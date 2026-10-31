from __future__ import annotations

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, record_audit
from app.core.config import settings
from app.core.db import get_db
from app.core.errors import ConflictError, ForbiddenError, UnauthorizedError
from app.core.rate_limit import rate_limit
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    hash_token,
    verify_password,
)
from app.models.investigation import Investigation
from app.models.user import RefreshToken, User
from app.schemas.auth import (
    ChangePasswordRequest,
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UpdateProfileRequest,
    UserOut,
)
from app.services.storage import storage_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _user_out(user: User) -> UserOut:
    return UserOut(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role.value,
        is_active=user.is_active,
        created_at=user.created_at,
        last_login_at=user.last_login_at,
    )


def _set_refresh_cookie(response: Response, raw_token: str) -> None:
    response.set_cookie(
        key=settings.refresh_cookie_name,
        value=raw_token,
        max_age=settings.refresh_token_days * 24 * 60 * 60,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        domain=settings.cookie_domain,
        path="/",
    )


def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.refresh_cookie_name,
        domain=settings.cookie_domain,
        path="/",
    )


async def _issue_tokens(
    db: AsyncSession,
    user: User,
    request: Request,
    response: Response,
) -> TokenResponse:
    access_token, _ = create_access_token(str(user.id), role=user.role.value)
    raw_refresh, refresh_hash, expires_at = create_refresh_token()
    db.add(
        RefreshToken(
            user_id=user.id,
            token_hash=refresh_hash,
            expires_at=expires_at,
            created_at=datetime.now(UTC),
            user_agent=request.headers.get("user-agent", "")[:512],
            ip_address=(request.client.host if request.client else None),
        )
    )
    await db.commit()
    _set_refresh_cookie(response, raw_refresh)
    return TokenResponse(
        access_token=access_token,
        expires_in=settings.access_token_minutes * 60,
        user=_user_out(user),
    )


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(rate_limit("auth", limit=settings.auth_rate_limit_per_minute))],
)
async def register(
    payload: RegisterRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    email = payload.email.lower().strip()
    existing = await db.scalar(select(User).where(User.email == email))
    if existing:
        raise ConflictError("An account with this email already exists")

    user = User(
        email=email,
        full_name=payload.full_name,
        password_hash=hash_password(payload.password),
        last_login_at=datetime.now(UTC),
    )
    db.add(user)
    await db.flush()
    await record_audit(
        db,
        action="auth.register",
        user_id=user.id,
        resource_type="user",
        resource_id=str(user.id),
        request=request,
    )
    return await _issue_tokens(db, user, request, response)


@router.post(
    "/login",
    response_model=TokenResponse,
    dependencies=[Depends(rate_limit("auth", limit=settings.auth_rate_limit_per_minute))],
)
async def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    email = payload.email.lower().strip()
    user = await db.scalar(select(User).where(User.email == email))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise UnauthorizedError("Incorrect email or password")
    if not user.is_active:
        raise ForbiddenError("This account has been disabled")

    user.last_login_at = datetime.now(UTC)
    await record_audit(
        db,
        action="auth.login",
        user_id=user.id,
        resource_type="user",
        resource_id=str(user.id),
        request=request,
    )
    return await _issue_tokens(db, user, request, response)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    raw_token = request.cookies.get(settings.refresh_cookie_name)
    if not raw_token:
        raise UnauthorizedError("No refresh session found")

    token_hash = hash_token(raw_token)
    stored = await db.scalar(select(RefreshToken).where(RefreshToken.token_hash == token_hash))
    if stored is None:
        _clear_refresh_cookie(response)
        raise UnauthorizedError("Invalid refresh session")

    now = datetime.now(UTC)
    expires_at = stored.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=UTC)

    if stored.revoked_at is not None:
        # Token reuse: revoke every session for this user.
        await db.execute(
            delete(RefreshToken).where(RefreshToken.user_id == stored.user_id)
        )
        await db.commit()
        _clear_refresh_cookie(response)
        raise UnauthorizedError("This session has been revoked. Please sign in again.")

    if expires_at <= now:
        stored.revoked_at = now
        await db.commit()
        _clear_refresh_cookie(response)
        raise UnauthorizedError("Your session has expired. Please sign in again.")

    user = await db.get(User, stored.user_id)
    if user is None or not user.is_active:
        _clear_refresh_cookie(response)
        raise UnauthorizedError("This account is not available")

    stored.revoked_at = now
    await db.commit()
    return await _issue_tokens(db, user, request, response)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> Response:
    raw_token = request.cookies.get(settings.refresh_cookie_name)
    if raw_token:
        stored = await db.scalar(
            select(RefreshToken).where(RefreshToken.token_hash == hash_token(raw_token))
        )
        if stored and stored.revoked_at is None:
            stored.revoked_at = datetime.now(UTC)
            await db.commit()
    _clear_refresh_cookie(response)
    response.status_code = status.HTTP_204_NO_CONTENT
    return response


@router.post("/logout-all", status_code=status.HTTP_204_NO_CONTENT)
async def logout_all(
    request: Request,
    response: Response,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Response:
    await db.execute(delete(RefreshToken).where(RefreshToken.user_id == user.id))
    user.token_version += 1
    await record_audit(
        db,
        action="auth.logout_all",
        user_id=user.id,
        resource_type="user",
        resource_id=str(user.id),
        request=request,
    )
    await db.commit()
    _clear_refresh_cookie(response)
    response.status_code = status.HTTP_204_NO_CONTENT
    return response


@router.get("/me", response_model=UserOut)
async def me(user: User = Depends(get_current_user)) -> UserOut:
    return _user_out(user)


@router.patch("/me", response_model=UserOut)
async def update_me(
    payload: UpdateProfileRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserOut:
    user.full_name = " ".join(payload.full_name.split())
    await db.commit()
    return _user_out(user)


@router.post("/me/change-password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(
    payload: ChangePasswordRequest,
    request: Request,
    response: Response,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Response:
    if not verify_password(payload.current_password, user.password_hash):
        raise UnauthorizedError("Your current password is incorrect")

    user.password_hash = hash_password(payload.new_password)
    user.token_version += 1
    await db.execute(delete(RefreshToken).where(RefreshToken.user_id == user.id))
    await record_audit(
        db,
        action="auth.password_changed",
        user_id=user.id,
        resource_type="user",
        resource_id=str(user.id),
        request=request,
    )
    await db.commit()
    _clear_refresh_cookie(response)
    response.status_code = status.HTTP_204_NO_CONTENT
    return response


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_me(
    request: Request,
    response: Response,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Response:
    paths = (
        await db.scalars(select(Investigation.file_path).where(Investigation.user_id == user.id))
    ).all()
    email = user.email
    await record_audit(
        db,
        action="auth.account_deleted",
        user_id=None,
        resource_type="user",
        resource_id=str(user.id),
        request=request,
        meta={"email": email},
    )
    await db.delete(user)
    await db.commit()
    for path in paths:
        await storage_service.delete(path)
    _clear_refresh_cookie(response)
    response.status_code = status.HTTP_204_NO_CONTENT
    return response

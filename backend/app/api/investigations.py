from __future__ import annotations

import uuid
from urllib.parse import urlparse

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    Form,
    Query,
    Request,
    UploadFile,
    status,
)
from fastapi.responses import JSONResponse
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, record_audit
from app.core.config import settings
from app.core.db import get_db
from app.core.errors import ConflictError, NotFoundError, ValidationError
from app.core.rate_limit import rate_limit
from app.models.investigation import (
    InputType,
    Investigation,
    InvestigationStatus,
)
from app.models.user import User, UserRole
from app.schemas.domain import InvestigationReport
from app.schemas.investigation import (
    InvestigationCreateResponse,
    InvestigationDetail,
    InvestigationListItem,
    InvestigationPage,
    RetryResponse,
)
from app.services.pipeline import pipeline
from app.services.storage import storage_service

router = APIRouter(prefix="/investigations", tags=["Investigations"])


def _detail(investigation: Investigation) -> InvestigationDetail:
    base = InvestigationListItem.model_validate(investigation).model_dump()
    report = (
        InvestigationReport.model_validate(investigation.result)
        if investigation.result
        else None
    )
    return InvestigationDetail(
        **base,
        stage=investigation.stage,
        stage_index=investigation.stage_index,
        error_message=investigation.error_message,
        file_name=investigation.file_name,
        report=report,
    )


async def _get_owned(
    db: AsyncSession,
    investigation_id: uuid.UUID,
    user: User,
) -> Investigation:
    statement = select(Investigation).where(Investigation.id == investigation_id)
    if user.role != UserRole.ADMIN:
        statement = statement.where(Investigation.user_id == user.id)
    investigation = await db.scalar(statement)
    if investigation is None:
        raise NotFoundError("Investigation not found")
    return investigation


def _normalize_url(value: str) -> str:
    url = value.strip()
    if not url:
        raise ValidationError("Enter a URL to investigate")
    if url.lower().startswith(("javascript:", "data:", "file:", "ftp:")):
        raise ValidationError("Only http and https URLs can be investigated")
    if not url.lower().startswith(("http://", "https://")):
        url = f"https://{url}"
    parsed = urlparse(url)
    if not parsed.hostname or "." not in parsed.hostname:
        raise ValidationError("Enter a valid URL, for example https://example.com")
    if len(url) > 2048:
        raise ValidationError("The URL is too long")
    return url


@router.post(
    "",
    response_model=InvestigationCreateResponse,
    status_code=status.HTTP_202_ACCEPTED,
    dependencies=[
        Depends(rate_limit("investigation", limit=settings.investigation_rate_limit_per_minute))
    ],
)
async def create_investigation(
    request: Request,
    background_tasks: BackgroundTasks,
    input_type: InputType = Form(...),
    text: str | None = Form(None),
    url: str | None = Form(None),
    file: UploadFile | None = File(None),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> InvestigationCreateResponse:
    input_text: str | None = None
    input_url: str | None = None
    stored = None

    if input_type == InputType.MESSAGE:
        input_text = (text or "").strip()
        if len(input_text) < 3:
            raise ValidationError("Paste the message you want to investigate")
        if len(input_text) > settings.max_text_characters:
            raise ValidationError(
                f"Message exceeds the {settings.max_text_characters:,} character limit"
            )

    elif input_type == InputType.URL:
        input_url = _normalize_url(url or text or "")
        input_text = input_url

    else:
        if file is None:
            raise ValidationError(
                "Upload a screenshot" if input_type == InputType.SCREENSHOT else "Upload a document"
            )
        data = await file.read(settings.max_upload_bytes + 1)
        stored = await storage_service.save(
            user_id=str(user.id),
            input_type=input_type.value,
            filename=file.filename or "evidence",
            data=data,
            content_type=file.content_type,
        )

    investigation = Investigation(
        user_id=user.id,
        input_type=input_type,
        status=InvestigationStatus.QUEUED,
        stage="queued",
        stage_index=0,
        input_text=input_text,
        input_url=input_url,
        input_excerpt=(" ".join(input_text.split())[:500] if input_text else None),
        file_name=stored.original_name if stored else None,
        file_path=stored.stored_path if stored else None,
        file_size=stored.size if stored else None,
        mime_type=stored.mime_type if stored else None,
    )
    db.add(investigation)
    await db.flush()
    await record_audit(
        db,
        action="investigation.created",
        user_id=user.id,
        resource_type="investigation",
        resource_id=str(investigation.id),
        request=request,
        meta={"input_type": input_type.value},
    )
    await db.commit()

    if settings.pipeline_mode == "inline":
        await pipeline.run(investigation.id)
        await db.refresh(investigation)
    else:
        background_tasks.add_task(pipeline.run, investigation.id)

    return InvestigationCreateResponse(id=investigation.id, status=investigation.status)


@router.get("", response_model=InvestigationPage)
async def list_investigations(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: InvestigationStatus | None = Query(None, alias="status"),
    risk_level: str | None = Query(None),
    input_type: InputType | None = Query(None),
    q: str | None = Query(None, max_length=200),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> InvestigationPage:
    filters = [Investigation.user_id == user.id]
    if user.role == UserRole.ADMIN:
        filters = []
    if status_filter:
        filters.append(Investigation.status == status_filter)
    if risk_level:
        filters.append(Investigation.risk_level == risk_level.upper())
    if input_type:
        filters.append(Investigation.input_type == input_type)
    if q:
        pattern = f"%{q.strip()}%"
        filters.append(
            or_(
                Investigation.input_excerpt.ilike(pattern),
                Investigation.threat_category.ilike(pattern),
            )
        )

    total = await db.scalar(select(func.count()).select_from(Investigation).where(*filters)) or 0
    statement = (
        select(Investigation)
        .where(*filters)
        .order_by(Investigation.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    rows = (await db.scalars(statement)).all()
    pages = max(1, (total + page_size - 1) // page_size)
    return InvestigationPage(
        items=[InvestigationListItem.model_validate(row) for row in rows],
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )


@router.get("/{investigation_id}", response_model=InvestigationDetail)
async def get_investigation(
    investigation_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> InvestigationDetail:
    investigation = await _get_owned(db, investigation_id, user)
    return _detail(investigation)


@router.post("/{investigation_id}/retry", response_model=RetryResponse)
async def retry_investigation(
    investigation_id: uuid.UUID,
    request: Request,
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> RetryResponse:
    investigation = await _get_owned(db, investigation_id, user)
    if investigation.status in {InvestigationStatus.QUEUED, InvestigationStatus.RUNNING}:
        raise ConflictError("This investigation is already in progress")

    investigation.status = InvestigationStatus.QUEUED
    investigation.stage = "queued"
    investigation.stage_index = 0
    investigation.error_message = None
    investigation.result = None
    investigation.risk_score = None
    investigation.risk_level = None
    investigation.threat_category = None
    investigation.correlation_level = None
    investigation.analysis_mode = None
    investigation.completed_at = None
    investigation.duration_ms = None
    await record_audit(
        db,
        action="investigation.retried",
        user_id=user.id,
        resource_type="investigation",
        resource_id=str(investigation.id),
        request=request,
    )
    await db.commit()

    if settings.pipeline_mode == "inline":
        await pipeline.run(investigation.id)
        await db.refresh(investigation)
    else:
        background_tasks.add_task(pipeline.run, investigation.id)

    return RetryResponse(id=investigation.id, status=investigation.status)


@router.get("/{investigation_id}/export")
async def export_investigation(
    investigation_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    investigation = await _get_owned(db, investigation_id, user)
    payload = {
        "id": str(investigation.id),
        "input_type": investigation.input_type.value,
        "status": investigation.status.value,
        "created_at": investigation.created_at.isoformat(),
        "completed_at": investigation.completed_at.isoformat()
        if investigation.completed_at
        else None,
        "risk_score": investigation.risk_score,
        "risk_level": investigation.risk_level,
        "threat_category": investigation.threat_category,
        "report": investigation.result,
        "disclaimer": (
            "TrustScan provides evidence-based risk intelligence. This report is not proof "
            "that a person, organization, phone number, URL or account is fraudulent."
        ),
    }
    return JSONResponse(
        content=payload,
        headers={
            "Content-Disposition": f'attachment; filename="trustscan-{investigation.id}.json"'
        },
    )


@router.delete("/{investigation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_investigation(
    investigation_id: uuid.UUID,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    investigation = await _get_owned(db, investigation_id, user)
    file_path = investigation.file_path
    await record_audit(
        db,
        action="investigation.deleted",
        user_id=user.id,
        resource_type="investigation",
        resource_id=str(investigation.id),
        request=request,
    )
    await db.delete(investigation)
    await db.commit()
    await storage_service.delete(file_path)

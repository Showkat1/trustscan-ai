from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, record_audit
from app.core.config import settings
from app.core.db import get_db
from app.core.errors import NotFoundError
from app.core.rate_limit import rate_limit
from app.models.device import DeviceScan
from app.models.user import User, UserRole
from app.schemas.device import (
    DeviceScanCreate,
    DeviceScanDetail,
    DeviceScanListItem,
    DeviceScanPage,
)
from app.services.device_scan import assess_device, device_label

router = APIRouter(prefix="/device", tags=["Device"])


def _detail(scan: DeviceScan) -> DeviceScanDetail:
    return DeviceScanDetail(
        id=scan.id,
        label=scan.label,
        score=scan.score,
        level=scan.level,
        summary=scan.summary,
        platform=scan.platform,
        browser=scan.browser,
        created_at=scan.created_at,
        user_agent=scan.user_agent,
        signals=scan.signals,
        recommendations=scan.recommendations,
        metrics=scan.metrics,
    )


async def _get_owned(db: AsyncSession, scan_id: uuid.UUID, user: User) -> DeviceScan:
    statement = select(DeviceScan).where(DeviceScan.id == scan_id)
    if user.role != UserRole.ADMIN:
        statement = statement.where(DeviceScan.user_id == user.id)
    scan = await db.scalar(statement)
    if scan is None:
        raise NotFoundError("Device scan not found")
    return scan


@router.post(
    "/scans",
    response_model=DeviceScanDetail,
    status_code=status.HTTP_201_CREATED,
    dependencies=[
        Depends(rate_limit("device_scan", limit=settings.device_scan_rate_limit_per_minute))
    ],
)
async def create_device_scan(
    payload: DeviceScanCreate,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DeviceScanDetail:
    snapshot = payload.snapshot
    assessment = assess_device(snapshot)
    label = (payload.label or "").strip() or device_label(snapshot)

    scan = DeviceScan(
        user_id=user.id,
        score=assessment.score,
        level=assessment.level,
        summary=assessment.summary,
        label=label,
        platform=snapshot.platform,
        browser=snapshot.browser,
        user_agent=snapshot.user_agent,
        signals=[signal.model_dump(mode="json") for signal in assessment.signals],
        recommendations=[
            recommendation.model_dump(mode="json")
            for recommendation in assessment.recommendations
        ],
        metrics=snapshot.model_dump(mode="json"),
    )
    db.add(scan)
    await db.flush()
    await record_audit(
        db,
        action="device_scan.created",
        user_id=user.id,
        resource_type="device_scan",
        resource_id=str(scan.id),
        request=request,
        meta={"level": assessment.level, "score": assessment.score},
    )
    await db.commit()
    await db.refresh(scan)
    return _detail(scan)


@router.get("/scans", response_model=DeviceScanPage)
async def list_device_scans(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    level: str | None = Query(None),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DeviceScanPage:
    filters = [] if user.role == UserRole.ADMIN else [DeviceScan.user_id == user.id]
    if level:
        filters.append(DeviceScan.level == level.upper())

    total = await db.scalar(select(func.count()).select_from(DeviceScan).where(*filters)) or 0
    statement = (
        select(DeviceScan)
        .where(*filters)
        .order_by(DeviceScan.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    rows = (await db.scalars(statement)).all()
    pages = max(1, (total + page_size - 1) // page_size)

    return DeviceScanPage(
        items=[DeviceScanListItem.model_validate(row) for row in rows],
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )


@router.get("/scans/{scan_id}", response_model=DeviceScanDetail)
async def get_device_scan(
    scan_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DeviceScanDetail:
    scan = await _get_owned(db, scan_id, user)
    return _detail(scan)


@router.delete("/scans/{scan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_device_scan(
    scan_id: uuid.UUID,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    scan = await _get_owned(db, scan_id, user)
    await record_audit(
        db,
        action="device_scan.deleted",
        user_id=user.id,
        resource_type="device_scan",
        resource_id=str(scan.id),
        request=request,
    )
    await db.delete(scan)
    await db.commit()

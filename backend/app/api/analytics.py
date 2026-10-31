from __future__ import annotations

from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.db import get_db
from app.models.investigation import Investigation, InvestigationStatus
from app.models.user import User, UserRole
from app.schemas.investigation import OverviewStats, RiskDistribution

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/overview", response_model=OverviewStats)
async def overview(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> OverviewStats:
    filters = [] if user.role == UserRole.ADMIN else [Investigation.user_id == user.id]

    total = await db.scalar(select(func.count()).select_from(Investigation).where(*filters)) or 0

    status_rows = (
        await db.execute(
            select(Investigation.status, func.count())
            .where(*filters)
            .group_by(Investigation.status)
        )
    ).all()
    status_counts = {row[0]: row[1] for row in status_rows}

    risk_rows = (
        await db.execute(
            select(Investigation.risk_level, func.count())
            .where(*filters, Investigation.risk_level.is_not(None))
            .group_by(Investigation.risk_level)
        )
    ).all()
    risk_distribution = RiskDistribution()
    for level, count in risk_rows:
        if level in {"LOW", "MEDIUM", "HIGH", "CRITICAL"}:
            setattr(risk_distribution, level, count)

    input_rows = (
        await db.execute(
            select(Investigation.input_type, func.count()).where(*filters).group_by(Investigation.input_type)
        )
    ).all()
    input_distribution = {
        (row[0].value if hasattr(row[0], "value") else str(row[0])): row[1] for row in input_rows
    }

    average = await db.scalar(
        select(func.avg(Investigation.risk_score)).where(
            *filters, Investigation.risk_score.is_not(None)
        )
    )
    last_7_days = await db.scalar(
        select(func.count())
        .select_from(Investigation)
        .where(*filters, Investigation.created_at >= datetime.now(UTC) - timedelta(days=7))
    )

    return OverviewStats(
        total=total,
        completed=status_counts.get(InvestigationStatus.COMPLETED, 0),
        running=status_counts.get(InvestigationStatus.RUNNING, 0)
        + status_counts.get(InvestigationStatus.QUEUED, 0),
        failed=status_counts.get(InvestigationStatus.FAILED, 0),
        high_risk=risk_distribution.HIGH,
        critical_risk=risk_distribution.CRITICAL,
        average_score=round(float(average or 0), 1),
        last_7_days=last_7_days or 0,
        risk_distribution=risk_distribution,
        input_type_distribution=input_distribution,
    )

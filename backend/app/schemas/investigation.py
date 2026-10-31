from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.investigation import InputType, InvestigationStatus
from app.schemas.domain import InvestigationReport


class InvestigationListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    input_type: InputType
    status: InvestigationStatus
    risk_score: int | None = None
    risk_level: str | None = None
    threat_category: str | None = None
    correlation_level: str | None = None
    analysis_mode: str | None = None
    input_excerpt: str | None = None
    created_at: datetime
    completed_at: datetime | None = None
    duration_ms: int | None = None


class InvestigationDetail(InvestigationListItem):
    stage: str
    stage_index: int
    error_message: str | None = None
    file_name: str | None = None
    report: InvestigationReport | None = None


class InvestigationPage(BaseModel):
    items: list[InvestigationListItem]
    total: int
    page: int
    page_size: int
    pages: int


class InvestigationCreateResponse(BaseModel):
    id: uuid.UUID
    status: InvestigationStatus


class RetryResponse(BaseModel):
    id: uuid.UUID
    status: InvestigationStatus


class RiskDistribution(BaseModel):
    LOW: int = 0
    MEDIUM: int = 0
    HIGH: int = 0
    CRITICAL: int = 0


class OverviewStats(BaseModel):
    total: int = 0
    completed: int = 0
    running: int = 0
    failed: int = 0
    high_risk: int = 0
    critical_risk: int = 0
    average_score: float = 0.0
    last_7_days: int = 0
    risk_distribution: RiskDistribution = Field(default_factory=RiskDistribution)
    input_type_distribution: dict[str, int] = Field(default_factory=dict)

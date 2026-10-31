from __future__ import annotations

import enum
import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, Enum, ForeignKey, Index, Integer, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import JSONType
from app.models.base import Base, TimestampMixin, UUIDMixin


class InputType(str, enum.Enum):
    MESSAGE = "message"
    URL = "url"
    SCREENSHOT = "screenshot"
    DOCUMENT = "document"


class InvestigationStatus(str, enum.Enum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class RiskLevel(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class Investigation(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "investigations"
    __table_args__ = (
        Index("ix_investigations_user_created", "user_id", "created_at"),
        Index("ix_investigations_user_status", "user_id", "status"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    input_type: Mapped[InputType] = mapped_column(
        Enum(InputType, native_enum=False, length=24), nullable=False
    )
    status: Mapped[InvestigationStatus] = mapped_column(
        Enum(InvestigationStatus, native_enum=False, length=24),
        default=InvestigationStatus.QUEUED,
        nullable=False,
        index=True,
    )
    stage: Mapped[str] = mapped_column(String(48), default="queued", nullable=False)
    stage_index: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    input_text: Mapped[str | None] = mapped_column(Text)
    input_url: Mapped[str | None] = mapped_column(String(2048))
    input_excerpt: Mapped[str | None] = mapped_column(String(500))

    file_name: Mapped[str | None] = mapped_column(String(255))
    file_path: Mapped[str | None] = mapped_column(String(1024))
    file_size: Mapped[int | None] = mapped_column(Integer)
    mime_type: Mapped[str | None] = mapped_column(String(128))

    risk_score: Mapped[int | None] = mapped_column(Integer)
    risk_level: Mapped[str | None] = mapped_column(String(16), index=True)
    threat_category: Mapped[str | None] = mapped_column(String(96))
    correlation_level: Mapped[str | None] = mapped_column(String(16))
    analysis_mode: Mapped[str | None] = mapped_column(String(32))

    error_message: Mapped[str | None] = mapped_column(Text)
    result: Mapped[dict[str, Any] | None] = mapped_column(JSONType)
    duration_ms: Mapped[int | None] = mapped_column(Integer)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    user: Mapped[User] = relationship("User", back_populates="investigations")  # noqa: F821

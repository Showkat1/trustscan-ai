from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import ForeignKey, Index, Integer, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import JSONType
from app.models.base import Base, TimestampMixin, UUIDMixin


class DeviceScan(UUIDMixin, TimestampMixin, Base):
    """A stored browser/device exposure assessment.

    The raw client snapshot is kept so a stored report can be reproduced and
    audited without re-running the scan on the device.
    """

    __tablename__ = "device_scans"
    __table_args__ = (
        Index("ix_device_scans_user_created", "user_id", "created_at"),
        Index("ix_device_scans_user_level", "user_id", "level"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )

    score: Mapped[int] = mapped_column(Integer, nullable=False)
    level: Mapped[str] = mapped_column(String(16), nullable=False, index=True)
    summary: Mapped[str] = mapped_column(Text, nullable=False)

    label: Mapped[str | None] = mapped_column(String(160))
    platform: Mapped[str | None] = mapped_column(String(96))
    browser: Mapped[str | None] = mapped_column(String(96))
    user_agent: Mapped[str | None] = mapped_column(String(512))

    signals: Mapped[list[dict[str, Any]]] = mapped_column(JSONType, nullable=False)
    recommendations: Mapped[list[dict[str, Any]]] = mapped_column(JSONType, nullable=False)
    metrics: Mapped[dict[str, Any]] = mapped_column(JSONType, nullable=False)

    user: Mapped[User] = relationship("User", back_populates="device_scans")  # noqa: F821

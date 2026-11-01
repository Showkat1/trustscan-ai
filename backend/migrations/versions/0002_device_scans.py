"""Add device scans.

Revision ID: 0002_device_scans
Revises: 0001_initial
Create Date: 2026-11-01
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0002_device_scans"
down_revision: str | None = "0001_initial"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "device_scans",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("score", sa.Integer(), nullable=False),
        sa.Column("level", sa.String(length=16), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("label", sa.String(length=160), nullable=True),
        sa.Column("platform", sa.String(length=96), nullable=True),
        sa.Column("browser", sa.String(length=96), nullable=True),
        sa.Column("user_agent", sa.String(length=512), nullable=True),
        sa.Column("signals", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("recommendations", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("metrics", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_device_scans_user_id"), "device_scans", ["user_id"], unique=False)
    op.create_index(op.f("ix_device_scans_level"), "device_scans", ["level"], unique=False)
    op.create_index(
        "ix_device_scans_user_created",
        "device_scans",
        ["user_id", "created_at"],
        unique=False,
    )
    op.create_index(
        "ix_device_scans_user_level",
        "device_scans",
        ["user_id", "level"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_table("device_scans")

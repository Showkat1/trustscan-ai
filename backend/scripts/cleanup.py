from __future__ import annotations

import argparse
import asyncio
from datetime import UTC, datetime, timedelta

from app.core.config import settings
from app.core.db import SessionLocal
from app.models.investigation import Investigation
from app.services.storage import storage_service
from sqlalchemy import select


async def main(days: int | None) -> None:
    retention = days if days is not None else settings.retention_days
    cutoff = datetime.now(UTC) - timedelta(days=retention)

    async with SessionLocal() as session:
        rows = (
            await session.scalars(
                select(Investigation).where(Investigation.created_at < cutoff)
            )
        ).all()
        for investigation in rows:
            await storage_service.delete(investigation.file_path)
            await session.delete(investigation)
        await session.commit()

    print(f"Deleted {len(rows)} investigation(s) older than {retention} days.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Delete investigations past the retention window")
    parser.add_argument("--days", type=int, default=None)
    args = parser.parse_args()
    asyncio.run(main(args.days))

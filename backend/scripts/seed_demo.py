from __future__ import annotations

import asyncio
from datetime import UTC, datetime

from app.core.db import SessionLocal, init_models
from app.core.security import hash_password
from app.models.investigation import InputType, Investigation, InvestigationStatus
from app.models.user import User
from app.services.pipeline import pipeline
from app.services.rag import knowledge_base
from sqlalchemy import func, select

DEMO_EMAIL = "demo@trustscan.ai"
DEMO_PASSWORD = "TrustScanDemo123"

SAMPLES = [
    (
        InputType.MESSAGE,
        "Your HBL account will be blocked immediately. Verify your account at "
        "https://secure-hbl-login.example.com/verify and send your OTP to 03001234567. "
        "Pay PKR 5,000 verification fee within 30 minutes.",
    ),
    (
        InputType.MESSAGE,
        "Congratulations! You have won PKR 1,000,000 in our lottery. Pay PKR 10,000 tax "
        "processing fee to claim your prize immediately.",
    ),
    (
        InputType.MESSAGE,
        "Your HBL account statement for August is now available in your official mobile "
        "banking application. Please log in through the application to view it.",
    ),
]


async def main() -> None:
    await init_models()
    async with SessionLocal() as session:
        await knowledge_base.seed_if_empty(session)

        user = await session.scalar(select(User).where(User.email == DEMO_EMAIL))
        if user is None:
            user = User(
                email=DEMO_EMAIL,
                full_name="TrustScan Demo",
                password_hash=hash_password(DEMO_PASSWORD),
                last_login_at=datetime.now(UTC),
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)
            print(f"Created demo user: {DEMO_EMAIL} / {DEMO_PASSWORD}")

        existing = await session.scalar(
            select(func.count())
            .select_from(Investigation)
            .where(Investigation.user_id == user.id)
        )
        if existing:
            print(f"Demo user already has {existing} investigation(s); nothing to do.")
            return

        ids = []
        for input_type, text in SAMPLES:
            investigation = Investigation(
                user_id=user.id,
                input_type=input_type,
                status=InvestigationStatus.QUEUED,
                stage="queued",
                input_text=text,
                input_excerpt=" ".join(text.split())[:500],
            )
            session.add(investigation)
            await session.flush()
            ids.append(investigation.id)
        await session.commit()

    for investigation_id in ids:
        await pipeline.run(investigation_id)
    print(f"Seeded {len(ids)} demo investigation(s) for {DEMO_EMAIL}.")


if __name__ == "__main__":
    asyncio.run(main())

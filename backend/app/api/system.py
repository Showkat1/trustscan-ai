from __future__ import annotations

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app import __version__
from app.core.config import settings
from app.core.db import get_db
from app.schemas.knowledge import MetaResponse
from app.services.embeddings import embedding_service
from app.services.pipeline import STAGES

router = APIRouter(tags=["System"])


@router.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "version": __version__, "service": settings.app_name}


@router.get("/health/ready")
async def readiness(db: AsyncSession = Depends(get_db)) -> JSONResponse:
    try:
        await db.execute(text("SELECT 1"))
    except Exception:
        return JSONResponse(
            status_code=503,
            content={"status": "not_ready", "database": "unavailable"},
        )
    return JSONResponse(content={"status": "ready", "database": "ok"})


@router.get("/meta", response_model=MetaResponse)
async def meta() -> MetaResponse:
    return MetaResponse(
        app_name=settings.app_name,
        version=__version__,
        pipeline=[{"key": stage["key"], "label": stage["label"]} for stage in STAGES],
        input_types=["message", "url", "screenshot", "document"],
        risk_bands=[
            {"level": "LOW", "min": 0, "max": 24},
            {"level": "MEDIUM", "min": 25, "max": 49},
            {"level": "HIGH", "min": 50, "max": 79},
            {"level": "CRITICAL", "min": 80, "max": 100},
        ],
        llm_mode="generative" if settings.llm_configured else "deterministic",
        embedding_provider=embedding_service.provider,
    )

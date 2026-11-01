from __future__ import annotations

import time
import uuid
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError

from app import __version__
from app.api import analytics, auth, device, investigations, knowledge, system
from app.core.config import settings
from app.core.db import SessionLocal, close_db, init_models
from app.core.errors import AppError
from app.core.logging import configure_logging, get_logger
from app.services.rag import knowledge_base

configure_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    if settings.auto_create_tables:
        await init_models()
    if settings.seed_knowledge_on_startup:
        try:
            async with SessionLocal() as session:
                await knowledge_base.seed_if_empty(session)
        except Exception as exc:  # pragma: no cover - startup resilience
            logger.warning("knowledge_seed_failed", error=str(exc))

    logger.info(
        "trustscan_started",
        environment=settings.environment,
        version=__version__,
        llm="generative" if settings.llm_configured else "deterministic",
        embeddings=settings.embedding_provider,
    )
    yield
    await close_db()


app = FastAPI(
    title="TrustScan AI API",
    description=(
        "Evidence-grounded fraud investigation API. TrustScan correlates extracted evidence, "
        "URL intelligence, trusted-source retrieval and an explainable risk engine."
    ),
    version=__version__,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
    expose_headers=["X-Request-ID", "Content-Disposition"],
    max_age=600,
)


@app.middleware("http")
async def observability_and_security(request: Request, call_next):
    request_id = request.headers.get("x-request-id") or uuid.uuid4().hex
    structlog.contextvars.clear_contextvars()
    structlog.contextvars.bind_contextvars(request_id=request_id)
    started = time.perf_counter()

    try:
        response = await call_next(request)
    except Exception:
        logger.exception("unhandled_request_error", path=request.url.path)
        raise
    finally:
        structlog.contextvars.clear_contextvars()

    duration_ms = round((time.perf_counter() - started) * 1000, 1)
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    if settings.is_production:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

    logger.info(
        "http_request",
        method=request.method,
        path=request.url.path,
        status_code=response.status_code,
        duration_ms=duration_ms,
    )
    return response


@app.exception_handler(AppError)
async def app_error_handler(_: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details,
            }
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_error_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "code": "validation_error",
                "message": "Some of the submitted values are invalid.",
                "details": exc.errors(),
            }
        },
    )


@app.exception_handler(IntegrityError)
async def integrity_error_handler(_: Request, exc: IntegrityError) -> JSONResponse:
    logger.warning("database_integrity_error", error=str(exc))
    return JSONResponse(
        status_code=409,
        content={
            "error": {
                "code": "conflict",
                "message": "That change conflicts with existing data.",
            }
        },
    )


@app.exception_handler(Exception)
async def unhandled_error_handler(_: Request, exc: Exception) -> JSONResponse:
    logger.exception("unhandled_error", error=str(exc))
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "internal_error",
                "message": "Something went wrong. Please try again.",
            }
        },
    )


app.include_router(system.router)
app.include_router(auth.router, prefix=settings.api_v1_prefix)
app.include_router(investigations.router, prefix=settings.api_v1_prefix)
app.include_router(device.router, prefix=settings.api_v1_prefix)
app.include_router(analytics.router, prefix=settings.api_v1_prefix)
app.include_router(knowledge.router, prefix=settings.api_v1_prefix)
app.include_router(system.router, prefix=settings.api_v1_prefix, include_in_schema=False)


@app.get("/", include_in_schema=False)
async def root() -> dict[str, str]:
    return {
        "name": settings.app_name,
        "version": __version__,
        "docs": "/docs",
        "health": "/health",
    }

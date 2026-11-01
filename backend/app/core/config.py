from __future__ import annotations

import json
import secrets
from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]
PROJECT_ROOT = BACKEND_DIR.parent
DEFAULT_KNOWLEDGE_DIR = PROJECT_ROOT / "data" / "knowledge_base"
DEFAULT_UPLOAD_DIR = BACKEND_DIR / "uploads"

Environment = Literal["development", "test", "production"]


class Settings(BaseSettings):
    """Application settings.

    Every value can be overridden with a ``TRUSTSCAN_``-prefixed environment
    variable. A root ``.env`` file is loaded for local development.
    """

    model_config = SettingsConfigDict(
        env_prefix="TRUSTSCAN_",
        env_file=(PROJECT_ROOT / ".env", BACKEND_DIR / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
        # List settings are comma-separated, so skip pydantic-settings' JSON
        # decoding and let the validators below parse the raw string.
        enable_decoding=False,
    )

    # Application
    app_name: str = "TrustScan AI"
    environment: Environment = "development"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"
    frontend_url: str = "http://localhost:3000"
    cors_origins: list[str] = Field(
        default_factory=lambda: ["http://localhost:3000", "http://127.0.0.1:3000"]
    )

    # Security
    secret_key: str = Field(default_factory=lambda: secrets.token_urlsafe(48))
    access_token_minutes: int = 15
    refresh_token_days: int = 30
    password_min_length: int = 10
    cookie_secure: bool = False
    cookie_domain: str | None = None
    rate_limit_enabled: bool = True
    auth_rate_limit_per_minute: int = 12
    investigation_rate_limit_per_minute: int = 20
    device_scan_rate_limit_per_minute: int = 30

    # Database
    database_url: str = "postgresql+asyncpg://trustscan:trustscan@localhost:5432/trustscan"
    database_echo: bool = False
    auto_create_tables: bool = True

    # Uploads
    upload_dir: Path = DEFAULT_UPLOAD_DIR
    max_upload_size_mb: int = 10
    max_text_characters: int = 20_000
    retention_days: int = 90

    # LLM
    llm_enabled: bool = True
    llm_provider: str = "openrouter"
    llm_api_key: str = ""
    llm_base_url: str = "https://openrouter.ai/api/v1"
    llm_model: str = "openrouter/free"
    llm_timeout_seconds: float = 45.0
    llm_max_retries: int = 2

    # Embeddings / RAG
    embedding_provider: Literal["openai", "sentence-transformers", "hash"] = "hash"
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    embedding_dim: int = 384
    rag_top_k: int = 4
    rag_min_score: float = 0.05
    knowledge_dir: Path = DEFAULT_KNOWLEDGE_DIR
    seed_knowledge_on_startup: bool = True

    # OCR
    ocr_enabled: bool = True
    tesseract_cmd: str | None = None

    # Pipeline
    pipeline_mode: Literal["background", "inline"] = "background"
    pipeline_timeout_seconds: int = 180

    # Observability
    log_level: str = "INFO"
    log_json: bool = False
    sentry_dsn: str = ""

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _split_origins(cls, value: object) -> object:
        if isinstance(value, str):
            raw = value.strip()
            if raw.startswith("["):
                try:
                    return json.loads(raw)
                except ValueError:
                    pass
            return [origin.strip() for origin in raw.split(",") if origin.strip()]
        return value

    @field_validator("upload_dir", "knowledge_dir", mode="before")
    @classmethod
    def _resolve_path(cls, value: object) -> object:
        if isinstance(value, str):
            path = Path(value)
            return path if path.is_absolute() else (PROJECT_ROOT / path)
        return value

    @field_validator("cookie_domain", mode="before")
    @classmethod
    def _blank_domain_is_none(cls, value: object) -> object:
        # Empty strings from compose/env files must not become ``Domain=``.
        if isinstance(value, str) and not value.strip():
            return None
        return value

    @model_validator(mode="after")
    def _validate_production(self) -> Settings:
        if self.environment == "production":
            if not self.cookie_secure:
                self.cookie_secure = True
            if self.debug:
                raise ValueError("DEBUG must be false in production")
        return self

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024

    @property
    def refresh_cookie_name(self) -> str:
        return "trustscan_refresh"

    @property
    def llm_configured(self) -> bool:
        return self.llm_enabled and bool(self.llm_api_key.strip())


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

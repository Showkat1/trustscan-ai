from __future__ import annotations

import os
import uuid
from pathlib import Path

import pytest

TEST_DB = Path(__file__).resolve().parent / "test_trustscan.db"
if TEST_DB.exists():
    TEST_DB.unlink()

os.environ.update(
    {
        "TRUSTSCAN_ENVIRONMENT": "test",
        "TRUSTSCAN_DATABASE_URL": f"sqlite+aiosqlite:///{TEST_DB.as_posix()}",
        "TRUSTSCAN_AUTO_CREATE_TABLES": "true",
        "TRUSTSCAN_SEED_KNOWLEDGE_ON_STARTUP": "true",
        "TRUSTSCAN_PIPELINE_MODE": "inline",
        "TRUSTSCAN_RATE_LIMIT_ENABLED": "false",
        "TRUSTSCAN_SECRET_KEY": "test-secret-key-not-for-production",
        "TRUSTSCAN_LLM_ENABLED": "false",
        "TRUSTSCAN_EMBEDDING_PROVIDER": "hash",
        "TRUSTSCAN_COOKIE_SECURE": "false",
        "TRUSTSCAN_LOG_LEVEL": "WARNING",
    }
)

from app.main import app  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402


@pytest.fixture(scope="session")
def client() -> TestClient:
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture()
def user_credentials() -> dict[str, str]:
    suffix = uuid.uuid4().hex[:10]
    return {
        "email": f"tester-{suffix}@example.com",
        "full_name": "Test Investigator",
        "password": "StrongPassword123",
    }


@pytest.fixture()
def auth(client: TestClient, user_credentials: dict[str, str]) -> dict[str, str]:
    response = client.post("/api/v1/auth/register", json=user_credentials)
    assert response.status_code == 201, response.text
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def auth_user(client: TestClient, auth: dict[str, str]) -> dict:
    response = client.get("/api/v1/auth/me", headers=auth)
    assert response.status_code == 200
    return response.json()

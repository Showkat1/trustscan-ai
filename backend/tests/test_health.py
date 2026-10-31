from __future__ import annotations

from fastapi.testclient import TestClient


def test_health(client: TestClient) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.headers["X-Content-Type-Options"] == "nosniff"


def test_readiness(client: TestClient) -> None:
    response = client.get("/health/ready")
    assert response.status_code == 200
    assert response.json()["database"] == "ok"


def test_meta(client: TestClient) -> None:
    response = client.get("/api/v1/meta")
    assert response.status_code == 200
    payload = response.json()
    assert len(payload["pipeline"]) == 8
    assert payload["llm_mode"] == "deterministic"
    assert payload["risk_bands"][-1]["level"] == "CRITICAL"


def test_openapi(client: TestClient) -> None:
    response = client.get("/openapi.json")
    assert response.status_code == 200
    assert "/api/v1/investigations" in response.json()["paths"]

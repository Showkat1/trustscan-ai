from __future__ import annotations

from fastapi.testclient import TestClient

SCAM = (
    "Your HBL account will be blocked immediately. Verify your account at "
    "https://secure-hbl-login.example.com/verify and send your OTP to 03001234567. "
    "Pay PKR 5,000 verification fee within 30 minutes."
)


def _create_message(client: TestClient, auth: dict[str, str], text: str = SCAM):
    return client.post(
        "/api/v1/investigations",
        headers=auth,
        data={"input_type": "message", "text": text},
    )


def test_message_investigation_end_to_end(client: TestClient, auth: dict[str, str]) -> None:
    response = _create_message(client, auth)
    assert response.status_code == 202, response.text
    created = response.json()
    assert created["status"] == "completed"

    detail = client.get(f"/api/v1/investigations/{created['id']}", headers=auth)
    assert detail.status_code == 200
    payload = detail.json()
    assert payload["risk_level"] == "CRITICAL"
    assert payload["risk_score"] >= 80
    assert payload["report"]["extracted"]["urls"]
    assert payload["report"]["extracted"]["requests"]
    assert len(payload["report"]["stages"]) == 8
    assert payload["report"]["actions"]
    assert payload["report"]["sources"]
    assert payload["report"]["correlation"]["correlations"]
    assert payload["report"]["analysis_mode"] == "deterministic"


def test_url_investigation(client: TestClient, auth: dict[str, str]) -> None:
    response = client.post(
        "/api/v1/investigations",
        headers=auth,
        data={"input_type": "url", "url": "secure-hbl-login.example.com/verify"},
    )
    assert response.status_code == 202, response.text
    investigation_id = response.json()["id"]

    detail = client.get(f"/api/v1/investigations/{investigation_id}", headers=auth).json()
    assert detail["status"] == "completed"
    assert detail["report"]["urls"][0]["hostname"] == "secure-hbl-login.example.com"
    assert "brand_domain_mismatch" in detail["report"]["urls"][0]["risk_indicators"]


def test_document_investigation(client: TestClient, auth: dict[str, str]) -> None:
    content = (
        b"Congratulations! You have won PKR 1,000,000. Pay PKR 10,000 processing fee "
        b"to claim your prize immediately."
    )
    response = client.post(
        "/api/v1/investigations",
        headers=auth,
        data={"input_type": "document"},
        files={"file": ("prize.txt", content, "text/plain")},
    )
    assert response.status_code == 202, response.text
    investigation_id = response.json()["id"]

    detail = client.get(f"/api/v1/investigations/{investigation_id}", headers=auth).json()
    assert detail["status"] == "completed"
    assert detail["report"]["risk"]["level"] in {"HIGH", "CRITICAL"}
    assert detail["file_name"] == "prize.txt"


def test_invalid_inputs(client: TestClient, auth: dict[str, str]) -> None:
    empty = client.post(
        "/api/v1/investigations",
        headers=auth,
        data={"input_type": "message", "text": ""},
    )
    assert empty.status_code == 422

    bad_url = client.post(
        "/api/v1/investigations",
        headers=auth,
        data={"input_type": "url", "url": "javascript:alert(1)"},
    )
    assert bad_url.status_code == 422

    no_file = client.post(
        "/api/v1/investigations",
        headers=auth,
        data={"input_type": "screenshot"},
    )
    assert no_file.status_code == 422

    bad_file = client.post(
        "/api/v1/investigations",
        headers=auth,
        data={"input_type": "document"},
        files={"file": ("malware.exe", b"nope", "application/octet-stream")},
    )
    assert bad_file.status_code == 422


def test_list_filter_export_retry_delete(client: TestClient, auth: dict[str, str]) -> None:
    created = _create_message(client, auth).json()
    investigation_id = created["id"]

    listing = client.get(
        "/api/v1/investigations",
        headers=auth,
        params={"risk_level": "CRITICAL", "page_size": 5},
    )
    assert listing.status_code == 200
    assert listing.json()["total"] >= 1
    assert any(item["id"] == investigation_id for item in listing.json()["items"])

    export = client.get(f"/api/v1/investigations/{investigation_id}/export", headers=auth)
    assert export.status_code == 200
    assert "attachment" in export.headers["content-disposition"]
    assert export.json()["report"]["risk"]["level"] == "CRITICAL"

    retry = client.post(f"/api/v1/investigations/{investigation_id}/retry", headers=auth)
    assert retry.status_code == 200
    assert retry.json()["status"] == "completed"

    deleted = client.delete(f"/api/v1/investigations/{investigation_id}", headers=auth)
    assert deleted.status_code == 204

    missing = client.get(f"/api/v1/investigations/{investigation_id}", headers=auth)
    assert missing.status_code == 404


def test_investigation_isolation(
    client: TestClient, auth: dict[str, str], user_credentials: dict[str, str]
) -> None:
    created = _create_message(client, auth).json()

    other = client.post(
        "/api/v1/auth/register",
        json={
            "email": f"other-{user_credentials['email']}",
            "full_name": "Other User",
            "password": "AnotherPassword123",
        },
    )
    other_headers = {"Authorization": f"Bearer {other.json()['access_token']}"}
    response = client.get(f"/api/v1/investigations/{created['id']}", headers=other_headers)
    assert response.status_code == 404

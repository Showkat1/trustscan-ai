from __future__ import annotations

from typing import Any

from fastapi.testclient import TestClient

BASE_SNAPSHOT: dict[str, Any] = {
    "platform": "Windows",
    "browser": "Chrome",
    "browser_version": "141.0",
    "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/141.0 Safari/537.36",
    "language": "en-GB",
    "languages": ["en-GB", "en"],
    "timezone": "Asia/Karachi",
    "timezone_offset": -300,
    "screen": {
        "width": 1920,
        "height": 1080,
        "pixel_ratio": 1.0,
        "color_depth": 24,
        "viewport_width": 1280,
        "viewport_height": 800,
    },
    "hardware": {
        "cpu_cores": 8,
        "memory_gb": 8,
        "max_touch_points": 0,
        "plugins": 5,
        "audio_inputs": 1,
        "audio_outputs": 1,
        "video_inputs": 1,
    },
    "connection": {
        "effective_type": "4g",
        "downlink_mbps": 10,
        "rtt_ms": 50,
        "save_data": False,
    },
    "battery": {"charging": True, "level": 0.8},
    "privacy": {"do_not_track": True, "global_privacy_control": True, "webdriver": False},
    "context": {"secure": True, "hostname": "localhost", "protocol": "https:"},
    "storage": {"local_storage": True, "session_storage": True, "indexed_db": True},
    "webrtc": {"supported": True, "local_addresses": [], "public_addresses": []},
    "permissions": {
        "camera": "prompt",
        "microphone": "prompt",
        "geolocation": "prompt",
        "notifications": "prompt",
        "clipboard_read": "prompt",
    },
    "cookies_enabled": True,
    "collected_at": "2026-11-01T00:00:00Z",
}


def _merge(base: dict[str, Any], updates: dict[str, Any]) -> dict[str, Any]:
    merged = {key: value for key, value in base.items()}
    for key, value in updates.items():
        if isinstance(value, dict) and isinstance(merged.get(key), dict):
            merged[key] = _merge(merged[key], value)
        else:
            merged[key] = value
    return merged


def make_snapshot(**updates: Any) -> dict[str, Any]:
    return _merge(BASE_SNAPSHOT, updates)


def _create(
    client: TestClient,
    auth: dict[str, str],
    snapshot: dict[str, Any] | None = None,
    label: str | None = None,
) -> dict:
    body: dict[str, Any] = {"snapshot": snapshot or make_snapshot()}
    if label:
        body["label"] = label
    response = client.post("/api/v1/device/scans", json=body, headers=auth)
    assert response.status_code == 201, response.text
    return response.json()


def test_device_scan_requires_authentication(client: TestClient) -> None:
    response = client.post("/api/v1/device/scans", json={"snapshot": make_snapshot()})
    assert response.status_code == 401


def test_safe_snapshot_scores_low(client: TestClient, auth: dict[str, str]) -> None:
    scan = _create(client, auth)

    assert scan["score"] == 0
    assert scan["level"] == "LOW"
    assert "No material exposure signals" in scan["summary"]
    assert scan["label"] == "Chrome on Windows"
    keys = {signal["key"] for signal in scan["signals"]}
    assert "secure_context" in keys
    assert "do_not_track" in keys
    assert "global_privacy_control" in keys
    assert not any(signal["points"] > 0 for signal in scan["signals"])


def test_risky_snapshot_scores_critical(client: TestClient, auth: dict[str, str]) -> None:
    snapshot = make_snapshot(
        context={"secure": False, "hostname": "192.168.1.20", "protocol": "http:"},
        cookies_enabled=False,
        storage={"local_storage": False, "session_storage": False, "indexed_db": False},
        privacy={"webdriver": True, "do_not_track": False, "global_privacy_control": False},
        webrtc={
            "supported": True,
            "local_addresses": ["192.168.1.10"],
            "public_addresses": ["203.0.113.7"],
        },
        permissions={
            "camera": "granted",
            "microphone": "granted",
            "geolocation": "granted",
            "notifications": "granted",
            "clipboard_read": "granted",
        },
        timezone_offset=0,
    )
    scan = _create(client, auth, snapshot, label="Shared demo laptop")

    assert scan["score"] == 100
    assert scan["level"] == "CRITICAL"
    assert scan["label"] == "Shared demo laptop"
    keys = {signal["key"] for signal in scan["signals"]}
    expected = {
        "insecure_context",
        "cookies_disabled",
        "storage_blocked",
        "webrtc_public_ip",
        "webrtc_local_ip",
        "permission_camera",
        "permission_microphone",
        "permission_geolocation",
        "permission_notifications",
        "permission_clipboard_read",
        "automation_driver",
        "timezone_mismatch",
    }
    assert expected <= keys
    titles = {recommendation["title"] for recommendation in scan["recommendations"]}
    assert "Use the HTTPS address" in titles
    assert "Review site permissions" in titles
    assert any(recommendation["priority"] == "now" for recommendation in scan["recommendations"])


def test_loopback_http_is_not_flagged_as_insecure(
    client: TestClient, auth: dict[str, str]
) -> None:
    snapshot = make_snapshot(
        context={"secure": True, "hostname": "localhost", "protocol": "http:"}
    )
    scan = _create(client, auth, snapshot)
    keys = {signal["key"] for signal in scan["signals"]}
    assert "secure_context" in keys
    assert "insecure_context" not in keys


def test_device_scan_history_and_delete(client: TestClient, auth: dict[str, str]) -> None:
    first = _create(client, auth)
    second = _create(client, auth, label="Work phone")

    listing = client.get("/api/v1/device/scans", headers=auth)
    assert listing.status_code == 200
    body = listing.json()
    assert body["total"] == 2
    assert body["page"] == 1
    assert body["pages"] == 1
    assert {item["id"] for item in body["items"]} == {first["id"], second["id"]}

    filtered = client.get("/api/v1/device/scans?level=LOW", headers=auth)
    assert filtered.status_code == 200
    assert filtered.json()["total"] == 2

    detail = client.get(f"/api/v1/device/scans/{first['id']}", headers=auth)
    assert detail.status_code == 200
    assert detail.json()["metrics"]["platform"] == "Windows"
    assert detail.json()["signals"]

    deleted = client.delete(f"/api/v1/device/scans/{first['id']}", headers=auth)
    assert deleted.status_code == 204

    missing = client.get(f"/api/v1/device/scans/{first['id']}", headers=auth)
    assert missing.status_code == 404

    remaining = client.get("/api/v1/device/scans", headers=auth)
    assert remaining.json()["total"] == 1


def test_device_scans_are_isolated_between_users(
    client: TestClient, auth: dict[str, str]
) -> None:
    scan = _create(client, auth)

    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "other-device-user@example.com",
            "full_name": "Other User",
            "password": "StrongPassword123",
        },
    )
    assert response.status_code == 201, response.text
    other = {"Authorization": f"Bearer {response.json()['access_token']}"}

    assert client.get(f"/api/v1/device/scans/{scan['id']}", headers=other).status_code == 404
    assert client.get("/api/v1/device/scans", headers=other).json()["total"] == 0
    assert client.delete(f"/api/v1/device/scans/{scan['id']}", headers=other).status_code == 404


def test_device_scan_rejects_invalid_snapshot(client: TestClient, auth: dict[str, str]) -> None:
    bad_offset = client.post(
        "/api/v1/device/scans",
        json={"snapshot": make_snapshot(timezone_offset=5000)},
        headers=auth,
    )
    assert bad_offset.status_code == 422

    too_many_addresses = client.post(
        "/api/v1/device/scans",
        json={
            "snapshot": make_snapshot(
                webrtc={
                    "supported": True,
                    "local_addresses": [f"192.168.0.{index}" for index in range(25)],
                    "public_addresses": [],
                }
            )
        },
        headers=auth,
    )
    assert too_many_addresses.status_code == 422

from __future__ import annotations

from fastapi.testclient import TestClient


def test_register_me_and_login(client: TestClient, user_credentials: dict[str, str]) -> None:
    register = client.post("/api/v1/auth/register", json=user_credentials)
    assert register.status_code == 201, register.text
    payload = register.json()
    assert payload["token_type"] == "bearer"
    assert payload["user"]["email"] == user_credentials["email"]
    assert "trustscan_refresh" in register.cookies

    headers = {"Authorization": f"Bearer {payload['access_token']}"}
    me = client.get("/api/v1/auth/me", headers=headers)
    assert me.status_code == 200
    assert me.json()["full_name"] == user_credentials["full_name"]

    login = client.post(
        "/api/v1/auth/login",
        json={"email": user_credentials["email"], "password": user_credentials["password"]},
    )
    assert login.status_code == 200

    bad = client.post(
        "/api/v1/auth/login",
        json={"email": user_credentials["email"], "password": "WrongPassword123"},
    )
    assert bad.status_code == 401


def test_duplicate_registration(client: TestClient, user_credentials: dict[str, str]) -> None:
    assert client.post("/api/v1/auth/register", json=user_credentials).status_code == 201
    duplicate = client.post("/api/v1/auth/register", json=user_credentials)
    assert duplicate.status_code == 409


def test_refresh_rotation_and_logout(client: TestClient, user_credentials: dict[str, str]) -> None:
    register = client.post("/api/v1/auth/register", json=user_credentials)
    assert register.status_code == 201
    first_refresh = register.cookies.get("trustscan_refresh")

    refreshed = client.post("/api/v1/auth/refresh")
    assert refreshed.status_code == 200, refreshed.text
    assert refreshed.json()["access_token"]
    second_refresh = refreshed.cookies.get("trustscan_refresh")
    assert second_refresh and second_refresh != first_refresh

    assert client.post("/api/v1/auth/logout").status_code == 204
    after_logout = client.post("/api/v1/auth/refresh")
    assert after_logout.status_code == 401


def test_password_change_revokes_sessions(
    client: TestClient, user_credentials: dict[str, str]
) -> None:
    register = client.post("/api/v1/auth/register", json=user_credentials)
    headers = {"Authorization": f"Bearer {register.json()['access_token']}"}

    changed = client.post(
        "/api/v1/auth/me/change-password",
        headers=headers,
        json={
            "current_password": user_credentials["password"],
            "new_password": "EvenStrongerPassword456",
        },
    )
    assert changed.status_code == 204

    old_login = client.post(
        "/api/v1/auth/login",
        json={"email": user_credentials["email"], "password": user_credentials["password"]},
    )
    assert old_login.status_code == 401

    new_login = client.post(
        "/api/v1/auth/login",
        json={
            "email": user_credentials["email"],
            "password": "EvenStrongerPassword456",
        },
    )
    assert new_login.status_code == 200


def test_protected_route_requires_token(client: TestClient) -> None:
    response = client.get("/api/v1/investigations")
    assert response.status_code == 401


def test_profile_update(client: TestClient, auth: dict[str, str]) -> None:
    response = client.patch(
        "/api/v1/auth/me",
        headers=auth,
        json={"full_name": "Updated Investigator"},
    )
    assert response.status_code == 200
    assert response.json()["full_name"] == "Updated Investigator"

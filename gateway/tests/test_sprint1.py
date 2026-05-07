"""Gateway test suite — Sprint 1 acceptance criteria."""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from gateway.main import create_app


@pytest.fixture()
def client() -> TestClient:
    app = create_app()
    return TestClient(app, raise_server_exceptions=False)


# ── /healthz ─────────────────────────────────────────────────────────────────


def test_healthz_returns_200(client: TestClient) -> None:
    r = client.get("/healthz")
    assert r.status_code == 200
    data = r.json()
    assert data["ok"] is True
    assert "deps" in data
    assert "supabase" in data["deps"]
    assert "langflow" in data["deps"]
    assert "n8n" in data["deps"]


def test_version_returns_200(client: TestClient) -> None:
    r = client.get("/version")
    assert r.status_code == 200
    assert r.json()["service"] == "agent-gateway"


# ── Login — CSRF gate ─────────────────────────────────────────────────────────


def test_login_without_csrf_returns_403(client: TestClient) -> None:
    """Missing CSRF header must be rejected."""
    r = client.post(
        "/auth/operator-login",
        json={"email": "test@example.com", "password": "hunter2"},
    )
    assert r.status_code == 403


def test_login_with_csrf_but_no_supabase_returns_503(client: TestClient) -> None:
    """With CSRF header but no Supabase config, should get 503 not 500."""
    r = client.post(
        "/auth/operator-login",
        json={"email": "test@example.com", "password": "hunter2"},
        headers={"X-GDAI-CSRF": "present"},
    )
    # In local mode with no Supabase configured, returns 503
    assert r.status_code in {503, 401}


def test_logout_without_csrf_returns_403(client: TestClient) -> None:
    r = client.post("/auth/logout")
    assert r.status_code == 403


def test_logout_with_csrf_returns_200(client: TestClient) -> None:
    r = client.post("/auth/logout", headers={"X-GDAI-CSRF": "present"})
    assert r.status_code == 200
    assert r.json()["ok"] is True


# ── Rate limiting ─────────────────────────────────────────────────────────────


def test_login_rate_limit_after_5_attempts(client: TestClient) -> None:
    """The 6th login attempt within a minute must be rate-limited."""
    for _ in range(5):
        client.post(
            "/auth/operator-login",
            json={"email": "brute@example.com", "password": "wrong"},
            headers={"X-GDAI-CSRF": "present"},
        )
    r = client.post(
        "/auth/operator-login",
        json={"email": "brute@example.com", "password": "wrong"},
        headers={"X-GDAI-CSRF": "present"},
    )
    assert r.status_code == 429

"""Health dependency probe degradation tests — Sprint 2."""
from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from gateway.main import create_app


@pytest.fixture()
def client() -> TestClient:
    app = create_app()
    return TestClient(app, raise_server_exceptions=False)


@pytest.fixture(autouse=True)
def _patch_urls(monkeypatch: pytest.MonkeyPatch) -> None:
    """Give each service a unique URL so probes are distinguishable by URL."""
    monkeypatch.setenv("SUPABASE_URL", "http://fake-supabase")
    monkeypatch.setenv("LANGFLOW_URL", "http://fake-langflow")
    monkeypatch.setenv("N8N_BASE_URL", "http://fake-n8n")
    monkeypatch.setenv("LANGFUSE_HOST", "http://fake-langfuse")
    monkeypatch.setenv("OTEL_COLLECTOR_HEALTH_URL", "http://fake-otel")
    monkeypatch.setenv("CHATWOOT_BASE_URL", "")
    from gateway import settings as s  # noqa: PLC0415

    s.get_settings.cache_clear()
    yield
    s.get_settings.cache_clear()


def _probe_factory(**overrides: str):  # noqa: ANN201
    """Return an async _probe mock that returns 'ok' unless overridden by hostname match."""

    async def _probe(url: str, timeout: float = 2.0) -> str:
        for hostname, result in overrides.items():
            if hostname in url:
                return result
        return "ok"

    return _probe


def test_all_healthy_returns_ok_map(client: TestClient) -> None:
    """When all probes return 200, deps map has all 'ok'."""
    with patch("gateway.health._probe", new=AsyncMock(return_value="ok")):
        r = client.get("/healthz")
    assert r.status_code == 200
    data = r.json()
    assert data["ok"] is True
    for key in ("supabase", "langflow", "n8n", "langfuse", "otel_collector"):
        assert key in data["deps"]
        assert data["deps"][key] == "ok"


def test_n8n_down_shows_degraded(client: TestClient) -> None:
    """n8n returning 503 → deps.n8n is not 'ok'."""
    with patch("gateway.health._probe", new=_probe_factory(**{"fake-n8n": "http_503"})):
        r = client.get("/healthz")
    assert r.status_code == 200
    data = r.json()
    assert data["ok"] is True
    assert data["deps"]["n8n"] != "ok"


def test_langfuse_down_shows_degraded(client: TestClient) -> None:
    """Langfuse probe failing → deps.langfuse is not 'ok'."""
    with patch("gateway.health._probe", new=_probe_factory(**{"fake-langfuse": "unreachable"})):
        r = client.get("/healthz")
    assert r.status_code == 200
    assert r.json()["deps"]["langfuse"] != "ok"


def test_otel_collector_down_shows_degraded(client: TestClient) -> None:
    """OTel collector probe failing → deps.otel_collector is not 'ok'."""
    with patch("gateway.health._probe", new=_probe_factory(**{"fake-otel": "unreachable"})):
        r = client.get("/healthz")
    assert r.status_code == 200
    assert r.json()["deps"]["otel_collector"] != "ok"


def test_healthz_includes_sprint2_deps(client: TestClient) -> None:
    """Sprint 2 adds langfuse, otel_collector, chatwoot to dep map."""
    r = client.get("/healthz")
    assert r.status_code == 200
    data = r.json()
    assert "langfuse" in data["deps"]
    assert "otel_collector" in data["deps"]
    assert "chatwoot" in data["deps"]

"""Webhook HMAC verification tests — Sprint 2."""
from __future__ import annotations

import hashlib
import hmac
import time
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from gateway.main import create_app

_SECRET = "test-hmac-secret"


def _sign(body: bytes, timestamp: str, secret: str = _SECRET) -> str:
    msg = f"{timestamp}:{body.hex()}".encode()
    return hmac.new(secret.encode(), msg=msg, digestmod=hashlib.sha256).hexdigest()


def _ts_now() -> str:
    return str(int(time.time()))


def _valid_headers(
    body: bytes,
    *,
    idem_key: str = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
    secret: str = _SECRET,
    ts: str | None = None,
) -> dict[str, str]:
    ts = ts or _ts_now()
    return {
        "X-Signature": _sign(body, ts, secret),
        "X-Timestamp": ts,
        "X-Idempotency-Key": idem_key,
    }


@pytest.fixture()
def client() -> TestClient:
    app = create_app()
    return TestClient(app, raise_server_exceptions=False)


@pytest.fixture(autouse=True)
def _patch_hmac_secret(monkeypatch: pytest.MonkeyPatch) -> None:
    """Inject test secret into settings so we can predict signatures."""
    monkeypatch.setenv("N8N_HMAC_SECRET", _SECRET)
    # Clear lru_cache so patched env is picked up
    from gateway import settings as s  # noqa: PLC0415

    s.get_settings.cache_clear()
    yield
    s.get_settings.cache_clear()


# ── Valid signature ────────────────────────────────────────────────────────────


def test_valid_signature_returns_ok(client: TestClient) -> None:
    body = b'{"event": "run.completed"}'
    headers = _valid_headers(body)
    with patch(
        "gateway.routers.callbacks._check_idempotency",
        new=AsyncMock(return_value=False),
    ), patch(
        "gateway.routers.callbacks._insert_callback_event",
        new=AsyncMock(return_value=None),
    ):
        r = client.post(
            "/callbacks/n8n/wf002v2",
            content=body,
            headers={"Content-Type": "application/json", **headers},
        )
    assert r.status_code == 200
    assert r.json() == {"ok": True}


# ── Expired timestamp ─────────────────────────────────────────────────────────


def test_expired_timestamp_returns_400(client: TestClient) -> None:
    body = b'{"event": "run.completed"}'
    stale_ts = str(int(time.time()) - 400)  # >300 s ago
    headers = {
        "X-Signature": _sign(body, stale_ts),
        "X-Timestamp": stale_ts,
        "X-Idempotency-Key": "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
    }
    r = client.post(
        "/callbacks/n8n/wf002v2",
        content=body,
        headers={"Content-Type": "application/json", **headers},
    )
    assert r.status_code == 400
    assert r.json()["detail"]["error"] == "stale_timestamp"


# ── Tampered body ─────────────────────────────────────────────────────────────


def test_tampered_body_returns_401(client: TestClient) -> None:
    original_body = b'{"event": "run.completed"}'
    headers = _valid_headers(original_body)
    tampered_body = b'{"event": "run.hacked"}'
    r = client.post(
        "/callbacks/n8n/wf002v2",
        content=tampered_body,
        headers={"Content-Type": "application/json", **headers},
    )
    assert r.status_code == 401
    assert r.json()["detail"]["error"] == "invalid_signature"


# ── Tampered signature ────────────────────────────────────────────────────────


def test_tampered_signature_returns_401(client: TestClient) -> None:
    body = b'{"event": "run.completed"}'
    headers = _valid_headers(body)
    # Flip one nibble
    sig = headers["X-Signature"]
    headers["X-Signature"] = sig[:-1] + ("f" if sig[-1] != "f" else "e")
    r = client.post(
        "/callbacks/n8n/wf002v2",
        content=body,
        headers={"Content-Type": "application/json", **headers},
    )
    assert r.status_code == 401


# ── Idempotency dedup ─────────────────────────────────────────────────────────


def test_idempotency_dedup_returns_deduped(client: TestClient) -> None:
    body = b'{"event": "run.completed"}'
    headers = _valid_headers(body)
    with patch(
        "gateway.routers.callbacks._check_idempotency",
        new=AsyncMock(return_value=True),  # already seen
    ):
        r = client.post(
            "/callbacks/n8n/wf002v2",
            content=body,
            headers={"Content-Type": "application/json", **headers},
        )
    assert r.status_code == 200
    assert r.json() == {"deduped": True}


# ── Invalid idempotency key format ────────────────────────────────────────────


def test_invalid_idempotency_key_returns_400(client: TestClient) -> None:
    body = b'{"event": "run.completed"}'
    ts = _ts_now()
    r = client.post(
        "/callbacks/n8n/wf002v2",
        content=body,
        headers={
            "Content-Type": "application/json",
            "X-Signature": _sign(body, ts),
            "X-Timestamp": ts,
            "X-Idempotency-Key": "not-a-uuid",
        },
    )
    assert r.status_code == 400

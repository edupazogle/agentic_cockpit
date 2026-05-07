"""Redaction unit tests."""
from __future__ import annotations

from gateway.redact import redact


def test_drops_password() -> None:
    result = redact({"password": "hunter2", "action": "login"})
    assert result["password"] == "[redacted]"
    assert result["action"] == "login"


def test_hashes_email() -> None:
    result = redact({"email": "alice@example.com"})
    assert result["email"].startswith("sha256:")
    assert "alice" not in result["email"]


def test_hashes_user_id() -> None:
    result = redact({"user_id": "abc-123"})
    assert result["user_id"].startswith("sha256:")


def test_drops_access_token() -> None:
    result = redact({"access_token": "eyJsomething"})
    # Either dropped by key or by pattern
    assert "[redacted" in result["access_token"]


def test_drops_jwt_by_pattern() -> None:
    jwt_value = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.sig"
    result = redact({"custom_field": jwt_value})
    assert "[redacted" in result["custom_field"]


def test_nested_redaction() -> None:
    data = {"user": {"email": "bob@example.com", "role": "operator"}}
    result = redact(data)
    assert result["user"]["email"].startswith("sha256:")
    assert result["user"]["role"] == "operator"


def test_passthrough_benign_data() -> None:
    data = {"scenario_id": "abc", "status": "running", "step": 3}
    result = redact(data)
    assert result == data

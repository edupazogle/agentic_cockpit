"""PII redaction allowlist — strip/hash sensitive fields before tracing."""
from __future__ import annotations

import hashlib
import re
from typing import Any

# Fields that must be hashed (not dropped) for correlation
_HASH_FIELDS = frozenset(
    {
        "email",
        "user_email",
        "operator_email",
        "session_id",
        "user_id",
        "actor_id",
        "policyholder_id",
        "claimant_id",
    }
)

# Fields that must be fully dropped
_DROP_FIELDS = frozenset(
    {
        "password",
        "token",
        "access_token",
        "refresh_token",
        "cookie",
        "authorization",
        "credit_card",
        "iban",
        "ssn",
        "date_of_birth",
        "phone_number",
        "address",
        "first_name",
        "last_name",
        "nom",
        "prenom",
        "telephone",
        "adresse",
    }
)

# Patterns for values that look like secrets even in unknown keys
_SECRET_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"^eyJ[A-Za-z0-9_-]{20,}"),  # JWT
    re.compile(r"^sk-[A-Za-z0-9]{20,}"),  # OpenAI key
    re.compile(r"^sbp_[A-Za-z0-9]{20,}"),  # Supabase personal key
]


def _hash_value(value: str) -> str:
    return "sha256:" + hashlib.sha256(value.encode()).hexdigest()[:16]


def _looks_like_secret(value: Any) -> bool:
    if not isinstance(value, str):
        return False
    return any(p.match(value) for p in _SECRET_PATTERNS)


def redact(data: dict[str, Any], depth: int = 0) -> dict[str, Any]:
    """
    Recursively redact PII from a dict before it enters Langfuse/OTel spans.

    - DROP_FIELDS → replaced with "[redacted]"
    - HASH_FIELDS → replaced with "sha256:<first16>" for correlation without PII
    - Values matching _SECRET_PATTERNS → replaced with "[redacted:secret_pattern]"
    - Nested dicts and lists are processed recursively (max depth 8)
    """
    if depth > 8:  # noqa: PLR2004
        return {"[truncated]": "max_depth_exceeded"}

    result: dict[str, Any] = {}
    for key, value in data.items():
        lower_key = key.lower()

        if lower_key in _DROP_FIELDS:
            result[key] = "[redacted]"
        elif lower_key in _HASH_FIELDS and isinstance(value, str):
            result[key] = _hash_value(value)
        elif isinstance(value, str) and _looks_like_secret(value):
            result[key] = "[redacted:secret_pattern]"
        elif isinstance(value, dict):
            result[key] = redact(value, depth + 1)
        elif isinstance(value, list):
            result[key] = [
                redact(item, depth + 1) if isinstance(item, dict) else item
                for item in value
            ]
        else:
            result[key] = value

    return result

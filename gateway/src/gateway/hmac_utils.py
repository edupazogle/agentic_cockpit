"""HMAC verification utilities for webhook callbacks.

All comparisons use hmac.compare_digest to prevent timing-oracle attacks.
Timestamp window is enforced *before* the HMAC comparison so that stale
requests are rejected cheaply without leaking HMAC oracle data.
"""
from __future__ import annotations

import hashlib
import hmac
import time

from fastapi import HTTPException, status

_MAX_SKEW_SECONDS = 300  # 5 minutes


class HMACError(Exception):
    """Raised when HMAC verification fails.

    Callers translate this into the appropriate HTTP response.
    """

    def __init__(self, message: str, *, stale: bool = False) -> None:
        super().__init__(message)
        self.stale = stale


def _expected_signature(body: bytes, timestamp: str, secret: str) -> str:
    """Compute the expected HMAC-SHA256 hex signature.

    Format: HMAC-SHA256(key=secret, msg=f"{timestamp}:{body_hex}")
    The timestamp is bound to the payload so replay at a different time fails.
    """
    msg = f"{timestamp}:{body.hex()}".encode()
    return hmac.new(
        secret.encode(),
        msg=msg,
        digestmod=hashlib.sha256,
    ).hexdigest()


def verify_hmac(
    body: bytes,
    signature: str,
    timestamp_str: str,
    secret: str,
    *,
    max_skew: int = _MAX_SKEW_SECONDS,
) -> None:
    """Verify that *body* was signed with *secret* and is not stale.

    Args:
        body: Raw request body bytes.
        signature: Hex-encoded HMAC-SHA256 from the ``X-Signature`` header.
        timestamp_str: Unix epoch string from the ``X-Timestamp`` header.
        secret: Shared HMAC secret (kept in gateway env only).
        max_skew: Maximum allowed age of the request in seconds (default 300).

    Raises:
        HMACError: If the timestamp is stale or the signature is invalid.
    """
    # ── Timestamp gate (cheap, no oracle) ────────────────────────────────────
    try:
        ts = int(timestamp_str)
    except ValueError as exc:
        raise HMACError("invalid timestamp format", stale=False) from exc

    skew = abs(int(time.time()) - ts)
    if skew > max_skew:
        raise HMACError(
            f"stale timestamp: skew={skew}s > max={max_skew}s",
            stale=True,
        )

    # ── Signature check (constant-time) ──────────────────────────────────────
    expected = _expected_signature(body, timestamp_str, secret)
    if not hmac.compare_digest(expected, signature.lower()):
        raise HMACError("signature mismatch")


def raise_hmac_error(err: HMACError) -> None:
    """Convert an HMACError into the correct FastAPI HTTP exception."""
    if err.stale:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "stale_timestamp", "message": str(err)},
        )
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail={"error": "invalid_signature", "message": "HMAC verification failed"},
    )

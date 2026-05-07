"""Authentication — JWT verification and cookie management."""
from __future__ import annotations

from typing import Any

import structlog
from fastapi import Cookie, HTTPException, Request, status
from itsdangerous import BadSignature, SignatureExpired, TimestampSigner
from jose import JWTError, jwt

from gateway.settings import get_settings

logger = structlog.get_logger()

# ── JWT helpers ──────────────────────────────────────────────────────────────


def verify_supabase_jwt(token: str) -> dict[str, Any]:
    """
    Verify a Supabase-issued JWT using the project JWT secret.

    Returns the decoded payload on success, raises HTTPException on failure.
    """
    settings = get_settings()
    secret = settings.supabase_jwt_secret.get_secret_value()
    if not secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Auth service not configured",
        )
    try:
        payload: dict[str, Any] = jwt.decode(
            token,
            secret,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
        return payload
    except JWTError as exc:
        logger.warning("jwt_verification_failed", error=str(exc))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from exc


# ── Cookie helpers ────────────────────────────────────────────────────────────


def _get_signer() -> TimestampSigner:
    settings = get_settings()
    return TimestampSigner(settings.cookie_signing_key.get_secret_value())


def sign_session_cookie(user_id: str, tenant_id: str) -> str:
    """Create a signed, timestamped session cookie value."""
    payload = f"{user_id}:{tenant_id}"
    signer = _get_signer()
    signed: str = signer.sign(payload).decode()
    return signed


def verify_session_cookie(cookie_value: str) -> dict[str, str]:
    """
    Verify a signed session cookie.

    Returns {'user_id': ..., 'tenant_id': ...} on success.
    Raises HTTPException on failure.
    """
    settings = get_settings()
    signer = _get_signer()
    try:
        raw = signer.unsign(
            cookie_value,
            max_age=settings.cookie_max_age_seconds,
        )
        parts = raw.decode().split(":", 1)
        if len(parts) != 2:  # noqa: PLR2004
            raise ValueError("Malformed cookie payload")
        return {"user_id": parts[0], "tenant_id": parts[1]}
    except SignatureExpired as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired",
        ) from exc
    except (BadSignature, ValueError) as exc:
        logger.warning("invalid_session_cookie", error=str(exc))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid session",
        ) from exc


# ── CSRF ──────────────────────────────────────────────────────────────────────


def verify_csrf_header(request: Request) -> None:
    """
    Verify the custom CSRF header is present for state-mutating requests.

    We use the "custom header" technique: same-origin JS can set custom
    headers; cross-origin requests are blocked by the pre-flight check.
    """
    settings = get_settings()
    csrf_value = request.headers.get(settings.csrf_header_name)
    if not csrf_value:
        logger.warning(
            "csrf_missing",
            path=str(request.url.path),
            origin=request.headers.get("origin", ""),
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="CSRF header required",
        )


# ── FastAPI dependency ────────────────────────────────────────────────────────


def require_session(
    gdai_session: str | None = Cookie(default=None, alias="gdai_session"),
) -> dict[str, str]:
    """
    FastAPI dependency that enforces an authenticated session.

    Usage::

        @router.get("/protected")
        def protected(session = Depends(require_session)):
            return {"user_id": session["user_id"]}
    """
    if not gdai_session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )
    return verify_session_cookie(gdai_session)


def build_session_cookie_kwargs(signed_value: str) -> dict[str, Any]:
    """Build the kwargs dict for `Response.set_cookie`."""
    settings = get_settings()
    return {
        "key": settings.cookie_name,
        "value": signed_value,
        "httponly": True,
        "secure": settings.cookie_secure,
        "samesite": settings.cookie_samesite,
        "max_age": settings.cookie_max_age_seconds,
        "path": "/",
    }

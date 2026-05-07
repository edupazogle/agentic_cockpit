"""Auth routes — login / logout with rate limiting and cookie management."""
from __future__ import annotations

from typing import Any

import structlog
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel, EmailStr

# email-validator must be installed for EmailStr (included in pydantic[email])
from slowapi import Limiter
from slowapi.util import get_remote_address

from gateway.audit import AuditAction, append_audit_event
from gateway.auth import (
    build_session_cookie_kwargs,
    sign_session_cookie,
    verify_csrf_header,
)
from gateway.settings import get_settings
from gateway.tenant import resolve_tenant_id

router = APIRouter(prefix="/auth", tags=["auth"])
logger = structlog.get_logger()

limiter = Limiter(key_func=get_remote_address)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    ok: bool
    user_id: str
    tenant_id: str


@router.post("/operator-login", response_model=LoginResponse)
@limiter.limit("5/minute")
async def operator_login(
    request: Request,
    response: Response,
    body: LoginRequest,
    tenant_id: str = Depends(resolve_tenant_id),
) -> LoginResponse:
    """
    Authenticate an operator against Supabase Auth.

    On success: sets an HTTP-only signed session cookie.
    Rate-limited to 5 attempts per minute per IP.
    """
    verify_csrf_header(request)
    settings = get_settings()

    import httpx  # noqa: PLC0415 — lazy import to keep startup fast

    supabase_url = settings.supabase_url
    anon_key = settings.supabase_anon_key.get_secret_value()

    if not supabase_url or not anon_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Auth service not configured",
        )

    async with httpx.AsyncClient(timeout=5.0) as client:
        res = await client.post(
            f"{supabase_url}/auth/v1/token?grant_type=password",
            json={"email": body.email, "password": body.password},
            headers={"apikey": anon_key, "Content-Type": "application/json"},
        )

    if res.status_code != 200:  # noqa: PLR2004
        await append_audit_event(
            tenant_id=tenant_id,
            action=AuditAction.AUTH_FAILED,
            actor_id=None,
            resource_type="auth",
            resource_id="login",
            payload={"email_hash": _hash_email(body.email)},
        )
        logger.warning(
            "login_failed",
            status=res.status_code,
            tenant_id=tenant_id,
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    data: dict[str, Any] = res.json()
    user_id: str = data.get("user", {}).get("id", "")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Auth response malformed",
        )

    signed = sign_session_cookie(user_id=user_id, tenant_id=tenant_id)
    response.set_cookie(**build_session_cookie_kwargs(signed))

    await append_audit_event(
        tenant_id=tenant_id,
        action=AuditAction.AUTH_LOGIN,
        actor_id=user_id,
        resource_type="auth",
        resource_id=user_id,
    )

    logger.info("login_success", user_id=user_id, tenant_id=tenant_id)
    return LoginResponse(ok=True, user_id=user_id, tenant_id=tenant_id)


@router.post("/logout")
async def operator_logout(
    request: Request,
    response: Response,
) -> dict[str, bool]:
    """Clear the session cookie."""
    verify_csrf_header(request)
    settings = get_settings()

    response.delete_cookie(
        key=settings.cookie_name,
        path="/",
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        httponly=True,
    )
    return {"ok": True}


def _hash_email(email: str) -> str:
    import hashlib  # noqa: PLC0415

    return "sha256:" + hashlib.sha256(email.lower().encode()).hexdigest()[:16]

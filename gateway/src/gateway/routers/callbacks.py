"""Webhook callback router — receives HMAC-signed events from n8n.

Security model:
  1. Timestamp window check (≤300 s) — cheap rejection before HMAC work.
  2. Constant-time HMAC-SHA256 comparison.
  3. Idempotency dedup via `idempotency_key` in scenario_run_events.
  4. Rejected requests write a WEBHOOK_REJECTED audit row.
"""
from __future__ import annotations

import uuid
from typing import Any

import structlog
from fastapi import APIRouter, Depends, Header, Request, status
from fastapi.responses import JSONResponse

from gateway.audit import AuditAction, append_audit_event
from gateway.hmac_utils import HMACError, raise_hmac_error, verify_hmac
from gateway.settings import get_settings
from gateway.tenant import resolve_tenant_id

router = APIRouter(prefix="/callbacks", tags=["callbacks"])
logger = structlog.get_logger()


async def _check_idempotency(
    idempotency_key: str,
    tenant_id: str,
    supabase: Any,  # noqa: ANN401 — supabase client is dynamic
) -> bool:
    """Return True if this key has already been processed (dedup hit)."""
    if supabase is None:
        return False
    try:
        result = (
            await supabase.table("scenario_run_events")
            .select("id")
            .eq("idempotency_key", idempotency_key)
            .eq("tenant_id", tenant_id)
            .limit(1)
            .execute()
        )
        return bool(result.data)
    except Exception as exc:
        logger.warning("idempotency_check_failed", error=str(exc))
        return False


async def _insert_callback_event(
    *,
    idempotency_key: str,
    tenant_id: str,
    flow: str,
    payload: dict[str, Any],
    supabase: Any,  # noqa: ANN401
) -> None:
    """Insert callback payload into callback_queue for async processing."""
    if supabase is None:
        logger.info(
            "callback_received_local_only",
            flow=flow,
            idempotency_key=idempotency_key,
        )
        return
    await supabase.table("callback_queue").insert(
        {
            "tenant_id": tenant_id,
            "source": "n8n",
            "flow": flow,
            "idempotency_key": idempotency_key,
            "payload": payload,
        }
    ).execute()


@router.post("/n8n/{flow}")
async def n8n_callback(
    flow: str,
    request: Request,
    x_signature: str = Header(..., alias="X-Signature"),
    x_timestamp: str = Header(..., alias="X-Timestamp"),
    x_idempotency_key: str = Header(..., alias="X-Idempotency-Key"),
    tenant_id: str = Depends(resolve_tenant_id),
) -> JSONResponse:
    """
    Receive a HMAC-signed callback from n8n.

    Headers required:
        X-Signature: hex HMAC-SHA256 of ``{timestamp}:{body_hex}``
        X-Timestamp: Unix epoch string (must be within 300 s of now)
        X-Idempotency-Key: UUID; replayed keys return ``{deduped: true}``

    Returns:
        200 ``{ok: true}`` — accepted and queued
        200 ``{deduped: true}`` — already processed (idempotent replay)
        400 — stale timestamp
        401 — invalid signature
    """
    settings = get_settings()

    # ── Build Supabase client lazily (avoids import cycle) ───────────────────
    supabase_client: Any = None
    if settings.supabase_url and settings.supabase_service_role_key.get_secret_value():
        from supabase._async.client import AsyncClient  # noqa: PLC0415

        supabase_client = AsyncClient(
            settings.supabase_url,
            settings.supabase_service_role_key.get_secret_value(),
        )

    body = await request.body()

    # ── HMAC + timestamp verification ────────────────────────────────────────
    try:
        verify_hmac(
            body,
            x_signature,
            x_timestamp,
            settings.n8n_hmac_secret.get_secret_value(),
        )
    except HMACError as err:
        logger.warning(
            "webhook_rejected",
            flow=flow,
            reason=str(err),
            stale=err.stale,
        )
        await append_audit_event(
            tenant_id=tenant_id,
            action=AuditAction.WEBHOOK_REJECTED,
            actor_id=None,
            resource_type="callback",
            resource_id=f"n8n:{flow}",
            payload={"reason": str(err), "stale": err.stale},
            supabase_client=supabase_client,
        )
        raise_hmac_error(err)  # always raises — never returns

    # ── Idempotency dedup ────────────────────────────────────────────────────
    # Validate UUID format first to avoid injection
    try:
        idem_key = str(uuid.UUID(x_idempotency_key))
    except ValueError:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": "invalid_idempotency_key"},
        )

    if await _check_idempotency(idem_key, tenant_id, supabase_client):
        logger.info("callback_deduped", flow=flow, idempotency_key=idem_key)
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"deduped": True},
        )

    # ── Parse payload ─────────────────────────────────────────────────────────
    try:
        payload: dict[str, Any] = await request.json()
    except Exception:
        payload = {}

    # ── Enqueue callback ──────────────────────────────────────────────────────
    await _insert_callback_event(
        idempotency_key=idem_key,
        tenant_id=tenant_id,
        flow=flow,
        payload=payload,
        supabase=supabase_client,
    )

    logger.info("callback_accepted", flow=flow, idempotency_key=idem_key)
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={"ok": True},
    )

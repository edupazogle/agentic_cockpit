"""FastAPI application factory — agent-gateway."""
from __future__ import annotations

import asyncio
import signal
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from gateway.health import router as health_router
from gateway.logging_config import configure_logging
from gateway.otel import init_otel
from gateway.routers.auth_router import router as auth_router
from gateway.routers.callbacks import router as callbacks_router
from gateway.routers.hitl_router import router as hitl_router
from gateway.routers.pilots_router import router as pilots_router
from gateway.routers.runs_router import router as runs_router
from gateway.settings import get_settings

logger = structlog.get_logger()

limiter = Limiter(key_func=get_remote_address)


# Drain flag — set True on SIGTERM so in-flight callbacks can finish
_draining = False
_DRAIN_TIMEOUT_SECONDS = 15


def _handle_sigterm(signum: int, frame: object) -> None:  # noqa: ARG001
    global _draining  # noqa: PLW0603
    _draining = True
    logger.info("gateway_drain_started", timeout=_DRAIN_TIMEOUT_SECONDS)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    configure_logging()
    init_otel()
    settings = get_settings()
    # Register graceful drain on SIGTERM (Railway sends this before kill)
    signal.signal(signal.SIGTERM, _handle_sigterm)
    logger.info(
        "gateway_starting",
        env=settings.app_env,
        version=settings.app_version,
    )
    yield
    # ── Drain window ──────────────────────────────────────────────────────────
    if _draining:
        logger.info("gateway_draining", secs=_DRAIN_TIMEOUT_SECONDS)
        await asyncio.sleep(_DRAIN_TIMEOUT_SECONDS)
    logger.info("gateway_shutdown")


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="GDAI Agent Gateway",
        version=settings.app_version,
        docs_url="/docs" if settings.is_local else None,
        redoc_url="/redoc" if settings.is_local else None,
        lifespan=lifespan,
    )

    # ── Rate limiting ────────────────────────────────────────────────────────
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # type: ignore[arg-type]

    # ── CORS ─────────────────────────────────────────────────────────────────
    origins = settings.allowed_origins or (
        ["http://localhost:3000"] if settings.is_local else []
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )

    # ── Routers ───────────────────────────────────────────────────────────────
    app.include_router(health_router)
    app.include_router(auth_router)
    app.include_router(callbacks_router)
    app.include_router(pilots_router)
    app.include_router(hitl_router)
    app.include_router(runs_router)

    # ── OpenTelemetry instrumentation ─────────────────────────────────────────
    FastAPIInstrumentor.instrument_app(app)

    # ── Global error handler ─────────────────────────────────────────────────
    @app.exception_handler(Exception)
    async def global_exception_handler(
        request: Request, exc: Exception
    ) -> JSONResponse:
        logger.error(
            "unhandled_exception",
            path=str(request.url.path),
            method=request.method,
            error=str(exc),
            exc_info=exc,
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"ok": False, "error": "Internal server error"},
        )

    return app


app = create_app()

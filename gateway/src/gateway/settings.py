"""Gateway settings — loaded from environment variables."""
from __future__ import annotations

from functools import lru_cache

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── App ─────────────────────────────────────────────────────────────────
    app_env: str = Field(default="local", description="local | staging | production")
    app_version: str = Field(default="dev")
    tenant_id_default: str = Field(
        default="gdai-default",
        description="Single-tenant MVP fallback — local/dev only. Must not be used in production.",
    )

    # ── Supabase ─────────────────────────────────────────────────────────────
    supabase_url: str = Field(default="")
    supabase_service_role_key: SecretStr = Field(default=SecretStr(""))
    supabase_anon_key: SecretStr = Field(default=SecretStr(""))
    supabase_jwt_secret: SecretStr = Field(default=SecretStr(""))

    # ── Cookie / session ─────────────────────────────────────────────────────
    cookie_signing_key: SecretStr = Field(default=SecretStr("change-me-in-prod"))
    cookie_name: str = Field(default="gdai_session")
    cookie_secure: bool = Field(default=True)
    cookie_samesite: str = Field(default="strict")
    cookie_max_age_seconds: int = Field(default=3600 * 8)  # 8 hours

    # ── CORS / CSRF ───────────────────────────────────────────────────────────
    allowed_origins: list[str] = Field(default_factory=list)
    csrf_header_name: str = Field(default="X-GDAI-CSRF")

    # ── Rate limits ───────────────────────────────────────────────────────────
    login_rate_limit: str = Field(default="5/minute")

    # ── Downstream services ───────────────────────────────────────────────────
    langflow_url: str = Field(default="")
    n8n_base_url: str = Field(default="")
    docling_url: str = Field(default="")
    chatwoot_base_url: str = Field(default="")

    # ── Webhook HMAC ─────────────────────────────────────────────────────────
    n8n_hmac_secret: SecretStr = Field(
        default=SecretStr("change-me-in-prod"),
        description="Shared HMAC-SHA256 secret for n8n→gateway callbacks.",
    )

    # ── OTel collector health endpoint ────────────────────────────────────────
    otel_collector_health_url: str = Field(
        default="",
        description="HTTP health endpoint of the OTel collector (e.g. http://otel-collector:13133).",
    )

    # ── OTel ─────────────────────────────────────────────────────────────────
    otel_exporter_otlp_endpoint: str = Field(default="")
    otel_service_name: str = Field(default="agent-gateway")

    # ── Langfuse ─────────────────────────────────────────────────────────────
    langfuse_secret_key: SecretStr = Field(default=SecretStr(""))
    langfuse_public_key: str = Field(default="")
    langfuse_host: str = Field(default="http://localhost:3000")

    # ── Langflow runtime ─────────────────────────────────────────────────────
    langflow_api_url: str = Field(default="")
    langflow_api_key: SecretStr = Field(default=SecretStr(""))
    langflow_timeout_s: float = Field(default=30.0)
    langflow_flow_id: str = Field(default="property-fast-track")

    # ── PostHog ──────────────────────────────────────────────────────────────
    posthog_api_key: str = Field(default="")
    posthog_host: str = Field(default="https://eu.posthog.com")

    # ── Canary rollout ───────────────────────────────────────────────────────
    langflow_canary_pct: int = Field(default=5, description="Max Langflow traffic percentage")
    langflow_error_threshold: float = Field(default=5.0)
    langflow_rollback_window_s: int = Field(default=600)

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @property
    def is_local(self) -> bool:
        return self.app_env == "local"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()

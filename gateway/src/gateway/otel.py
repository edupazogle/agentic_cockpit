"""OTel SDK initialisation — call once at gateway startup."""
from __future__ import annotations

import structlog
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import SERVICE_NAME, Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor, ConsoleSpanExporter

from gateway.settings import get_settings

logger = structlog.get_logger()

_initialized = False


def init_otel() -> None:
    """
    Initialise OpenTelemetry tracing for the gateway.

    - When OTEL_EXPORTER_OTLP_ENDPOINT is set: exports to the OTel collector
      (which performs PII redaction before forwarding to Langfuse/Dynatrace).
    - When not set (local dev): falls back to ConsoleSpanExporter so traces
      are visible without running the collector.
    """
    global _initialized  # noqa: PLW0603
    if _initialized:
        return

    settings = get_settings()

    resource = Resource(
        attributes={
            SERVICE_NAME: settings.otel_service_name,
            "deployment.environment": settings.app_env,
            "service.version": settings.app_version,
        }
    )
    provider = TracerProvider(resource=resource)

    if settings.otel_exporter_otlp_endpoint:
        exporter = OTLPSpanExporter(
            endpoint=f"{settings.otel_exporter_otlp_endpoint}/v1/traces",
        )
        provider.add_span_processor(BatchSpanProcessor(exporter))
        logger.info(
            "otel_otlp_exporter_configured",
            endpoint=settings.otel_exporter_otlp_endpoint,
        )
    else:
        provider.add_span_processor(BatchSpanProcessor(ConsoleSpanExporter()))
        logger.info("otel_console_exporter_configured_local_dev_only")

    trace.set_tracer_provider(provider)
    _initialized = True


def get_tracer(name: str = "agent-gateway") -> trace.Tracer:
    return trace.get_tracer(name)

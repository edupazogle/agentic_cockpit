---
name: otel
description: >
  OpenTelemetry collector configuration for the Agentic Cockpit. Use when editing
  the otel-collector service, adding a new exporter, tweaking PII redaction, wiring
  a new service into the trace pipeline, or debugging missing traces in Langfuse.
  Triggers: "PII redaction", "trace pipeline", "OTLP", "otel-collector", "missing traces",
  "dual export", "Dynatrace exporter", "span attribute redact".
allowed-tools: Bash(curl:*), Bash(otelcol-contrib:*)
---

# OTel collector — PII redaction + dual export

## When to use this skill

- Adding a new exporter (currently: Langfuse OTLP; later: Dynatrace).
- Modifying PII redaction rules.
- Wiring a new service to send OTLP traces.
- Debugging missing traces in Langfuse.

## Pipeline shape

```
[ services ] --OTLP/HTTP:4318--> [ otel-collector ] --processors--> [ exporters ]
                                                                       ├── Langfuse OTLP
                                                                       └── Dynatrace OTLP (Phase 6)
```

Config lives at `otel/otel-config.yaml` in the repo and is mounted into the collector container at `/etc/otelcol-contrib/config.yaml`.

## Receivers

```yaml
receivers:
  otlp:
    protocols:
      http:
        endpoint: 0.0.0.0:4318
      grpc:
        endpoint: 0.0.0.0:4317
```

Public on Railway? **No.** Private only. Services use `${{ otel-collector.RAILWAY_PRIVATE_DOMAIN }}:4318`.

## Processors (order matters)

1. **`memory_limiter`** — drop spans before OOM; soft 75%, hard 90%.
2. **`attributes/redact`** — redact PII keys before any exporter sees them.
3. **`transform/scrub`** — regex-strip emails, IBANs, plate numbers, NINs from span body.
4. **`batch`** — 5s flush, 8192 max.

### PII keys to redact (drop)

`user.email`, `user.phone`, `user.iban`, `claim.policyholder_name`, `claim.policyholder_email`, `vehicle.vin`, `vehicle.plate`, `address.street`, `address.postal_code`.

### Regex scrub (replace with `[REDACTED]`)

- Emails: `[\w.+-]+@[\w-]+\.[\w.-]+`
- IBANs: `[A-Z]{2}[0-9]{2}[A-Z0-9]{4,30}`
- Spanish DNI/NIE: `[0-9XYZ][0-9]{7}[A-Z]`
- French plates: `[A-Z]{2}-[0-9]{3}-[A-Z]{2}`

## Exporters

Generate the Basic Auth header value:
```bash
echo -n "pk-lf-YOUR_PUBLIC_KEY:sk-lf-YOUR_SECRET_KEY" | base64
# → cGstbGYtWU9VUl9QVUJMSUNfS0VZOnNrLWxmLVlPVVJfU0VDUkVUX0tFWQ==
```

```yaml
exporters:
  otlphttp/langfuse:
    endpoint: "http://${LANGFUSE_HOST}:3000/api/public/otel"
    headers:
      Authorization: "Basic ${LANGFUSE_BASIC_AUTH_B64}"  # base64(public_key:secret_key)
  # Phase 6:
  # otlphttp/dynatrace:
  #   endpoint: "${DT_OTLP_ENDPOINT}"
  #   headers:
  #     Authorization: "Api-Token ${DT_TOKEN}"
```

## Service block

```yaml
service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [memory_limiter, attributes/redact, transform/scrub, batch]
      exporters: [otlphttp/langfuse]
```

## Sender setup (gateway)

```python
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter

trace.set_tracer_provider(TracerProvider())
trace.get_tracer_provider().add_span_processor(
    BatchSpanProcessor(OTLPSpanExporter(endpoint=f"{OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces"))
)
```

`OTEL_EXPORTER_OTLP_ENDPOINT=http://${{otel-collector.RAILWAY_PRIVATE_DOMAIN}}:4318`.

## Verify traces are flowing

After wiring the collector, confirm the pipeline is end-to-end before moving on:

```bash
# 1. Collector is alive
curl -s http://127.0.0.1:13133/ | jq .status          # → "Server available"

# 2. Send a test span
curl -X POST http://127.0.0.1:4318/v1/traces \
  -H "Content-Type: application/json" \
  -d '{"resourceSpans":[{"resource":{"attributes":[{"key":"service.name","value":{"stringValue":"test"}}]},"scopeSpans":[{"spans":[{"traceId":"00000000000000000000000000000001","spanId":"0000000000000001","name":"verify-pipeline","kind":1,"startTimeUnixNano":"1000000000","endTimeUnixNano":"2000000000"}]}]}]}'

# 3. Check trace appears in Langfuse (wait ~5s for batch flush)
curl -s "http://127.0.0.1:3000/api/public/traces?limit=1" \
  -H "Authorization: Basic ${LANGFUSE_BASIC_AUTH_B64}" | jq .data[0].name
# → "verify-pipeline"
```



- **n8n's OTel community node** sends OTLP/HTTP to port 4318, not 4317. Don't accidentally point it at gRPC.
- The `transform/scrub` processor uses OTTL syntax, not Go regex syntax — escape `\w` as `\\w` in YAML.
- Langfuse expects `Basic` auth (base64 of `pub:secret`), not `Bearer`. Easy mistake.
- Memory limiter dropping silently? Watch `otelcol_processor_dropped_spans` metric on the collector's own `:8888/metrics`.

## Healthcheck

`extensions: [health_check]` on `:13133/`. Railway healthcheck path is `/`.

## References

- OTel collector contrib: https://github.com/open-telemetry/opentelemetry-collector-contrib
- Langfuse OTLP ingest: https://langfuse.com/docs/opentelemetry/get-started
- OTTL functions: https://github.com/open-telemetry/opentelemetry-collector-contrib/blob/main/pkg/ottl/LANGUAGE.md

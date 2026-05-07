# Sprint 2 — Runtime Estate Landing: Implementation Plan

**Linear Issue:** AXA-4  
**Branch:** `deliver/backend/axa-4-runtime-estate`  
**Sprint doc:** `docs/sprints/sprint-2-runtime-estate-landing.md`  
**Architecture authority:** `docs/architecture.md`

---

## Architecture Compliance Checklist

Before any commit, verify:

- [ ] Gateway is the only trust boundary — no Supabase service-role key in Next.js
- [ ] All inter-service calls use Railway private domain pattern (`${{ Service.RAILWAY_PRIVATE_DOMAIN }}`)
- [ ] HMAC callback endpoints use constant-time comparison (no timing leaks)
- [ ] Timestamp window check (≤300 s skew) applied before HMAC compare
- [ ] Idempotency dedup reads from `events` table — no duplicate state writes
- [ ] Audit log written for every WEBHOOK_REJECTED event
- [ ] Callback queue follows the same `tenant_id` + RLS pattern as all other tables
- [ ] OTel redaction processor config matches the `redact.py` DROP/HASH field lists
- [ ] Migration 0010 idempotent (`create table if not exists`)
- [ ] No business logic in Next.js API routes

---

## Files to Create

### Gateway

| File | Purpose |
|------|---------|
| `gateway/src/gateway/routers/callbacks.py` | `POST /callbacks/n8n/{flow}` — HMAC verify, dedup, event write |
| `gateway/src/gateway/hmac_utils.py` | `verify_hmac()` — constant-time compare, timestamp window |
| `gateway/tests/test_webhook_hmac.py` | HMAC tests: valid, expired, tampered body, tampered ts, dedup |
| `gateway/tests/test_health_deps.py` | Health probe degradation: n8n/langfuse/otel down → degraded |

### Gateway (modify)

| File | Change |
|------|--------|
| `gateway/src/gateway/health.py` | Add n8n, langfuse, otel-collector probes to `GET /healthz` |
| `gateway/src/gateway/main.py` | Register callbacks router; add SIGTERM drain handler |
| `gateway/src/gateway/settings.py` | Add `N8N_HMAC_SECRET`, `OTEL_COLLECTOR_ENDPOINT` fields |

### Database

| File | Purpose |
|------|---------|
| `db/migrations/0010_callback_queue.sql` | `callback_queue` + `callback_dead_letter` tables, indexes, RLS |

### Infrastructure / Observability

| File | Purpose |
|------|---------|
| `infra/railway.json` | Service manifest for staging estate (S2 subset) |
| `otel/otel-config.yaml` | Collector: receivers, redaction processor, dual exporter |
| `infra/perf/k6-s2-baseline.json` | k6 baseline result placeholder (committed with stub for CI) |

### Runbooks

| File | Purpose |
|------|---------|
| `docs/runbooks/railway-bootstrap.md` | Bootstrap order, env var checklist, rollback |
| `docs/runbooks/backup-supabase.md` | Daily PITR + on-demand snapshot, restore plan |

### Backup scripts

| File | Purpose |
|------|---------|
| `infra/backup/backup-pg-langfuse.sh` | Logical dump Langfuse Postgres → `langfuse-blobs/backups/` |
| `infra/backup/backup-clickhouse.sh` | ClickHouse logical dump → `langfuse-blobs/backups/ch/` |

---

## Implementation Order

1. **Migration 0010** — DB changes needed by gateway callbacks
2. **hmac_utils.py** — Isolated crypto utility, no deps on other new code
3. **settings.py update** — Add new env vars before they're needed
4. **callbacks.py** — Router using hmac_utils + events module
5. **health.py update** — Expanded probes
6. **main.py update** — Register router + SIGTERM drain
7. **Tests** — test_webhook_hmac.py + test_health_deps.py
8. **OTel config** — otel/otel-config.yaml
9. **infra/railway.json** — Service manifest
10. **Backup scripts** — infra/backup/
11. **Runbooks** — docs/runbooks/

---

## Testing Plan

### Unit tests (gateway/tests/)

- `test_webhook_hmac.py`
  - `test_valid_signature` — correct body + sig + ts → 200 `{ok: true}`
  - `test_expired_timestamp` — ts > 300s ago → 400 + audit row
  - `test_tampered_body` — body changed after signing → 401 + audit row
  - `test_tampered_signature` — sig nibble flipped → 401 + audit row
  - `test_idempotency_dedup` — replay same `X-Idempotency-Key` → 200 `{deduped: true}`

- `test_health_deps.py`
  - `test_n8n_degraded` — n8n mock returns 503 → `deps.n8n == "degraded"`
  - `test_langfuse_degraded` — langfuse mock fails → `deps.langfuse == "degraded"`
  - `test_all_healthy` — all deps return 200 → `deps.*` all `"ok"`

### Regression (run full suite)

```bash
cd gateway && uv run pytest tests/ -v
```

---

## Rollback Plan

1. **Migration 0010** — Migration is additive (new tables only). Rollback: `DROP TABLE callback_dead_letter; DROP TABLE callback_queue;`
2. **Callbacks router** — Remove import from `main.py`; gateway degrades gracefully
3. **Health probes** — Previous probe list is a subset; reverting to `health.py` backup restores S1 behaviour
4. **infra/railway.json** — Railway services can be removed individually via `railway service delete`; no state corruption

---

## Acceptance Criteria (from AXA-4)

| ID | Criterion | Verification |
|----|-----------|-------------|
| AC-2-01 | Railway staging estate provisioned with S2 service subset | `railway service status --all --json` |
| AC-2-02 | n8n property-fast-track runs end-to-end through gateway | One full run trace in Langfuse |
| AC-2-03 | OTel collector deployed with PII redaction active | `pytest tests/test_redact.py` + screenshot |
| AC-2-04 | Langfuse self-host smoke test passes | Span visible in Langfuse UI |
| AC-2-05 | Backup runbooks committed; restore drill plan documented | File exists + reviewed |
| AC-2-06 | k6 baseline at 10 concurrent users passes | `infra/perf/k6-s2-baseline.json` exists |

Additional from sprint doc:
| AC-2-07 | HMAC callback writes one event row + one audit row | psql query |
| AC-2-08 | Replay same idempotency key → `{deduped: true}`, no duplicate event | pytest |
| AC-2-09 | Stale timestamp (>5 min) → 400 + audit row | pytest |
| AC-2-10 | Migration 0010 applied, local == remote | `supabase migration list --linked` |

# Railway Bootstrap Runbook

> **Scope:** Sprint 2 services — `agentic-web`, `agent-gateway`, `n8n`, `langfuse-web`, `langfuse-worker`, `clickhouse`, `otel-collector`
>
> **Authority:** `infra/railway.json` is the canonical service manifest.

---

## Prerequisites

- Railway CLI (`railway --version`) ≥ 3.x installed and authenticated (`railway login`)
- Project linked: `railway link` (select `gdai-agentic-cockpit`, env `production`)
- All required secrets available in a secrets manager or 1Password vault

---

## Boot Order

Railway services must be started in dependency order to avoid healthcheck races.

```
1. Databases first (no dependencies)
   └── langfuse-db (Postgres)
   └── n8n-db (Postgres)

2. Storage
   └── clickhouse

3. Core platform
   └── langfuse-worker (depends on langfuse-db + clickhouse)
   └── langfuse-web    (depends on langfuse-db + clickhouse)
   └── n8n             (depends on n8n-db)

4. Observability
   └── otel-collector  (depends on langfuse-web for OTLP export)

5. Application
   └── agent-gateway   (depends on langfuse, n8n, Supabase)
   └── agentic-web     (depends on agent-gateway)
```

For a fresh project bootstrap:

```bash
# 1. Provision databases via Railway dashboard or CLI
railway service create --name langfuse-db --image postgres:16-alpine
railway service create --name n8n-db      --image postgres:16-alpine

# 2. Provision ClickHouse
railway service create --name clickhouse  --image clickhouse/clickhouse-server:24.8-alpine

# 3. Set required variables (from 1Password vault: gdai/railway/production)
railway variables set --service agent-gateway \
  SUPABASE_URL="..." \
  SUPABASE_SERVICE_ROLE_KEY="..." \
  SUPABASE_ANON_KEY="..." \
  SUPABASE_JWT_SECRET="..." \
  N8N_HMAC_SECRET="..." \
  LANGFUSE_SECRET_KEY="..."

# 4. Deploy from infra manifest
railway up --service agentic-web
railway up --service agent-gateway
```

---

## Required Environment Variables

### `agent-gateway` (must be set before first deploy)

| Variable | Source | Notes |
|---|---|---|
| `SUPABASE_URL` | Supabase project settings | `https://<project>.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase > API > service_role | **Secret** |
| `SUPABASE_ANON_KEY` | Supabase > API > anon | |
| `SUPABASE_JWT_SECRET` | Supabase > JWT settings | **Secret** |
| `N8N_HMAC_SECRET` | Generate: `openssl rand -hex 32` | **Secret** — must match n8n credential |
| `LANGFUSE_SECRET_KEY` | Langfuse > Settings > API keys | **Secret** |
| `DYNATRACE_OTLP_ENDPOINT` | AXA Dynatrace tenant | Optional in dev |
| `DYNATRACE_API_TOKEN` | AXA Dynatrace API tokens | Optional in dev |

### `langfuse-web` / `langfuse-worker`

| Variable | Notes |
|---|---|
| `SALT` | `openssl rand -hex 32` — **must match between web and worker** |
| `ENCRYPTION_KEY` | `openssl rand -hex 32` |
| `AUTH_DISABLE_SIGNUP` | `true` for production |
| `NEXTAUTH_SECRET` | `openssl rand -hex 32` |

---

## Healthcheck Verification

After deploy, verify all services report healthy:

```bash
# Public endpoints
curl -f https://cockpit.gdai.axa/api/health     | jq .
curl -f https://langfuse.gdai.axa/api/public/health | jq .

# Gateway deps (via cockpit API — requires auth cookie)
curl -f https://cockpit.gdai.axa/api/gateway/healthz | jq .deps

# Railway status
railway service status --all
```

Expected: all services `Active`, gateway `deps.*` all `ok`.

---

## Rollback Procedure

### Code rollback (bad deploy)

```bash
# List recent deployments for a service
railway deployments list --service agent-gateway

# Roll back to previous deployment
railway deployment rollback --service agent-gateway --deployment <ID>
```

### Database rollback (migration error)

Database migrations are applied via `supabase db push`. They are **not** auto-rolled back by Railway. See [backup-supabase.md](./backup-supabase.md) for PITR restore.

### Full environment rollback

1. Switch Railway environment to `staging` to test fix
2. Apply fix and re-deploy to `production`
3. Do NOT delete `production` environment — it contains linked volumes and secrets

---

## Drain and Graceful Shutdown

The `agent-gateway` handles SIGTERM with a 15-second drain window before shutdown. Railway sends SIGTERM on redeploy. Normal redeploy cycle is:

1. Railway starts new replica
2. Railway sends SIGTERM to old replica
3. Old replica drains in-flight requests (≤15s)
4. New replica takes traffic

If the drain window is too long, reduce `_DRAIN_TIMEOUT_SECONDS` in `gateway/src/gateway/main.py`.

---

## Checklist for Sprint 2 Bootstrap

- [ ] `langfuse-db` and `n8n-db` Postgres services provisioned
- [ ] `clickhouse` service provisioned with persistent volume
- [ ] All required secrets set via `railway variables set`
- [ ] Migration 0010 applied (`supabase db push`)
- [ ] `otel/otel-config.yaml` mounted into `otel-collector` service
- [ ] `langfuse-web` and `langfuse-worker` deployed and healthy
- [ ] `n8n` deployed and workflow catalog bootstrapped (`scripts/bootstrap-n8n.mjs`)
- [ ] `agent-gateway` deployed, `/healthz` returns all deps `ok`
- [ ] `agentic-web` deployed, `/api/health` returns 200
- [ ] Langfuse shows traces from gateway (test with one manual scenario run)

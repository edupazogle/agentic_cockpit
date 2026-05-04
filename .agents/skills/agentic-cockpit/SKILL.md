---
name: agentic-cockpit
description: >
  Repo-specific conventions for the GDAI Agentic Cockpit monorepo: Next.js cockpit,
  Python gateway, run-store, scenario state machine, gateway↔web wire format,
  HITL flow, and the testing/CI pipeline. Use this skill any time you're touching
  /app, /lib/server, /gateway, or wiring scenarios. Triggers: "scenario_runs",
  "hitl_items", "run-store", "node_states", "audit_log", "gateway proxy",
  "wire format", "run status", "queued → running", "scenario state machine".
allowed-tools: Bash(pnpm:*), Bash(uv:*), Bash(supabase:*), Bash(railway:*)
---

# Agentic Cockpit — repo conventions

> Companion to `docs/refactor_main_v3.md`. This skill captures **how the code is organized**, not what to build.

## Monorepo layout

```
agentic/
├── app/                  Next.js App Router (RSC + client islands)
├── lib/
│   ├── client/           Browser-only utilities
│   └── server/           Server-only — DO NOT import from client code
│       ├── run-store.ts  scenario_runs read/write — single source of truth
│       └── demo/         synthetic claims DB (motor-fleet data here)
├── components/           React 19 + RSC + a few client components
├── db/migrations/        Supabase SQL migrations (numeric prefix only!)
├── flows/                Langflow JSON exports + lfx config
├── gateway/              Python FastAPI (Phase 1+)
│   ├── src/gateway/
│   │   ├── main.py
│   │   ├── tenant.py
│   │   ├── langflow_client.py
│   │   ├── langfuse_obs.py
│   │   ├── posthog_flags.py
│   │   ├── hitl.py
│   │   ├── audit.py
│   │   ├── eval_runner.py
│   │   └── routes/
│   ├── pyproject.toml    uv-managed, Python 3.12, mypy strict
│   └── tests/
├── otel/                 collector config
├── infra/                Railway template manifest (railway.json)
└── docs/                 refactor_main_v3.md is canonical
```

## Tooling (don't deviate)

- **Node:** v20 LTS, **pnpm** (not npm/yarn).
- **Python:** 3.12, **uv** for deps, **ruff** for lint, **mypy --strict**.
- **DB:** Supabase CLI v2.95.4 at `/usr/local/bin/supabase`. Project ref `tsevmqftwnyzrxlpnred`.
- **Tests:** `pnpm test` (Vitest), `cd gateway && uv run pytest`.

## Wire format: cockpit ↔ gateway

The Next.js cockpit talks to the gateway via **`/api/gateway/*`** proxy routes. Cookies/auth are forwarded server-side, never exposed to the browser.

```
POST /api/runs                       — start a run
POST /api/runs/:id/cancel
GET  /api/runs/:id/events?since=...  — SSE stream of scenario_run_events
POST /api/hitl/items/:id/decision    — operator approve/edit/reject
GET  /api/audit/bundle?run_id=...    — signed ZIP (Phase 6)
```

All bodies are JSON, all timestamps ISO-8601 UTC, all IDs UUIDv4 (except `pilot_id` text and `claim_id` `CLM-…`).

## Scenario state machine

Defined in `lib/server/run-store.ts`. States:

```
queued → running → (waiting → running)* → (completed | failed)
```

`waiting` is set when `node_states.<step>.state == 'awaiting_hitl'`. The cockpit polls SSE for events and re-renders nodes by ID.

**Do not invent new states.** If you need a new node-level state (e.g., `retrying`), put it in `node_states[stepKey].state`, not on `scenario_runs.status`.

## Tenancy

- `tenant_id` on every row. MVP value: `'gdai-default'`.
- Read it from `request.jwt.claims.tenant_id` in `gateway/src/gateway/tenant.py` — middleware injects on every route.
- Cockpit doesn't pass tenant_id; the gateway resolves it from the SSO token (Phase 3+).

## HITL ↔ Chatwoot

See `chatwoot` skill for the handover packet format. Repo-specific: `gateway/src/gateway/hitl.py` owns the queue. Don't post to Chatwoot directly from any other module — go through `hitl.handover()`.

## Run-store rules

- **`scenario_runs.runtime_metadata` is jsonb** and used as a scratchpad. Fields documented in JSDoc on `RunStore.update`. Don't add new top-level columns for transient state.
- **Atomic updates only** — use `update_run({ id, patch })` which does optimistic concurrency on `updated_at`.
- **Events are append-only.** Never delete a `scenario_run_events` row.

## Testing pyramid

| Layer | Tool | Where |
|---|---|---|
| Unit | Vitest, pytest | colocated `*.test.ts`, `tests/test_*.py` |
| Component | Vitest + RTL | `components/**/*.test.tsx` |
| Integration | Playwright | `e2e/*.spec.ts` (smoke happy-path per pilot) |
| Eval | `gateway/scripts/eval_runner.py` | golden dataset on every flow change |

CI runs unit + lint + typecheck on PR. Integration + eval run nightly on `main`.

## Don'ts

- ❌ Don't import `lib/server/*` into `lib/client/*` or any `"use client"` module.
- ❌ Don't hard-code service URLs in env files — use Railway reference vars.
- ❌ Don't write to `scenario_runs` from anywhere except `run-store.ts`.
- ❌ Don't bypass the audit log when changing pilot or HITL state.
- ❌ Don't add a feature flag without documenting it in `docs/refactor_main_v3.md` §11.

## References

- `docs/refactor_main_v3.md` — canonical plan
- `db/migrations/0001_agentic_schema.sql` ... `0008_extensions.sql` — schema
- `lib/server/run-store.ts` — run state model

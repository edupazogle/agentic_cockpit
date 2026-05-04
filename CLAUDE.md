# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture authority

**[`docs/architecture.md`](docs/architecture.md) is the single source of truth** for all technical decisions, component boundaries, data flow, and deployment topology. When any implementation question arises:
1. `docs/architecture.md` has priority over all other documents
2. If architecture.md is silent, consult [`docs/refactor_main_v3.md`](docs/refactor_main_v3.md)
3. If both are silent, default to the conservative option matching locked Q-decisions (§Hard constraints below)

## Repo purpose

GDAI Agentic Cockpit — an AXA-internal control plane for AI-agent insurance pilots. The canonical delivery plan is [`docs/refactor_main_v3.md`](docs/refactor_main_v3.md). **Read it before any non-trivial change.**

## Current state (2026-05-03)

The repo is at the **start of Sprint 1** ("Foundation Skeleton") of a 6-sprint, 12-week MVP. The original Next.js 16 cockpit prototype lives in `delete/` and will be selectively restored. No `app/`, `components/`, `lib/`, or `gateway/` directories exist yet — they all need to be created during Sprint 1.

Supabase migrations 0001–0008 are applied to project `tsevmqftwnyzrxlpnred` but the gateway and new routes are not built.

## Commands

```bash
# Node / Next.js (from project root, after restoring from delete/)
pnpm dev                    # Next.js dev server
pnpm build                  # production build
pnpm lint                   # ESLint via next lint
pnpm test                   # Vitest

# Python gateway (once gateway/ exists)
cd gateway && uv run pytest
cd gateway && uv run ruff check
cd gateway && uv run mypy

# Database
supabase db push             # apply new migrations
supabase migration list      # verify sync status

# Railway (once infra/ exists)
railway up                   # deploy from infra/railway.json
railway service status --all
```

Node v20 LTS, **pnpm** (not npm/yarn). Python 3.12, **uv** (not pip). Supabase CLI at `/usr/local/bin/supabase`.

## Architecture

**Runtime topology (Railway):** 17 services on a private network, all inter-service calls use `${{ Service.RAILWAY_PRIVATE_DOMAIN }}`. Only 3 services are public: `agentic-web`, `chatwoot-web`, `langfuse-web`.

```
agentic-web (Next.js 16, React 19) ──private──▶ agent-gateway (FastAPI Python 3.12)
                                                       │
                          ┌────────────────────────────┼────────────────────┐
                          ▼                            ▼                    ▼
                  langflow-runtime 1.9          n8n (tools layer)     docling-serve
                  (agent orchestrator)          wfmcp01–04, wf006     (doc pipeline)
                          │                            │
                          ▼                            ▼
                  Langfuse OSS (self-hosted)    Chatwoot (HITL bridge)
                  PostHog Cloud EU (flags)
```

**Key design choices:**
- Two services, not one: Next.js cockpit proxies to Python gateway — no business logic in Next.js API routes
- Langflow owns reasoning + control flow; n8n owns stable tools/side-effects
- Self-hosted Langfuse from day 1 (no cloud dependency)
- Single-tenant MVP: `tenant_id` hardcoded `gdai-default`, RLS policies written but service-role bypasses
- WaitForResume durability via Postgres-backed `hitl_items` bridge (Langflow's native checkpointing isn't durable enough)
- Feature-flag cutover from n8n to Langflow via PostHog `pf_orchestrator` flag with auto-rollback

**Wire format:** Next.js → proxy `/api/gateway/*` → gateway. Cookies forwarded server-side. All bodies JSON, timestamps ISO-8601 UTC, IDs UUIDv4 (except `pilot_id` text and `claim_id` `CLM-…`).

**Scenario state machine** (in `lib/server/run-store.ts`): `queued → running → (waiting → running)* → (completed | failed)`. Node-level states in `node_states[stepKey].state`, not on `scenario_runs.status`.

## MCP servers (configured in `.vscode/mcp.json`)

| Server | Use for |
|---|---|
| **supabase** | Schema queries, migrations, table reads, advisors |
| **Railway** | Service status, env vars, deploys, logs, metrics, buckets |
| **n8n** (HTTP) | Tool execution as gateway would — testing MCP wiring end-to-end |
| **n8n-mcp** (stdio) | Editing/creating/validating n8n workflows |
| **langflow** | Triggering flows by name, checking runtime tools manifest |
| **linear** | Sprint issue management, labels, blocking relationships, project sync |

**Fallback order when MCP is down:** MCP → ecosystem CLI → direct `psql` / `curl`.

## Skills catalog (hub-and-spoke)

**Always load the hub skill first** when working in its domain. Hubs route to sub-skills via decision trees. Sub-skills are loaded on demand — never load all sub-skills upfront.

### Workflow hubs

| `/` command | Domain | Sub-skills (loaded on demand) |
|---|---|---|
| `/brainstorm` | Design, ideation, experimentation | — |
| `/sprint` | Sprint planning, Linear sync, architecture updates | — |
| `/deliver` | Sprint delivery lifecycle | Branch prefixes: `deliver/frontend/*`, `deliver/backend/*` |
| `/qa` | Code quality review, merge gate | designqa-reviewer (frontend), qa-reviewer (backend) |

### Platform hubs

| `/` command | Domain | Sub-skills (loaded on demand) |
|---|---|---|
| `/langflow` | Agent orchestration | `runtime`, `flows-api`, `hitl-resume`, `components`, `custom-components`, `backend-code-review`, `frontend-code-review`, `component-refactoring`, `e2e-testing`, `frontend-query-mutation`, `frontend-testing` |
| `/n8n` | Workflow automation, MCP tools | `n8n-code-javascript`, `n8n-code-python`, `n8n-expression-syntax`, `n8n-mcp-tools-expert`, `n8n-node-configuration`, `n8n-validation-expert`, `n8n-workflow-patterns` |
| `/supabase` | Database schema, migrations, RLS | — |
| `/railway` | Infrastructure, deploys, logs | — |

### Observability hubs

| `/` command | Domain | Sub-skills |
|---|---|---|
| `/langfuse` | LLM tracing, evals, datasets | — |
| `/posthog` | Feature flags, experiments | — |
| `/otel` | OpenTelemetry config, PII redaction | — |

### Specialized hubs

| `/` command | Domain | Sub-skills (loaded on demand) |
|---|---|---|
| `/design` | Visual design, taste, branding | `brandkit`, `design-taste-frontend`, `full-output-enforcement`, `gpt-taste`, `high-end-visual-design`, `image-to-code`, `minimalist-ui`, `redesign-existing-projects` |
| `/chatwoot` | HITL handover, webhook signatures | — |
| `/toolkit` | Meta: skill authoring, code review, diagrams | `skill-forge`, `skill-judge`, `code-review-expert`, `c4-architecture`, `mermaid-diagrams` |
| `/experimentation` | LLM prompt experiments, evals | — |
| `agentic-cockpit` | Repo conventions: run-store, wire format, state machine, HITL flow, testing pyramid | — |

### Discovery

To see all available skills: `ls /home/mr_e/agentic/.agents/skills/`
To see sub-skills in a domain: `ls /home/mr_e/agentic/.agents/skills/<domain>/`
To load a hub: Read `.agents/skills/<domain>/SKILL.md`
To load a sub-skill: Read `.agents/skills/<domain>/<sub-skill>/SKILL.md`

## Database rules

- **Never edit applied migrations.** New schema → new file `db/migrations/00NN_purpose.sql`
- Numeric prefix only (`^\d+_`) — Supabase CLI ignores non-numeric prefixes
- Idempotent SQL: `create table if not exists`, `create or replace function`, `drop policy if exists ... create policy`
- Every new table: `tenant_id text not null references tenants(id)` + RLS policy in same migration
- Apply via `supabase db push` (project `tsevmqftwnyzrxlpnred`)
- Any write via `service_role` from outside the gateway must write an `audit_log` row

## Hard constraints (locked Q-decisions)

1. Keep Railway as infra platform
2. Keep Next.js cockpit (don't rewrite UI)
3. Langflow 1.9 backend-only, n8n stays as MCP-tools layer
4. Two app services: Next.js + Python gateway
5. Single-tenant MVP: `gdai-default`
6. Self-hosted Langfuse from day 1
7. 3 LLM-judge rubrics: factual accuracy, policy compliance, tone
8. Single `operator` HITL role
9. Demo narration: LLM-generated from Langfuse trace
10. Motor-fleet test data: fully synthesized

**Push back if a request conflicts with any of these** — reference `docs/refactor_main_v3.md` §2.

## Code style

- **TypeScript strict**, ESM only, App Router conventions
- **Python 3.12 + Ruff + mypy --strict**, Pydantic v2, FastAPI
- No business logic in Next.js API routes — they proxy to gateway
- Tests colocated: `*.test.ts` for TS, `tests/test_*.py` for Python
- Comments only where intent is non-obvious
- Don't import `lib/server/*` into client code
- Don't write to `scenario_runs` except through `run-store.ts`
- Don't bypass audit log for pilot or HITL state changes

## Definition of done (per phase)

1. All todos for phase are `done`
2. `supabase migration list --linked` shows local == remote
3. Railway services for phase are `Active` with passing healthchecks
4. Langfuse shows traces for new flows
5. CI green: `pnpm test`, `pnpm lint`, `pnpm typecheck`, `cd gateway && uv run pytest && uv run ruff check && uv run mypy`
6. `docs/refactor_main_v3.md` updated if scope/interfaces shifted

## When stuck

1. Re-read relevant section of `docs/refactor_main_v3.md`
2. Load matching skill from `.agents/skills/`
3. Try relevant MCP server before falling back to CLI
4. If ambiguous, ask one focused question — don't guess architecture
5. Default to the conservative option matching locked decisions; document choice in `docs/refactor_main_v3.md` §12

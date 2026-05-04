# GDAI Agentic Cockpit — Refactor Main v3 Delivery PRD

> **Status:** v3 — final implementation PRD, 2026-05-04. This is the single canonical delivery plan. Earlier refactor docs (v1, v2) have been retired.
>
> **Authority:** this document is the source of truth for sequencing, delivery gates, security posture, promotion rules, sprint acceptance criteria, architecture, the 17-service Railway topology, the property-fast-track graph, the UI component inventory, and the runtime durability architecture (§15). Companion docs: `docs/property-fast-track.md`, `docs/architecture.md`.
>
> **Core stance:** keep the same fundamental choices: Railway, Next.js cockpit, FastAPI gateway, Langflow backend runtime, n8n tools layer, Supabase control plane, Langfuse observability, PostHog flags, Chatwoot HITL, synthetic-first delivery. The changes here are about delivery discipline, hard gates, security/compliance depth, and demo quality.

---

## 0. Executive Summary

The combined v2 plan is ambitious and directionally strong, but it currently has four problems that would make delivery fragile:

1. **The repo is pre-Sprint-1, not ready for Builder or Langflow cutover.** The runnable Next.js prototype is under `delete/`; root `app/`, `lib/`, `components/`, `gateway/`, `flows/`, `infra/`, and `otel/` do not exist yet.
2. **Earlier docs contain competing delivery tracks.** One plan says 6 sprints, another says 7, and Builder readiness is described as if later infrastructure already exists. v3 normalizes this into **Sprint 0 + eight delivery sprints**.
3. **Real-data promotion controls are too late.** Authentication, RLS enforcement, PII minimization, webhook replay defense, audit anchoring, and data-residency proof must be hard gates before any G1/G2 real-data path.
4. **Sprint demos are too infrastructure-heavy.** v3 turns every sprint into a stakeholder-visible PRD: each sprint proves a persona journey on staging and includes failure-state testing plus user decision experiments.

The revised delivery shape:

| Stage | Weeks | Purpose |
|---|---:|---|
| **S0 — Repo Recovery Gate** | 0 | Restore active monorepo shape, CI skeleton, run-store risk surfaced. |
| **S1 — Foundation + Trust Boundary** | 1-2 | Web shell, gateway skeleton, auth shape, run-store hardening, trace smoke. |
| **S2 — Runtime Estate Landing** | 3-4 | Railway services, n8n baseline, metrics, backups, health model, no Langflow cutover. |
| **S3 — Langflow Cutover Canary** | 5-6 | Property-fast-track on Langflow at forced/5%, checkpoint proof, MCP reliability. |
| **S4 — Pilot + HITL Product Surface** | 7-8 | Operator can run, monitor, approve, and audit a claim in cockpit. |
| **S5 — Ops + Eval Control Loop** | 9-10 | Ops view, SLOs, eval CI, online sampling, 25% canary eligibility. |
| **S6 — Executive Demo + Experimentation** | 11-12 | Narrated demo, Try It Yourself, controlled variants, rollback theater. |
| **S7 — Motor-Fleet + Audit Hardening** | 13-14 | Second pilot, audit bundle, load test, restore drill, pentest triage. |
| **S8 — Scenario Builder + Synthdata Factory** | 15-16 | Safe generated pilot workflow, only after pre-S8 validation experiment passes. |

The most important change is the **promotion ladder**:

| Gate | Meaning | Allowed data | Requirement |
|---|---|---|---|
| **G0 Synthetic** | MVP build/demo mode | Synthetic only | Current architecture may proceed here. |
| **G1 Shadow** | Real data read/shadow, no real effects | Redacted/tokenized real-like or approved real shadow data | Entra/OIDC, RLS no-fallback, source redaction, data residency, webhook replay defense, audit anchoring, DPIA complete. |
| **G2 Canary** | Limited real-effect pilot | Approved real data | G1 plus SLOs, eval CI, rollback, DORA evidence, operator oversight tests. |
| **G3 Production** | Broad rollout | Production data | Post-MVP; not part of this delivery plan. |

---

## 1. Review Method, Skills, Plugins, and Sources

### Skills Used

| Skill | Why it mattered |
|---|---|
| `agentic-cockpit` | Repo conventions: Next.js/gateway boundary, run-store, state machine, HITL flow, testing pyramid. |
| `brainstorming` | Structured the PRD as understanding -> critique -> delivery design. |
| `experimentation` | Used to define per-sprint questions that must be tested rather than assumed. |
| `railway` | Informed infrastructure sequencing, service boundaries, health checks, private-network assumptions. |
| `supabase` | Informed RLS, service-role, migration, tenant, audit, and storage controls. |
| `chatwoot` | Informed HITL handover, webhook signatures, and operator decision flow. |
| `otel` | Informed collector-level redaction and telemetry transformation. |
| `posthog` | Informed server-side flag and experiment requirements. |
| `langfuse` | Informed tracing, evals, project separation, and self-hosting constraints. |
| `langflow/runtime`, `langflow/flows-api`, `langflow/hitl-resume` | Informed Langflow runtime, API, session, checkpoint, and HITL risks. |
| `n8n/*` skills | Informed n8n MCP/tooling validation, generated workflow risks, and Code-node security. |

### Plugins Evaluated

No plugin was required to complete this review. The available installable plugin that may help later is:

| Plugin | Use later when |
|---|---|
| `github` | Turning this PRD into issues, PR branches, review queues, CI checks, and release notes. |

I did not install a plugin because the current task is a local planning and documentation task, not a GitHub issue/PR operation.

### MCP Availability and Future Use

MCP resources were checked during this review, but no callable resources were exposed in this session. The implementation plan still assumes the repo's configured MCP servers are the preferred operational path once available:

| MCP | Use during delivery |
|---|---|
| `supabase` | Schema inspection, migration verification, advisors, read-only debugging. |
| `Railway` | Service status, variables, deploy verification, logs, metrics, bucket checks. |
| `n8n` | Runtime tool execution as the gateway would call it. |
| `n8n-mcp` | Workflow authoring, validation, security audits, credential schema inspection. |
| `langflow` | Flow runtime health, MCP manifest, flow execution smoke tests. |

Fallback order remains MCP -> ecosystem CLI/API -> direct `curl`/`psql`, with audit logging for any privileged data mutation.

### Subagent Review Coverage

Four subagents reviewed the plan independently:

| Reviewer | Focus | Key contribution |
|---|---|---|
| Codebase-plan alignment | Current repo vs plan assumptions | Found missing root app/gateway/infra/flows and run-store contradictions. |
| Security/privacy/compliance | Enterprise insurance controls | Moved real-data gates left; added auth/RLS/PII/audit/webhook requirements. |
| Product/demo/PRD | Sprint acceptance and stakeholder journeys | Converted sprint demos into persona-visible product moments. |
| Infra/runtime/delivery | Sequencing, topology, rollout | Added S0, moved gateway reliability and Langflow durability proof earlier. |

### Online Verification Corrections

The review used current public docs and security references. Most important corrections:

| Topic | Verified point | Plan implication |
|---|---|---|
| Railway private networking | Railway describes private networking as an encrypted WireGuard mesh and recommends `http://service.railway.internal:port` for private service URLs. | Remove v2-overlay's self-signed `*.railway.internal` TLS requirement from S1. Use private networking + app-layer auth/HMAC; evaluate mTLS only for G1/G2 if AXA requires it. |
| Supabase service role | Supabase service keys bypass RLS. | Service-role must stay server-only in gateway; RLS tests must use non-service JWTs; tenant fallback must be dev-only. |
| Chatwoot webhooks | Chatwoot signs outgoing webhooks with HMAC-SHA256 over timestamp and raw body. | Standardize timestamp skew, replay cache, nonce/idempotency, raw-body canonicalization, and constant-time comparison. |
| Langflow production auth | Langflow recommends enabling authentication in production; API/webhook auth settings exist. | Langflow must remain private and authenticated; no public flow build/runtime endpoints. |
| OTel collector | Redaction, transform, filter, and attributes processors are available in the collector ecosystem. | Collector redaction is necessary but insufficient; source-level redaction is required before Langfuse/Chatwoot/audit. |
| PostHog Node/flags | Server-side flags need the right host/key and feature-flag attribution; local evaluation uses personal API key. | Current US Cloud probe is synthetic/dev only; real-data mode requires EU data residency or no PII events. |
| React/Next.js RSC advisory | React/Next App Router had critical RSC RCE advisories in late 2025 with patched versions required. | S0 must pin patched Next/React versions and add dependency audit gates before public deployment. |
| OWASP MCP Tool Poisoning | MCP tool poisoning is a documented prompt/tool attack class. | Builder-generated MCP/tool artifacts need capability manifests and deny-by-default egress. |
| DORA and EU AI Act | DORA applies from 2025-01-17; EU AI Act high-risk obligations are relevant to insurance-adjacent AI deployment timelines. | Compliance evidence cannot wait until S7; G1 promotion requires a control/evidence pack. |

---

## 2. Non-Negotiable Corrections to Earlier Plans

### 2.1 v3 Is the Sequencing Authority

Earlier docs remain valuable, but implementers must not choose between parallel sprint tracks. This v3 is authoritative for:

- Sprint names and order.
- Promotion gates.
- Definition of Done.
- Security/compliance requirements.
- Canary progression.
- Real-data restrictions.
- Current-state assumptions.

### 2.2 Current Repo State Is Pre-Sprint-1

The root repo does not yet contain the planned active application shape. The live prototype exists under `delete/`. Therefore:

- S0 is mandatory.
- Builder is not ready to start.
- Langflow cutover is not ready to start.
- Gateway work must start from a scaffold.
- CI/test gates must be created before they can be enforced.

### 2.3 Keep 17 Services as the Default MVP Topology

The v2-overlay suggested reducing 17 services to 14 by sharing Postgres/Redis across components. That is demoted to a cost experiment, not the default. For this MVP:

- Keep the locked 17-service topology because it preserves isolation, blast-radius clarity, service ownership, and restore procedures.
- Each component remains its own "box" on Railway.
- A **cost-down topology experiment** may be run in S2, but changing topology requires explicit user approval and updated runbooks.

### 2.4 Remove Self-Signed Private TLS From S1

Self-signed internal TLS adds certificate rotation and trust-store complexity without being the highest-value Sprint 1 control. Railway private networking is already mesh-encrypted. v3 uses:

- Railway private domains with `http://...railway.internal:port`.
- Internal bearer token / HMAC between services.
- Strict public/private service exposure.
- Optional mTLS evaluation before G1 if required by AXA security.

### 2.5 Cloud Telemetry Is Synthetic-Only

Earlier readiness notes mention Langfuse Cloud and PostHog US Cloud probes. Those are historical dev probes, not MVP policy.

- **Self-hosted Langfuse on Railway remains required for staging/MVP demos.**
- **PostHog Cloud EU remains the target for any stakeholder/staging telemetry unless events are synthetic-only and contain no operator/claim PII.**
- Any US Cloud PostHog project is synthetic-dev-only until data-protection signoff.

### 2.6 No Canary Above 5% Before Eval CI

Previous rollout ramps went to 100% before eval CI was fully in place. v3 changes this:

1. Forced-session Langflow testing.
2. 5% canary after S3 checkpoint/perf pass.
3. 25% only after S5 golden eval CI is green.
4. 100% only after seven consecutive days of online eval + SLO stability.

### 2.7 G1/G2 Promotion Requires Security Evidence

G0 synthetic demos can proceed, but G1 real-data shadow cannot start until the G1 checklist is green. This is a hard gate, not a "follow-up."

---

## 3. Current-State Audit

### What Exists

| Area | Current state |
|---|---|
| Docs | This v3 PRD (incl. §15 runtime durability) plus `docs/architecture.md`, `docs/property-fast-track.md`. |
| Migrations | `db/migrations/0001` through `0008` exist and are documented as applied. |
| Prototype app | Next.js code under `delete/app`, `delete/components`, `delete/lib`, `delete/package.json`. |
| Skills | Rich `.agents/skills` set for repo, Supabase, Railway, Langflow, n8n, Chatwoot, OTel, PostHog, Langfuse. |
| Experiments | One NIM/Builder prompt experiment under `experiments/2026-05-03-s14-s15-refinement`. |

### What Is Missing

| Area | Missing implementation |
|---|---|
| Root app | `app/`, `components/`, `lib/`, `public/`, root `package.json`, `pnpm-lock.yaml`. |
| Gateway | `gateway/`, `pyproject.toml`, FastAPI source, Python tests. |
| Infrastructure | `infra/railway.json`, `otel/otel-config.yaml`, Prometheus/Grafana, backup scripts. |
| Flows/prompts | `flows/property-fast-track.json`, `flows/motor-fleet.json`, `prompts/property-fast-track/*.txt`, lfx config. |
| Tests/CI | `.github/workflows/*`, Vitest, Playwright, axe, pytest, contract tests, eval runner. |
| Security baseline | `.gitleaks.toml`, `.semgrep.yml`, headers middleware, login rate limit, CSRF, dependency audit gates. |
| Runtime bridge | `/api/gateway/*` proxy, gateway-owned runs/HITL/audit, n8n compatibility adapter. |

### Current Implementation Contradictions

| Plan rule | Current contradiction | v3 action |
|---|---|---|
| Events are append-only. | Current run-store deletes/reinserts child rows. | S0/S1 hardening: append-only events, idempotency keys, optimistic concurrency. |
| Next.js proxies to gateway. | Current Next routes contain orchestration/HITL logic. | Move business logic to gateway through compatibility adapter. |
| Orchestrator immutable at run create. | Current run-store does not persist/use orchestrator selection. | Add immutable orchestrator handling and constraint. |
| True SSE push. | Current SSE polls per run every second. | S4 gateway pub/sub with client fallback. |
| Tests define done. | No active test pyramid exists. | S0 CI skeleton and S1 contract/integration tests. |

---

## 4. Target Architecture

### Runtime Boundary

```text
Browser
  -> agentic-web (Next.js App Router, public)
     -> /api/gateway/* server-side proxy
        -> agent-gateway (FastAPI, private)
           -> Supabase control plane
           -> Langflow runtime (agent orchestration)
           -> n8n MCP/tool routers (side effects)
           -> Chatwoot (HITL handover)
           -> Langfuse (traces/evals)
           -> PostHog (flags/experiments)
           -> OTel collector (redaction/export path)
```

The gateway is the trust boundary. Browser/client code never receives:

- Supabase service-role key.
- Langflow API key.
- n8n API credentials.
- Chatwoot API token.
- Langfuse secret key.
- PostHog personal API key.
- Internal Railway URLs.

### Authoritative Service Topology

17-service inventory:

| Group | Services |
|---|---|
| Public app | `agentic-web`, `chatwoot-web`, `langfuse-web` |
| Private apps | `agent-gateway`, `langflow-runtime`, `n8n`, `docling-serve`, `otel-collector`, `chatwoot-worker`, `langfuse-worker` |
| Databases | `pg-langfuse`, `pg-langflow`, `pg-n8n`, `pg-chatwoot`, `clickhouse-langfuse`, `redis-langfuse`, `redis-chatwoot` |
| Buckets | `agentic-runtime`, `langfuse-blobs`, `audit-bundles` |

Cost consolidation is a **critical question**, not a default implementation.

### Private Networking Contract

Use Railway private reference variables:

```text
agentic-web.GATEWAY_URL=http://${{agent-gateway.RAILWAY_PRIVATE_DOMAIN}}:8000
agent-gateway.LANGFLOW_URL=http://${{langflow-runtime.RAILWAY_PRIVATE_DOMAIN}}:7860
agent-gateway.N8N_BASE_URL=http://${{n8n.RAILWAY_PRIVATE_DOMAIN}}:5678
agent-gateway.DOCLING_URL=http://${{docling-serve.RAILWAY_PRIVATE_DOMAIN}}:5001
agent-gateway.OTEL_EXPORTER_OTLP_ENDPOINT=http://${{otel-collector.RAILWAY_PRIVATE_DOMAIN}}:4318
```

Every internal request also carries either:

- `Authorization: Bearer $GATEWAY_INTERNAL_TOKEN`, or
- an HMAC signature contract for webhook-style calls.

### Observability Contract

Observability must be useful without leaking raw regulated data:

- Langfuse trace IDs are stored on `scenario_runs.langfuse_trace_id`.
- Only allowlisted span attributes are captured by default.
- Raw prompts/responses are allowed in G0 synthetic mode.
- In G1/G2, prompts/responses are redacted/tokenized before Langfuse, Chatwoot, PostHog, and audit export.
- OTel collector redaction is the last line of defense, not the first.

### PostHog Contract

PostHog is for:

- Feature flags.
- Experiment assignment.
- Synthetic/product telemetry with minimized attributes.

PostHog is not for:

- Raw claim events.
- Prompt/response text.
- Operator free text.
- Claimant or policyholder identifiers.

---

## 5. Security, Privacy, and Compliance Gates

### G0 Synthetic Gate

G0 is the default for all MVP work until explicitly promoted.

Allowed:

- Fully synthetic claims, telematics, documents, operators, vendors.
- Synthetic Langfuse traces and PostHog events.
- Demo narration generated from synthetic trace trees.

Required before S1 completes:

- No real secrets in repo.
- Service-role key only in gateway server context.
- Basic auth gate and rate limit.
- Security headers.
- Dependency/security scans in CI.
- Trace redaction smoke test.

### G1 Shadow Gate

No real-data shadow until all are true:

| Control | Requirement |
|---|---|
| Identity | Entra/OIDC or approved IdP, MFA via IdP, session revocation. |
| Authorization | `operator`, `viewer`, `admin`, `senior-review` action matrix, even if UI defaults to single operator mode. |
| CSRF | Cookie-backed writes protected by CSRF token or same-site + origin checks. |
| RLS | No default `gdai-default` fallback outside local/dev; non-service JWT RLS negative tests pass. |
| Data minimization | Source redaction/tokenization before Langfuse/Chatwoot/PostHog/audit. |
| Telemetry residency | Langfuse self-hosted and PostHog EU/no-PII posture verified. |
| Webhooks | HMAC, timestamp, nonce/idempotency, replay cache, key rotation documented. |
| Audit | Hash-chain lock/verification, monotonic chain position, external anchor, append-only grants. |
| Compliance | DPIA draft, ROPA entry, AI Act classification worksheet, DORA ICT third-party register. |
| Human oversight | HITL decision screen tested for clear evidence, edit/reject path, and audit reason capture. |

### G2 Canary Gate

No real-effect canary until all G1 controls plus:

- 7 days of online eval and SLO stability in synthetic/staging.
- Load test baseline meets p95/error-rate targets.
- Rollback works with evidence.
- Incident response playbook tested.
- Backup restore drill passed.
- Audit bundle verified and readable by a non-engineer reviewer.

### G3 Production

G3 is out of MVP scope.

---

## 6. Critical Gap Register

| ID | Severity | Gap | Why it matters | Resolution sprint |
|---|---|---|---|---|
| G-01 | P0 | Active code is under `delete/`, not root. | Every downstream task assumes a monorepo that does not exist yet. | S0 |
| G-02 | P0 | No gateway. | Trust boundary and business-logic separation are missing. | S1 |
| G-03 | P0 | Run-store deletes/reinserts events. | Violates append-only audit semantics and risks lost callbacks. | S0/S1 |
| G-04 | P0 | Service-role/RLS fallback. | Tenant bleed risk and false confidence in RLS. | S1 before G1 |
| G-05 | P0 | PII redaction too late and too narrow. | Langfuse/Chatwoot/audit can leak raw claims. | S1-S5, G1 gate |
| G-06 | P0 | Audit chain is forgeable/racy. | Forensic evidence may not withstand scrutiny. | S1 migration 0009 |
| G-07 | P0 | Webhook replay contract missing. | HITL/vendor callbacks can be replayed or spoofed. | S1/S2 |
| G-08 | P1 | Gateway HA/degradation too late. | Gateway becomes critical path in S2. | S1/S2 |
| G-09 | RESOLVED | Langflow checkpoint durability unproven. | Validated 2026-05-04 via 20 live experiments (see §15). Resolution: gateway owns durability; Langflow runs single-step stateless flows; idempotency keys prevent duplicate side effects. | Closed; replaced by E-04 step-idempotency proof in S3. |
| G-10 | P1 | Eval CI arrives after rollout. | Bad Langflow prompts could reach too much traffic. | S3/S5; canary cap |
| G-11 | P1 | Builder generated workflow abuse. | SSRF, env exfiltration, unsafe Code nodes. | S8 gated |
| G-12 | P1 | Data residency conflict. | US Cloud telemetry cannot contain real or identifiable data. | S1 policy, G1 gate |
| G-13 | P1 | No CI/test pyramid. | Definition of Done cannot be enforced. | S0/S1 |
| G-14 | P2 | Accessibility unspecified in code. | Enterprise cockpit must be keyboard and screen-reader usable. | S1/S4 |
| G-15 | P2 | Demo requirements underspecified. | Stakeholders see plumbing, not value. | Every sprint |

---

## 7. Workstream Contracts

### A. Web Cockpit

Owns:

- Next.js App Router routes.
- Railway shell, sidebar, responsive layout.
- Pilot/Ops/Demo/HITL/Builder UI.
- `/api/gateway/*` proxy only.

Does not own:

- Run orchestration.
- HITL side effects.
- n8n callbacks.
- Langflow dispatch.
- Direct service-role writes except preserved legacy cutover paths explicitly named and temporary.

### B. Gateway

Owns:

- Auth/session verification.
- Tenant context.
- Run creation/cancel/resume.
- Orchestrator selection.
- Langflow client.
- n8n MCP proxy.
- HITL and Chatwoot bridge.
- Audit writer.
- SSE event stream.
- Prompt registry.
- Eval runner.
- PII minimization and telemetry allowlists.

### C. Run Store

Rules:

- `scenario_runs.status`: only `queued`, `running`, `waiting`, `completed`, `failed`, `failed_sla`.
- Node-specific state belongs in `node_states`.
- Events are append-only.
- Child rows are never delete/reinserted for normal updates.
- Orchestrator is set once at run creation and immutable.
- All callbacks are idempotent.
- Concurrent updates use optimistic concurrency or row locking.

### D. Flow Runtime

Rules:

- Langflow owns reasoning/control flow.
- n8n owns tools and side effects.
- Every MCP response is schema-validated.
- Every side-effecting tool call has idempotency key and audit event.
- Prompt files live in `prompts/`, not only inside JSON graph configs.

### E. Compliance Evidence

Artifacts created progressively:

- Threat model.
- Data-flow register.
- ROPA entry.
- DPIA template and pilot-specific DPIA.
- AI Act classification worksheet.
- DORA ICT third-party register.
- Model/prompt/version inventory.
- Control-to-test matrix.
- Incident response playbook.
- Audit bundle manifest spec.

---

## 8. Sprint Delivery PRD

Each sprint ends with:

- A stakeholder-visible demo journey.
- A technical proof.
- A failure-mode proof.
- A user decision/experiment record.
- Updated risk register.

### Sprint 0 — Repo Recovery Gate

**Duration:** Week 0, target 2-4 working days.

**Persona promise:** an engineer can clone the repo, run the cockpit locally, and see the actual active project shape.

**Scope**

- Restore selected `delete/` assets to root:
  - `app/`
  - `components/`
  - `lib/`
  - `public/`
  - `package.json`
  - `tsconfig.json`
  - `next.config.ts`
- Convert package workflow to pnpm.
- Add initial `pnpm` scripts:
  - `dev`
  - `build`
  - `lint`
  - `typecheck`
  - `test`
  - `test:visual` placeholder
- Add CI skeleton:
  - `.github/workflows/ci.yml`
  - typecheck/lint/build jobs
  - placeholder security job
- Add local smoke test documentation.
- Identify and document run-store hazards:
  - event delete/reinsert behavior
  - missing orchestrator persistence
  - missing optimistic concurrency
  - direct n8n dispatch
- Create `docs/refactor_execution_notes.md` with S0 decisions and known constraints.
- Mark `delete/` as archived source, not active runtime.

**Out of scope**

- Gateway runtime.
- Railway deployment.
- Langflow flow authoring.
- UI redesign.

**Acceptance criteria**

- `pnpm install` succeeds from repo root.
- `pnpm build` succeeds or has a documented single blocker with issue ID.
- Root app starts locally.
- `/` and legacy `/scenario/[scenarioKey]` render from restored root app.
- `delete/` is no longer imported by active code.
- No secrets are introduced to root files.

**Failure tests**

- Fresh clone without `delete/node_modules` still installs.
- Missing Supabase env vars produce a controlled local error or seed fallback.
- Build fails if code imports from `delete/`.

**Demo requirement**

Show a fresh terminal:

1. `pnpm install`
2. `pnpm dev`
3. Open the cockpit shell.
4. Show CI skeleton file.
5. Show the run-store risk note that will be fixed in S1.

**Critical user questions / experiments**

- Which parts of the prototype are sacred visual language vs replaceable implementation detail?
- Should the legacy route `/scenario/[scenarioKey]` remain permanently redirected or be removed after S4?
- Is the team comfortable keeping `delete/` as an archive for one sprint, or should it be removed immediately after restoration?

---

### Sprint 1 — Foundation + Trust Boundary

**Duration:** Weeks 1-2.

**Persona promise:** an operator can log into the cockpit shell on staging, and an engineer can verify the gateway trust boundary and first redacted trace.

**Scope**

Web:

- Add `RailwayShell`, `SidebarNav`, `WorkspaceSwitcher`.
- Add routes with non-deceptive empty states:
  - `/pilots`
  - `/hitl`
  - `/ops`
  - `/demo`
  - `/pilots/[id]/experiments`
  - `/login`
- Add `middleware.ts` for route protection.
- Add security headers.
- Add 404/500/error boundary.
- Add skip link, landmarks, visible focus base styles.
- Add token contrast audit.

Gateway:

- Scaffold `gateway/`:
  - `pyproject.toml`
  - `src/gateway/main.py`
  - `tenant.py`
  - `auth.py`
  - `health.py`
  - `audit.py`
  - `events.py`
  - `settings.py`
- Endpoints:
  - `GET /healthz`
  - `POST /auth/operator-login`
  - `POST /auth/logout`
  - `GET /version`
- Cookie signing and verification.
- Rate limit login.
- CSRF/origin strategy for cookie-backed writes.
- Structured error envelope.

Run-store and DB:

- Migration `0009_runtime_safety.sql`:
  - add `failed_sla` status.
  - constrain `orchestrator` known values.
  - add missing indexes.
  - harden audit chain with row lock/chain position/verification function.
  - add idempotency table or event idempotency key.
- Refactor current run-store toward append-only event writes.
- Service-role key stays gateway-only in staging/prod.
- Document tenant fallback as local/dev only.

Observability/security:

- OTel SDK initialized in gateway.
- Langfuse self-host config target documented.
- Redaction allowlist module stub.
- Semgrep, Gitleaks, dependency audit in CI.
- React/Next patched versions pinned.
- Threat model skeleton created.
- Data-flow register skeleton created.

**Out of scope**

- Langflow runtime.
- n8n migration.
- Real Pilot/HITL UI.
- Full Entra/OIDC.

**Acceptance criteria**

- Logged-out access to `/pilots` redirects to `/login`.
- Login sets HTTP-only cookie and returns to intended route.
- Gateway `/healthz` returns:

```json
{
  "ok": true,
  "deps": {
    "supabase": "ok",
    "langflow": "not_configured",
    "n8n": "not_configured"
  }
}
```

- First synthetic gateway request produces a redacted Langfuse/OTel trace.
- Semgrep/Gitleaks/dependency audit runs in CI.
- Audit verification function returns success on current chain.
- No direct service-role key in web runtime.
- WCAG baseline: no obvious focus traps; axe introduced even if only smoke routes are checked.

**Failure tests**

- Five bad login attempts are rate-limited.
- Missing/invalid cookie cannot write.
- Cross-origin POST is rejected.
- Audit chain verification detects a deliberately tampered local row.
- Gitleaks catches a seeded fake secret in a test fixture branch.

**Demo requirement**

1. Open `/pilots` logged out -> redirected to `/login`.
2. Login -> cockpit shell appears with five routes.
3. Open gateway health.
4. Trigger synthetic gateway trace -> show Langfuse trace with no raw PII.
5. Show CI security checks green.
6. Show audit verification SQL/function output.

**Critical user questions / experiments**

- Is bootstrap-token login acceptable for G0 demos, or should Entra/OIDC be pulled into S1?
- What is the minimum role matrix needed before G1: `operator/viewer/admin/senior-review`, or something smaller?
- Which trace fields are useful enough to keep after redaction?
- Does the shell make sense to a non-engineer without explanatory placeholder prose?

---

### Sprint 2 — Runtime Estate Landing

**Duration:** Weeks 3-4.

**Persona promise:** an admin can verify that the runtime estate is healthy, backed up, observable, and still running the existing n8n path before Langflow is introduced.

**Scope**

Infrastructure:

- Railway project/environment for staging.
- Deploy authoritative service topology:
  - minimum required S2 services from the 17-service map.
  - explicit public/private exposure.
- `infra/railway.json`.
- Reference variables for private service URLs.
- Health checks on each deployed service.
- Railway runbook with bootstrap order.

Runtime:

- Keep existing n8n property-fast-track path as control.
- Move HMAC callbacks to gateway.
- Add dual-write compatibility back to old web route only if needed.
- Gateway dependency health:
  - Supabase
  - n8n
  - Langfuse
  - OTel
  - Chatwoot if configured
- Gateway replicas/draining behavior if Railway supports it for the service.
- Callback queue/dead-letter table for gateway-owned callbacks.

Observability:

- OTel collector config with redaction tests.
- Prometheus/Grafana or Railway metrics dashboard baseline.
- Langfuse self-host smoke.
- PostHog flag smoke in synthetic mode.

Backups:

- Supabase backup runbook.
- Railway Postgres backup scripts.
- ClickHouse backup plan.
- Bucket backup/retention policy.
- Restore drill plan, not yet full execution.

Testing:

- k6 baseline through n8n path at 10 concurrent users.
- Contract tests for gateway health/auth/callback endpoints.
- Webhook signature test harness.

**Out of scope**

- Langflow traffic.
- Pilot view.
- Eval CI.
- Builder.

**Acceptance criteria**

- All S2 services are `Active` with health checks.
- Gateway `/healthz` accurately reports dependency degradation.
- n8n property-fast-track control path still completes.
- HMAC callback through gateway writes run event and audit row.
- OTel redaction test passes with fake email/IBAN/phone.
- k6 n8n baseline report committed.
- Backup scripts run in dry-run or staging mode.

**Failure tests**

- Kill n8n -> gateway health degrades within 30 seconds and recovers after restart.
- Replay same callback twice -> only one state transition occurs.
- Tampered HMAC -> rejected and audited.
- Old timestamp webhook -> rejected and audited.
- Missing backup credentials -> backup job fails loudly, not silently.

**Demo requirement**

1. Open Grafana/metrics dashboard.
2. Trigger property-fast-track via existing n8n path.
3. Show trace with `orchestrator=n8n:wf002v2`.
4. Kill/restore n8n and show health recovery.
5. Replay a webhook and show idempotency.
6. Show backup dry-run output and k6 baseline.

**Critical user questions / experiments**

- Is 17-service isolation acceptable for MVP budget and operations?
- Should a 14-service cost-down topology be tested, or does isolation matter more?
- Which alerts should page a human vs only appear in Ops?
- Does Chatwoot belong in the first staging estate, or can in-cockpit HITL lead until Chatwoot is required?

---

### Sprint 3 — Langflow Cutover Canary

**Duration:** Weeks 5-6.

**Persona promise:** the same property-fast-track journey can run through Langflow safely, with rollback, checkpoint proof, and no duplicate side effects.

**Scope**

Langflow:

- `flows/property-fast-track.json` authored from the v2 node graph.
- Prompt files:
  - `prompts/property-fast-track/triage-preflight.txt`
  - `reserve-gate.txt`
  - `document-extract.txt`
  - `document-review.txt`
  - `dispatch-prep.txt`
  - `dispatch-confirm.txt`
- Prompt registry endpoint in gateway.
- Langflow API key/auth enabled.
- Flow deployment via CI/lfx or documented manual bootstrap.

Gateway orchestration:

- `runs.py` create/cancel/resume.
- `langflow_client.py`.
- `n8n.py` MCP proxy.
- `posthog_flags.py` server-side flag selection.
- `hitl.py` durable ReserveGate bridge.
- `events.py` append-only events.
- MCP timeout/retry/circuit breaker.
- Pydantic schemas for MCP tool responses.
- Idempotency around side-effecting tool calls.

Rollout:

- `pf_orchestrator` flag:
  - `n8n` default.
  - `langflow` forced-session only.
  - 5% max by end of sprint.
- No 25% rollout until S5 eval CI is green.

Durability (validated architecture — see §15):

- Each Langflow flow is **one short stateless step** invoked by the gateway.
- Gateway owns the durable FSM via `scenario_runs` + `events` (append-only) + `hitl_items`.
- "Needs human review" is signalled by the custom `RequiresHumanReview` Langflow component (see §15.3); gateway reads `_signal: "requires_human_review"` from step output.
- **Step-idempotency proof** before full cutover (replaces the obsolete checkpoint spike):
  - gateway issues `step_idempotency_key` per step and forwards it to all MCP calls.
  - kill Langflow mid-step; gateway times out and retries with same key.
  - verify no duplicate n8n vendor call, no double LLM charge, no second hitl_item.
- No native Langflow pause/resume needed — resume = next-step invocation by gateway.

**In-sprint A/B spikes (deliver both, demo at review)**

Where the experiments left genuine uncertainty, S3 ships **two implementations side by side** and the user picks at the sprint review. Don't pre-decide.

| Spike | Option A | Option B | Decision criterion |
|---|---|---|---|
| HITL signal pattern | Custom `RequiresHumanReview` component (`HitlGate`) emitting `{_signal, evidence, options, sla_deadline}` | Built-in `StructuredOutput` component returning a JSON contract `{requires_review: bool, ...}` parsed by gateway | Reliability across model swaps + author ergonomics in Langflow canvas |
| Triage model choice | `gemini-2.5-flash` (fast, cheap; observed hallucination on synthetic claim — needs StructuredOutput guard) | `gpt-4o` and `claude-sonnet-4-6` (slower, costlier; baseline accuracy unknown until measured) | Hallucination rate on 50-claim golden set; cost/latency budget |
| Session context | Implicit Agent conversation memory (works per experiment) | Explicit `Message History` built-in component (more controllable; not yet validated) | Deterministic replay + clean Langfuse traces |

Each spike: small flow per option, golden-set run, side-by-side Langfuse trace screenshots, 1-page recommendation memo. **No silent default.**

**Out of scope**

- 25% or 100% rollout.
- Real Pilot UI.
- Full Eval CI.
- Parallel execution optimizations.

**Acceptance criteria**

- Forced Langflow run completes end-to-end.
- Langfuse trace shows named nodes and child MCP spans.
- ReserveGate pauses and resumes via gateway.
- Killing Langflow at ReserveGate and mid-DocumentExtract: gateway retries with idempotency key; no duplicate external effects across 50 trials.
- Broken MCP router opens circuit and recovers.
- Langflow p95 is less than 2x n8n p95 baseline or an explicit remediation plan is created.
- Both A/B spikes (HITL signal pattern, triage model) deliver working flows + recommendation memos.
- 5% rollout is enabled only after all above pass AND user has selected an option for each spike at sprint review.

**Failure tests**

- n8n MCP router returns 500 -> retry/circuit behavior observed.
- MCP response schema mismatch -> rejected, retried or failed with clear event.
- Langflow unavailable -> new runs stay on n8n or queue according to flag state.
- PostHog unavailable -> deterministic fallback to `n8n`.
- Duplicate HITL approval -> ignored after first accepted decision.
- LLM hallucination on triage step -> StructuredOutput rejection caught, run flagged for HITL.

**Demo requirement**

1. Start a Langflow-forced property run.
2. Show canvas/trace event stream or trace-only view.
3. Pause at ReserveGate via the chosen HITL signal pattern.
4. Kill Langflow mid-step, show gateway retry with idempotency key, no duplicate side effects.
5. Compare one n8n and one Langflow trace.
6. Break one MCP router and show circuit breaker while other tools continue.
7. **Side-by-side A/B presentation**: HITL signal pattern Option A vs B, triage model Option A vs B, with hallucination rates and Langfuse traces. User picks the production default.

**Critical user questions / experiments**

- Does Langflow create visible product/operator value, or only platform optionality?
- Which node failures should auto-retry vs require HITL?
- What is the acceptable latency penalty for better observability/control flow?
- Is prompt registry runtime fetching acceptable, or should CI bundle prompts into immutable flow artifacts?
- HITL signal: custom component vs StructuredOutput contract — which is more robust under model changes?
- Triage model: which (Gemini / gpt-4o / claude-sonnet-4-6) gives the best accuracy/cost/latency for property-fast-track at G1?

---

### Sprint 4 — Pilot + HITL Product Surface

**Duration:** Weeks 7-8.

**Persona promise:** a claims operator can create/open a pilot, run a claim, inspect evidence, approve/edit/reject a HITL decision, and see an audit confirmation.

**Scope**

Routes:

- `/pilots`
- `/pilots/[pilotId]`
- `/hitl`
- legacy `/scenario/[scenarioKey]` redirect.

Components:

- `PilotCard`
- `PilotForm`
- `KPIStrip`
- `VariantBadge`
- `CohortBadge`
- `MetroCanvas` live mode
- `TraceTree`
- `TraceSpan`
- `HitlInlineCard`
- `HitlQueueTable`
- `HitlDetail`
- `SlaTimer`
- `CostBadge`
- `LatencyBadge`
- skeletons and empty states.

Gateway:

- Pilot CRUD endpoints.
- HITL list/detail/decision endpoints.
- Audit writer for pilot/HITL decisions.
- True SSE stream:
  - single connection per browser tab.
  - run ID multiplexing.
  - heartbeat.
  - backoff reconnect.
  - 5s polling fallback.

Accessibility:

- WCAG 2.1 AA sprint gate.
- Keyboard navigation for MetroCanvas.
- `aria-live` for run/HITL updates.
- Non-color-only status labels.
- Mobile drawer under 920px.
- iPad usability target.

Data:

- Canonical run snapshot button for future demo.
- Audit chain migration must already be active before HITL decisions count as done.

**Out of scope**

- Ops charts.
- Eval CI.
- Demo narration.
- Motor-fleet.

**Acceptance criteria**

- Operator can create a pilot and run property-fast-track.
- Canvas updates live.
- TraceTree updates live.
- HITL queue shows the pending item.
- Operator can approve, edit, and reject in separate test cases.
- Audit rows exist for every decision with reason.
- Canonical snapshot writes `scenarios_demo.seed_run_id`.
- Axe reports zero critical violations on sprint routes.
- Keyboard-only user can reach and operate core actions.

**Failure tests**

- Gateway restarts during a run -> client shows reconnecting and recovers.
- SSE drops -> fallback polling starts.
- Empty HITL queue shows useful empty state.
- Missing trace shows a recoverable state, not blank UI.
- Two operators decide same HITL item -> one wins, second sees already-resolved state.
- Mobile drawer opens/closes and does not trap focus.

**Demo requirement**

1. Create/open Property Fast Track pilot.
2. Click Run Now.
3. Watch live canvas and TraceTree.
4. Pause at reserve approval.
5. Open `/hitl`, review evidence, edit reserve or approve.
6. Return to pilot view and see completion.
7. Show audit row and snapshot as canonical.
8. Tab through key UI with keyboard.

**Critical user questions / experiments**

- Can an operator make a confident HITL decision in under 60 seconds?
- What evidence is missing from HitlDetail for a real claims handler?
- Are edit/reject decisions too permissive without senior-review?
- Does the canvas help decision-making, or is it mostly executive theater?

---

### Sprint 5 — Ops + Eval Control Loop

**Duration:** Weeks 9-10.

**Persona promise:** an ops/admin user can detect degraded quality, latency, and runtime health before customers or demo stakeholders do.

**Scope**

Ops:

- `/ops`.
- Live run table/tail.
- MetroCanvas ops mode.
- Dependency health panel.
- Error rate, p95 latency, cost, runs/min.
- Dead-letter queue list and replay with authorization.
- Notification center.
- Settings shell for notification preferences and API token visibility.

Eval:

- Golden dataset for property-fast-track.
- Three rubrics:
  - factual accuracy.
  - policy compliance.
  - tone.
- Eval runner in gateway.
- Langfuse datasets/scores integration.
- CI workflow for `flows/*` and `prompts/*`.
- Bad-prompt fixture PR fails.
- Online eval sampler at 5%.

Rollout:

- 25% canary eligibility only after:
  - eval CI green.
  - online sampler writes scores.
  - latency/error SLOs stable.
  - rollback tested.

Performance:

- 50 concurrent users k6 test.
- Langflow checkpoint stress test.
- Gateway degradation behavior.

Runbooks:

- Incident response playbook.
- Restore drill execution report.
- Data retention draft.

**Out of scope**

- Executive demo narration.
- Motor-fleet.
- Builder.
- 100% canary unless 7-day window has elapsed.

**Acceptance criteria**

- `/ops` shows current and recent runs.
- A selected run drills into spans/events.
- Bad prompt PR fails eval CI.
- No-op prompt PR passes.
- Online eval sampler writes scores.
- Dead-letter item can be replayed only by authorized operator/admin.
- 50-user load report committed.
- Restore drill report committed.
- 25% rollout decision record exists.

**Failure tests**

- Langflow down -> gateway queues or routes according to rollout policy.
- n8n circuit open -> Ops shows degraded tool, not global failure.
- Eval provider unavailable -> PR fails safe or marks blocking according to policy.
- Dead-letter replay without auth -> rejected and audited.
- Metric API unavailable -> cached stale state is labeled stale.

**Demo requirement**

1. Trigger 5 concurrent runs.
2. Open `/ops` and show live throughput/latency/error rate.
3. Drill into one run.
4. Open a deliberately bad prompt PR and show eval CI red.
5. Replay a dead-letter item.
6. Show 50-user load result and restore drill summary.

**Critical user questions / experiments**

- Which three metrics are executive-worthy vs engineering-only?
- What eval threshold is too strict or too lenient for early pilots?
- Should rollback be automatic at 25%, or require operator confirmation?
- Can ops diagnose a failed run without opening Langfuse directly?

---

### Sprint 6 — Executive Demo + Experimentation

**Duration:** Weeks 11-12.

**Persona promise:** an executive sponsor can open a polished demo, understand the agent value in two minutes, try a safe synthetic run, and see controlled experimentation with rollback.

**Scope**

Demo:

- `/demo`.
- `/demo/[scenarioKey]`.
- Scenario picker.
- `MetroCanvas` replay mode.
- `ReplayScrubber`.
- `NarrationOverlay`.
- `ComparisonCard`.
- Narration generation endpoint.
- Narration cached in `scenarios_demo.narration`.
- Re-narrate per span.
- "Try it yourself" synthetic live run.
- Clear synthetic-data banner.

Experimentation:

- `/pilots/[id]/experiments`.
- `VariantTable`.
- `RubricRadar`.
- Time-series KPI chart.
- Bayesian or minimum-sample significance explanation.
- Canary/shadow state display.
- Auto-rollback demo fixture.

Demo quality:

- Board-safe copy.
- No in-app text explaining implementation internals.
- No raw trace payloads in executive view.
- One-click trace/audit deep link for technical appendix.

**Out of scope**

- Motor-fleet if not already ready.
- Builder.
- Real-data demo.

**Acceptance criteria**

- Demo replay works from canonical S4 snapshot.
- Narration appears quickly or streams with a clear pending state.
- Re-narrate changes wording without changing factual claims.
- ComparisonCard data source is documented.
- Try It Yourself creates a fresh synthetic run.
- Experiment page shows control/treatment and rollback state.
- Degraded variant triggers rollback in test fixture.
- Demo works on projector-friendly viewport and iPad viewport.

**Failure tests**

- No canonical run -> guided empty state with "Create canonical run" CTA.
- Narration model unavailable -> replay still works without narration.
- Langfuse trace missing -> demo uses stored events and flags missing trace.
- Rollback event delayed -> UI shows pending rollback rather than success.
- Executive view never reveals raw prompts, keys, or internal hostnames.

**Demo requirement**

1. Open `/demo/property-fast-track`.
2. Press Play.
3. Narration explains each major span in sponsor language.
4. Show "without agent vs with agent" comparison.
5. Press Try It Yourself for a synthetic live run.
6. Open experiments, create/inspect a bad treatment, show rollback.
7. End with the canonical decision/audit trace link.

**Critical user questions / experiments**

- Does narration persuade without overclaiming?
- Should comparison metrics be hand-curated, generated, or measured live?
- Which audience should the default demo serve: claims leader, CTO, risk/compliance, or CEO?
- Does the demo need multilingual narration for Italy/Germany/Spain?

---

### Sprint 7 — Motor-Fleet + Audit Hardening

**Duration:** Weeks 13-14.

**Persona promise:** the platform proves it can support a second distinct pilot and produce an audit bundle that a risk/compliance reviewer can inspect.

**Scope**

Motor-fleet:

- `flows/motor-fleet.json`.
- Synthetic telematics data:
  - ~50 packets.
  - ~30 vehicles.
  - ~25 body shops.
  - 20 golden eval cases.
- Motor-fleet pilot card and demo seed.
- Reused gateway/Langflow/n8n patterns.
- Distinct enough from property-fast-track to prove reuse.

Audit:

- Audit bundle generator.
- Bundle manifest:
  - trace summary.
  - prompt versions.
  - model versions.
  - policy refs.
  - HITL decisions.
  - eval scores.
  - redaction report.
  - audit-chain verification report.
- Signed ZIP.
- External hash anchor.
- Download audit trail.
- Searchable `/audit` browser.

Hardening:

- Full restore drill.
- Full-scale k6:
  - 200 concurrent users.
  - 5K traces/day equivalent.
  - 1-hour sustained.
- Pentest/DAST triage.
- Data retention/archival job.
- Real Docling with stub fallback.
- G1 readiness review; real-data promotion still optional and gated.

**Out of scope**

- Production rollout.
- Third pilot.
- Builder unless S8 pre-gate passes.

**Acceptance criteria**

- Motor-fleet completes end-to-end.
- Motor-fleet has its own golden dataset/eval baseline.
- Audit bundle exports and verifies.
- Audit hash anchor exists outside the primary table.
- Audit browser can find a HITL decision and open its bundle.
- Full restore drill passes.
- Load test meets target or produces remediation plan.
- Pentest findings are triaged by severity.

**Failure tests**

- Audit bundle generation interrupted -> resumable or clean failure.
- Bundle tampered -> verification fails.
- Real Docling times out -> stub fallback and audit event.
- Motor-fleet eval regression -> blocked from canary.
- Retention job archives only eligible rows and preserves audit log.

**Demo requirement**

1. Run property-fast-track and motor-fleet.
2. Open both pilot pages and compare reuse.
3. Export an audit bundle.
4. Verify bundle hash and audit chain.
5. Show restore drill and load report.
6. Show pentest findings register.

**Critical user questions / experiments**

- Is motor-fleet sufficiently different to prove platform generality?
- What does compliance actually need inside the audit bundle?
- Is a PDF summary required, or is signed JSON/ZIP enough?
- What latency is acceptable when real Docling replaces stub extraction?

---

### Sprint 8 — Scenario Builder + Synthdata Factory

**Duration:** Weeks 15-16, only after pre-S8 gate.

**Persona promise:** an admin can describe a new synthetic pilot, review a cited plan, build a safe bundle, run it in an isolated preview, and deploy it to G0 with provenance and guardrails.

### Pre-S8 Gate

Before Sprint 8 starts, run an experiment:

- Five diverse briefs.
- Full Plan -> Build -> Lint -> Preview pipeline.
- Pass criteria:
  - 4/5 produce valid plan structure.
  - 4/5 pass bundle lint.
  - 4/5 preview runs complete.
  - 0 generated artifacts violate security policy.
  - Average session cost under agreed cap.

If this fails, S8 becomes "Builder Experiment Hardening" rather than "Builder Delivery."

**Scope**

Builder backend:

- Plain-Python deterministic FSM.
- `gateway/builder/nim.py`.
- `prompts.py`.
- `session.py`.
- `recipes.py`.
- `api.py`.
- `tools/web_search_insurance.py`.
- `tools/bundle_lint.py`.
- `tools/preview_run.py`.
- Advisory lock per session.
- Builder Langfuse project/client separation.

Builder frontend:

- `/builder`.
- Chat pane.
- Plan preview.
- Monaco diff.
- Flow graph preview.
- Dataset manifest preview.
- Preview run trace.
- Deploy G0 action.
- Cancel/stop generation.
- Token/cost budget banner with hard stop.

Synthdata:

- `gateway/synthdata/`.
- Seed upload/fingerprint.
- Dataset manifest.
- Faker/Pydantic generation.
- Document/email rendering.
- Validators:
  - schema.
  - distribution.
  - anti-PII.
  - persona fidelity.

Security:

- Generated workflow capability manifest.
- Deny-by-default egress allowlist.
- No env access from generated n8n Code nodes.
- OPA/Rego or equivalent policy checks.
- Signed artifact provenance.
- Isolated preview project with no production credentials.
- Human approval before G0 -> G1.

**Out of scope**

- Auto-promotion beyond G0.
- Real-data generated flows.
- Marketplace/connectors ecosystem.
- Voice input.
- AI-generated custom cockpit UI.

**Acceptance criteria**

- New brief creates Plan v0.1 in required sections.
- Plan has allowlisted citations or explicitly says research pending.
- Operator can revise plan in multiple turns.
- Approved plan locks and hashes.
- Build creates dataset/flow/eval/KPI artifacts.
- Bundle lint passes.
- Preview run completes in sandbox.
- Deploy creates G0 pilot.
- Generated artifact has provenance, version, and rollback point.
- Motor-fleet can be regenerated within 5% eval tolerance if pre-gate said it could.

**Failure tests**

- Prompt tries to exfiltrate env vars -> lint blocks.
- Generated HTTP node targets external URL -> lint blocks unless allowlisted.
- Citation search returns no hits -> plan does not hallucinate citations.
- NIM unavailable -> graceful pause/fallback, no partial deployment.
- Concurrent operator turns serialize correctly.
- Preview run attempts real side effect -> gateway dry-runs/blocks.

**Demo requirement**

1. Live new brief.
2. Plan with challenges and citations.
3. Operator approves.
4. Build bundle.
5. Inspect diff and graph.
6. Preview run.
7. Deploy to G0.
8. Open resulting pilot and trace.

**Critical user questions / experiments**

- Is 4/5 generation reliability enough for an internal builder?
- Should security approval be a separate role from business approval?
- Does full skills-pack prompting justify cost, or should skill routing be dynamic?
- Are generated pilots meant for discovery only, or eventual production hardening?

---

## 9. Cross-Sprint Demo Standards

Every sprint demo must include:

1. **Persona framing** — who is using this?
2. **Happy path** — the main user journey.
3. **Failure path** — one meaningful degraded case.
4. **Evidence** — trace, audit row, CI result, load report, or runbook.
5. **Decision ask** — one user question the team needs answered before the next sprint.
6. **Options when in doubt** — if the sprint encountered a design decision the team could not resolve from evidence, deliver **two working implementations side by side** (an A/B spike) and present both at the demo with a recommendation. The user picks. **If only one approach was valid, deliver it directly without manufactured options.** Never assume; when uncertain, build to learn.

Avoid demos that only show service status. Service status is evidence, not the story.

### Persona Journeys

| Persona | Journey |
|---|---|
| Executive sponsor | Opens demo, watches replay, understands value, tries synthetic run, receives audit artifact. |
| Claims operator | Reviews HITL item, edits/approves/rejects with evidence and audit reason. |
| Ops engineer | Detects degraded service, drills into run, replays dead-letter item, confirms rollback. |
| Pilot owner/admin | Creates pilot, assigns variant/cohort, reviews eval, controls rollout. |
| Risk/compliance reviewer | Opens audit bundle, verifies chain, checks DPIA/control evidence. |
| Builder operator | Creates new synthetic pilot from brief, reviews cited plan, deploys G0 only. |

---

## 10. Definition of Done

A sprint is done only when all are true:

- Scope items merged.
- CI green:
  - lint.
  - typecheck.
  - unit tests.
  - integration tests.
  - contract tests.
  - security scans.
  - visual/a11y where UI changed.
- Staging demo checklist passes 100%.
- Failure test passes.
- New DB changes are in new numeric migrations.
- `supabase migration list --linked` reviewed where relevant.
- New endpoints have JSON schema contract tests.
- New prompts are version-controlled.
- New side effects write audit events.
- New telemetry passes redaction tests.
- Sprint risk register updated.
- Sprint decision/experiment questions recorded with outcome or owner.

Not done:

- "Works locally" but no staging proof.
- "Happy path works" but failure path unknown.
- "Trace exists" but contains raw PII in a mode where it should not.
- "Audit row exists" but chain verification fails.
- "Canary enabled" without rollback proof.

---

## 11. Implementation Backlog by Artifact

### Files and Directories

```text
app/
components/
lib/
public/
gateway/
  pyproject.toml
  src/gateway/
  tests/
flows/
prompts/
infra/
otel/
tests/
  integration/
  visual/
docs/
  runbooks/
  compliance/
.github/workflows/
```

### Migrations After 0008

| Migration | Purpose |
|---|---|
| `0009_runtime_safety.sql` | `failed_sla`, orchestrator constraints, indexes, audit chain hardening, idempotency. |
| `0010_gateway_contracts.sql` | callback/dead-letter tables, webhook nonces, replay cache. |
| `0011_data_stage_gates.sql` | pilot data stage, promotions, transition audit. |
| `0012_eval_control_loop.sql` | eval baselines, shadow evals, online sampler metadata. |
| `0013_synthdata_builder.sql` | synthdata seeds/runs, builder sessions/artifacts. |
| `0014_retention_archival.sql` | retention metadata, archive tracking, partition prep. |

### CI Workflows

| Workflow | Gates |
|---|---|
| `ci.yml` | install, build, lint, typecheck, unit tests. |
| `gateway.yml` | pytest, ruff, mypy, contract tests. |
| `security.yml` | Semgrep, Gitleaks, dependency audit, Trivy. |
| `visual.yml` | Playwright snapshots, axe. |
| `evals.yml` | Langfuse/golden dataset eval on flow/prompt changes. |
| `perf.yml` | Optional scheduled k6 smoke. |

---

## 12. Critical Experiments Register

| ID | Sprint | Question | Success criterion |
|---|---|---|---|
| E-01 | S0 | Can the prototype be restored without importing from `delete/`? | Root app builds and no active imports from `delete/`. |
| E-02 | S1 | Can redaction preserve useful traces? | Operators can debug from redacted trace; fake PII removed. |
| E-03 | S2 | Is 17-service topology acceptable? | Cost/ops review signed; 14-service experiment only if user approves. |
| E-04 | S3 | **Step-idempotency**: does kill-and-retry produce zero duplicate side effects? | 50 kill-mid-step trials × 2 step types pass with zero duplicate MCP calls. (Replaces obsolete native-checkpoint spike — see §15.) |
| E-05 | S3 | Is Langflow latency acceptable vs n8n? | p95 < 2x n8n baseline or remediation accepted. |
| E-06 | S4 | Can operator decide HITL in under 60 seconds? | 3/3 test users complete with confidence score >= 4/5. |
| E-07 | S5 | Are eval rubrics calibrated? | Bad prompt fails, no-op passes, borderline case reviewed. |
| E-08 | S6 | Does narration persuade without overclaiming? | Stakeholder review approves wording and claims. |
| E-09 | S7 | Is motor-fleet truly distinct? | Reuse analysis shows shared platform plus distinct domain logic. |
| E-10 | Pre-S8 | Can Builder build valid flows reliably? | 4/5 full pipeline success, 0 security violations. |
| E-11 | S3 A/B | **HITL signal pattern**: custom component vs StructuredOutput JSON contract? | Both implemented; recommendation memo + user pick at sprint review. |
| E-12 | S3 A/B | **Triage model**: Gemini-2.5-flash vs gpt-4o vs claude-sonnet-4-6 (with/without StructuredOutput guard)? | 50-claim golden run per cell; user picks production default at sprint review. |
| E-13 | S4 A/B | **Session context**: implicit Agent memory vs explicit Message History component? | Both implemented; deterministic-replay test + Langfuse trace cleanliness compared. |

---

## 13. Sources

Online sources checked during v3 review:

- Railway private networking: https://docs.railway.com/private-networking
- Supabase RLS and service-role behavior: https://supabase.com/docs/guides/database/postgres/row-level-security
- Langfuse authentication/SSO and self-hosting auth: https://langfuse.com/docs/administration/authentication-and-sso and https://langfuse.com/self-hosting/v2/deployment-guide
- Langflow auth/API docs: https://docs.langflow.org/api-keys-and-authentication and https://docs.langflow.org/api-reference-api-examples
- Langflow MCP client docs: https://docs.langflow.org/mcp-client
- Chatwoot webhook signatures: https://www.chatwoot.com/hc/user-guide/articles/1677693021-how-to-use-webhooks
- PostHog Node/feature flag docs: https://posthog.com/docs/libraries/node
- OpenTelemetry collector processors: https://opentelemetry.io/docs/collector/components/processor/
- OWASP MCP Tool Poisoning: https://owasp.org/www-community/attacks/MCP_Tool_Poisoning
- OWASP LLM Top 10 project: https://owasp.org/www-project-top-10-for-large-language-model-applications
- React Server Components advisory: https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components
- Next.js RSC advisory: https://github.com/vercel/next.js/security/advisories/GHSA-9qr9-h5gf-34mp
- EU AI Act overview: https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai
- DORA official sources: https://eur-lex.europa.eu/legal-content/ENG/ALL/?uri=CELEX%3A32022R2554 and https://www.eiopa.europa.eu/digital-operational-resilience-act-dora_sv
- NIST AI RMF / GenAI profile: https://www.nist.gov/itl/ai-risk-management-framework

Local sources reviewed:

- `.github/copilot-instructions.md`
- `CLAUDE.md`
- `.agents/skills/*/SKILL.md`
- `docs/property-fast-track.md`
- `docs/architecture.md`
- `db/migrations/0001` through `0008`
- `delete/app`, `delete/components`, `delete/lib`, `delete/package.json`

---

## 14. Final Delivery Rule

Build momentum, but do not let momentum erase the gates:

- G0 synthetic can move fast.
- G1 real-data shadow must be earned.
- G2 real-effect canary must be reversible.
- Builder must prove reliability before becoming a product promise.

The v3 plan is intentionally stricter than the earlier plans because the project is good enough to deserve real discipline.

---

## 15. Experimentation Findings & Locked Runtime Architecture (added 2026-05-04)

This section consolidates the Langflow runtime decision after two rounds of evidence:

- **Audit-of-the-audit** (2026-05-04 morning): a parallel agent's v4 audit claimed Langflow 1.9 cannot serve as production runtime because it lacks `WaitForResume`, execution checkpointing, and a resume API. We re-verified those three claims via GitHub MCP code search and they are all **true**. But the v4 conclusion ("replace with LangGraph") was an over-reach — see §15.2.
- **Live experimentation** (2026-05-04 afternoon): 20 experiments against a live Langflow 1.8.4 instance validated the "gateway-owns-durability + Langflow-as-step-executor" architecture end to end — see §15.4.

### 15.1 Locked decision

**Architecture:**

```
Gateway (durability owner)          Langflow (stateless step executor)
─────────────────────────           ──────────────────────────────────
Creates run in scenario_runs
Invokes step flow via API    ──►    Runs Agent + tools in ~30-90s
Writes events (append-only)         Returns structured output
Checks for "needs HITL" signal ◄──  RequiresHumanReview component (§15.3)
If HITL: hitl_items + Chatwoot
If continue: invoke next step ──►   Next step flow
```

**Invariants:**

- Each Langflow flow is **one short stateless step** (input → tools → output).
- Gateway's FSM owns transitions: `queued → running → waiting → running → completed | failed | failed_sla`.
- Durability = Postgres rows in `scenario_runs` + `events` (append-only) + `hitl_items`. Restart-safe by construction; no Langflow state to recover.
- Resume = gateway invokes the next-step flow with the operator's decision in `input_value`. Native pause/resume not needed.
- Idempotency keys flow gateway → Langflow → MCP per step.

### 15.2 Why Langflow stays (not LangGraph)

The v4 audit's three technical facts about Langflow 1.9 are correct (no `WaitForResume`, no execution checkpointing, no pause/resume API). But the conclusion ignored that:

1. **The architecture never required Langflow to own durability.** The prototype's `lib/server/run-store.ts` + `hitl_items` already does that.
2. **Translation cost.** Hand-translating each Langflow visual flow into LangGraph Python costs 3–5 engineering days per pilot, every time. The gateway-as-durability path has zero per-pilot translation cost.
3. **Locked Q-decision Q3** preserves Langflow as the agent runtime and visual authoring story.
4. **Forward-compatible.** When Langflow ships native HITL (issue [#6867](https://github.com/langflow-ai/langflow/issues/6867)), multi-step flows can collapse without breaking the gateway FSM.

### 15.3 The `RequiresHumanReview` custom component

Authored in S3 as a small custom Langflow component. Validated as `HitlGate` in the live experiments (Langflow auto-loaded it from `LANGFLOW_COMPONENTS_PATH`).

```python
# flows/components/requires_human_review.py
class RequiresHumanReview(CustomComponent):
    display_name = "Requires Human Review"
    description = "Signals to the gateway that this step needs HITL."

    def build_config(self):
        return {
            "claim_evidence":   {"display_name": "Evidence",         "type": "Data"},
            "decision_options": {"display_name": "Decision Options", "type": "list"},
            "sla_minutes":      {"display_name": "SLA (minutes)",    "type": "int"},
        }

    def build(self, claim_evidence, decision_options, sla_minutes):
        return {
            "_signal":      "requires_human_review",
            "evidence":     claim_evidence,
            "options":      decision_options,
            "sla_deadline": iso_now_plus_minutes(sla_minutes),
        }
```

Gateway detects `_signal: "requires_human_review"` in the Langflow run output → opens an `hitl_items` row → posts handover packet to Chatwoot → returns FSM to `waiting`.

**Open A/B (resolved at S3 demo):** ship this custom component AND a parallel `StructuredOutput`-based variant (JSON contract `{requires_review: bool, ...}`). User picks the production default after seeing both at sprint review (E-11).

### 15.4 Live Langflow Experiment Results (20 experiments, 2026-05-04)

| Area | Result | Evidence |
|---|---|---|
| MCP server | **Working.** Flows exposed as MCP tools; `tools/list` and `tools/call` both functional. | 1 flow enabled as tool (scalable). |
| Session persistence | **Works.** Messages stored in Langflow's message table per `(flow_id, session_id)`. Retrievable via `/api/v1/monitor/messages`. | 2 messages persisted across turns. |
| Session-based HITL | **Works with caveats.** Same `session_id` preserves conversation context across API calls; Agent sees prior messages. | Turn 1 → Turn 2 context maintained. |
| Custom components | **Working.** `HitlGate` (RequiresHumanReview equivalent) loaded from `LANGFLOW_COMPONENTS_PATH`. | `HitlGate` in "hitl" category. |
| Flow creation via API | **Works.** 2-node Agent+ChatOutput flow created programmatically. Required correct edge data handle format per `flows-api` skill. | Created `2d7752a8-…` (PFT Triage). |
| Tweaks (runtime overrides) | **Works.** System prompt and model params overridable per-run via `tweaks` JSON. | Used `tweaks.Agent-f12f5.system_prompt`. |
| 296 built-in components | **Documented.** Key ones: Agent, MCP Tools, Message History, Structured Output, Python Function, Flow as Tool, If-Else, Loop. | Pulled from `/api/v1/all`. |
| Model hallucination | **Risk observed.** Gemini 2.5 Flash sometimes ignored provided data and hallucinated different claim values. | Mitigated by Structured Output + prompt engineering; informs E-12. |
| Durability | **Validated architecture.** Langflow session state is in its SQLite DB; survives within-process. Does NOT survive DB loss — acceptable because the gateway's `hitl_items` + `scenario_runs` are the durability layer. | Aligns with §15.1. |

### 15.5 Sprint impact summary

| Sprint | Change |
|---|---|
| **S2** | No change to MCP work — validated as designed. |
| **S3** | Replace "checkpoint proof spike" with **step-idempotency proof** (E-04). Add **two A/B spikes**: HITL signal pattern (E-11) and triage model choice (E-12). Add `RequiresHumanReview` component as deliverable. Updated demo and acceptance — see §8 S3. |
| **S4** | Add **A/B spike** on session context management: implicit Agent memory vs explicit Message History component (E-13). |
| **S5** | Bake **StructuredOutput hallucination guard** into eval rubrics; report exact-match accuracy per model. |

### 15.6 Other findings folded as incremental hardening

These are valid but **not architecture changes** — they fold into existing sprint scopes:

| Finding | Sprint |
|---|---|
| `scenario_runs.status` missing `'failed_sla'` | S1 — migration `0009_runtime_safety.sql` |
| Audit log hash-chain race (no `SELECT FOR UPDATE`) | S1 — same migration |
| `evals.score` no range check (0..1) | S5 |
| Only 2 GET endpoints vs 23 POSTs | S1/S4 — gateway API contract expansion |
| OTel doesn't redact `gen_ai.prompt` / `gen_ai.completion` | S2 |
| SSE is polling, not push | S4 (`asyncio.Queue` per `run_id`, 5s poll fallback) |
| Golden dataset 50 → 200 claims | S5 |
| Personal Railway → AXA-controlled | Pre-S2 procurement |
| Bootstrap token in Railway template README | S0 sanitize |
| LLM-as-judge needs 3× median to avoid flake | S5 design |

### 15.7 Tracked todos

- `s3-requires-human-review-component`
- `s3-step-idempotency-proof` (depends on above)
- `s1-migration-0009-runtime-safety`
- `s2-otel-genai-redaction`
- `s4-sse-push-queue`
- `s4-gateway-list-endpoints`
- *(new)* `s3-hitl-signal-ab` — deliver custom-component variant AND StructuredOutput variant
- *(new)* `s3-triage-model-ab` — golden-set comparison across 3 models × 2 guard configs
- *(new)* `s4-session-context-ab` — implicit Agent vs Message History
- *(new)* `s5-hallucination-guard-eval` — StructuredOutput-on/off accuracy reporting

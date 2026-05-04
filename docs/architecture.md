# GDAI Agentic Cockpit — Target Architecture

> **Status:** Target architecture as of 2026-05-04. Reflects `docs/refactor_main_v3.md` v3.
> **Current sprint:** Sprint 1 — Foundation + Trust Boundary (active)
> **Next sprint:** Sprint 2 — Runtime Estate Landing (planned)
> **Authority:** For delivery sequencing, sprint acceptance criteria, and security gate definitions refer to the PRD. This document covers structure and data flow only.
> **Data model:** `db/migrations/0001–0008` applied. Next migrations: `0009–0014` per §11 of the PRD.

---

## Contents

1. [System Context (C4 L1)](#1-system-context)
2. [Container Diagram (C4 L2)](#2-container-diagram)
3. [Gateway Component Diagram (C4 L3)](#3-gateway-components)
4. [Railway Deployment Topology](#4-railway-deployment-topology)
5. [Scenario Run State Machine](#5-scenario-run-state-machine)
6. [Property Fast Track — Happy Path Flow](#6-property-fast-track-happy-path)
7. [HITL Decision Flow](#7-hitl-decision-flow)
8. [Observability Pipeline](#8-observability-pipeline)
9. [Canary Rollout Ladder](#9-canary-rollout-ladder)
10. [Database Schema (Core Tables)](#10-database-schema)
11. [Security Trust Model](#11-security-trust-model)
12. [Sprint Delivery Timeline](#12-sprint-delivery-timeline)
13. [Runtime Durability & Step Idempotency](#13-runtime-durability--step-idempotency)
14. [Eval CI Pipeline](#14-eval-ci-pipeline)
15. [Demo Replayer & LLM Narration](#15-demo-replayer--llm-narration)
16. [Scenario Builder Architecture (S8)](#16-scenario-builder-architecture-s8)
17. [Local Development Quickstart](#17-local-development-quickstart)

For per-sprint deliverables, testing plans, and review-decision scripts see [`docs/sprints/`](sprints/).

---

## 1. System Context

The cockpit is the internal control plane for AI-agent insurance pilots. It serves three personas: claims operators running HITL queues, ops engineers monitoring runtime health, and executive sponsors reviewing narrated demos. All traffic enters through a single public Next.js service.

```mermaid
C4Context
  title GDAI Agentic Cockpit — System Context

  Person(operator, "Claims Operator", "Reviews HITL items, approves/rejects reserve decisions")
  Person(opseng, "Ops Engineer", "Monitors runtime health, replays dead-letter items")
  Person(exec, "Executive Sponsor", "Views narrated demo, tries synthetic runs")
  Person(admin, "Pilot Admin", "Creates pilots, controls canary rollout, reviews evals")

  System(cockpit, "GDAI Agentic Cockpit", "Next.js control plane + FastAPI gateway. Orchestrates AI claim pilots for AXA.")

  System_Ext(langflow, "Langflow Runtime", "Agent orchestration runtime (stateless step executor)")
  System_Ext(n8n, "n8n Workflow Engine", "MCP tools layer: claims facade, document pipeline, vendor booking")
  System_Ext(supabase, "Supabase (PostgreSQL)", "Control-plane DB: scenario_runs, events, hitl_items, audit_log")
  System_Ext(langfuse, "Langfuse OSS", "Self-hosted trace store, prompt registry, LLM-judge evals")
  System_Ext(chatwoot, "Chatwoot", "HITL operator UI — operator receives handover packets here")
  System_Ext(posthog, "PostHog Cloud EU", "Feature flags, A/B experiments, synthetic product analytics")
  System_Ext(otel, "OTel Collector", "PII redaction + trace routing to Langfuse / Dynatrace")
  System_Ext(docling, "Docling Serve", "Document extraction pipeline (PDF, images → structured fields)")

  Rel(operator, cockpit, "Runs claims, reviews HITL queue", "HTTPS")
  Rel(opseng, cockpit, "Monitors runs, replays dead-letter", "HTTPS")
  Rel(exec, cockpit, "Watches narrated demo, tries synthetic run", "HTTPS")
  Rel(admin, cockpit, "Manages pilots and canary rollout", "HTTPS")

  Rel(cockpit, langflow, "Invokes step flows", "HTTP/private")
  Rel(cockpit, n8n, "Calls MCP tools", "HTTP/private")
  Rel(cockpit, supabase, "Reads/writes run state", "HTTP/private")
  Rel(cockpit, langfuse, "Writes traces, reads evals", "OTLP/HTTP private")
  Rel(cockpit, chatwoot, "Posts HITL handover packets", "HTTP/private")
  Rel(cockpit, posthog, "Evaluates feature flags", "HTTPS EU")
  Rel(cockpit, otel, "Sends spans for redaction", "OTLP/HTTP private")
  Rel(cockpit, docling, "Submits documents for extraction", "HTTP/private")

  Rel(chatwoot, cockpit, "Posts operator decisions (webhook)", "HMAC-signed HTTPS")
  Rel(n8n, cockpit, "Posts run callbacks (HMAC)", "HTTP/private")

  UpdateLayoutConfig($c4ShapeInRow="4", $c4BoundaryInRow="2")
```

---

## 2. Container Diagram

The cockpit consists of two app services plus a private service mesh. The gateway is the trust boundary — the browser never receives internal credentials or Railway private URLs.

```mermaid
C4Container
  title GDAI Agentic Cockpit — Container Diagram (17-service MVP topology)

  Person(operator, "Claims Operator / Ops / Admin")

  Container_Boundary(public_apps, "Public Services (3)") {
    Container(web, "agentic-web", "Next.js 16, React 19", "Cockpit UI + /api/gateway/* proxy. Only public-facing app service.")
    Container(cw_web, "chatwoot-web", "Chatwoot 4.x, Rails", "HITL operator queue. Operators receive handover packets here.")
    Container(lf_web, "langfuse-web", "Langfuse OSS, Next.js", "Trace explorer, prompt registry, eval dashboard.")
  }

  Container_Boundary(private_apps, "Private App Services (8)") {
    Container(gateway, "agent-gateway", "FastAPI, Python 3.12", "Trust boundary. Auth, run FSM, orchestrator dispatch, HITL bridge, audit writer, eval runner.")
    Container(langflow, "langflow-runtime", "Langflow 1.9", "Stateless step executor. Each flow = one short reasoning step.")
    Container(n8n, "n8n", "n8n", "MCP tools layer. Hosts claims_facade, wfmcp01–04, wf006 (Docling), wferr01.")
    Container(docling, "docling-serve", "Python, Docling", "PDF/image → structured claim field extraction.")
    Container(otel_col, "otel-collector", "OTel Collector Contrib", "PII redaction processor + dual exporter (Langfuse + Dynatrace phase 6).")
    Container(cw_worker, "chatwoot-worker", "Sidekiq", "Chatwoot background job processor.")
    Container(lf_worker, "langfuse-worker", "Langfuse worker", "Async trace ingestion, eval scoring, dataset writes.")
  }

  Container_Boundary(dbs, "Database Services (6)") {
    ContainerDb(pg_main, "pg-main", "PostgreSQL 16", "Supabase-linked control plane DB. scenario_runs, events, hitl_items, audit_log, pilots, tenants.")
    ContainerDb(pg_lf, "pg-langfuse", "PostgreSQL 16", "Langfuse traces, datasets, scores, prompts.")
    ContainerDb(pg_lf2, "pg-langflow", "PostgreSQL 16", "Langflow session state and flow definitions.")
    ContainerDb(pg_n8n, "pg-n8n", "PostgreSQL 16", "n8n workflow metadata and execution logs.")
    ContainerDb(pg_cw, "pg-chatwoot", "PostgreSQL 16", "Chatwoot conversations and messages.")
    ContainerDb(ch, "clickhouse-langfuse", "ClickHouse", "High-cardinality event analytics for Langfuse.")
  }

  Container_Boundary(caches, "Cache Services (2)") {
    ContainerDb(redis_lf, "redis-langfuse", "Redis", "Langfuse worker queue and cache.")
    ContainerDb(redis_cw, "redis-chatwoot", "Redis", "Chatwoot action cable and job queue.")
  }

  Rel(operator, web, "Uses browser", "HTTPS")
  Rel(web, gateway, "Proxies /api/gateway/*", "HTTP private, bearer token")

  Rel(gateway, langflow, "POST /api/v1/run/{flow_id}", "HTTP private, API key")
  Rel(gateway, n8n, "MCP tool calls via HTTP MCP server", "HTTP private, bearer")
  Rel(gateway, pg_main, "Run state R/W", "SQL/TLS private")
  Rel(gateway, otel_col, "OTLP spans", "HTTP private :4318")
  Rel(gateway, cw_web, "POST handover packet", "HTTP private, API token")
  Rel(gateway, lf_web, "Trace deep-link + eval read", "HTTP private")

  Rel(langflow, pg_lf2, "Session state", "SQL private")
  Rel(n8n, pg_n8n, "Workflow state", "SQL private")

  Rel(otel_col, lf_web, "Redacted spans via OTLP", "HTTP private")
  Rel(lf_web, pg_lf, "Trace R/W", "SQL private")
  Rel(lf_web, ch, "Analytics events", "HTTP private")
  Rel(lf_worker, redis_lf, "Job queue", "Redis private")

  Rel(cw_web, pg_cw, "Conversation state", "SQL private")
  Rel(cw_web, redis_cw, "Action cable", "Redis private")
  Rel(cw_worker, pg_cw, "Background jobs", "SQL private")

  Rel(cw_web, gateway, "Webhook: operator decision", "HMAC-signed HTTP private")

  UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

---

## 3. Gateway Components

The `agent-gateway` is the single trust boundary. Nothing in `agentic-web` calls Supabase service-role, Langflow, n8n, or Chatwoot directly.

```mermaid
C4Component
  title agent-gateway — Internal Component Diagram

  Container(web, "agentic-web", "Next.js", "Cockpit UI — proxies all writes to gateway")
  Container(langflow, "langflow-runtime", "Langflow 1.9", "Stateless step executor")
  Container(n8n, "n8n", "n8n", "MCP tools layer")
  ContainerDb(pg, "pg-main", "PostgreSQL", "Control-plane DB")
  Container(otel, "otel-collector", "OTel", "PII redaction + export")
  Container(chatwoot, "chatwoot-web", "Chatwoot", "HITL operator UI")
  Container(posthog, "PostHog EU", "PostHog", "Feature flags")

  Container_Boundary(gw, "agent-gateway") {
    Component(auth, "auth.py", "FastAPI / JWT", "Cookie signing, login rate-limit, session verify, CSRF")
    Component(tenant, "tenant.py", "Pydantic", "Tenant context — injects gdai-default at MVP")
    Component(runs, "runs.py", "FastAPI", "Run create/cancel/resume FSM. Append-only events. Idempotency keys.")
    Component(lf_client, "langflow_client.py", "httpx async", "Invoke step flows. Timeout/retry/circuit breaker. Reads _signal from output.")
    Component(n8n_proxy, "n8n.py", "httpx async", "MCP proxy. Schema-validates every tool response. Idempotency key forwarding.")
    Component(hitl, "hitl.py", "FastAPI", "Opens/closes hitl_items rows. Builds Chatwoot handover packet. Resume = next-step invocation.")
    Component(audit, "audit.py", "SQLAlchemy", "Append-only audit_log writer. Hash-chain with SELECT FOR UPDATE.")
    Component(events, "events.py", "asyncio.Queue", "SSE push per run_id. 5s poll fallback. Heartbeat + backoff reconnect.")
    Component(flags, "posthog_flags.py", "posthog-python", "Server-side flag eval sticky per chatwoot_conversation_id.")
    Component(eval_runner, "eval_runner.py", "Langfuse SDK", "Runs golden-dataset eval against 3 judge rubrics. CI-triggered.")
    Component(redact, "redact.py", "re / presidio", "Source-level PII minimization before Langfuse / Chatwoot / audit export.")
    Component(settings, "settings.py", "pydantic-settings", "All config from env. No hard-coded URLs or keys.")
    Component(health, "health.py", "FastAPI", "GET /healthz — checks Supabase, Langflow, n8n, Langfuse, OTel, Chatwoot.")
  }

  Rel(web, auth, "All requests — cookie verify")
  Rel(auth, tenant, "Injects tenant context")
  Rel(runs, lf_client, "Invoke step flow")
  Rel(runs, n8n_proxy, "Tool calls with idempotency key")
  Rel(runs, hitl, "HITL signal detected")
  Rel(runs, audit, "Every state transition")
  Rel(runs, events, "Publish run events")
  Rel(runs, flags, "Select orchestrator variant")
  Rel(runs, redact, "Scrub before trace/audit write")
  Rel(lf_client, langflow, "POST /api/v1/run/{flow_id}")
  Rel(n8n_proxy, n8n, "HTTP MCP tool call")
  Rel(hitl, chatwoot, "POST handover packet")
  Rel(eval_runner, pg, "Read golden dataset")
  Rel(auth, pg, "Session / nonce store")
  Rel(audit, pg, "Append audit_log row")

  UpdateLayoutConfig($c4ShapeInRow="4", $c4BoundaryInRow="1")
```

---

## 4. Railway Deployment Topology

17 services on a WireGuard-encrypted private mesh. Only 3 expose public domains.

```mermaid
C4Deployment
  title Railway Deployment — MVP Production Topology

  Deployment_Node(railway, "Railway Project: gdai-agentic", "Railway Cloud") {

    Deployment_Node(public_zone, "Public Services", "Railway public domains") {
      Container(web, "agentic-web", "Next.js 16", "cockpit.axa-demo.up.railway.app")
      Container(chatwoot, "chatwoot-web", "Chatwoot 4.x", "hitl.axa-demo.up.railway.app")
      Container(langfuse_web, "langfuse-web", "Langfuse OSS", "traces.axa-demo.up.railway.app")
    }

    Deployment_Node(private_zone, "Private Services", "railway.internal — never public") {
      Container(gateway, "agent-gateway", "FastAPI :8000", "${{ agent-gateway.RAILWAY_PRIVATE_DOMAIN }}:8000")
      Container(langflow, "langflow-runtime", "Langflow 1.9 :7860", "${{ langflow-runtime.RAILWAY_PRIVATE_DOMAIN }}:7860")
      Container(n8n, "n8n", "n8n :5678", "${{ n8n.RAILWAY_PRIVATE_DOMAIN }}:5678")
      Container(docling, "docling-serve", "Python :5001", "${{ docling-serve.RAILWAY_PRIVATE_DOMAIN }}:5001")
      Container(otel_col, "otel-collector", "OTel :4317/:4318", "${{ otel-collector.RAILWAY_PRIVATE_DOMAIN }}:4318")
      Container(cw_worker, "chatwoot-worker", "Sidekiq", "private")
      Container(lf_worker, "langfuse-worker", "Node.js", "private")
    }

    Deployment_Node(data_zone, "Database Services", "Railway Postgres volumes") {
      ContainerDb(pg_main, "pg-main", "PostgreSQL 16", "Control plane — Supabase linked")
      ContainerDb(pg_lf, "pg-langfuse", "PostgreSQL 16", "Langfuse state")
      ContainerDb(pg_lf2, "pg-langflow", "PostgreSQL 16", "Langflow sessions")
      ContainerDb(pg_n8n, "pg-n8n", "PostgreSQL 16", "n8n workflows")
      ContainerDb(pg_cw, "pg-chatwoot", "PostgreSQL 16", "Chatwoot conversations")
      ContainerDb(ch, "clickhouse", "ClickHouse", "Langfuse analytics")
      ContainerDb(redis_lf, "redis-langfuse", "Redis", "Queue + cache")
      ContainerDb(redis_cw, "redis-chatwoot", "Redis", "Action cable")
    }

    Deployment_Node(buckets, "Object Storage (S3-compatible)", "Railway Buckets") {
      ContainerDb(bkt_runtime, "agentic-runtime", "Railway Bucket", "Flow artifacts, prompt bundles")
      ContainerDb(bkt_blobs, "langfuse-blobs", "Railway Bucket", "Trace media blobs")
      ContainerDb(bkt_audit, "audit-bundles", "Railway Bucket", "Signed audit ZIP exports")
    }
  }

  Rel(web, gateway, "Private HTTP bearer", "${{ agent-gateway.RAILWAY_PRIVATE_DOMAIN }}:8000")
  Rel(gateway, langflow, "Private HTTP API key")
  Rel(gateway, n8n, "Private HTTP MCP")
  Rel(gateway, otel_col, "OTLP/HTTP :4318")
  Rel(gateway, pg_main, "SQL private")
  Rel(gateway, chatwoot, "Private HTTP API token")
  Rel(chatwoot, gateway, "Webhook HMAC")
```

---

## 5. Scenario Run State Machine

The gateway owns all state transitions. Langflow never advances the FSM directly.

```mermaid
stateDiagram-v2
  direction LR

  [*] --> queued : POST /runs

  queued --> running : Gateway invokes step flow

  running --> waiting : Langflow returns _signal=requires_human_review\nGateway opens hitl_items row\nHandover packet posted to Chatwoot

  waiting --> running : Operator decision webhook received\nGateway resumes — invokes next step flow

  running --> completed : All steps done\nGateway writes final audit row

  running --> failed : Step error / timeout after retries\nCircuit breaker open

  running --> failed_sla : SLA deadline exceeded\nGateway auto-escalates

  waiting --> failed_sla : SLA deadline exceeded while awaiting operator

  note right of waiting
    hitl_items row persists decision options,
    evidence, sla_deadline, langfuse_trace_id.
    Chatwoot conversation is the operator surface.
  end note

  note right of running
    Node-level state in node_states[stepKey].
    Events are append-only.
    Orchestrator is immutable after run creation.
    Idempotency key forwarded to every MCP call.
  end note
```

---

## 6. Property Fast Track — Happy Path

End-to-end flow for a property damage claim through the Langflow-orchestrated path.

```mermaid
sequenceDiagram
  autonumber
  actor Op as Claims Operator
  participant Web as agentic-web
  participant GW as agent-gateway
  participant LF as langflow-runtime
  participant N8N as n8n (MCP tools)
  participant CW as chatwoot-web
  participant DB as pg-main (Supabase)
  participant OTel as otel-collector
  participant Langfuse

  Op->>Web: Run Property Fast Track (claim input)
  Web->>GW: POST /api/gateway/runs (proxied)
  GW->>DB: INSERT scenario_runs (status=queued, orchestrator=langflow)
  GW->>DB: INSERT events (type=run.queued)

  Note over GW: PostHog flag eval → pf_orchestrator=langflow

  GW->>LF: POST /api/v1/run/triage-flow (tweaks: claim_text, idempotency_key)
  LF->>N8N: MCP tool: claims_facade.create_claim
  N8N-->>LF: {claim_id: CLM-001, policy_ok: true}
  LF-->>GW: {category: Motor, severity: HIGH, output: {...}}

  GW->>OTel: OTLP span (redacted — no raw claim text)
  OTel->>Langfuse: Forwarded span after PII processor

  GW->>DB: UPDATE scenario_runs (status=running)
  GW->>DB: INSERT events (type=step.triage.completed)

  GW->>LF: POST /api/v1/run/reserve-gate-flow (evidence, decision_options)
  LF-->>GW: {_signal: requires_human_review, evidence: {...}, sla_deadline: +4h}

  GW->>DB: INSERT hitl_items (status=pending, sla_deadline)
  GW->>DB: UPDATE scenario_runs (status=waiting)
  GW->>CW: POST /api/v1/accounts/1/conversations (handover packet)
  CW-->>Op: Conversation appears in HITL queue

  Op->>CW: Approve reserve €12,500
  CW->>GW: POST /webhook (HMAC-signed) {decision: approve, amount: 12500}

  GW->>GW: Verify HMAC + timestamp + nonce (replay cache)
  GW->>DB: UPDATE hitl_items (status=resolved, decision=approve)
  GW->>DB: INSERT audit_log (action=hitl.approved, hash_chain)

  GW->>LF: POST /api/v1/run/document-extract-flow (claim_id, session_id)
  LF->>N8N: MCP tool: wf006.extract_document (Docling)
  N8N-->>LF: {extracted_fields: {...}, confidence: 0.91}
  LF-->>GW: {docs_ok: true, fields: {...}}

  GW->>LF: POST /api/v1/run/dispatch-prep-flow
  LF->>N8N: MCP tool: wfmcp02.vendor_search + wfmcp03.vendor_rank
  N8N-->>LF: {vendor_id: V-042, vendor_name: Northside Repairs}
  LF-->>GW: {dispatch_ready: true, vendor: {...}}

  GW->>N8N: MCP tool: wfmcp04.vendor_book (idempotency_key)
  N8N-->>GW: {booking_ref: BK-9921, confirmed: true}

  GW->>DB: UPDATE scenario_runs (status=completed)
  GW->>DB: INSERT audit_log (action=run.completed, hash_chain)
  GW-->>Web: SSE: run.completed event
  Web-->>Op: Canvas updates — all nodes green
```

---

## 7. HITL Decision Flow

Detailed view of the pause/resume cycle with full durability guarantees.

```mermaid
sequenceDiagram
  autonumber
  participant GW as agent-gateway
  participant DB as pg-main
  participant CW as Chatwoot
  actor Op as Operator
  participant LF as langflow-runtime

  Note over GW: Langflow step returns _signal=requires_human_review

  GW->>DB: INSERT hitl_items (run_id, gate_type, evidence_json, decision_options, sla_deadline, langfuse_trace_id)
  GW->>DB: UPDATE scenario_runs (status=waiting)
  GW->>DB: INSERT audit_log (action=hitl.opened)

  GW->>CW: POST /api/v1/accounts/{id}/conversations
  GW->>CW: POST message (private note — handover packet)
  GW->>CW: PATCH custom_attributes {claim_id, langfuse_trace_id, decision_options, sla_deadline}
  GW->>CW: POST labels [pilot:property-fast-track, priority:escalated]

  CW-->>Op: HITL item appears in queue

  Op->>CW: Review evidence + select decision
  CW->>GW: POST /webhook/chatwoot (HMAC-SHA256: timestamp + raw body)

  GW->>GW: Constant-time HMAC verify
  GW->>GW: Check timestamp skew < 5 min
  GW->>GW: Check nonce not in replay cache
  GW->>DB: Write nonce to replay cache (TTL 24h)

  alt Decision accepted
    GW->>DB: UPDATE hitl_items (status=resolved, decision, reason)
    GW->>DB: INSERT audit_log (action=hitl.decided, hash_chain_position=N+1)
    GW->>LF: POST /api/v1/run/next-step-flow (operator_decision in input_value)
    GW->>DB: UPDATE scenario_runs (status=running)
  else Duplicate decision (nonce already seen)
    GW->>GW: Return 200 OK (idempotent — no state change)
  else SLA expired
    GW->>DB: UPDATE scenario_runs (status=failed_sla)
    GW->>DB: INSERT audit_log (action=hitl.sla_expired)
  end
```

---

## 8. Observability Pipeline

All telemetry flows through the OTel collector for PII redaction before reaching Langfuse.

```mermaid
flowchart LR
  subgraph Services
    GW[agent-gateway\n@observe decorators]
    LF[langflow-runtime\nAuto-instrumented]
    N8N[n8n\nOTel community node]
  end

  subgraph OTel_Collector["otel-collector (PII redaction layer)"]
    direction TB
    RCV[OTLP receiver\n:4317 gRPC / :4318 HTTP]
    MEM[memory_limiter]
    ATTR[attributes/redact\nRemoves: email, phone, IBAN\nFrench plates, Spanish DNI/NIE]
    XFORM[transform/scrub\nOttl: replaces gen_ai.prompt\ngen_ai.completion with REDACTED]
    BATCH[batch processor]
  end

  subgraph Destinations
    LFUSE[Langfuse OSS\nSelf-hosted\n:3000]
    DT[Dynatrace\nPhase 6 only]
  end

  GW -->|OTLP/HTTP| RCV
  LF -->|OTLP/HTTP| RCV
  N8N -->|OTLP/HTTP| RCV

  RCV --> MEM --> ATTR --> XFORM --> BATCH

  BATCH -->|Basic auth\nbase64 pub:secret| LFUSE
  BATCH -.->|Phase 6\nApi-Token| DT

  LFUSE --> LF_WORKER[langfuse-worker\nAsync ingestion]
  LF_WORKER --> PG_LF[(pg-langfuse)]
  LF_WORKER --> CH[(clickhouse\nAnalytics)]

  style ATTR fill:#ffeecc
  style XFORM fill:#ffeecc
  style DT stroke-dasharray: 5 5
```

**Langfuse trace propagation to cockpit:**

```mermaid
flowchart LR
  GW[gateway @observe] -->|trace_id| SR[(scenario_runs\n.langfuse_trace_id)]
  SR --> WEB[agentic-web\nTraceTree component]
  WEB -->|deep-link| LFUSE[Langfuse UI\nFull span tree]
```

---

## 9. Canary Rollout Ladder

The `pf_orchestrator` PostHog flag controls which orchestrator handles each run. Stickiness is per `chatwoot_conversation_id`.

```mermaid
flowchart TD
  G0["🟢 G0 — Synthetic Only\nDefault for all MVP work\n\nAllowed: synthetic claims, traces, events\nNot allowed: real data, real operator PII"]

  G0_GATE{"G0 → G1 Gate\n• No real secrets in repo\n• Service-role key gateway-only\n• Basic auth + rate limit\n• Security headers\n• Trace redaction smoke test\n• DPIA draft complete\n• RLS no-fallback (non-dev)\n• Entra/OIDC or approved IdP\n• HMAC webhooks validated"}

  G1["🟡 G1 — Shadow\nReal data read / shadow\nNo real effects\n\npf_orchestrator: forced then 5% max\nReal Langfuse traces (redacted)\nPostHog EU only"]

  G1_GATE{"G1 → G2 Gate\n• Eval CI green (7 days)\n• 50-user load test passed\n• Online eval sampler active\n• Rollback tested with evidence\n• Incident response playbook tested\n• Backup restore drill passed\n• Audit bundle verified by compliance\n• G1 security checklist 100%"}

  G2["🟠 G2 — Canary\nLimited real-effect pilot\nMax 25% → 100% after 7 days stable\n\nApproved real data\nFull HITL in Chatwoot\nAudit bundle on every run"]

  G3["🔴 G3 — Production\nPost-MVP\nNot in scope for this delivery"]

  G0 --> G0_GATE --> G1 --> G1_GATE --> G2 --> G3

  subgraph "Canary progression within G2"
    C5["5% — After S3 cutover passes"]
    C25["25% — After S5 eval CI green\n+ SLO stable + rollback tested"]
    C100["100% — After 7 consecutive days\nonline eval + SLO stability"]
    C5 --> C25 --> C100
  end

  G2 -.-> C5
```

---

## 10. Database Schema

Core tables in `pg-main` (Supabase project `tsevmqftwnyzrxlpnred`). Migrations `0001–0008` applied; `0009–0014` planned.

```mermaid
erDiagram
  tenants {
    text id PK "gdai-default at MVP"
    text name
    jsonb config
    timestamptz created_at
  }

  pilots {
    uuid id PK
    text tenant_id FK
    text slug
    text display_name
    text orchestrator "n8n | langflow"
    text data_stage "G0 | G1 | G2"
    text status "active | archived"
    timestamptz created_at
  }

  scenario_runs {
    uuid id PK
    text tenant_id FK
    uuid pilot_id FK
    text status "queued|running|waiting|completed|failed|failed_sla"
    text orchestrator "immutable after create"
    text langfuse_trace_id
    jsonb node_states
    uuid idempotency_key
    integer version "optimistic concurrency"
    timestamptz created_at
    timestamptz updated_at
  }

  run_events {
    uuid id PK
    uuid run_id FK
    text tenant_id FK
    text event_type
    jsonb payload
    text idempotency_key
    timestamptz occurred_at
  }

  hitl_items {
    uuid id PK
    uuid run_id FK
    text tenant_id FK
    text gate_type "reserve_gate|payment_gate|escalation_gate"
    text status "pending|resolved|expired"
    jsonb evidence
    jsonb decision_options
    text decision
    text decision_reason
    text langfuse_trace_id
    text chatwoot_conversation_id
    timestamptz sla_deadline
    timestamptz resolved_at
  }

  audit_log {
    uuid id PK
    text tenant_id FK
    uuid run_id FK
    text action
    uuid actor_id
    jsonb payload "PII-minimized"
    text prev_hash "SHA-256 of prior row"
    integer chain_position
    timestamptz occurred_at
  }

  scenarios_demo {
    uuid id PK
    text tenant_id FK
    text scenario_key
    uuid seed_run_id FK
    jsonb narration "keyed by span_id"
    timestamptz narrated_at
  }

  eval_baselines {
    uuid id PK
    text tenant_id FK
    text pilot_slug
    text rubric "factual_accuracy|policy_compliance|tone"
    float8 score
    text langfuse_dataset_id
    timestamptz evaluated_at
  }

  tenants ||--o{ pilots : "owns"
  tenants ||--o{ scenario_runs : "owns"
  pilots ||--o{ scenario_runs : "has"
  scenario_runs ||--o{ run_events : "appends"
  scenario_runs ||--o{ hitl_items : "opens"
  scenario_runs ||--o{ audit_log : "writes"
  scenario_runs ||--o| scenarios_demo : "seeds"
  pilots ||--o{ eval_baselines : "benchmarks"
```

---

## 11. Security Trust Model

```mermaid
flowchart TD
  subgraph Browser["Browser (untrusted)"]
    UI[Next.js cockpit UI]
  end

  subgraph TrustBoundary["Trust Boundary — agent-gateway"]
    AUTH[Cookie verify\nCSRF check\nRate limit]
    TENANT[Tenant context inject]
    REDACT[PII minimization\nbefore any write]
    AUDIT[Audit log writer\nhash-chain]
  end

  subgraph Internal["Private Railway mesh (WireGuard)"]
    LF[langflow-runtime\nAPI key auth]
    N8N[n8n\nBearer token]
    DB[(pg-main\nservice-role — gateway only)]
    CW[chatwoot-web\nAPI token]
    OTEL[otel-collector\nno auth needed — private only]
  end

  UI -->|HTTPS + HTTP-only cookie| AUTH
  AUTH --> TENANT --> REDACT --> AUDIT
  REDACT --> LF
  REDACT --> N8N
  AUDIT --> DB
  REDACT --> CW
  AUDIT --> OTEL

  note1["❌ Browser NEVER receives:\n• Supabase service-role key\n• Langflow API key\n• n8n credentials\n• Chatwoot API token\n• Langfuse secret key\n• PostHog personal API key\n• Railway private URLs"]

  style note1 fill:#ffe0e0,stroke:#cc0000
  style TrustBoundary fill:#e8f5e9,stroke:#2e7d32
  style Internal fill:#e3f2fd,stroke:#1565c0
```

**Key security invariants:**

| Control | Where | Gate |
|---|---|---|
| No service-role key in web runtime | `settings.py` / env | G0 |
| CSRF protection on cookie-backed writes | `middleware.ts` + `auth.py` | G0 |
| Login rate limit (5 attempts) | `auth.py` | G0 |
| HMAC webhook verify + timestamp + nonce | `hitl.py` | G0/G1 |
| Source-level PII minimization | `redact.py` | G1 |
| OTel redaction as last-line defense | `otel-config.yaml` | G0+ |
| RLS no-fallback outside dev | Supabase migration | G1 |
| Audit chain hash-verification function | Migration `0009` | G0 |
| Entra/OIDC + MFA | `auth.py` | G1 |

---

## 12. Sprint Delivery Timeline

```mermaid
gantt
  title GDAI Agentic Cockpit — 16-Week Delivery (S0–S8)
  dateFormat  YYYY-MM-DD
  axisFormat  %b %d

  section Foundation
    S0 Repo Recovery Gate        :done,    s0, 2026-04-28, 4d
    S1 Foundation + Trust Boundary :active, s1, 2026-05-04, 14d

  section Runtime
    S2 Runtime Estate Landing    :         s2, after s1, 14d
    S3 Langflow Cutover Canary   :         s3, after s2, 14d

  section Product Surface
    S4 Pilot + HITL Product      :         s4, after s3, 14d
    S5 Ops + Eval Control Loop   :         s5, after s4, 14d

  section Demo + Scale
    S6 Executive Demo + Experiments :      s6, after s5, 14d
    S7 Motor-Fleet + Audit Hardening :     s7, after s6, 14d

  section Builder
    Pre-S8 Gate Experiment       :         s8pre, after s7, 5d
    S8 Scenario Builder (if gate passes) : s8, after s8pre, 14d

  section Security Gates
    G0 Synthetic (default)       :milestone, 2026-05-04, 0d
    G1 Shadow Gate (requires S1 complete) :milestone, after s1, 0d
    G2 Canary Gate (requires S5 + 7 days) :milestone, after s5, 0d
```

---

## 13. Runtime Durability & Step Idempotency

The gateway owns durability — Langflow runs single short stateless steps. This diagram shows what happens when Langflow dies mid-step.

```mermaid
sequenceDiagram
  autonumber
  participant GW as agent-gateway
  participant LF as langflow-runtime
  participant N8N as n8n / MCP
  participant DB as pg-main

  Note over GW: Step N starts. Gateway issues step_idempotency_key=K.

  GW->>DB: INSERT events (type=step.N.started, idempotency_key=K)
  GW->>LF: POST /api/v1/run/step-N-flow (input, idempotency_key=K)

  LF->>N8N: tool call A (Idempotency-Key: K-A)
  N8N->>N8N: SELECT prior call WHERE key=K-A
  N8N-->>LF: result A (cached or fresh)

  rect rgba(255,200,200,0.4)
    Note over LF: 💥 Langflow OOM-killed mid-flow
  end

  GW->>GW: httpx timeout after 60s
  GW->>DB: INSERT events (type=step.N.timeout, idempotency_key=K)

  Note over GW: Retry with same K

  GW->>LF: POST /api/v1/run/step-N-flow (same input, idempotency_key=K)
  LF->>N8N: tool call A (Idempotency-Key: K-A)
  N8N->>N8N: Returns prior result — NO duplicate side effect
  N8N-->>LF: cached result A
  LF-->>GW: step result

  GW->>DB: INSERT events (type=step.N.completed, idempotency_key=K)
  GW->>DB: UPDATE scenario_runs (advance state)
```

**Invariants enforced:**

- Every MCP tool call carries `Idempotency-Key: {run_id}-{step}-{tool}-{attempt_root}`.
- n8n stores key→result for 24h; duplicate keys return cached result.
- Gateway's `events` table is append-only — restart safely re-emits the timeout/completed events without rewriting history.
- LLM calls are not retried automatically; gateway records cost on first attempt and skips on retry (LLM-side caching not assumed).

---

## 14. Eval CI Pipeline

Golden-dataset evals run on every PR touching a flow or prompt. Three LLM-judge rubrics gate the merge.

```mermaid
flowchart LR
  PR[PR merges to main\nflow or prompt change] --> CI[GitHub Actions\neval.yml]

  CI --> LOAD[Load golden dataset\n200 synthetic claims\nSupabase: golden_dataset]
  LOAD --> RUN[Run flow per claim\nthrough live Langflow]
  RUN --> CAPTURE[Capture outputs +\nLangfuse trace_id per claim]

  CAPTURE --> JUDGE_FA[Judge: factual_accuracy\n3x median run]
  CAPTURE --> JUDGE_PC[Judge: policy_compliance\n3x median run]
  CAPTURE --> JUDGE_TONE[Judge: tone\n3x median run]

  JUDGE_FA --> SCORES[(eval_baselines\ntenant scoped)]
  JUDGE_PC --> SCORES
  JUDGE_TONE --> SCORES

  SCORES --> COMPARE{Threshold check\n>= baseline - 5%?}
  COMPARE -- pass --> GREEN[✅ PR mergeable\nUpdate baseline]
  COMPARE -- fail --> RED[❌ Block merge\nPost regression diff]

  RED --> SLACK[Slack alert\n#eval-regressions]

  style RED fill:#ffe0e0,stroke:#cc0000
  style GREEN fill:#e0ffe0,stroke:#2e7d32
```

**Rubric definitions:** see `gateway/scripts/eval_runner.py` and Langfuse dataset `gdai-default/golden-property-fast-track`.

---

## 15. Demo Replayer & LLM Narration

Demo scenarios replay an existing scenario_run with cached LLM-generated narration per span.

```mermaid
sequenceDiagram
  autonumber
  actor Exec as Executive Sponsor
  participant Web as agentic-web
  participant GW as agent-gateway
  participant DB as pg-main
  participant LFUSE as Langfuse
  participant NIM as NIM (narration LLM)

  Exec->>Web: Open Demo "Property Fast Track"
  Web->>GW: GET /api/gateway/demo/scenarios/{key}
  GW->>DB: SELECT scenarios_demo (seed_run_id, narration jsonb)

  alt Narration cached
    GW-->>Web: {seed_run, narration}
  else First-open / Re-narrate
    GW->>LFUSE: GET /api/public/traces/{seed_run.langfuse_trace_id}
    LFUSE-->>GW: Span tree
    GW->>NIM: chat(narration_prompt, span_tree, claim_facts)
    NIM-->>GW: Per-span narration JSON
    GW->>DB: UPDATE scenarios_demo SET narration=...
    GW-->>Web: {seed_run, narration}
  end

  Web-->>Exec: Render replay canvas\n+ narration overlay per node

  Exec->>Web: Click "Try synthetic run"
  Web->>GW: POST /api/gateway/runs (pilot=property-fast-track, demo=true)
  Note over GW,DB: Standard run flow — no real effects in G0
```

---

## 16. Scenario Builder Architecture (S8)

The Builder is a guided FSM that turns an operator's brief into a synthetic pilot. It is gated behind a pre-S8 quality experiment (E-10).

```mermaid
flowchart TB
  subgraph User["Pilot operator (browser)"]
    UI[Builder UI\nNext.js]
  end

  subgraph Gateway["agent-gateway/builder/"]
    direction TB
    API[api.py\nPOST /builder/sessions]
    FSM[session.py\nFSM: brief→plan→bundle→preview→deploy]
    NIM[nim.py\nNIM chat helper]
    PROMPTS[prompts.py\nMessage builders]
    SKILLS[skills_pack.py\nLoader: .agents/skills/* digest]
    CHECK[richness-checklist.py\n5 must-have signals]
  end

  subgraph Tools["builder/tools/"]
    WEB[web_search_insurance.py\nTavily-backed]
    LINT[bundle_lint.py\nFlow JSON validator]
    PREVIEW[preview_run.py\nDry-run against Langflow]
  end

  subgraph Outputs["Generated artifacts"]
    FLOW[flows/{pilot}.json]
    PROMPT[prompts/{pilot}/*.txt]
    SEEDS[demo seed claims]
  end

  UI --> API --> FSM
  FSM --> NIM
  NIM --> PROMPTS
  PROMPTS --> SKILLS
  FSM --> CHECK

  FSM --> WEB
  FSM --> LINT
  FSM --> PREVIEW

  PREVIEW --> FLOW
  PREVIEW --> PROMPT
  PREVIEW --> SEEDS

  FLOW -.->|G0 only| Langflow[langflow-runtime]
  PROMPT -.-> Langflow

  style Tools fill:#fff8e1
  style Outputs fill:#e8f5e9
```

**Gating:** Builder ships read-only canvas first. Deploy button enabled only at G0. Generated flows never leave G0 without manual review + risk owner approval.

---

## 17. Local Development Quickstart

For full delivery setup see `CLAUDE.md` and `.github/copilot-instructions.md`. Quick reference:

```bash
# Web cockpit (currently lives in delete/ pending S0 restoration)
source ~/.nvm/nvm.sh && nvm use 20
cd /home/mr_e/agentic/delete && PORT=3001 pnpm dev

# Python gateway
cd /home/mr_e/agentic/gateway && uv run fastapi dev --port 8000

# Langflow
langflow run --port 7860

# n8n
N8N_USER_FOLDER=~/.n8n n8n start --host 127.0.0.1 --port 5678

# Chatwoot
cd ~/chatwoot && docker compose up -d
```

Production private URLs use Railway reference variables — never hard-coded IPs:

```bash
GATEWAY_URL=http://${{ agent-gateway.RAILWAY_PRIVATE_DOMAIN }}:8000
LANGFLOW_URL=http://${{ langflow-runtime.RAILWAY_PRIVATE_DOMAIN }}:7860
N8N_BASE_URL=http://${{ n8n.RAILWAY_PRIVATE_DOMAIN }}:5678
OTEL_EXPORTER_OTLP_ENDPOINT=http://${{ otel-collector.RAILWAY_PRIVATE_DOMAIN }}:4318
```

For per-sprint deliverables, testing plans, and review-decision scripts see `docs/sprints/sprint-N-*.md`.

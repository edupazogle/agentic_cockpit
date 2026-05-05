# Sprint Documentation Index

This folder contains the per-sprint delivery briefs for the GDAI Agentic Cockpit MVP. Each sprint document includes:

- **Why this sprint exists** — the gap it closes.
- **Scope summary** — in-scope and out-of-scope.
- **Implementation diagram** — Mermaid diagram of what gets built.
- **Technical implementation** — code paths, schemas, key snippets.
- **Testing plan** — unit / integration / contract / E2E / performance / failure tests.
- **Acceptance criteria** — table of measurable outcomes.
- **Sprint review / decision gate** — demo script, definition of done, readiness for next sprint, critical user questions.
- **What's deferred** — items handed to later sprints.
- **References** — links to source-of-truth doc, skills, and MCP servers.

The canonical source for scope and rationale remains [`../refactor_main_v3.md`](../refactor_main_v3.md). Architecture-level diagrams live in [`../architecture.md`](../architecture.md).

## Sprints

| # | Sprint | Duration | Persona promise |
|---|---|---|---|
| 0 | [Repo Recovery Gate](sprint-0-repo-recovery.md) | Week 0 (2-4 days) | An engineer can clone the repo, run the cockpit locally, and see the actual active project shape. |
| 1 | [Foundation + Trust Boundary](sprint-1-foundation-trust-boundary.md) | Weeks 1-2 | Operator can log in; engineer can verify the gateway trust boundary and first redacted trace. |
| 2 | [Runtime Estate Landing](sprint-2-runtime-estate-landing.md) | Weeks 3-4 | Admin can verify the runtime estate is healthy, backed up, observable, and still running n8n. |
| 3 | [Langflow Cutover Canary](sprint-3-langflow-cutover-canary.md) | Weeks 5-6 | The same property-fast-track runs through Langflow safely, with rollback and step-idempotency proof. |
| 4 | [L1 First-Arrival of Pilot Workspace (Pilot + HITL Surface)](sprint-4-pilot-hitl-product-surface.md) | Weeks 7-8 | Operator lands at L1 right after ship, sees hero card + voucher, places real call, decides HITL, sees audit. |
| 5 | [L4 Live Ops Centre Pane (Ops + Eval Control Loop)](sprint-5-ops-eval-control-loop.md) | Weeks 9-10 | Ops/admin detects degraded quality early; L4 centre-pane skeleton seeded for future polish. |
| 6 | [Staircase End-to-End Demo (Executive Demo + Experimentation)](sprint-6-executive-demo-experimentation.md) | Weeks 11-12 | Executive watches one pilot climb L0 → L4 in 12-15 min with companion narration + on-demand rollback. |
| 7 | [Motor-FNOL-Tow Anchor + Audit Hardening](sprint-7-motor-fnol-tow-audit-hardening.md) | Weeks 13-14 | Anchor pilot for Pilot Workspace + audit bundle a compliance reviewer can inspect. |
| 8 | [Pilot Workspace L0 (Eight Movements) + Ship Overlay](sprint-8-pilot-workspace-l0-ship-overlay.md) | Weeks 15-16, gated | A business user composes a pilot in 8 movements, ships to L1 in ≤ 75 s with real Langfuse + ElevenLabs + Twilio + Guidewire + Salesforce wiring. |
| 9 | [L2 Sandbox Load](sprint-9-l2-sandbox-load.md) | Weeks 17-18 (post-MVP) | Owner runs N synthetic claims in cohort + drift detector + eval rerun; gates L2→L3 by checklist. |
| 10 | [L3 Canary](sprint-10-l3-canary.md) | Weeks 19-20 (post-MVP) | Owner exposes pilot to live canary cohort with always-visible rollback; gates L3→L4 by checklist. |
| 11 | [L4 Live Ops Polish](sprint-11-l4-live-ops-polish.md) | Weeks 21-22 (post-MVP) | Plateau head operates L4 pilot long-term: KPIs, anomalies, improvement queue, drift, cost ledger, retirement. |
| 12 | [Companion Polish](sprint-12-companion-polish.md) | Weeks 23-24 (post-MVP) | Multimodal upload polish, board-ready deck/memo generators, multilingual companion (FR/EN/ES/DE), full a11y. |
| 13 | [Cockpit Shell: Landing + Sphere + Scenarios](sprint-13-cockpit-shell-landing-scenarios.md) | Weeks 25-26 (post-MVP) | Plateau head opens per-country cockpit with sphere companion, configurable landing bento, and pilot catalog. |
| 14 | [KPI Dashboard + Agent Drill-Down](sprint-14-kpi-dashboard-agent-drilldown.md) | Weeks 27-28 (post-MVP) | Three-pillar governance (Business · Operational · Quality) with per-agent trace drill-down to Langfuse. |
| 15 | [HITL Chat + Decision Packets](sprint-15-hitl-chat-decision-packets.md) | Weeks 29-30 (post-MVP) | Country-level companion chat with HITL decision packets (Approve/Override/Escalate), citation chips, artifact cards. |
| 16 | [External Escalation Adapters + Blueprint Library](sprint-16-external-escalation-adapters.md) | Weeks 31-32 (post-MVP) | Teams/SF/ServiceNow adapters activated; cross-country blueprint library for sharing agents, flows, and data. |

## Cross-sprint demo standards

Every sprint demo includes:

1. **Persona framing** — who uses this?
2. **Happy path** — main user journey.
3. **Failure path** — one meaningful degraded case.
4. **Evidence** — trace, audit row, CI result, load report, or runbook.
5. **Decision ask** — one question the team needs answered before the next sprint.
6. **Options when in doubt** — if a design decision isn't resolvable from evidence, deliver **two working implementations side by side** and let the user pick. Never assume; build to learn.

## Phase tracking

Phase status is tracked in the SQL `todos` table (see `.copilot/session-state/.../plan.md`). Use the standard "ready" query to find the next actionable todo:

```sql
SELECT t.* FROM todos t
WHERE t.status = 'pending'
AND NOT EXISTS (
  SELECT 1 FROM todo_deps td JOIN todos d ON td.depends_on = d.id
  WHERE td.todo_id = t.id AND d.status != 'done'
);
```

## Definition of done (per sprint)

1. All `todos` rows for the sprint are `status='done'`.
2. `supabase migration list --linked` shows local == remote.
3. Railway services for the sprint are `Active` with passing healthchecks.
4. Langfuse shows traces for the new flows.
5. CI green: `pnpm test`, `pnpm lint`, `pnpm typecheck`, `cd gateway && uv run pytest && uv run ruff check && uv run mypy`.
6. `docs/refactor_main_v3.md` updated if scope or interfaces shifted.

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
| 4 | [Pilot + HITL Product Surface](sprint-4-pilot-hitl-product-surface.md) | Weeks 7-8 | Claims operator can create/open a pilot, run a claim, decide HITL, and see audit. |
| 5 | [Ops + Eval Control Loop](sprint-5-ops-eval-control-loop.md) | Weeks 9-10 | Ops/admin can detect degraded quality, latency, and runtime health early. |
| 6 | [Executive Demo + Experimentation](sprint-6-executive-demo-experimentation.md) | Weeks 11-12 | Executive sponsor can open a polished demo, try a synthetic run, see experimentation with rollback. |
| 7 | [Motor-Fleet + Audit Hardening](sprint-7-motor-fleet-audit-hardening.md) | Weeks 13-14 | Platform proves second pilot + produces an audit bundle a compliance reviewer can inspect. |
| 8 | [Scenario Builder + Synthdata Factory](sprint-8-scenario-builder-synthdata-factory.md) | Weeks 15-16, gated | Admin can describe a new synthetic pilot, review a cited plan, build a safe bundle, and deploy to G0. |

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

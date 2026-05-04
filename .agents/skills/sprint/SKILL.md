---
name: sprint
description: Use when the user runs /sprint or asks to convert plans to sprint deliverables, sync Linear issues, generate sprint documentation, or organize the delivery backlog into structured sprints with diagrams and acceptance tests
---

# Sprint Orchestration

Converts `docs/plans/` into structured `docs/sprints/` deliverables, syncs everything to Linear under the Agentic Cockpit project, and updates `docs/architecture.md` to reflect the current delivery target.

## Core principle

One `/sprint` run = one full sync: **audit → plan → generate → publish → clean**. Never skip a phase. Never batch with unrelated changes.

## When to Use

- User runs `/sprint`
- User says "sync sprints to Linear" or "update sprint docs"
- User says "convert plans to sprints" or "organize the backlog"
- User says "create sprint issues" or "update architecture.md with sprint targets"

## Prerequisites

- Linear MCP server authenticated (`mcp__linear__*` tools available)
- `docs/refactor_main_v3.md` exists (canonical PRD)
- `docs/architecture.md` exists (target architecture)
- `docs/plans/` directory exists with at least one plan

## Key References

- **Linear project:** `agentic-cockpit` (ID: `9e704a34-31f3-4011-9b9d-3b4759a8ef75`)
- **Linear team:** AXA GDAI (ID: `b4c393c9-3ca4-4f07-9e11-74589bb9d40b`, key: `AXA`)
- **Milestone:** MVP (ID: `8a67772f-55ea-4bc1-ac66-78241b5fca0a`)
- **Labels:** `Backend`, `Frontend`, `Database`, `API`, `Storage`, `Monitoring`, `Performance`, `Feature`, `Bug`, `Improvement`, `Experimentation`
- **Architecture doc:** `docs/architecture.md`
- **PRD:** `docs/refactor_main_v3.md`
- **Skills directory:** `.agents/skills/`

## Phase 1 — Audit

### 1.1 Read current state

Read these files in parallel:
- `docs/refactor_main_v3.md` — extract sprint list, durations, persona promises, dependencies
- `docs/architecture.md` — note current `§12 Sprint Delivery Timeline`, section count, last-updated date
- `docs/sprints/README.md` — note which sprints already have docs

### 1.2 Scan Linear

```bash
# Get all open issues in the project
mcp__linear__list_issues with project="agentic-cockpit", state filter for non-done statuses
# Also check done/recently completed
mcp__linear__list_issues with project="agentic-cockpit", filter for done/canceled
```

Record:
- Existing issue IDs, titles, statuses, labels, assignees, blocking relationships
- Which sprints already have Linear issues
- Gaps: sprints in `docs/sprints/` with no Linear issue, or Linear issues with no sprint doc

### 1.3 Scan docs/plans

List `docs/plans/` directory. Identify:
- New plans since last `/sprint` run (no corresponding file in `docs/sprints/`)
- Updated plans (plan file newer than sprint file)
- Stale plans (plan file older than sprint file, or marked as processed)

### 1.4 Compute delta

Produce a summary table:

| Sprint | Plan exists? | Sprint doc exists? | Linear issue? | Action |
|--------|-------------|-------------------|---------------|--------|
| S0     | yes         | yes               | no            | Create AXA issue |
| S1     | no          | yes               | AXA-1         | Update from sprint doc |
| ...     |             |                   |               |        |

## Phase 2 — Generate Sprint Documents

For each sprint in `docs/refactor_main_v3.md` that has a plan in `docs/plans/`:

### 2.1 Sprint document template

Create `docs/sprints/sprint-N-slug.md` using this exact structure:

```markdown
# Sprint N — [Title]

**Duration:** [from PRD]
**Persona promise:** [from PRD — one sentence about who can do what after this sprint]
**Depends on:** [previous sprint deliverables]

---

## Why This Sprint Exists

[2-3 sentences: the gap it closes, why now, what depends on it]

---

## Scope Summary

### In Scope

[Organized by subsystem: Web, Gateway, DB, Observability, CI, etc.]

### Out of Scope

[What's explicitly deferred to later sprints]

---

## Implementation Diagram

```mermaid
[Architecture-aligned diagram — see §Diagram Conventions below]
```

---

## Technical Implementation

[Per-subsystem implementation details with file paths]

---

## Skills & MCP Servers

| Skill | Purpose |
|-------|---------|
| `skill-name` | What it guides |

| MCP Server | Purpose |
|-----------|---------|
| `server-name` | What it provides |

---

## Testing Plan

### Unit Tests
### Integration Tests
### Contract Tests
### Failure Tests
### Performance Tests (if applicable)

---

## Acceptance Criteria

| ID | Criterion | Measurable outcome |
|----|-----------|-------------------|
| AC-N-01 | ... | ... |

---

## Sprint Review / Demo

### Demo script

1. **Persona framing** — who uses this?
2. **Happy path** — main user journey step by step
3. **Failure path** — one meaningful degraded case
4. **Evidence** — trace, audit row, CI result, or health check
5. **Decision ask** — one question the team needs answered

### Approach options (if applicable)

If a design decision has multiple valid approaches, deliver **two working implementations side by side** and let the user pick.

---

## Definition of Done

1. All todos for sprint are `done`
2. `supabase migration list --linked` shows local == remote
3. Railway services for sprint are `Active` with passing healthchecks
4. Langfuse shows traces for new flows
5. CI green: `pnpm test && pnpm lint && pnpm typecheck && cd gateway && uv run pytest && uv run ruff check && uv run mypy`
6. `docs/refactor_main_v3.md` updated if scope shifted

---

## Deferred Items

| Item | Deferred to | Reason |
|------|------------|--------|

---

## References

- [PRD §N](../refactor_main_v3.md#section-N)
- [Architecture §12](../architecture.md#12-sprint-delivery-timeline)
- [Skill: name](../../.agents/skills/name/SKILL.md)
```

### 2.2 Diagram conventions

Every sprint diagram must:
- Use the same subsystem boundaries as `docs/architecture.md` (Web tier, Gateway tier, Data tier, External services)
- Use `flowchart` for implementation flows, `C4Context`/`C4Container` only if extending architecture-level views
- Use `sequenceDiagram` for multi-party interactions (HITL, callbacks)
- Label edges with protocol + direction (e.g., `HTTP/private`, `OTLP/HTTP`, `HMAC-signed HTTPS`)
- Color-code: new components in green (`#10b981`), modified in amber (`#f59e0b`), existing in gray (`#6b7280`)
- Include a legend node when using color coding

### 2.3 Skill & MCP server mapping

Map each sprint to relevant skills from `.agents/skills/`:

| Sprint focus | Relevant skills |
|-------------|----------------|
| Gateway / backend | `agentic-cockpit`, `supabase`, `otel`, `langfuse` |
| Frontend / UI | `frontend-design`, `agentic-cockpit`, `posthog` |
| Langflow / orchestration | `langflow/runtime`, `langflow/flows-api`, `langflow/hitl-resume`, `langflow/custom-components` |
| n8n / tools | `n8n/*` skills |
| Deployment / infra | `railway`, `supabase` |
| HITL / Chatwoot | `chatwoot`, `agentic-cockpit` |
| Observability | `otel`, `langfuse`, `posthog` |
| Experiments | `experimentation` |

Map MCP servers similarly:
- `supabase` — migrations, schema queries, RLS
- `Railway` — deploys, logs, service status
- `n8n` — workflow execution
- `n8n-mcp` — workflow editing/validation
- `langflow` — flow triggering, tools manifest
- `linear` — issue management

### 2.4 Demo acceptance test

Every sprint must include a concrete demo script the user can follow. Format:

```
## Sprint Review / Demo

### Setup (before demo)
- [ ] Prerequisite 1
- [ ] Prerequisite 2

### Demo flow (~5-10 minutes)
1. **Context** (30s): [what the audience sees]
2. **Action** (2-3m): [step-by-step user actions with expected outcomes]
3. **Evidence** (1m): [trace/audit/CI output to show]
4. **Failure demo** (1m): [trigger one failure, show how it surfaces]

### Decision required
[One clear question for the team. If multiple approaches are viable, show both.]
```

## Phase 3 — Update architecture.md

### 3.1 Update sprint timeline (§12)

In `docs/architecture.md`, locate `## 12. Sprint Delivery Timeline`. Update the Gantt chart or table to reflect:
- Completed sprints marked with checkmark or `[done]`
- Current sprint marked with `[active]`
- Any date/sprint mapping changes from the PRD

### 3.2 Add target annotation

At the top of `docs/architecture.md`, ensure the status line reads:
```
> **Status:** Target architecture as of YYYY-MM-DD. Reflects `docs/refactor_main_v3.md` v3.
> **Current sprint:** Sprint N — [Title] (active)
> **Next sprint:** Sprint N+1 — [Title] (planned)
```

### 3.3 Cross-reference new sprints

If new sprint docs were created, add links to them from the appropriate architecture section.

## Phase 4 — Sync to Linear

### 4.1 Critical rules (learned the hard way)

**These rules prevent issues from being invisible or orphaned. All are mandatory.**

1. **Always use the project UUID, not the name.** `"project": "9e704a34-31f3-4011-9b9d-3b4759a8ef75"` — the name `"agentic-cockpit"` silently fails. The project ID is the only reliable value.
2. **Always include `"state": "Todo"`** when creating issues. Without it, issues default to "Backlog" status and are hidden from the default Linear project view.
3. **Always set `"milestone": "MVP"`** on every issue. The milestone ID is `8a67772f-55ea-4bc1-ac66-78241b5fca0a`.
4. **Always include `"team": "AXA GDAI"`** (team ID: `b4c393c9-3ca4-4f07-9e11-74589bb9d40b`).
5. **Verify after creation.** After creating/updating issues, call `mcp__linear__get_issue` on at least one issue to confirm `project`, `projectMilestone`, and `status` fields are present in the response. If missing, re-apply with the UUID values.
6. **Use separate `save_issue` calls for content vs. metadata.** Create the issue with title + description first, then do a follow-up call with only `id`, `project` (UUID), and `milestone` to ensure metadata sticks.

### 4.2 Label assignment rules

Assign labels based on sprint content:

| Sprint contains | Labels to apply |
|----------------|-----------------|
| Gateway / Python code | `Backend`, `API` |
| Next.js / UI components | `Frontend` |
| Database migrations | `Database` |
| File storage / buckets | `Storage` |
| Observability / tracing | `Monitoring` |
| Performance / load testing | `Performance` |
| New capability | `Feature` |
| Refactoring / hardening | `Improvement` |
| Bug fixes | `Bug` |

### 4.3 Create sprint issues

**If the sprint has both frontend (UI surfaces) AND backend (gateway/DB) deliverables, create TWO sibling issues, not one.**

Signals that a sprint must be split:
- Sprint doc has sections for both `app/` / `components/` AND `gateway/` / `db/`
- Scope includes both visual surfaces (dashboard, scenario view, HITL queue) AND API endpoints / migrations
- The sprint doc's Acceptance Criteria mix visual ACs ("user sees...") with functional ACs ("gateway returns...")

**Two-issue pattern:**

```
AXA-N   [Frontend] Sprint N — <slug>    labels: Frontend
  blocks →
AXA-N+1 [Backend]  Sprint N — <slug>    labels: Backend, API (or Database, etc.)
```

- Frontend issue is created first and **blocks** the backend issue.
- The frontend branch (`deliver/frontend/axa-N-slug`) is delivered first, validated by `designqa-reviewer`, merged.
- Only then does the backend branch (`deliver/backend/axa-N+1-slug`) open for wiring and `qa-reviewer` review.
- The backend QA issue body includes a gate note referencing the frontend DesignQA issue.

**Frontend issue title prefix:** `[Frontend] Sprint N — <title>`
**Backend issue title prefix:** `[Backend] Sprint N — <title>`
**Blocking relationship:** set `blocks: ["AXA-<backend-id>"]` on the frontend issue.

If the sprint is backend-only or frontend-only, create a single issue with the appropriate label (no prefix needed).

**Step 1 — Create frontend issue (if mixed sprint):**

```json
{
  "title": "[Frontend] Sprint N — [Title]",
  "description": "[Full sprint doc — Frontend scope only: UI surfaces, design tokens, component files, designqa acceptance criteria]",
  "team": "AXA GDAI",
  "project": "9e704a34-31f3-4011-9b9d-3b4759a8ef75",
  "state": "Todo",
  "priority": 2,
  "labels": ["Frontend", "Feature"]
}
```

**Step 2 — Create backend issue (if mixed sprint):**

```json
{
  "title": "[Backend] Sprint N — [Title]",
  "description": "[Full sprint doc — Backend scope only: gateway, DB, API wiring, functional integration, QA checklist including 'Frontend DesignQA (AXA-N) must be Done before this branch merges']",
  "team": "AXA GDAI",
  "project": "9e704a34-31f3-4011-9b9d-3b4759a8ef75",
  "state": "Todo",
  "priority": 2,
  "labels": ["Backend", "API"]
}
```

**Step 3 — Link frontend blocks backend:**

```json
{
  "id": "AXA-<frontend-id>",
  "blocks": ["AXA-<backend-id>"]
}
```

**Step 4 — Ensure metadata sticks (separate call for each issue):**

```json
{
  "id": "AXA-<N>",
  "project": "9e704a34-31f3-4011-9b9d-3b4759a8ef75",
  "milestone": "MVP"
}
```

**Step 5 — Verify:**

Call `mcp__linear__get_issue` on both issues. Confirm the response includes:
- `"project": "Agentic Cockpit"` and `"projectId": "9e704a34-..."`
- `"projectMilestone": {"id": "8a67772f-...", "name": "MVP"}`
- `"status": "Todo"` and `"statusType": "unstarted"`

### 4.4 Mermaid diagrams in descriptions

Linear renders mermaid diagrams from ````mermaid` code blocks in Markdown descriptions. Every sprint issue must include its implementation diagram extracted from the corresponding `docs/sprints/sprint-N-*.md` file.

**Extraction:** Read the sprint doc, find the `## Implementation Diagram` section, and copy the entire ````mermaid ... ```` block verbatim into the issue description between the Scope and Skills sections.

Linear editor reference: use `/diagram` slash command or paste a code block starting with ````mermaid`. See https://linear.app/docs/editor for formatting.

### 4.6 Experimentation prerequisites

If a sprint requires experimentation BEFORE implementation, create a separate blocking issue:

**Step 1 — Create experiment issue:**

```json
{
  "title": "Sprint N — Prerequisite — Experimentation: [topic]",
  "description": "[What needs experimentation, approaches to test, success criteria, output format]",
  "team": "AXA GDAI",
  "project": "9e704a34-31f3-4011-9b9d-3b4759a8ef75",
  "state": "Todo",
  "priority": 1,
  "labels": ["Experimentation"],
  "blocks": ["AXA-<main-sprint-id>"]
}
```

**Step 2 — Update main sprint to be blocked:**

```json
{
  "id": "AXA-<main-sprint-id>",
  "blockedBy": ["AXA-<experiment-id>"]
}
```

**Step 3 — Verify metadata on experiment issue:**

```json
{
  "id": "AXA-<experiment-id>",
  "project": "9e704a34-31f3-4011-9b9d-3b4759a8ef75",
  "milestone": "MVP"
}
```

Criteria for creating experimentation prerequisites:
- The sprint doc lists multiple approach options for a design decision
- The PRD flags an unresolved technical question
- A new integration/pattern hasn't been proven in this codebase yet
- The user explicitly asked for alternatives to evaluate

### 4.7 Update existing issues

For sprints that already have Linear issues, update them with `mcp__linear__save_issue` using the `id` field. Always:
- Refresh the description with the latest sprint doc content (including mermaid diagram)
- Update labels if scope changed
- Adjust blocking relationships if dependencies shifted
- Preserve existing assignee unless explicitly changing
- Follow up with a metadata-only call to ensure project/milestone are set

### 4.8 Link dependent issues

Dependency chain: S0 → S1 → S2 → S3 → S4 → S5 → S6 → S7 → S8

For each sprint N, set `blocks: ["AXA-<N+1>"]` so Sprint N blocks Sprint N+1. Experimentation issues block their parent sprint.

Use `mcp__linear__save_issue` with `blocks` array. The `blocks` field is append-only — existing relationships are preserved.

## Phase 5 — Cleanup

### 5.1 Move processed plans

For each plan in `docs/plans/` that was converted to a sprint doc:
1. Verify the sprint doc exists in `docs/sprints/`
2. Verify the Linear issue was created/updated
3. Move the plan file to `docs/sprints/` (it's now the canonical sprint doc)
4. If the plan added value beyond what's in the sprint doc, merge that content first, then remove the plan

### 5.2 Update sprint index

Update `docs/sprints/README.md`:
- Add entries for new sprints
- Update status columns (planned → active → done)
- Update the summary table

### 5.3 Verify clean state

After cleanup, `docs/plans/` should contain only:
- Plans not yet converted to sprints
- Plans intentionally kept as reference (documented in a `README.md` in `docs/plans/`)

If `docs/plans/` is empty after cleanup, that's the ideal end state — everything is in `docs/sprints/`.

## Phase 6 — Report

Output a summary table:

| Sprint | Doc | Linear Issue | Labels | Blocks | Status |
|--------|-----|-------------|--------|--------|--------|
| S0 | sprint-0-repo-recovery.md | AXA-3 | Feature, Backend | AXA-4 | Created |
| S1 | sprint-1-foundation-trust-boundary.md | AXA-1 | Feature, Backend, API | AXA-5 | Updated |
| ... | ... | ... | ... | ... | ... |

Followed by:
- Count of issues created, updated, and unchanged
- Any experimentation prerequisites created
- Link to the Linear project view
- Any warnings (missing plans, unresolvable dependencies)

## Quick Reference

### Linear MCP tools used

| Tool | Phase |
|------|-------|
| `mcp__linear__list_issues` | Audit |
| `mcp__linear__get_issue` | Audit (for specific issues) |
| `mcp__linear__save_issue` | Sync (create + update) |
| `mcp__linear__list_issue_labels` | Audit (verify labels exist) |
| `mcp__linear__get_project` | Audit (verify project state) |

### File paths

| Path | Purpose |
|------|---------|
| `docs/refactor_main_v3.md` | Canonical PRD, sprint definitions |
| `docs/architecture.md` | Target architecture, timeline |
| `docs/plans/` | Input plans (consumed by /sprint) |
| `docs/sprints/` | Output sprint docs (generated by /sprint) |
| `docs/sprints/README.md` | Sprint index |
| `.agents/skills/` | Available skills for mapping |

## Common Mistakes

- **Creating sprint issues without reading the PRD first** — sprint scope must match `docs/refactor_main_v3.md`, not assumptions
- **Skipping the architecture.md update** — timeline must stay in sync
- **Wrong label format** — Linear labels are names like `Backend` not `backend` or `back-end`
- **Missing blocking relationships** — if Sprint N+1 depends on Sprint N, the Linear issues must reflect it
- **Sprint doc and Linear issue divergence** — the Linear description IS the sprint doc content; don't maintain two versions
- **Not creating experimentation issues** — if a sprint has unresolved design decisions, create a blocking prerequisite
- **Leaving stale plans in docs/plans** — always move or remove after conversion

---
name: deliver
description: Use when the user runs /deliver or asks to deliver a sprint, implement a sprint issue, or execute a named sprint from the backlog — takes a Linear issue ID and drives the full delivery lifecycle from review through implementation to review-ready completion
---

# Sprint Delivery Orchestration

Takes a sprint issue from Linear, reviews dependencies, creates a git branch, produces an architecture-aligned implementation plan, delivers the work, and moves the issue to review with a completion report.

## Core principle

`/deliver AXA-N` = full lifecycle: **review → branch → plan → implement → verify → report**. Never skip a phase. Never deliver without a plan written and approved.

## MANDATORY: Always run the formal lifecycle

**Any request to "deliver", "implement", "build", or "execute" a plan or feature MUST go through this full lifecycle. No exceptions.**

If the user points at a plan doc, feature, or design — and there is no Linear issue ID yet — you MUST:
1. Run the `sprint` skill first to convert the plan into Linear issues + sprint docs.
2. Then run this `deliver` skill on the resulting `AXA-N` issue ID.

Never implement work directly without a Linear issue, a sprint doc, and a git branch. If you skip any of these, you are not delivering — you are hacking.

**Trigger phrases that ALWAYS require this full lifecycle:**
- "deliver X"
- "implement X"  
- "build X"
- "execute the plan for X"
- "test and deliver X"
- "create X" (when X is a feature, sprint, or plan)

## Prerequisites

- Linear MCP server authenticated
- Architecture doc at `docs/architecture.md` (single source of truth)
- Sprint doc in `docs/sprints/sprint-N-*.md`
- Linear issue in the Agentic Cockpit project

## Key References

- **Linear project UUID:** `9e704a34-31f3-4011-9b9d-3b4759a8ef75`
- **Team:** AXA GDAI (ID: `b4c393c9-3ca4-4f07-9e11-74589bb9d40b`)
- **MVP milestone ID:** `8a67772f-55ea-4bc1-ac66-78241b5fca0a`
- **Statuses:** Todo (`unstarted`) → In Progress (`started`) → In Review (`started`) → Done (`completed`)
- **Architecture doc:** `docs/architecture.md` — the **single source of truth** for all technical decisions
- **PRD:** `docs/refactor_main_v3.md`

## Phase 1 — Review

### 1.1 Read the Linear issue

```bash
mcp__linear__get_issue with id="AXA-N", includeRelations=true
mcp__linear__list_comments with issueId="AXA-N"
```

Record:
- Issue title, description, labels, assignee
- Status and milestone
- All comments (decisions, questions, clarifications)
- Blocking relationships: what blocks this issue, what this issue blocks

### 1.2 Validate dependencies

Check every issue in `blockedBy`:

```bash
# For each blocking issue
mcp__linear__get_issue with id="AXA-<blocker>"
```

**Gate:** If ANY blocking issue is not in `Done` status, STOP and report:
```
Cannot deliver AXA-N. Blocked by:
- AXA-X: [title] — status: [current status] (needs: Done)
Deliver blocking issues first, or confirm override.
```

Do NOT proceed past this gate without explicit user override.

### 1.3 Read the sprint doc

Find and read the corresponding `docs/sprints/sprint-N-*.md` file. Cross-reference:
- Does the Linear issue description match the sprint doc? If not, note discrepancies.
- Are there comments on the Linear issue that should be incorporated into the sprint doc?

Update the sprint doc if Linear has newer information (comments with decisions, scope changes).

## Phase 2 — Elevate Architecture Authority

Before any implementation, update `CLAUDE.md` and `.github/copilot-instructions.md` to establish `docs/architecture.md` as the single source of truth.

### 2.1 Update CLAUDE.md

Ensure the architecture section states clearly:

```markdown
## Architecture authority

`docs/architecture.md` is the **single source of truth** for all technical decisions, component boundaries, data flow, and deployment topology. When any implementation question arises:
1. `docs/architecture.md` has priority over all other documents
2. If architecture.md is silent, consult `docs/refactor_main_v3.md`
3. If both are silent, default to the conservative option matching locked Q-decisions
```

### 2.2 Update copilot-instructions.md

Add at the top of the file, after the title:

```markdown
> **ARCHITECTURE AUTHORITY:** [`docs/architecture.md`](../docs/architecture.md) is the single source of truth. When in doubt, architecture.md has priority over all other documents, habits, or conventions.
```

## Phase 3 — Create Implementation Plan

### 3.1 Load planning skills

**REQUIRED:** Use `superpowers:writing-plans` to structure the plan. The plan must reference `docs/architecture.md` for all architectural decisions.

### 3.2 Plan structure

The plan file at `docs/sprints/ongoing/sprint-N-plan.md` must contain:

```markdown
# Sprint N — [Title] — Implementation Plan

**Created:** YYYY-MM-DD
**Issue:** [AXA-N](https://linear.app/venture-clienting-axa/issue/AXA-N/...)
**Branch:** deliver/sprint-N-slug
**Architecture ref:** [docs/architecture.md](../../architecture.md)

## Architecture compliance checklist

- [ ] Component boundaries match architecture.md §2 (Container Diagram)
- [ ] Data flow follows architecture.md §6 (Happy Path) or §7 (HITL)
- [ ] Gateway is the trust boundary — no direct Supabase/LLM calls from web tier
- [ ] Wire format: JSON bodies, ISO-8601 timestamps, UUIDv4 IDs
- [ ] State machine transitions match architecture.md §5
- [ ] New services registered in architecture.md §4 (Railway topology) if applicable
- [ ] Observability: OTel spans, Langfuse traces, PII redaction per architecture.md §8

## Implementation steps

[Numbered, ordered steps. Each step references the specific architecture.md section it implements.]

## Files to create/modify

| File | Action | Architecture ref |
|------|--------|-----------------|
| ... | create/modify | §N |

## Testing plan

[Per the sprint doc's testing plan + architecture verification]

## Rollback plan

[How to revert if this sprint fails acceptance]
```

### 3.3 Architecture gate

Before writing ANY code, verify:
1. The plan's component boundaries match `docs/architecture.md` §2
2. No new service is introduced without being registered in `docs/architecture.md` §4
3. All data flows pass through the gateway (architecture.md §6 trust boundary)
4. The state machine in architecture.md §5 is respected

If the plan conflicts with architecture.md, the plan is wrong. Fix the plan, not the architecture.

## Phase 4 — Branch and Track

### 4.1 Initialize git if needed

```bash
# Check if repo is a git repo
git rev-parse --git-dir 2>/dev/null || git init
```

### 4.2 Create delivery branch

```bash
git checkout -b deliver/sprint-N-slug
```

Branch naming: `deliver/sprint-N-<slug>` where slug is lowercase-hyphenated from the sprint title.

### 4.3 Update Linear status

Move the issue to "In Progress":

```json
{
  "id": "AXA-N",
  "state": "In Progress"
}
```

### 4.4 Move sprint doc

```bash
mv docs/sprints/sprint-N-*.md docs/sprints/ongoing/
```

The plan file also lives in `docs/sprints/ongoing/`.

## Phase 5 — Implement

### 5.1 Follow the plan

Execute implementation steps in order. After each step:
- Verify against the architecture compliance checklist
- Run relevant tests

### 5.2 Commit strategy

One commit per logical step. Commit messages reference the architecture section:
```
feat(sprint-N): [what was done]

Implements §[section] of architecture.md for Sprint N delivery.
Ref: AXA-N
```

### 5.3 Continuous verification

After every file change:
- TypeScript: `pnpm typecheck`
- Python: `cd gateway && uv run ruff check && uv run mypy`
- Tests: `pnpm test` / `cd gateway && uv run pytest`

## Phase 6 — Verify

### 6.1 Architecture compliance review

Run through the architecture compliance checklist from the plan. Every item must be checked.

### 6.2 Run the sprint's demo script

Execute the demo script from the sprint doc step by step. Record what passes and what fails.

### 6.3 Run the sprint's acceptance criteria

Check every AC from the sprint doc. Record results.

### 6.4 Verify definition of done

Per CLAUDE.md and the sprint doc:
1. All todos for sprint are `done`
2. `supabase migration list --linked` shows local == remote
3. Railway services for sprint are `Active` with passing healthchecks
4. Langfuse shows traces for new flows
5. CI green: `pnpm test && pnpm lint && pnpm typecheck && cd gateway && uv run pytest && uv run ruff check && uv run mypy`

## Phase 7 — Complete

### 7.1 Move to In Review

```json
{
  "id": "AXA-N",
  "state": "In Review"
}
```

### 7.2 Post completion comment

Post a comment on the Linear issue using `mcp__linear__save_comment`:

```markdown
## Sprint Delivery Complete — Ready for Review

### Decisions taken during delivery
[List each decision the user made during implementation, with rationale]

### Step-by-step test instructions
[Numbered steps with exact URLs, curl commands, or UI paths to verify each acceptance criterion]

### Evidence
- [Link to trace, audit row, CI run, or screenshot]

### Proposed enhancements
[Items that would improve quality but were out of scope for this sprint:
1. Enhancement — why it would help, estimated effort
2. ...]
```

### 7.3 Move sprint doc to delivered

```bash
mv docs/sprints/ongoing/sprint-N-*.md docs/sprints/delivered/
```

### 7.4 Update architecture.md

If any architectural decisions were made during delivery, update `docs/architecture.md` accordingly. At minimum, update the status header:

```markdown
> **Current sprint:** Sprint N+1 — [Title] (active)
> **Last completed:** Sprint N — [Title] (delivered YYYY-MM-DD)
```

## Quick Reference

### Linear MCP tools used

| Tool | Phase |
|------|-------|
| `mcp__linear__get_issue` | Review, Verify deps |
| `mcp__linear__list_comments` | Review |
| `mcp__linear__save_issue` | Track (status), Complete |
| `mcp__linear__save_comment` | Complete |

### File paths

| Path | Purpose |
|------|---------|
| `docs/architecture.md` | Single source of truth |
| `docs/sprints/sprint-N-*.md` | Sprint doc (input) |
| `docs/sprints/ongoing/` | Active sprint docs + plans |
| `docs/sprints/delivered/` | Completed sprint docs |
| `CLAUDE.md` | Updated with architecture authority |
| `.github/copilot-instructions.md` | Updated with architecture authority |

### Git branches

| Pattern | Purpose |
|---------|---------|
| `deliver/sprint-N-slug` | Active delivery branch |

## Common Mistakes

- **Proceeding with blocked dependencies** — always check blockedBy and confirm with user before overriding
- **Writing code before the plan** — the plan must exist and reference architecture.md sections
- **Skipping architecture compliance checklist** — every file change must be checked against architecture.md
- **Not updating Linear status** — the issue must move: Todo → In Progress → In Review
- **Not posting a completion comment** — the reviewer needs test steps, decisions, and enhancement proposals
- **Introducing new services without architecture.md registration** — all services must be in architecture.md §4
- **Direct Supabase/LLM calls from web tier** — everything goes through the gateway per architecture.md §6

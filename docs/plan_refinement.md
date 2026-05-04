# Plan Refinement Process — From v3 to Production-Ready Sprints

> **Goal:** Validate every claim, close every gap, and produce sprint-ready implementation documents before a single line of code is written.
> **Principle:** Quality over speed. Token cost and wall-clock time are not constraints. Completeness is.

---

## 0. What we have now

| Document | Status | Role |
|---|---|---|
| `docs/refactor_main_v3.md` (v2) | Canonical reference — component specs, flow diagrams, checklists | Source of truth for what to build |
| `docs/refactor_main_v3.md` (v3) | Enhancement overlay — 31 findings, 6 domain audits, sprint restructure | Documents what v2 missed |
| `docs/refactor.md` | Original architecture critique — v1 PRD | Historical context, problem framing |
| `docs/property-fast-track.md` | ?? (just opened by user — need to verify exists and read) | Pilot spec |
| `delete/` directory | Old Next.js prototype code | Restoration source |
| `db/migrations/0001–0008` | Applied Supabase migrations | Schema reference |

**What's missing before we can start coding:**
- No per-sprint detailed task breakdown
- No API contract documents (OpenAPI/JSON Schema)
- No component spec documents (props, states, a11y)
- No database schema validation report
- No Langflow flow validation (does `property-fast-track.json` exist?)
- No infrastructure-as-code validated against Railway
- No test plan per sprint
- Source docs referenced by v2 not all verified to exist

---

## 1. Tools available for refinement

### Ralph Loop — iterative fixer

```
/ralph-loop "<prompt>" --completion-promise "<PROMISE>" --max-iterations <N>
```

**Best for:** Well-defined tasks with measurable success criteria where each iteration improves on the last by reading its own prior output in files.

**Use in refinement:** Phase 4 — after all issues are catalogued, ralph-loop iteratively fixes each category until a validator passes.

### Parallel sub-agents — diverse perspective review

Launch 6–10 agents simultaneously, each auditing a specific domain with a specialized prompt. Already used in v3 review. Will use again for deeper domain dives.

### Specialized skills — domain expertise

| Skill | Refinement role |
|---|---|
| `security-review` | Full security audit of all planned endpoints, flows, data stores |
| `superpowers:systematic-debugging` | Trace critical paths for failure modes |
| `superpowers:brainstorming` | Explore alternative designs for high-risk components |
| `agentic-cockpit` | Validate against repo conventions |
| `langflow/runtime` | Validate Langflow 1.9 claims in the plan |
| `langflow/flows-api` | Validate flow API usage patterns |
| `langflow/hitl-resume` | Validate WaitForResume durability design |
| `n8n/n8n-mcp-tools-expert` | Validate MCP router patterns |
| `n8n/n8n-workflow-patterns` | Validate n8n workflow designs |
| `n8n/n8n-validation-expert` | Validate n8n JSON exports |
| `supabase` | Validate schema, RLS, migrations |
| `railway` | Validate Railway template and service configs |
| `langfuse` | Validate tracing and eval design |
| `posthog` | Validate feature flag and experiment design |
| `chatwoot` | Validate HITL handover bridge |
| `otel` | Validate OTel collector config and PII redaction |

### MCP servers — live validation

| MCP Server | Refinement role |
|---|---|
| **n8n** | Verify actual MCP tool signatures match plan assumptions |
| **n8n-mcp** | Validate workflow JSON against n8n schema |
| **Railway** | Validate service template, check current workspace state |
| **supabase** | Query actual schema, verify migrations applied, test RLS |
| **langflow** | Verify runtime is reachable, check existing flows |
| **context7** | Pull latest docs for Langflow, n8n, Railway, Supabase, Next.js |

---

## 2. The 7-phase refinement process

### Phase 1 — Source Document Audit (est. 1–2 hours)

**Goal:** Verify every document, file, and external resource referenced by the plan actually exists and is consistent with the plan's claims.

**Method:** Parallel file checks + MCP queries.

**Checklist:**

| # | Check | Method |
|---|---|---|
| 1.1 | `docs/property-fast-track.md` exists and content matches plan §4 assumptions | Read file |
| 1.2 | `docs/architecture.md` exists (referenced in v2 header) | Read file |
| 1.3 | `docs/railway-template.md` exists (referenced in v2 header) | Read file |
| 1.4 | `delete/` directory structure matches what v2 expects to restore | List + compare against v2 Appendix A |
| 1.5 | All 8 migrations in `db/migrations/` are valid SQL and idempotent | `supabase migration list --linked` |
| 1.6 | `flows/property-fast-track.json` exists (or verify it doesn't — S2 deliverable) | File check |
| 1.7 | `infra/railway.json` exists (or verify it doesn't — S1 deliverable) | File check |
| 1.8 | Experiment artifacts (`experiments/2026-05-03-s14-s15-refinement/`) are complete and reproducible | Run `run_v2.py` if API key available |
| 1.9 | `delete/package.json` dependencies match v2 assumptions (Next.js 16, React 19) | Read and compare |
| 1.10 | `.env.local` has required keys for all services | Check against v2 §9.1 template vars |

**Output:** `docs/audit/source-audit.md` — table of every reference with status (✓ exists / ✗ missing / ⚠ partial).

---

### Phase 2 — Domain Deep-Dives (est. 3–4 hours)

**Goal:** 10 specialized agents audit the plan against domain expertise, external docs, live MCP servers, and industry best practices. Each produces a structured findings report.

**Method:** Launch all 10 agents in parallel. Each agent gets:
- The relevant section of v2 (the canonical spec)
- The v3 findings relevant to their domain
- Access to relevant MCP servers for live validation
- A structured output template

**The 10 deep-dive agents:**

| # | Domain | Agent prompt focus | MCPs used | Skills loaded |
|---|---|---|---|---|
| **D1** | Langflow flow design | Validate the 8-node property-fast-track graph. Is every MCP tool name real? Is every edge correct? Are error edges complete? Is the WaitForResume pattern compatible with Langflow 1.9's actual API? | langflow, n8n | `langflow/runtime`, `langflow/flows-api`, `langflow/hitl-resume` |
| **D2** | n8n MCP router audit | For every MCP tool referenced in the plan (claim.get, weather.lookup, reserve.set, claim.update, activity.append, hitl.create, evidence.add, vendor.search, vendor.scorecard, vendor.book), verify the actual tool signature on the live n8n instance. Document any mismatch. | n8n, n8n-mcp | `n8n/n8n-mcp-tools-expert`, `n8n/n8n-validation-expert` |
| **D3** | Database schema validation | Every table in the plan must have a matching migration. Every column referenced in code examples must exist. Every constraint must be enforced. Foreign keys must be complete. Indexes must cover query patterns. | supabase | `supabase` |
| **D4** | API contract design | Every endpoint referenced in the plan (gateway routes, Next.js API routes, Langflow endpoints, n8n webhooks) must be documented with: method, path, request schema, response schema, error codes, auth requirements. Missing endpoints must be identified. | — | `agentic-cockpit` |
| **D5** | Infrastructure-as-code validation | The Railway service inventory (§7.1) must be complete. Every service needs: image/tag, port, healthcheck path, volume mounts, env vars with sources. Missing config for any service = gap. | Railway | `railway` |
| **D6** | Security threat model | STRIDE-per-service threat model. For each of the 14 services: Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation of privilege. | — | `security-review` |
| **D7** | Observability trace | For every critical path (run creation, MCP call, HITL decision, cutover, eval), trace the full span tree. Verify every span has a parent. Verify PII redaction covers every span type. Verify Langfuse export path is complete. | — | `otel`, `langfuse` |
| **D8** | UI component completeness | For every component in the v2 inventory (§5.3), verify: props interface is complete, loading/empty/error states are specified, a11y requirements are met, Storybook story is planned, visual regression test covers it. | — | `frontend-design:frontend-design` |
| **D9** | Builder feasibility re-assessment | With the v3 fixes applied, re-assess the Scenario Builder (S7→S8) against the experiment data. Can the Build phase actually work? What's the minimum viable validation gate? Is the NIM fallback credible? | context7 | `superpowers:brainstorming` |
| **D10** | Cross-cutting dependency map | Map every dependency between sprints, services, and components. Identify: (a) what blocks what, (b) what can be parallelized, (c) what has no owner, (d) circular dependencies. Output a DOT graph + critical path analysis. | — | `superpowers:brainstorming` |

**Output per agent:** Standardized findings file in `docs/audit/domain-<D#>-<name>.md` with schema:
```markdown
# Domain Audit: <name>
## Summary (<100 words)
## Findings (table: id, severity, description, v2 section, v3 coverage, recommendation)
## Validated claims (things the plan gets right)
## MCP validation results (if applicable)
## Recommended sprint changes
```

---

### Phase 3 — Cross-Cutting Analysis (est. 1–2 hours)

**Goal:** After all domain audits complete, run 3 synthesis agents that read ALL 10 domain reports and find patterns, contradictions, and emergent risks that no single domain audit would catch.

**Method:** Each synthesis agent reads all domain reports + v2 + v3.

| # | Synthesis | Prompt focus |
|---|---|---|
| **S1** | Contradiction detector | Find places where two domain reports contradict each other (e.g., D1 says a tool signature is `X` but D2 says it's `Y`; D3 says a column exists but D4's endpoint doesn't use it). |
| **S2** | Gap aggregator | Merge all findings into a single prioritized backlog. De-duplicate. Assign severity (BLOCKING / CRITICAL / HIGH / MEDIUM / LOW). Map each gap to the sprint that must address it. |
| **S3** | Risk reassessment | With all findings in view, re-score the risk register. Are there new HIGH-LIKELIHOOD risks that neither v2 nor v3 caught? Are any v3 mitigations invalidated by domain findings? |

**Output:** 
- `docs/audit/contradictions.md` — conflicts between domain reports
- `docs/audit/gap-backlog.md` — single prioritized list of all gaps with sprint assignments
- `docs/audit/risk-register-v4.md` — updated risk register

---

### Phase 4 — Ralph-Loop Iterative Fixing (est. 2–4 hours)

**Goal:** Take the gap backlog from Phase 3 and fix every issue through iterative refinement. Each ralph-loop session targets one category of gap with a clear completion promise.

**Method:** Run separate ralph-loop sessions for each gap category. Each session:
1. Receives the gap list for its category
2. Edits the relevant plan document to fix gaps
3. Validates the fix
4. Exits with a completion promise when all gaps in its category are closed

**Ralph-loop sessions:**

| Loop | Gap category | Prompt | Completion promise | Max iterations |
|---|---|---|---|---|
| **L1** | Schema & migrations | "Fix all schema gaps in gap-backlog.md. For each gap, write the exact DDL. Validate against supabase MCP. When all schema gaps are closed, output <promise>SCHEMA FIXED</promise>" | `SCHEMA FIXED` | 15 |
| **L2** | API contracts | "For every endpoint gap in gap-backlog.md, write the OpenAPI 3.0 spec fragment. Validate request/response schemas are complete. When all API gaps are closed, output <promise>API CONTRACTS FIXED</promise>" | `API CONTRACTS FIXED` | 15 |
| **L3** | Infrastructure config | "Fix all Railway/infra gaps in gap-backlog.md. For each service, produce the exact Railway service config. Validate healthchecks, env vars, volumes. When all infra gaps are closed, output <promise>INFRA FIXED</promise>" | `INFRA FIXED` | 15 |
| **L4** | Security hardening | "Fix all security gaps in gap-backlog.md. Write exact middleware, CSP headers, IAM rules, scan configs. When all security gaps are closed, output <promise>SECURITY FIXED</promise>" | `SECURITY FIXED` | 15 |
| **L5** | UI component specs | "Fix all UI/UX gaps in gap-backlog.md. For each component, write the complete props interface, states, a11y requirements. When all UI gaps are closed, output <promise>UI FIXED</promise>" | `UI FIXED` | 15 |
| **L6** | Test plan | "Fix all testing gaps in gap-backlog.md. Write test cases per sprint with exact assertions. When all testing gaps are closed, output <promise>TESTS FIXED</promise>" | `TESTS FIXED` | 15 |
| **L7** | MCP & agent reliability | "Fix all MCP wiring and agent orchestration gaps. Write retry configs, circuit breaker params, timeout hierarchy. When all agent gaps are closed, output <promise>AGENT FIXED</promise>" | `AGENT FIXED` | 15 |

**How ralph-loop helps here:** Each loop session sees its own previous fixes in the files. If a fix introduces a new gap, the next iteration catches it. The loop continues until the gap list for that category is empty and the validator passes.

**Important:** Ralph-loop sessions L1–L7 can run SEQUENTIALLY (not parallel) because they may edit the same files. Order matters: L1 (schema) before L2 (API contracts that reference schema), L3 (infra) before L4 (security that references infra).

---

### Phase 5 — Sprint Document Generation (est. 2–3 hours)

**Goal:** Produce the final sprint documents — one per sprint — that are complete enough for an AI agent to execute without ambiguity.

**Method:** Parallel agents, one per sprint. Each agent reads:
- v2 (canonical spec for its sprint)
- v3 (enhancements for its sprint)
- All domain audit reports relevant to its sprint
- The gap backlog (only gaps assigned to its sprint)

Each agent produces a self-contained sprint document.

**Sprint document template:**
```markdown
# Sprint <N> — <Title> (Weeks <W>)

## Goal (<1 paragraph)

## Pre-requisites (must be complete before this sprint starts)
- [ ] <dependency from previous sprint>
- [ ] <infrastructure requirement>
- [ ] <external dependency>

## Scope — ordered by priority

### <Workstream 1>
- [ ] <Task> — <owner skill> — <estimated hours> — <depends on>
  - Acceptance criteria: <measurable outcome>
  - Test: <how to verify>

### <Workstream 2>
...

## API contracts (OpenAPI fragments for new endpoints this sprint)
## Database migrations (exact DDL for new/changed tables this sprint)
## Component specs (props, states, a11y for new components this sprint)

## Test plan
- [ ] Unit tests: <list of test files and what they cover>
- [ ] Integration tests: <list of test scenarios>
- [ ] E2E tests: <user journey tests>
- [ ] Visual regression: <routes to snapshot>
- [ ] Performance: <benchmark targets>

## End-of-sprint checklist (<N> min walkthrough)
1. <check>
2. <check>
...

## Risk register (sprint-specific)
| Risk | Likelihood | Mitigation | Owner |

## Dependencies for next sprint
- [ ] <what Sprint N+1 needs from this sprint>
```

**Parallel agents:**

| Agent | Sprint | Output file |
|---|---|---|
| **G1** | Sprint 1 — Foundation Skeleton + Security Baseline | `docs/sprints/sprint-01.md` |
| **G2** | Sprint 2A — Infrastructure Landing | `docs/sprints/sprint-02a.md` |
| **G3** | Sprint 2B — Langflow Cutover | `docs/sprints/sprint-02b.md` |
| **G4** | Sprint 3 — Pilot View + HITL + Accessibility | `docs/sprints/sprint-03.md` |
| **G5** | Sprint 4 — Ops View + Eval CI + Monitoring | `docs/sprints/sprint-04.md` |
| **G6** | Sprint 5 — Demo View + Experimentation | `docs/sprints/sprint-05.md` |
| **G7** | Sprint 6 — Motor-Fleet + Audit Bundle + Hardening | `docs/sprints/sprint-06.md` |
| **G8** | Sprint 7 — Scenario Builder + Synthdata Factory | `docs/sprints/sprint-07.md` |

---

### Phase 6 — Cross-Sprint Consistency Check (est. 1 hour)

**Goal:** After all sprint documents are written, verify they form a coherent whole.

**Method:** 3 synthesis agents read all 8 sprint documents:

| # | Check | Prompt focus |
|---|---|---|
| **C1** | Dependency chain integrity | Verify every "depends on" in sprint N is satisfied by sprint N-1's output. Every "pre-requisite" is produced by a prior sprint. No circular dependencies. |
| **C2** | Interface consistency | Verify API contracts in sprint N don't conflict with sprint M. Verify database schema in sprint N extends (not breaks) schema from prior sprints. |
| **C3** | Effort calibration | Sum estimated hours per sprint. Flag sprints > 80 hours (2 people × 2 weeks). Propose scope cuts for over-packed sprints. |

**Output:** `docs/sprints/consistency-report.md`

---

### Phase 7 — Final Synthesis & Executive Summary (est. 1 hour)

**Goal:** Produce the final documents that tie everything together.

**Method:** Single focused agent with access to all outputs.

**Deliverables:**
1. `docs/EXECUTIVE_SUMMARY.md` — 1-page for stakeholders: what we're building, timeline, risks, cost estimate
2. `docs/GETTING_STARTED.md` — for the first engineer: what to set up, first 10 commands to run
3. Update `CLAUDE.md` — add pointer to sprint docs, update current state
4. Update `docs/refactor_main_v3.md` — add "see sprint docs for execution" header

---

## 3. Execution order

```
Phase 1 (Source Audit)
    │
    ▼
Phase 2 (10 Domain Deep-Dives) ─── parallel ─── D1..D10 all run simultaneously
    │
    ▼
Phase 3 (3 Cross-Cutting Synthesis) ─── parallel ─── S1, S2, S3 read all D* reports
    │
    ▼
Phase 4 (7 Ralph-Loop Fix Sessions) ─── sequential ─── L1→L2→L3→L4→L5→L6→L7
    │
    ▼
Phase 5 (8 Sprint Documents) ─── parallel ─── G1..G8 all run simultaneously
    │
    ▼
Phase 6 (3 Consistency Checks) ─── parallel ─── C1, C2, C3 read all sprint docs
    │
    ▼
Phase 7 (Final Synthesis) ─── single agent ─── => DONE. Ready to code.
```

**Total estimated wall-clock time:** 10–15 hours (mostly parallel agent execution + sequential ralph-loop sessions).

**Total estimated token usage:** 500K–1M input, 200K–400K output (cost: $15–40 at current Anthropic pricing, negligible at DeepSeek pricing).

---

## 4. Ralph Loop's specific role

Ralph-loop is NOT the right tool for Phases 1, 2, 3, 5, 6, or 7 — those require diverse analysis, creative synthesis, and cross-document reasoning best done by parallel specialized agents.

Ralph-loop IS the right tool for Phase 4 — the iterative "fix known issues until validator passes" work. Here's why:

| Ralph-loop strength | How Phase 4 uses it |
|---|---|
| Same prompt repeated | Each loop session has one prompt: "fix all gaps of category X" |
| Self-reference via files | Each iteration sees the previous iteration's fixes in the plan files |
| Completion promise gate | Loop exits only when the gap-backlog for that category is empty |
| Max iterations safety net | Prevents infinite loops if a gap is unfixable |
| Incremental improvement | Each pass fixes more gaps, builds on prior fixes |

**What ralph-loop should NOT be used for:**
- Making architectural decisions (needs human judgment)
- Designing new features (needs creativity + user intent understanding)
- Trade-off analysis (needs context about what the user values)
- The initial deep review (needs diverse perspectives)

---

## 5. Go/No-Go decision

After Phase 7 completes, we will have:

- ✅ Every document reference validated
- ✅ 10 domain audits with structured findings
- ✅ All contradictions resolved
- ✅ Prioritized gap backlog with all gaps closed
- ✅ 8 self-contained sprint documents with tasks, contracts, tests
- ✅ Cross-sprint consistency verified
- ✅ Executive summary for stakeholders

**At that point, the plan is ready for Sprint 1 execution.** The user reviews the sprint documents and gives the go-ahead.

---

## 6. What to do right now

If you approve this process, I recommend starting with **Phase 1 immediately** — it's the quickest (1–2 hours) and unblocks everything else. Phase 1 just reads files and checks references — no design decisions, no code.

Then we proceed through Phases 2–7 in order, with human check-ins at:
- After Phase 3 (review the gap backlog, decide if any gaps should be accepted rather than fixed)
- After Phase 4 (review the fixed documents before sprint generation)
- After Phase 7 (final approval before coding)

---

*This process is designed for maximum thoroughness. If at any point you want to skip a phase or accelerate, just say so. The default is "run every phase completely."*

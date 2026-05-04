# Skill Architecture & Development Workflow — Design Spec

**Date:** 2026-05-04
**Status:** Approved — implementing
**Author:** Eduardo + Claude
**Last updated:** 2026-05-04 (post-commit 4c6bc1c — two-phase QA gate landed)

## 1. Problem Summary

### Current state (44 SKILL.md files)

| Problem | Scale |
|---|---|
| 31 nested skills invisible to slash commands | Only 13/44 get `/` commands |
| Massive token waste | 12 skills over 500 lines; worst is 4,589 lines |
| No Iron Laws | Only 2 of 44 skills have one |
| No workflow checklists | Only 4 of 44 use ⚠️/⛔ markers |
| No progressive loading | Only 9 of 44 use `references/` |
| Inconsistent naming | `langflow-runtime`, `use-railway`, `agent-toolkit/skill-judge` — 3 conventions |

### Root cause

SessionStart hook scans `.agents/skills/*/SKILL.md` — one level deep. Domains like `langflow/`, `n8n/`, `taste/` have sub-folders but no root hub SKILL.md.

### Target

~10 hub `/` commands. Each hub routes to sub-skills via decision trees. Sub-skills loaded on demand. All skills meet skill-forge quality standards.

---

## 2. Hub-and-Spoke Architecture

```
User: /langflow build me a hitl flow for claim disputes
        │
        ▼
┌─────────────────────────────────┐
│  langflow/SKILL.md (hub, ~120L) │
│  - Decision tree                │
│  - Sub-skill catalog            │
│  - Related domains              │
│  - Domain Iron Law              │
└──────────┬──────────┬───────────┘
           │          │
    "hitl flow"   "build flow"
           │          │
           ▼          ▼
  hitl-resume/SKILL  flows-api/SKILL
       │                  │
       └──────┬───────────┘
              │
              ▼
       AI composes both sub-skills,
       executes, returns result
```

### Hub commands (10 total)

| Command | Domain | Load when... |
|---|---|---|
| `/brainstorm` | Design, ideation, experimentation | Creative/planning work |
| `/sprint` | Sprint planning, Linear sync | Sprint orchestration |
| `/deliver` | Sprint delivery lifecycle | Implementing Linear issues |
| `/qa` | Quality assurance, testing | Verification, test writing |
| `/langflow` | Agent orchestration (runtime, flows, HITL, components) | Langflow work |
| `/n8n` | Workflow automation (tools, code nodes, validation) | n8n work |
| `/supabase` | Database schema, migrations, RLS | Database work |
| `/railway` | Infrastructure, deploys, logs | Deploy/infra work |
| `/observe` | Tracing, flags, telemetry (langfuse, posthog, otel) | Observability work |
| `/design` | Visual design, taste, frontend aesthetics | UI/design work |

### Hub SKILL.md template

```markdown
---
name: langflow
description: "Langflow agent orchestration. Use when working with Langflow runtime,
flows, components, HITL patterns, or custom component development."
---

# Langflow Hub

IRON LAW: Never modify a running flow without first reading its current state
via the flows API. Always test flows with test_workflow before deploying.

## Sub-Skill Catalog

| User says... | Load sub-skill |
|---|---|
| "start/stop langflow", "list flows", "check health" | `runtime/SKILL.md` |
| "run a flow", "execute flow", "call flow API" | `flows-api/SKILL.md` |
| "HITL", "pause flow", "resume flow" | `hitl-resume/SKILL.md` |
| "what components exist", "component list" | `components/SKILL.md` |
| "build a custom component" | `custom-components/SKILL.md` |
| "review langflow code" | `backend-code-review/SKILL.md` |

## Decision Tree

1. Running/operating Langflow? → `runtime/SKILL.md`
2. Executing flows via API? → `flows-api/SKILL.md`
3. HITL/pause/resume? → `hitl-resume/SKILL.md`
4. Finding/using components? → `components/SKILL.md`
5. Building custom components? → `custom-components/SKILL.md`
...

## Related Domains

Before executing, check if the task touches:
- Database → also load `../supabase/SKILL.md`
- External tools → also load `../n8n/SKILL.md`
- Deployment → also load `../railway/SKILL.md`
- Tracing → also load `../langfuse/SKILL.md`

## Anti-Patterns

- NEVER guess a flow ID — always look it up via runtime skill
- NEVER skip test_workflow before deploying a flow change

## Confirmation Gates

⛔ ASK before: restarting Langflow, modifying production flows, deleting components
```

### Cross-domain awareness

Every hub has a **Related Domains** section. When a user request mentions concepts from another domain (e.g. "store claims in supabase" during a langflow session), the hub's Related Domains triggers loading sibling hubs.

CLAUDE.md and `.github/copilot-instructions.md` get a concise skill catalog table listing all hubs and key sub-skills.

---

## 3. Sub-Skill Quality Standards

Every sub-skill must meet skill-forge gates:

| Gate | Requirement |
|---|---|
| Iron Law | One unbreakable rule at the top |
| Under 500 lines | Everything else → `references/` |
| Workflow checklist | ⚠️ REQUIRED and ⛔ BLOCKING markers |
| Anti-patterns | Explicit "NEVER" list with reasons |
| Progressive loading | References loaded on demand, not upfront |

### Bloated skills to refactor

| Skill | Current | Target |
|---|---|---|
| `langflow/components` | 4,589 lines | SKILL.md (~200L) + `references/component-catalog.md` |
| `taste/imagegen-frontend-mobile` | 1,465 lines | SKILL.md (~150L) + `assets/prompts/` |
| `n8n/*` (7 skills) | 500-877 lines each | SKILL.md (~200L) + `references/` |

### Migration: mass skills → references

```
Before:  SKILL.md (4,589 lines — everything dumped in)
After:   SKILL.md (~200 lines)
         references/
         ├── component-catalog.md
         ├── usage-patterns.md  
         └── known-issues.md
```

---

## 4. Development Workflow Lifecycle (IMPLEMENTED)

Two-track model from idea to production. Track A has a **two-phase QA gate** already implemented in commit `4c6bc1c`.

### Track A: Planned Work (roadmap features)

```
💡 Idea / Requirement
     │
/brainstorm → design doc written, approved
     │
/sprint → Two sibling Linear issues for mixed (frontend + backend) sprints:
     │    [Frontend] AXA-N blocks [Backend] AXA-N+1
     │
     ├── Phase 1: Frontend delivery
     │   /deliver AXA-N → deliver/frontend/axa-N-slug → PR
     │   auto-qa.yml → creates [DesignQA] issue → designqa-reviewer
     │   /approve-design → frontend branch squash-merged
     │
     ├── Phase 2: Backend delivery
     │   /deliver AXA-N+1 → deliver/backend/axa-N+1-slug → PR
     │   auto-qa.yml → creates [QA] issue → qa-reviewer
     │   (gate note references [DesignQA] issue — must be closed)
     │
     ├── /approve-merge on [QA] issue
     │   approve-merge.yml checks [DesignQA] is closed → blocks if not
     │
     ✋ Eduardo: approves
     │
     ✅ Both merged + Done
```

**Two-phase QA gate details:**

| Phase | Branch prefix | Agent | Checklist | Approval command |
|---|---|---|---|---|
| DesignQA | `deliver/frontend/*` | designqa-reviewer | Screenshot → axe a11y → visual diff → report | `/approve-design` |
| QA | `deliver/backend/*` | qa-reviewer | SOLID + Security + Code Quality + Functional Integration | `/approve-merge` |

**Backend merge is blocked until DesignQA is closed.** `approve-merge.yml` checks the linked [DesignQA] issue status before allowing the merge.

**Agent files (already landed):**
- `.github/agents/designqa-reviewer.agent.md` — Frontend visual QA pipeline
- `.github/agents/qa-reviewer.agent.md` — Backend code review with §4 Functional Integration
- `.github/workflows/auto-qa.yml` — Detects PR type, creates [DesignQA] or [QA] issues
- `.github/workflows/approve-merge.yml` — Handles `/approve-design` and `/approve-merge` with gate checks

### Track B: Stakeholder-Driven (Chatwoot → BugClaw) — PLANNED

```
📱 Stakeholder messages Chatwoot
     │
BugClaw collects: description, screenshots, steps, chat ID
     │
Auto-creates Linear issue with full context
     │
        ┌──────────┴──────────┐
        │                     │
     🐛 Bug               💡 Feature Request
        │                     │
   OpenClaw auto-fixes    Routes to Track A
   OpenClaw auto-tests    /brainstorm → /sprint → ...
        │
   QA report posted to:
   • Chatwoot → stakeholder
   • Linear → Eduardo
        │
   ✋ Eduardo: /approve-merge
        │
   ✅ Merged + Done
   Stakeholder notified in Chatwoot
```

**Hard gates:**
- Stakeholders NEVER access Linear — all communication via Chatwoot
- Every merge (Track A or B) requires Eduardo's approval on Linear
- BugClaw auto-fixes bugs only; features always route to Track A
- Backend merge blocked until frontend DesignQA is closed

---

## 5. BugClaw — OpenClaw Stakeholder Agent

### Architecture

```
Stakeholder → Chatwoot → Webhook → OpenClaw (BugClaw) → Linear
                │                                    │
                │         QA report                  │
                └────────────────────────────────────┘
```

### OpenClaw Infrastructure

| Component | Status |
|---|---|
| Railway service | ✅ `OpenClaw-fSxK` deployed |
| LLM provider | ✅ DeepSeek V4 (`deepseek-v4-flash`) |
| Device pairing | ✅ Approved |
| SSH access | ✅ `railway ssh -s "OpenClaw-fSxK" -i ~/.ssh/elevenlabs_deploy` |
| HTTP API (internal) | ✅ `POST /v1/chat/completions` works |
| HTTP API (public) | ⚠️ GET works, POST has wrapper body bug |

### BugClaw Agent Persona

Configured via OpenClaw's agent system:
- System prompt: Issue triage specialist — collects requirements, classifies bug vs feature, creates Linear issues
- Access to Linear API via OpenClaw skills/plugins
- Auto-fix capability for bugs via OpenClaw's coding workspace

### Chatwoot Integration

1. **Chatwoot inbox** for stakeholder bug/feature submissions
2. **Webhook** fires on new messages → OpenClaw hooks endpoint
3. **BugClaw** responds in Chatwoot thread:
   - "Thanks for the report! What page were you on?"
   - "Can you share a screenshot?"
   - "What steps reproduce this?"
   - "Which chat/conversation ID?"
4. Once requirements collected, creates Linear issue
5. Posts Linear issue link in Chatwoot thread

### Linear Integration

- BugClaw creates issues in the Agentic Cockpit Linear project
- Labels: `Bug` or `Feature Request`, `Stakeholder`, `Chatwoot`
- Bug issues: assigned to OpenClaw agent for auto-fix
- Feature issues: unassigned, routed to Track A via `/brainstorm`

---

## 6. Sprint Delivery Pipeline Coherence (IMPLEMENTED)

The five workflow skills form a linear pipeline from idea to production, with a two-phase QA gate for frontend+backend sprints:

```
/brainstorm ──▶ /sprint ──▶ /deliver (FE+BE) ──▶ DesignQA ──▶ QA ──▶ approve ──▶ Done
    │               │              │                 │          │
  Design doc    Two sibling     Two branches     Frontend    Backend
  approved      Linear issues   deliver/frontend  visual QA   code QA
                FE blocks BE    deliver/backend   /approve-   /approve-
                                                 design      merge
```

### Skill boundaries (no overlap)

| Skill | Starts when | Ends when | Output |
|---|---|---|---|
| `/brainstorm` | Idea exists | Design doc approved | `docs/superpowers/specs/*.md` |
| `/sprint` | Design doc ready | Two sibling Linear issues (FE+BE) | Issues in backlog + `docs/sprints/*.md` |
| `/deliver` AXA-N | Issue in Todo | Issue in In Review | `deliver/frontend/*` or `deliver/backend/*` branch, PR |
| `designqa-reviewer` | [DesignQA] issue created | `/approve-design` | Screenshot+a11y+diff report, frontend merge |
| `qa-reviewer` | [QA] issue created (DesignQA closed) | `/approve-merge` or `/request-changes` | SOLID+Security+Code+Integration report |

### Handoff contract

- `/brainstorm` → design doc path → `/sprint` reads it to create issues
- `/sprint` → Two Linear issues (FE blocks BE) → `/deliver` reads them to implement
- `/deliver` → branch + PR → `auto-qa.yml` detects prefix, creates QA issue, assigns agent
- `designqa-reviewer` → visual QA report + merge → unblocks backend
- `qa-reviewer` → code QA report → `/approve-merge` checks DesignQA gate

### Skill composition rules

1. **No skill skips the pipeline.** Every feature goes brainstorm → sprint → deliver → qa.
2. **Design is integrated.** Frontend/UI changes always go through DesignQA first.
3. **Backend blocked until DesignQA closed.** `approve-merge.yml` enforces this programmatically.
4. **Bugs from Track B skip brainstorm.** They go directly to BugClaw → auto-fix → qa → approve.
5. **Single merge gate.** Eduardo's approval is always the final step.

---

## 7. Meta-Skills for Cross-Domain Composition

```markdown
---
name: create-scenario
description: "Create a new end-to-end insurance scenario. Triggers: /create-scenario"
---

# Create Scenario

IRON LAW: Never create a scenario without wiring all 4 layers
(DB, Langflow, n8n tools, cockpit view).

## Workflow

- [ ] Phase 1: Design ⚠️ REQUIRED
  → Load `../brainstorm/SKILL.md`
- [ ] Phase 2: Database ⛔ BLOCKING
  → Load `../supabase/SKILL.md`
- [ ] Phase 3: Agent Flow
  → Load `../langflow/SKILL.md`
- [ ] Phase 4: Tools
  → Load `../n8n/SKILL.md`
- [ ] Phase 5: Verify
  → Load `../qa/SKILL.md`

## Confirmation Gates

⛔ ASK before: creating DB tables, modifying production flows
```

---

## 8. Implementation Phases

### Phase 1: Hub creation (immediate)
- Create hub SKILL.md for: `langflow/`, `n8n/`, `taste/` → `/design`
- Move `agent-toolkit/SKILL.md` (skill-judge) → `agent-toolkit/skill-judge/SKILL.md`
- Create new `agent-toolkit/SKILL.md` as hub

### Phase 2: Quality gates (Sprint 1)
- Add Iron Laws to all sub-skills
- Split skills >500 lines into SKILL.md + references/
- Add workflow checklists with ⚠️/⛔ markers
- Normalize skill names (remove redundant prefixes like `n8n-code-javascript` → `code-javascript`)

### Phase 3: BugClaw integration (Sprint 1)
- Configure OpenClaw agent persona for BugClaw
- Create Chatwoot inbox + webhook for stakeholder submissions
- Wire webhook → OpenClaw hooks endpoint
- Test end-to-end: stakeholder message → Linear issue → auto-fix → QA report

### Phase 4: Meta-skills (Sprint 2)
- Build `/create-scenario` as first cross-domain meta-skill
- Pattern can be reused for `/full-stack-feature`, `/deploy-to-production`

### Phase 5: CLAUDE.md + Copilot sync (ongoing)
- Update CLAUDE.md skill catalog with hub+sub-skill table
- Sync to `.github/copilot-instructions.md`
- Both files get the same catalog

---

## 9. Open Questions (ALL RESOLVED)

1. **Observe hub**: Merge langfuse + posthog + otel into one `/observe` hub or keep separate?
   → **RESOLVED**: Keep separate (`/langfuse`, `/posthog`, `/otel`). Distinct domains, used at different times.

2. **Chatwoot skill**: Keep as standalone `/chatwoot` or fold into BugClaw integration docs?
   → **RESOLVED**: Keep separate. Chatwoot is its own domain (HITL handover, custom attributes, webhook signatures).

3. **Taste skills**: 12 sub-skills under `/design` — which are essential vs. nice-to-have?
   → **RESOLVED**: User has updated taste SKILL.md files to only leave the essential. Design skills now under review.

4. **Template fork**: Should we fork `arjunkomath/openclaw-railway-template` to fix the POST body bug permanently?
   → **RESOLVED**: Yes. Fork and fix `express.json()` body consumption issue in `src/server.js`. Track in BugClaw plan.

## 10. Current State & Next Steps

### Already delivered (commit 4c6bc1c)
- Two-phase QA gate: designqa-reviewer + qa-reviewer agents
- auto-qa.yml: PR type detection, issue creation, agent assignment
- approve-merge.yml: merge gate with DesignQA blocking check
- sprint/SKILL.md: two sibling issues for mixed sprints
- deliver/SKILL.md: frontend/backend branch prefix conventions

### This delivery (in progress)
- [ ] Hub SKILL.md creation (langflow, n8n, design, agent-toolkit)
- [ ] Sub-skill quality audit (Iron Laws, checklists, <500 lines)
- [ ] CLAUDE.md + Copilot instructions sync
- [ ] Design doc finalize and commit
- [ ] BugClaw implementation plan in `docs/plans/`

### Next delivery (BugClaw)
- [ ] Fork and fix OpenClaw Railway template (POST body bug)
- [ ] Configure BugClaw agent persona in OpenClaw
- [ ] Create Chatwoot stakeholder inbox + webhook
- [ ] Wire Chatwoot webhook → OpenClaw hooks → Linear
- [ ] End-to-end test: stakeholder message → Linear issue → auto-fix → QA report
- [ ] Full plan: `docs/plans/2026-05-04-bugclaw-stakeholder-agent.md`

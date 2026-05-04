---
name: brainstorming
description: "Structured brainstorming and design skill. USE WHEN: user wants to brainstorm, explore ideas, plan a feature, design architecture, or think through a problem before coding. Turns unstructured ideas into concrete designs through collaborative 3-phase dialogue: Understanding → Exploration → Design. Adapted from obra/superpowers brainstorming skill for GitHub Copilot CLI."
argument-hint: "Topic or idea to brainstorm (e.g., 'new caching layer', 'redesign the alerts page', 'add webhook retry logic')"
---

# Brainstorming: Ideas Into Designs

Turn ideas into fully formed designs and specs through structured, collaborative dialogue.
Do NOT write code. This skill produces a **design document and plan**, not implementation.

<HARD-GATE>
Do NOT write any code, create any files (other than the design doc), scaffold anything,
or take any implementation action until you have presented a complete design and the
user has explicitly approved it. This applies to EVERY project regardless of perceived
simplicity. "Simple" projects are where unexamined assumptions waste the most work.
</HARD-GATE>

## The Three Phases

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ UNDERSTAND  │ ──▶ │   EXPLORE   │ ──▶ │   DESIGN    │
│             │     │             │     │             │
│ Context     │     │ 2-3 options │     │ Spec it out │
│ Constraints │     │ Trade-offs  │     │ Get approval│
│ Goals       │     │ Recommend   │     │ Write doc   │
└─────────────┘     └─────────────┘     └─────────────┘
```

## Checklist (complete in order)

1. **Explore project context** — read relevant files, docs, recent git history
2. **Ask clarifying questions** — one at a time via `ask_user`, understand purpose/constraints/success criteria
3. **Propose 2-3 approaches** — with trade-offs and your recommendation
4. **Present design** — in sections scaled to complexity, get user approval after each section
5. **Write design doc** — save to session workspace or `docs/` as agreed
6. **User reviews written spec** — ask user to review before proceeding
7. **Create implementation plan** — use plan.md + SQL todos for tracked execution

---

## Phase 1: Understanding

**Goal:** Build a clear mental model of what the user wants before proposing anything.

### How to gather context

- Use `explore` agents to scan relevant code, docs, and recent commits
- Read existing architecture docs, the copilot-instructions.md, and related files

### How to ask questions

- **One question at a time** using the `ask_user` tool
- **Prefer multiple choice** when possible — easier and faster for the user
- Do NOT bundle multiple questions into one message
- Each question should fill a real gap in your understanding
- Stop asking when you have: purpose, constraints, success criteria, scope

### Scope check

Before diving into detail questions, assess scope first. If the request describes
multiple independent subsystems, flag it immediately:

> "This looks like it has several independent pieces. Let's identify them and
> tackle the first one through the full design flow."

Help decompose into sub-projects if needed. Each gets its own design cycle.

### Good question examples

```
"What's the primary goal here?"                              (purpose)
"Who will use this — just you, or end users too?"            (audience)
"Are there any hard constraints I should know about?"        (constraints)
"How will you know this succeeded?"                          (success criteria)
```

### Anti-patterns to avoid

- ❌ Asking 5+ questions at once
- ❌ Dumping a complete design without checking assumptions
- ❌ Skipping straight to implementation ("this seems simple enough")
- ❌ Generic questions that don't help narrow the design

---

## Phase 2: Exploration

**Goal:** Present 2-3 concrete approaches with trade-offs so the user can make an informed choice.

### How to present options

For each approach, explain:
- **What it is** (1-2 sentences)
- **Pros** (what makes it good)
- **Cons** (what's risky or costly)
- **When you'd pick it** (context where it shines)

### Lead with your recommendation

Don't present options as equal. State which you prefer and why:

> "I'd recommend **Option B** because [reason]. But here are the alternatives..."

Use `ask_user` with choices to let the user pick:
```
choices: ["Option A: [name] (Recommended)", "Option B: [name]", "Option C: [name]"]
```

### Principles

- **YAGNI ruthlessly** — remove features that aren't needed yet
- **Explore alternatives** — don't just present the first idea that comes to mind
- **Consider existing patterns** — in existing codebases, follow what's already there

---

## Phase 3: Design

**Goal:** Convert the chosen approach into a concrete, reviewable specification.

### How to present the design

- Present in **sections**, scaled to complexity:
  - Simple section → a few sentences
  - Complex section → up to 200-300 words
- After each section, ask: "Does this look right so far?"
- Be ready to go back and revise if something doesn't fit

### What to cover (scale each to relevance)

| Section | What to address |
|---------|----------------|
| **Overview** | What are we building and why? |
| **Architecture** | Components, boundaries, data flow |
| **Interface** | API contracts, function signatures, UI wireframes (text) |
| **Data** | Schema changes, storage, migrations |
| **Error handling** | What fails, how we recover |
| **Testing** | What to test, key edge cases |
| **Migration** | How to get from current state to new state |

### Design principles

- **Isolation** — each unit has one clear purpose, communicates through well-defined interfaces
- **Testability** — can each unit be tested independently?
- **Comprehensibility** — can someone understand a unit without reading its internals?
- **Existing patterns** — follow conventions already in the codebase

### Working in existing codebases

- Explore current structure BEFORE proposing changes
- Follow existing patterns and conventions
- If existing code has problems that affect the work (overgrown files, tangled
  responsibilities), include targeted improvements — don't propose unrelated refactoring

---

## After Design Approval

### Write the design document

Save the validated design to one of:
- **Session workspace:** `~/.copilot/session-state/<session>/plan.md` (default)
- **Repo docs:** `docs/designs/YYYY-MM-DD-<topic>.md` (if user prefers persistent docs)

Ask the user which they prefer using `ask_user`.

### Create implementation plan

Once the design doc is approved:
1. Update or create `plan.md` with the implementation plan
2. Insert todos into the SQL `todos` table with clear, actionable descriptions
3. Add dependencies via `todo_deps` where order matters
4. Present the plan summary to the user

### Transition

After the plan is approved, tell the user:

> "Design and plan are ready. Switch out of brainstorming and say 'start' or
> 'implement it' when you want to begin."

Do NOT start implementing. The brainstorming skill ends here.



---

## Example Session Flow

```
User: "I want to add real-time price alerts via Discord"

Phase 1 — Understanding:
  → Explore: read alerts/, notifications.py, webhooks routes
  → Ask: "What should trigger an alert?" (choices: price threshold, % change, deal detected)
  → Ask: "How urgent? Real-time SSE push or next collection cycle?"
  → Ask: "Should alerts be per-item or support compound rules?"

Phase 2 — Exploration:
  → Option A: Extend existing webhook system (simple, limited)
  → Option B: New alert rule engine with Discord integration (recommended)
  → Option C: Full pub/sub with pluggable channels (overkill for now)
  → User picks B

Phase 3 — Design:
  → Present architecture (rule engine + evaluator + Discord sender)
  → Present data model (custom_alert_rules table schema)
  → Present API (CRUD endpoints + evaluation trigger)
  → Present error handling (Discord failures, rate limits)
  → User approves each section

After:
  → Write design doc to plan.md
  → Create SQL todos for implementation
  → Hand off to user to begin coding
```

---

*Adapted from the [Superpowers brainstorming skill](https://github.com/obra/superpowers) by Jesse Vincent (MIT License).*

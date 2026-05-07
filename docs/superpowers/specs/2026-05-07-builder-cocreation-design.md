# Builder Co-creation Rework — Pilot Workspace, Compagnon, UC-Aware Ship Pipeline

> **Project:** GDAI Agentic Cockpit — Builder Rework v2
> **Author:** Brainstorm session 2026-05-07 (Eduardo + Claude Opus 4.7)
> **Date created:** 2026-05-07
> **Status:** Design spec v2 — ready for review
> **Supersedes:** [`docs/superpowers/specs/2026-05-04-builder-rework-design.md`](./2026-05-04-builder-rework-design.md) (the prior spec for the same surface; this one keeps the original IA but adapts the ship pipeline to the multi-UC reality of Direct Assurance and to the manually-validated UC-01 delivery pattern)
> **Successor to:** [`docs/sprints/builder-hermes-prd.md`](../../sprints/builder-hermes-prd.md) (closes deferred items R10 — adaptive question generation — and R9 — dynamic personas)
> **References:**
> - [`docs/architecture.md`](../../architecture.md) (single source of truth)
> - [`docs/refactor_main_v3.md`](../../refactor_main_v3.md) (canonical delivery plan)
> - [`docs/DA_PILOT.md`](../../DA_PILOT.md) (anchor pilot — Direct Assurance Voice AI)
> - [`.agents/skills/hermes/agent_setup/SKILL.md`](../../../.agents/skills/hermes/agent_setup/SKILL.md) (canonical UC delivery pattern, validated on UC-01)
> - [`docs/superpowers/specs/2026-05-04-builder-rework-design.md`](./2026-05-04-builder-rework-design.md) §6 (motion, icons, density, progressive-disclosure rules — kept verbatim, not re-stated here)

---

## 0. Executive summary

### 0.1 What this document is

A complete design spec for reworking the GDAI cockpit's `/builder` surface from a **scripted 14-phase form wizard** into a **chat-companion-driven Pilot Workspace** that accompanies a Direct Assurance pilot from the first business-owner conversation through the ship of every UC's voice agent to a working L1 first-call against real ElevenLabs + Railway-hosted tools, with an architectural shell for L2 sandbox-load. It supersedes the 2026-05-04 spec on the same topic by anchoring on the actual DA pilot reality (multi-UC, real Railway gateway, real ElevenLabs API) and on the UC-01 delivery pattern that was validated by hand and extracted into the `hermes/agent_setup` skill.

This is the canonical PRD for this rework. Implementation planning (sprint plans, file-level diffs, Linear issues) flows from this in the `writing-plans` pass that follows.

### 0.2 What changes vs. the current builder

The current `/builder` surface is `<DirectAssuranceStudio>` running in one of three modes (`entry / studio / onboarding`). The Onboarding mode is a 14-phase form wizard that emits one scripted Hermes intro line per phase, presents a form, advances on a CTA — without any back-and-forth with the user. The Studio mode is a 5-act composition workspace with a chat slide-over that does stream real DeepSeek but is not bound to the composition state. Per the 2026-05-07 PRD, the plumbing is real (Hermes tools, citation gate, builder FSM, audit log, SSE chat) but the deferred items R9 (dynamic personas) and R10 (adaptive question generation per phase) leave the user without a real conversation; they are exactly the user's complaint.

The rework:

- **Replaces the wizard** with a Pilot Workspace at `/pilots/:slug` whose centre pane swaps per movement and whose right rail is a persistent chat thread (the "Compagnon"). The chat does not just narrate; it asks, advises, proposes diffs into the panes, pushes back on risky decisions, tracks open concerns, and refuses politely when the user asks for something it cannot do.
- **Re-anchors on Direct Assurance.** A pilot is the umbrella; UC-01…UC-07 are modules. Movements I-IV operate at pilot level; movements V (synth seed) and VII (rehearsal) fork per module; movement VIII synthesises.
- **Closes R9 + R10** by introducing a three-layer prompt registry, an exit-criteria evaluator that drives Hermes' next questions, an artifact diff engine, an open-concerns tracker, and visible compaction.
- **Hardens the ship pipeline** to reproduce the manually-validated UC-01 delivery: 14 manual steps mapped onto 6 ship phases that compose all artefacts (synth data patches, tools, routers, prompts, golden tests, ElevenLabs config), wire to Railway and ElevenLabs, run pytest, and execute one synthetic smoke call before declaring a module shipped.
- **Delivers L0 fully + L1 first-arrival fully + L2 architectural sketch.** L2 cohort runner is a stub; the shell exists.
- **Keeps Langflow reserved for runtime** (per the locked v3 Q-decision) — the Compagnon brain stays in the gateway for now, with a thin contract that allows a future migration to Langflow without disturbing the rest.

### 0.3 Locked decisions (from the brainstorm)

| # | Decision | Reason |
|---|---|---|
| D1 | Hybrid co-creation: 8 movements as real working surfaces, persistent chat companion as right rail. | Closest to the original 2026-05-04 spec; chat is not a sidekick narrator, it's the place where Hermes asks, advises, proposes diffs into the panes. |
| D2 | One pilot = whole DA program; UCs are modules within it. Movements I-IV pilot-level; V and VII fork per module; charter and citations pan-pilot. | Matches DA reality (7 UCs share charter/regulations/synth seed scope but each has its own agent + tools + prompts + golden tests). |
| D3 | Deliver L0 fully, L1 first-arrival fully, L2 architectural shell only. | L0 is the heart of the rework (the user can't ship anything without it); L1 is what makes "ship" meaningful; L2/L3/L4 stay in the spec but are deferred. |
| D4 | Extend the gateway-hosted Hermes (DeepSeek SSE → tools → audit) with: 3-layer prompt registry, artifact diff engine, open-concerns tracker, compaction memos, adaptive-question generator. Langflow stays reserved for runtime pilot flows. | Existing plumbing already works (per builder-hermes-prd 2026-05-07 delivery log); avoid re-platforming. The locked v3 split (Langflow reasoning, n8n tools) is preserved for runtime; the Compagnon is a separate concern. |
| D5 | The L0 → L1 ship overlay calls `hermes/agent_setup` per module to do the heavy lifting (synthdata + tools + router + prompts + golden tests + ElevenLabs agent + tool wiring + Railway deploy + smoke call). Skill stays human-readable; we add a programmatic runner. | The pattern is validated end-to-end on UC-01; reusing it is faster and safer than re-implementing inside the builder. |

### 0.4 Reading order

1. **§1 Pilot Workspace IA** — the architectural spine.
2. **§2 Compagnon co-creation engine** — the centre of gravity. Read this before the movements.
3. **§3 The eight movements at L0** — screen-by-screen with exit criteria, opening dialogue, allowed tools.
4. **§4 UC-01 fidelity → Ship overlay** — the manual checklist mapped to automated phases.
5. **§5 L1 first-arrival + L2 architectural sketch.**
6. **§6 Backend** — schema migrations, gateway routes, Langfuse prompts, orchestrators, FSM.
7. **§7 Hermes AI deliverables** — what we have to write/version.
8. **§8 Migration plan** — five sprint slices, feature flags, rollback.
9. **§9 Acceptance criteria, §10 Risks, §11 Open questions.**

For motion, icon, density and progressive-disclosure rules, defer to §6 of the [2026-05-04 spec](./2026-05-04-builder-rework-design.md). Those rules are unchanged and are the load-bearing experience chapter for both versions.

---

## 1. Pilot Workspace IA & navigation

### 1.1 The unit — Pilot

The product's primary noun is **Pilot**. Everything else is a facet of a pilot.

```
pilot {
  id:            uuid
  slug:          'da-direct-assurance' | 'motor-fnol-tow' | …
  domain:        'direct-assurance' | 'motor-fnol' | 'underwriting' | …
  level:         'L0' | 'L1' | 'L2' | 'L3' | 'L4'
  level_history: [{level, entered_at, exited_at, signed_by, ac_passed}]
  version:       '0.4.2'
  owner:         user_id
  facilitator:   user_id | null
  parent_id:     uuid | null            -- branched-from pilot (deferred UI)
  chat_thread:   chat_thread_id
  language:      'fr' | 'en' | 'de' | 'es' | 'it'
  tenant_id:     'gdai-default'
  created_at, updated_at
}
```

A pilot is created the moment the user lands on `/pilots/new` and sends the first chat message. It is an immediately-persisted draft.

### 1.2 Modules within a pilot

A pilot can contain one or many **modules**. For Direct Assurance, each module is one UC (UC-01 Attestation, UC-02 Justificatifs, UC-03 Paiement, UC-04 RIB, UC-05 Sinistres, UC-06 Résiliation, UC-07 Retraite). For a single-flow pilot like `motor-fnol-tow`, the pilot can have a single module.

```
pilot_module {
  id:           uuid
  pilot_id:     uuid fk
  uc_code:      'UC-01' | 'UC-02' | …
  slug:         'attestation' | 'justificatifs' | …
  agent_name:   'Claire' | 'Léa' | …
  risk_level:   'low' | 'medium' | 'high'
  kyc_level:    'standard' | 'strong'
  has_payment:  bool
  status:       'draft' | 'composed' | 'shipped' | 'retired'
  agent_id:     'agent_…' | null         -- ElevenLabs after ship
  gateway_url:  'https://…railway.app' | null
  module_spec:  jsonb                    -- canonical spec, one source of truth
  tenant_id:    text
  created_at, updated_at
}
```

The `module_spec` jsonb mirrors `agent_setup §1` (uc_code, agent_name, risk_level, has_payment, kyc_level, tools[], flow_steps[], escalation_triggers[], acceptance[]).

Movements I-IV operate at pilot level. Movement V (synth seed) and Movement VII (rehearsal) fork per module — the centre pane shows a per-module tab strip after the user has confirmed at least two modules. Movement VI charter spans all modules but per-module tool-contracts can override the charter integrations row. Movement VIII presents a per-module repo-changes panel.

### 1.3 Routes

| Route | Purpose | Phase |
|---|---|---|
| `/pilots` | Index — every pilot, grouped by level | shell |
| `/pilots/new` | Step 0 chat hero | L0 entry |
| `/pilots/:slug` | Redirect to current-level route | resolver |
| `/pilots/:slug/build` | L0 — eight movements (default = i) | L0 |
| `/pilots/:slug/build/:movement` | Deep-link to specific movement (`i` … `viii`) | L0 |
| `/pilots/:slug/test` | L1 — solo-test canvas with module selector | L1 |
| `/pilots/:slug/sandbox` | L2 — sandbox-load shell (architectural) | L2 |
| `/pilots/:slug/timeline` | Cross-level audit timeline | any |
| `/pilots/:slug/decks` | Generated artifacts (decks, memos, status updates) | any |

`/builder` (legacy) 308-redirects to `/pilots` after S5; before S5 it stays alive behind a feature flag.

### 1.4 Workspace anatomy

Four chrome elements present on every level. Only the centre pane swaps by level + movement.

```
┌─ TOP BAR · 56 px ────────────────────────────────────────────────────┐
│ AXA · Cockpit / Pilots / da-direct-assurance   [STAIRCASE: ●─○─○─○─○]│
│                                                  L0 L1 L2 L3 L4      │
│                                              v0.4.2 · saved 12s · ⌘K │
├──────────────┬─────────────────────────────────────┬─────────────────┤
│ LEFT RAIL    │ CENTRE — phase + movement aware     │ RIGHT RAIL      │
│ 320 px       │                                     │ 380 px          │
│              │ L0 → eight movements                │ Open concerns   │
│ Phase-spec   │ L1 → module selector + run canvas   │ Compagnon thread│
│ navigation   │ L2 → cohort sandbox (sketch)        │ Always present  │
│ + module     │                                     │ One thread per  │
│ list at L0   │                                     │ pilot, persists │
│ + run filter │                                     │ L0 → L4         │
│ at L1        │                                     │                 │
└──────────────┴─────────────────────────────────────┴─────────────────┘
```

### 1.5 Staircase indicator

The 5-segment staircase from the 2026-05-04 spec §1.4 applies verbatim. Segments: future / current / completed / promotion-pending / rolled-back. Click *completed* → time-travel to read-only history. Click *future* → promotion checklist tooltip.

### 1.6 Promotion dialog

L→L+1 transitions are dialogs within the workspace, not navigations. Contents are the per-level checklists from §9 (the L1→L2 checklist is in §5.4 of this spec; L2→L3 and beyond are sketches in this spec, full content in the 2026-05-04 spec §7).

### 1.7 What changes from today

**Kept and extended:**

- `chat-slide-over.tsx` SSE pattern → becomes the right rail's chat stream (renamed `<CompanionRail>`).
- Every `hermes_tools` endpoint (parse_document, propose_persona, search_regulatory_corpus, propose_flow_topology, run_lint, compute_cost, generate_artifacts, run_synthetic_test, propose_tool_contract, seed_kpi_dashboard).
- Builder FSM (extended; see §6.7).
- `audit_log`, `citation_gate`, DeepSeek + Langfuse, `/audit`.
- The trust ledger UI re-skinned as the open-concerns + compaction history view.
- The `hermes/agent_setup` skill (called at ship time per module — see §4 and §7.5).
- `infra/elevenlabs/uc01-agent-config.json` and the deployed Railway gateway (the rework lifts these into the ship pipeline; nothing is destructively replaced).

**Removed:**

- The 14-phase form wizard (`<HermesOnboarding>`).
- The tri-mode `'entry' | 'studio' | 'onboarding'` branching in `<DirectAssuranceStudio>`.
- The static Hermes recommendations that highlight UI elements via `setHermesTargetId`.
- Template-only intros (replaced with adaptive LLM-generated intros driven by exit-criteria state).
- Hardcoded persona / journey defaults (replaced by Hermes-drafted-from-source).

---

## 2. Compagnon co-creation engine

The chat is the primary product surface. The screens are scaffolds the Compagnon fills.

### 2.1 Persona & voice (BASE charter)

| | |
|---|---|
| **Working name** | "Compagnon" (locked at pilot creation; rename in brand pass without disturbing the prompt). |
| **Role** | Senior agentic-pilot specialist with deep insurance expertise (claims, underwriting, fraud, compliance, ops). Multi-language (FR primary for AXA EU, EN/DE/ES/IT supported). |
| **Surface** | Business-only. Never says *Langflow / n8n / MCP / embedding / vector store / FSM / OPA / Rego / capability manifest* unsolicited. The user reads "I've wired the FNOL voice agent to your fraud-score gate" — not "I've added a Langflow tool node and an MCP edge." |
| **Engine** | Behind the scenes composes Langflow flows, n8n workflows, ElevenLabs agents, Twilio templates, Salesforce metadata, Guidewire MCP calls, synth datasets, evals — surfaces only outcomes. |
| **Tone** | Direct, opinionated, infinitive verbs. FR vouvoiement. No exclamation marks. Never sycophantic. |
| **Stance** | Honest, finds solutions, flags risks before they bite, says "I don't know" when it doesn't, **pushes back when the user is wrong** with reasoning + a citation when possible. |
| **Mission** | EN: "I'm your agentic specialist. I accompany you from first idea to production. I tell you what works, what doesn't, and what to test before promising anything." FR: *"Je suis votre spécialiste agentique. Je vous accompagne de la première idée jusqu'au passage en production. Je dis ce qui marche, ce qui ne marche pas, et ce qu'il faut tester avant de promettre quoi que ce soit."* |

### 2.2 Authority matrix

| Action | Compagnon can | Must ask |
|---|---|---|
| Edit any artifact in the centre pane | ✓ as a *proposed diff* the user accepts/rejects | — |
| Run research, fetch citations | ✓ autonomously | — |
| Generate synth data | ✓ autonomously, batches of 10 streamed live, pause-on-input | — |
| Compose / modify a Langflow flow, n8n workflow, ElevenLabs spec | ✓ during **L0 only** (L1+ is read-only); surfaces as plain-language outcomes | — |
| Generate management deck / compliance memo / status update | ✓ autonomously, drops into `/pilots/:slug/decks` | — |
| Mutate the repo (write/patch source files) | ✗ until the user accepts the **repo-changes panel** at Movement VIII | Always — every commit is user-confirmed |
| Deploy to Railway | ✗ | Triggered by user CTA at end of Movement VIII |
| Create / update an ElevenLabs agent | ✗ | Triggered by ship overlay; rolls back on failure |
| Promote L→L+1 | ✗ | Promotion dialog with checklist signoff |
| Write to production data, real customer records | ✗ | Out of scope at every level. |
| Invent a citation when research returns nothing | ✗ | Must say "research pending — I don't have a source for this" |
| Override a regulatory finding (ACPR, RGPD, AMF, EU AI Act) | ✗ | Must escalate to user with the regulatory text quoted |

### 2.3 Memory model

**One persistent chat thread per pilot, lifetime = pilot lifetime.** The thread is the *primary* memory; structured artifacts are the *referenced* memory.

```sql
chat_thread (
  id uuid pk, pilot_id uuid fk, opened_at, last_active_at,
  total_tokens int, total_cost_eur numeric(10,4), message_count int,
  active_compaction_id uuid fk,
  tenant_id text not null references tenants(id)
);

chat_message (
  id uuid pk, thread_id uuid fk,
  role text check (role in ('user','companion','system','tool')),
  content jsonb,
  attachments jsonb,
  citations jsonb,
  tools_called jsonb,
  langfuse_trace_id text, ts timestamptz,
  tokens_in int, tokens_out int, cost_eur numeric(10,4),
  tenant_id text
);
```

`pilot_artifact` is the structured memory; its kind enum widens to cover all the artefact types the Compagnon produces:

```
persona, journey_node, tools_inventory, citation, reality_check_item,
flow_node, hitl_gate, creative_ai_step,
business_case, sensitivity_scenario, capability_investment,
synth_seed_manifest, edge_case_decision,
rule, integration_contract, agreement, tension_resolution,
flow_visualization, simulated_hitl_payload, kpi, eval_rubric_proposal,
summary_snapshot, observability_bundle, recommended_l1_scenarios,
generated_deck, generated_memo, status_update,
compaction_memo, module_spec
```

Multimodal uploads (PDF / PPTX / DOCX / images / audio) → Supabase Storage, parsed via Docling, embeddings to `pgvector`, structured extraction proposed to the user as artifact diffs. Audio → Whisper transcription, then treated as text.

### 2.4 Three-layer prompt architecture

All four layers live as **Langfuse Prompts** with semver versions:

```
[BASE CHARTER]    Compagnon Charter — persona, voice, authority, refusal patterns,
                  output expectations, hard rules learned from UC-01
                  (~ 2 500 tokens, version-locked per pilot at creation)
+
[LEVEL OVERLAY]   L0_BUILD / L1_SOLO_TEST / L2_SANDBOX
                  (~ 1 000 tokens; level-specific goals, allowed tools, narration mode)
+
[MOVEMENT OVERLAY] (L0 only)
                  STEP1_PERSONAS … STEP8_SUMMARY
                  (~ 800-1 500 tokens; mission, exit criteria, allowed tools, push-back triggers)
+
[CONTEXT]         Recent thread (or compaction memo + recent messages),
                  relevant artifacts via pgvector retrieval, current centre-pane state,
                  recent Langfuse traces (L1+), user input + uploads
```

Level and movement overlays are **swappable mid-thread** — Compagnon's identity stays via [BASE]; mission updates as the pilot climbs or moves. Langfuse tracks which prompt versions were active for every turn → reproducible.

### 2.5 Tool surface per movement

Each movement declares its allowed tool set. Tools that exist in `gateway/src/gateway/routers/hermes_tools.py` today are kept; new ones add to that file.

| Tool | Status | Movements |
|---|---|---|
| `read_artifact`, `write_artifact`, `propose_diff`, `delete_artifact`, `list_artifacts`, `read_thread`, `read_compaction_memos` | new (built into engine) | All |
| `parse_document` | exists | I |
| `propose_persona` | exists (R9 closure: dynamic now) | I |
| `search_regulatory_corpus`, `regulator_lookup`, `web_search_insurance`, `corpus_search` | exists / extend | II, VI |
| `propose_flow_topology` | exists | III |
| `run_lint` | exists | III, VI, VIII (ship phase 3) |
| `compute_cost` | exists | III, IV |
| `propose_business_case` | **new** | IV |
| `seed_synth_dataset` | **new** (extends `run_synthetic_test`) | V |
| `propose_tool_contract` | exists | VI |
| `generate_compliance_memo` | **new** | VI |
| `generate_simulated_hitl` | **new** | VII |
| `seed_kpi_dashboard` | exists | VII |
| `generate_eval_rubrics` | **new** | VII |
| `generate_artifacts` | exists | VIII |
| `summarize_runs`, `diff_versions`, `propose_canary_decision` | **new** | L1+ |
| `generate_management_deck`, `draft_executive_status_update` | **new** | Any (background) |
| `propose_module_spec` | **new** | III (when adding a new module) |
| `eval_exit_criteria` | **new** (R10 closure) | All movements |

All tools emit Langfuse spans. Costs aggregate to `chat_thread.total_cost_eur`.

### 2.6 Adaptive question generator (closes R10)

Every movement declares an **exit-criteria contract** as JSON. Before letting the user advance to the next movement, the Compagnon calls `eval_exit_criteria(pilot_id, movement)` which returns:

```json
{
  "met": false,
  "missing": [
    {"field": "hitl_gates[0].cost_eur", "criterion": "must have cost_eur set"},
    {"field": "tensions_with_movement_i", "criterion": "must be resolved"}
  ],
  "suggested_questions": [
    "Pour la porte fraude, quel est le coût d'une mauvaise validation côté plateau ?",
    "L'article RGPD 22 que vous avez accepté en II contredit la porte C. On garde laquelle ?"
  ]
}
```

The Compagnon is forbidden from saying "we're done" until the evaluator returns `met: true`. The user can override (force-advance) with a recorded justification, which becomes a `concern` of severity `warning`.

The exit-criteria are themselves Langfuse Prompts (`compagnon/exit_criteria/i…viii`), versioned, so the contract evolves with the pilot vocabulary.

### 2.7 Artifact diff engine

Compagnon never silently mutates a panel. Every change goes through an `artifact_proposal` row.

```sql
artifact_proposal (
  id uuid pk,
  pilot_id uuid fk,
  artifact_id uuid fk,           -- null when creating new
  artifact_kind text,             -- redundant for filtering
  version_from int,
  proposed_content jsonb,
  rationale text,
  citations jsonb,
  originating_message_id uuid fk,
  status text check (status in ('pending','accepted','rejected','superseded')),
  decided_at timestamptz, decided_by uuid,
  tenant_id text
);
```

UI: blue diff strip in the centre pane "↳ Hermes proposed: rename persona Sophie → Sophie M. — accept · reject · argue". Accept applies + writes new `pilot_artifact` version. Argue posts a chat message addressing the proposal; Compagnon responds, may emit a new (superseding) proposal.

### 2.8 Open-concerns tracker

Per-pilot list of risks the Compagnon is actively watching.

```sql
pilot_concern (
  id uuid pk, pilot_id uuid fk,
  severity text check (severity in ('info','warning','critical')),
  title text, body text,
  origin_movement text,            -- 'i' … 'viii' or 'l1' / 'l2'
  origin_message_id uuid fk,
  status text check (status in ('open','acked','resolved')),
  resolution_artifact_id uuid fk,
  ts timestamptz,
  acked_at timestamptz, resolved_at timestamptz,
  tenant_id text
);
```

Rules:

- **Info** can be acked by user.
- **Warning** can be acked, but is auto-promoted to critical if open > 14 days.
- **Critical** can only be cleared by an artifact change Compagnon verifies. Critical concerns block ship.
- An info concern open > 7 days auto-promotes to warning. Compagnon flags the auto-promotion in chat.

### 2.9 Compaction

When the thread crosses a configurable threshold (default 120k tokens), the Compagnon generates a `compaction_memo` artifact and a *new chapter* starts referencing the memo in `[CONTEXT]`. Compaction is **visible** — the user sees a chip in the thread "↻ next chapter — summary of N messages". The user can open, edit, or delete the memo.

`chat_thread.active_compaction_id` points at the latest compaction; new messages are written under a new chapter. Older chapters are not destroyed; they remain queryable.

### 2.10 Refusal & calibrated honesty patterns

The Charter forces these phrasings (eval rubric `compagnon/policy` checks every reply):

| Trigger | EN | FR |
|---|---|---|
| Research returns nothing | "I haven't found a source for this — I can mark it *research pending* if you want." | *"Je n'ai pas trouvé de source pour ça — je peux le marquer comme **recherche en attente** ?"* |
| User proposes risky action | "I'm pushing back here:" | *"Je vous pousse là-dessus :"* |
| Won't scale to prod | "I can do it, but it'd be fragile in prod because…" | *"Je peux le faire, mais ce serait fragile en prod parce que…"* |
| Promotion attempt | "I can't deploy this — you have to sign off the promotion yourself." | *"Je ne peux pas le déployer — il vous faut faire la promotion vous-même."* |
| Tracking risks | "Three things I'm watching for you:" | *"Trois choses que je surveille pour vous :"* |
| Ship without a healthy Railway probe | "I won't ship until the gateway is green. Standby." | *"Je n'expédie pas tant que la gateway n'est pas verte. Patientez."* |

Forbidden: *"Great question"*, *"Absolutely"*, *"I'd be happy to"*, any sycophantic preamble, any emoji, any exclamation mark.

### 2.11 Cost & token budgets

| Level | Default per-thread budget | Hard pause at | Note |
|---|---|---|---|
| L0 | 80k tokens / €5 / session | budget reached → Compagnon pauses, posts "I've used all the cheap iteration budget; press `+€5` to continue or close for the day" | Cheap iteration zone |
| L1 | 300k tokens / €25 / week | weekly | Real APIs (ElevenLabs, Twilio) billed separately |
| L2 | 2M tokens / €200 / week | weekly | Sandbox load runs costed per cohort |

Budgets surface in left-rail bottom (L0) or in a future `/admin/budgets` page.

---

## 3. The eight movements at L0

Each movement is one swap of the centre pane. Left rail (8 steps + module list when relevant) and right rail (chat + open concerns) stay constant. **Anchor: the Direct Assurance pilot.** All artifacts persist as `pilot_artifact` rows.

### 3.0 Common contract

Every movement declares:

- **Goal** — what concrete state of the pilot the movement targets.
- **Centre-pane shape** — what artefact panels are visible at Tier 1.
- **Compagnon does** — the autonomous behaviour (drafts, queries, proposes diffs, asks).
- **User can** — the affordances available to the user.
- **Artifacts produced** — `pilot_artifact` kinds written by acceptance.
- **Tools allowed** — the subset of §2.5 the Compagnon can call here.
- **Exit criteria** — JSON contract evaluated by `eval_exit_criteria`.
- **Push-back triggers** — situations where the Compagnon is forced to push back.
- **Copy** — eyebrow / title / lede / sample dialogue (EN + FR).

Movements V and VII fork **per module** — the centre pane shows a module tab strip; switching tabs preserves chat thread and concerns. Per-module artefacts carry a `module_id`.

### 3.1 Movement I — Personas & current journey

**Goal.** Make the as-is process visible: who does what today, with which tools, in how much time, with which pain points. *Before any "agentic" word is said.*

**Centre pane.** Persona cards (Tier 1) + as-is journey strip (Tier 1, horizontal timeline, lanes by actor). Tier 2 expansions: full narrative, sample-day, tools used. Tier 3: photos and source quotes.

**Compagnon does.** After Step 0 intake (uploads / description), proposes 4-5 personas + 10-14 journey nodes as a *first draft* with all fields filled, citing the source ("from your slides p.3", "from our conversation 14:21"). Probes time-frames, pain points, tools.

**User can.** Drag/drop journey nodes; click to edit fields inline; click persona for narrative; add via chat ("add an underwriter persona for cross-product sales"); reset to Compagnon's draft.

**Artifacts produced.** `persona[]`, `journey_node[]`, `tools_inventory[]`. Each citation-tagged when sourced.

**Tools allowed.** `parse_document`, `propose_persona`, `read_artifact`, `write_artifact`, `propose_diff`.

**Exit criteria.**
```json
{
  "personas": {"min": 3},
  "journey_nodes": {"min": 8},
  "every_node": ["actor", "action", "tool_used"],
  "uncertain_facts": "must be either confirmed or marked 'à vérifier' as a concern (no silent guesses)"
}
```

**Push-back triggers.** User skips persona definition / journey is single-actor / a tool name is too generic ("CRM" instead of "Salesforce SC Enterprise edition?").

**Copy (FR primary).** Eyebrow `MOUVEMENT I · L'AS-IS`. Title *"Vos personas, vos systèmes, **leur journée.**"*. Lede *"Avant qu'on parle d'IA, mettons à plat ce qui se passe vraiment aujourd'hui."*

**Sample opening dialogue.**

> **Hermes** — Bonjour. Je suis votre Compagnon agentique pour ce pilote. Avant qu'on parle d'IA, j'aimerais comprendre **la journée d'aujourd'hui** : qui répond, avec quels outils, en combien de temps. Vous pouvez me coller un brief, une slide, n'importe quoi — ou juste me décrire dans vos mots.
>
> **Vous** — On a 7 cas d'usage : attestation, justificatifs, paiement…
>
> **Hermes** — Sept UC, ça dessine un programme. Je vous propose qu'on commence par **une seule** comme module de référence — Genesys exposera la même AHT pour les autres après. **Quel est le plus simple à décrire pour vous aujourd'hui ?** Attestation est le candidat naturel (peu d'outils, faible risque).

### 3.2 Movement II — Research / reality check

**Goal.** Surface constraints *before* the plan. The Compagnon does deep research and presents the regulatory + operational reality the user might be tempted to brush over.

**Centre pane.** Citation stream (Tier 1, ~ 60% width, streams live, ~ 1.5s per chip). Reality-check panel (right ~ 40%): 3-5 challenges with `flag-triangle-right` icon, revealed staggered, each cited.

**Compagnon does.** Calls `web_search_insurance` for ACPR/RGPD/Code des assurances articles, `regulator_lookup` for AI Act / RGPD article fetches, `corpus_search` for AXA internal docs. Streams 12-18 citations. Presents 3-5 reality challenges.

**User can.** Approve/reject citations; mark as *must-address* (badge appears, flows to Movement III); argue with reality-check items; add a citation manually (paste URL → Compagnon fetches and tags); ask "research deeper on X".

**Artifacts produced.** `citation[]` (binding/context tag, source URL, snippet, retrieved_at, verified flag, must_address flag), `reality_check_item[]`.

**Tools allowed.** `web_search_insurance`, `corpus_search`, `regulator_lookup`, `search_regulatory_corpus`, `read_artifact`, `write_artifact`, `propose_diff`.

**Exit criteria.**
```json
{
  "binding_citations": {"min": 3, "all_verified_or_explicitly_overridden": true},
  "reality_check_items": {"min": 1, "user_acknowledged_each": true}
}
```

**Push-back triggers.** User dismisses a binding citation; user proposes ignoring an EU AI Act / RGPD article.

### 3.3 Movement III — Plan + HITL gates

**Goal.** Reorganize the journey into a TO-BE flow not constrained by current process. Mark every HITL gate with what's validated + cost-of-error + citation. Surface creative AI steps even when not customer-facing. **For multi-module pilots, this is also where the user adds modules** (Compagnon calls `propose_module_spec`).

**Centre pane.** Vertical flow with three node kinds (tool / AI / HITL), each Tier 1 collapsed, expanding to a gate card with cost, citation, "skipping this gate would mean…", and actions.

**Compagnon does.** Drafts the TO-BE plan from journey + citations + constraints. For multi-module pilots, can split the plan view by module (tabs at the top of the centre pane). Marks each HITL with cost (AI-seeded with citation; three-axis on hover). Proposes 2-3 creative AI steps per module. **Pushes back** if user removes a binding gate, with three clean alternatives.

**User can.** Drag to reorder; click HITL → expand gate card → edit cost (warning if AI-seeded), edit "what to validate", skip-impact sentence; click AI node → see prompt + tools, edit; add nodes; mark gate as "just notification"; ask Compagnon to "rethink step N"; **add a new module** ("let's add UC-02 justificatifs").

**Artifacts produced.** `flow_node[]`, `hitl_gate[]` (cost_eur primary + cost_axes JSON), `creative_ai_step[]`, `module_spec` (one per module — see §4.2 for shape).

**Tools allowed.** `propose_flow_topology`, `propose_module_spec`, `run_lint` (advisory), `read_artifact`, `write_artifact`, `propose_diff`.

**Exit criteria.**
```json
{
  "modules": {"min": 1},
  "every_module_has": {"flow_nodes": ">=8", "hitl_gates": ">=1"},
  "every_hitl_gate": ["cost_eur", "citation", "skip_impact"],
  "every_creative_ai_step": ["rationale"],
  "tensions_with_movement_i": "resolved",
  "no_binding_citation_contradicted": true
}
```

**Push-back triggers.** User removes a binding gate; user proposes auto-pay above thresholds RGPD Art. 22 forbids; user defines an AI step without rationale.

### 3.4 Movement IV — Business case

**Goal.** Translate HITL gate costs + volume + accuracy targets into a confidence-band ROI ("estimate, refine in pilot"). Opinionated, not boardroom-hard.

**Centre pane.** Top sliders (volume, accuracy, fallback rate) seeded from Movement II. Headline ROI band as one big number with confidence interval. Sensitivity 3×3 table (collapsible). Capability investment list ("real APIs from L1 — these are budget items").

**Compagnon does.** Computes ROI band live as user drags. Generates pessimistic/realistic/optimistic scenarios. Drafts a steering-committee slide on demand (`generate_management_deck` → `/decks/`). Surfaces what's *not* in the math (operational lift, training cost).

**User can.** Drag sliders; click "what if Gate B fails 5%?" → re-run; click "draft the steering deck"; click sensitivity cell → drill-down to formula.

**Artifacts produced.** `business_case`, `sensitivity_scenario[]`, `capability_investment[]`, `generated_deck[]`.

**Tools allowed.** `propose_business_case`, `compute_cost`, `generate_management_deck`, `read_artifact`, `write_artifact`, `propose_diff`.

**Exit criteria.**
```json
{
  "sensitivity_scenarios": {"count": 3, "kinds": ["pessimistic","realistic","optimistic"]},
  "roi_band_stable_across_two_slider_sweeps": true,
  "capability_investments": {"min": 1}
}
```

**Push-back triggers.** User locks in optimistic scenario as "the number"; user omits operational lift commentary.

### 3.5 Movement V — Synth seed (per UC fork)

**Goal.** Generate the synth seed *visibly*, *slowly*, with the user able to redirect mid-stream. The user must *see this happening* — it's a trust-building moment. **This is where the per-UC golden test seeds are decided.**

**Centre pane.** Module tab strip. Per module: streaming generation panel (left ⅔) + shape settings panel (right ⅓: Tier 1 = count, language mix, fraud rate; Tier 2 = severity, time range, accents, edge-case checkboxes). Bottom: scrubbable manifest with pause/resume.

**Compagnon does.** Narrates each batch in chat. Surfaces edge cases proactively. Pauses on user input. Generates per `agent_setup §5.1` distribution: 20% happy / 15% multi-entity / 15% multi-contract / 12% fallback / 10% channel variant / 8% KYC fail / 8% requests human / 5% fraud / 5% non-French / 2% optional missing.

**User can.** Watch records stream; pause/resume; edit settings live; type "more multi-vehicle" → redirect; click any record to see in full; click "approve seed for UC-XX" → seed locks for that module.

**Artifacts produced (per module).** `synth_seed_manifest`, generated rows in test schema, `edge_case_decision[]`, **`golden_cases` JSON** (this is the data ship phase 2 will use for `tests/test_<uc>_golden.py`).

**Tools allowed.** `seed_synth_dataset`, `run_synthetic_test` (validators), `read_artifact`, `write_artifact`, `propose_diff`.

**Exit criteria (per module).**
```json
{
  "approved_batches": {"min": 1},
  "golden_cases_count": "agent_setup §5.2 minimum by risk_level",
  "validators": {"schema": "pass", "distribution": "pass", "anti_pii": "pass", "persona_fidelity": "pass"}
}
```

**Push-back triggers.** User approves a seed below the tier minimum; PII regex hits.

### 3.6 Movement VI — Charter

**Goal.** Lock unbreakable rules + integration contracts + AI-human agreements in one signed charter. **Surface tensions.**

**Centre pane.** Three stacked panels — hard rules / integrations / agreements — plus a tension banner ("Tension detected: you said X at I, plan III allows Y. Which wins?").

**Compagnon does.** Compiles the three lists. Runs `lint_capability_manifest` (every integration declared has contract + auth + owner). Generates compliance memo on demand.

**User can.** Edit any rule/integration/agreement; add a rule manually; resolve tensions; click "Sign charter" → all three panels lock + Movement VII unlocks.

**Artifacts produced.** `rule[]`, `integration_contract[]` (per module + per shared system), `agreement[]`, `tension_resolution[]`, `compliance_memo`.

**Tools allowed.** `propose_tool_contract`, `run_lint`, `generate_compliance_memo`, `read_artifact`, `write_artifact`, `propose_diff`.

**Exit criteria.**
```json
{
  "hard_rules": {"min": 5, "every_one_has_citation_or_explicit_user_authorship": true},
  "integration_contracts": {"covers_every_module_tool": true},
  "agreements": {"min": 1},
  "tensions_resolved": "all",
  "capability_manifest_lint": "green"
}
```

**Push-back triggers.** User signs the charter with an unresolved tension; an integration contract has no owner.

### 3.7 Movement VII — Rehearsal (per UC fork)

**Goal.** Show the operator-side (conseiller / réviseur AXA) experience for every gate at L1+. Lock KPIs split between human-pre baseline and AI-during measurement.

**Centre pane.** Module tab strip. Top ⅔: visual flow canvas (read-only-ish). Click any HITL node → opens **simulated HITL experience** (faithful preview of operator UI). Bottom ⅓: KPI dashboard, two columns (human-baseline / AI-target).

**Compagnon does.** Renders the flow. Generates faithful simulated HITL UI for each gate using the Chatwoot bridge UI as template (the screen the conseiller / réviseur will see at L1+). Proposes KPIs split correctly. Justifies each.

**User can.** Click HITL node → walk through simulated experience; edit KPI threshold; add custom KPI; ask "what if Gate B fails 5%?"; mark a node "richer instrumentation here".

**Artifacts produced (per module).** `flow_visualization`, `simulated_hitl_payload[]`, `kpi[]`, `eval_rubric_proposal[]`.

**Tools allowed.** `generate_simulated_hitl`, `seed_kpi_dashboard`, `generate_eval_rubrics`, `read_artifact`, `write_artifact`, `propose_diff`.

**Exit criteria (per module).**
```json
{
  "simulated_hitl_for_every_gate": true,
  "kpis": {"min_per_pillar": 1},
  "eval_rubrics": {"min": 3}
}
```

**Push-back triggers.** A gate has no simulated HITL; a KPI lacks a measurement strategy.

### 3.8 Movement VIII — Summary

**Goal.** Calm, complete review. Everything decided is here, on one scrollable page, editable in-place. Ship CTA at bottom triggers ship overlay (§4). **The repo-changes panel lives here.**

**Centre pane.** Long, scannable single page. Each section collapsed to Tier 1 by default. Default expanded: pilot identity + headline ROI + observability bundle + **repo-changes panel**.

Sections (one row each):

1. Pilot identity
2. Personas
3. Citations (binding only, count of context)
4. Plan + HITL gates (per module mini-flow)
5. Business case
6. Synth seed (per module manifest summary)
7. Charter (signed rules / integrations / agreements)
8. Flow + KPIs (per module mini)
9. Observability bundle (Langfuse project, eval rubrics, datasets, alerts)
10. Risks open (open-concerns content persisted)
11. Decks generated
12. **Repo changes** — the ship preview (see §4.7)

**Compagnon does.** Generates summary by reading every artifact. Re-runs `run_lint` on full bundle — surfaces unresolved as red banners. Drafts one-page executive summary PDF. Surfaces "three things I'd test first at L1" — recommended first-call scenarios.

**User can.** Edit any section in-place (propagates back to source); click section header → jump to source movement; click "Generate & ship to L1" → ship overlay; click "Save & invite a reviewer" → shareable read-only link.

**Artifacts produced.** `summary_snapshot` (canonical pilot definition at ship time, hash-anchored), `observability_bundle`, `executive_summary.pdf`, `recommended_l1_scenarios[]`, `repo_change_set` (one row per module).

**Tools allowed.** `run_lint` (full), `generate_artifacts`, `read_artifact`, `write_artifact`, `propose_diff`.

**Exit criteria.**
```json
{
  "lint_full_bundle": "green or every finding explicitly overridden",
  "critical_concerns_open": 0,
  "charter_signed": true,
  "modules_ready_for_ship": ">= 1",
  "repo_change_set_present_for_each_ready_module": true
}
```

**Push-back triggers.** User attempts ship with critical concerns open; user attempts ship with no module ready.

### 3.9 Per-movement exit-criteria contracts (consolidated)

The eight JSON contracts live as `compagnon/exit_criteria/i…viii` Langfuse Prompts. Implementation note: the `eval_exit_criteria` tool reads the contract, queries the relevant `pilot_artifact` rows, returns `met / missing / suggested_questions`. The Compagnon's movement overlay prompt instructs it to call this tool before suggesting "we can move on".

---

## 4. UC-01 fidelity → Ship overlay

This section is the heart of the rework's operational fidelity. Without this, the builder is a story-telling wizard that doesn't deploy anything.

### 4.1 Manual UC-01 delivery → ship phases (mapping)

Eduardo wired UC-01 (Claire) by hand. The pattern was extracted into `.agents/skills/hermes/agent_setup/SKILL.md`. The ship overlay must reproduce all 14 manual steps automatically and verifiably.

| # | Manual step (UC-01) | Output artefact | Ship phase | How the builder does it |
|---|---|---|---|---|
| 1 | Parse UC spec (uc_code, agent_name, risk_level, kyc_level, has_payment, tools[], flow_steps[], escalation_triggers[]) | `module_spec.yaml` (jsonb) | L0 / Movement III | Compagnon extracts during plan; user confirms each gate; persisted as `module_spec` artefact. |
| 2 | Add UC-specific synth entities (children for UC-01); regen cache | synthdata patch + `.cache_da_synth.json` | Phase 2 · Composition | Compagnon proposes a Python diff to `direct_assurance.py`; accepted in Movement V; cache regen server-side. |
| 3 | Implement tool functions (UC-specific only; reuse shared) | `tools/direct_assurance.py` patch | Phase 2 | Generated from `module_spec.tools[]` using `agent_setup §3` templates. |
| 4 | Register tool in `TOOL_REGISTRY` + add router endpoint | `routers/da_tools_router.py` patch | Phase 2 | Identical pattern; auto-emits POST `/tools/<name>`. |
| 5 | Write system + safety prompts (file-system) | `prompts/direct-assurance/<uc-slug>/{system,safety}.txt` | Phase 2 | Compagnon drafts using `agent_setup §4` templates + `module_spec`; also registered as Langfuse Prompts; ElevenLabs config inlines the file content. |
| 6 | Generate golden test cases | `tests/test_<uc>_golden.py` + golden_cases JSON | Phase 2 | Compagnon generates per `agent_setup §5` distribution; minimum count by risk level (40/50/60). The seed approved at Movement V is the input. |
| 7 | Build ElevenLabs agent config JSON | `infra/elevenlabs/<uc>-agent-config.json` | Phase 2 | Static template + filled fields. **TTS hard-locked to `eleven_v3_conversational`** (lint enforces in phase 3). |
| 8 | Push gateway repo to Railway service | Railway `deploy_id` | Phase 4 · Wire | Via Railway MCP: commit current branch, trigger deploy on `agentic-voice-gateway` service, monitor build status. |
| 9 | Wait for healthy deploy + curl `/healthz` | Railway URL (cached) | Phase 4 | Polls Railway MCP `list-deployments` until `SUCCESS`; then `curl https://<svc>.up.railway.app/healthz`. Fail → roll back this phase. |
| 10 | Delete old ElevenLabs tools (if updating) + create new ones with Railway URL | `tool_ids[N]` | Phase 4 | Direct ElevenLabs REST calls (POST `/v1/convai/tools`); URL = `{railway_url}/tools/<name>`; idempotent — old tools deleted before create. |
| 11 | Create / update ElevenLabs agent + link tools | `agent_id` | Phase 4 | POST `/v1/convai/agents/create` with full config + tool_ids. **Lint guard:** `tts.model_id == eleven_v3_conversational`. |
| 12 | Patch `.env.local` (gateway URL, agent_id, tool_ids) | `.env.local` diff + Railway variable set | Phase 5 · Anchor | Builder writes `ELEVENLABS_UC<XX>_*` entries; uses Railway variables for prod. |
| 13 | Run pytest (full module suite + golden tests) | test report (N/N green) | Phase 6 · Verify | Triggered against the Railway deploy via gateway; failure pauses overlay with the failing test names + Compagnon diagnosis. |
| 14 | Smoke call: one synthetic claim end-to-end | Langfuse trace + run snapshot | Phase 6 | Synth-call orchestrator plays one golden case through the agent; checks tool round-trips happened against Railway; checks Langfuse received the trace. |

### 4.2 Module spec format

The canonical spec for a module — the input to ship phase 2.

```yaml
uc_code: "UC-01"
slug: "attestation"
agent_name: "Claire"
risk_level: "low"               # low | medium | high
kyc_level: "standard"           # standard | strong
has_payment: false
language: "fr"                  # primary
tools:
  - name: "verify_identity"
    shared: true                # shared across UCs
  - name: "get_contracts"
    shared: false
  - name: "get_children"
    shared: false
  - name: "generate_attestation"
    shared: false
    side_effect: true
    idempotency_key: "contract_id + child_id + year"
  - name: "send_attestation"
    shared: false
    side_effect: true
    idempotency_key: "contract_id + channel"
  - name: "escalate_to_advisor"
    shared: true
flow_steps:
  - "Greet and disclose AI nature"
  - "Ask for contract number"
  - "Verify identity (KYC)"
  - "List children covered"
  - "Generate attestation for selected child(ren)"
  - "Send via email or SMS"
  - "Confirm and close"
escalation_triggers:
  - trigger: "KYC fails twice"
    reason: "kyc_failed"
    queue: "attestation"
  - trigger: "Fraud keywords"
    reason: "fraud_suspected"
    priority: 4
acceptance:
  - "≥ 95% identity verification on golden cases"
  - "≥ 90% containment (no advisor needed)"
  - "≤ 90s average call duration"
prompts:
  system_template: "agent_setup §4.1"
  safety_template: "agent_setup §4.2"
golden_cases:
  count: 40                     # per agent_setup §5.2 (risk_level=low → 40)
  distribution:
    happy_path: 0.20
    multi_entity: 0.15
    multi_contract: 0.15
    fallback: 0.12
    channel_variant: 0.10
    kyc_fail: 0.08
    requests_human: 0.08
    fraud: 0.05
    non_french: 0.05
    optional_missing: 0.02
elevenlabs:
  voice_id: "21m00Tcm4TlvDq8ikWAM"
  llm: "gemini-2.5-flash"
  tts_model_id: "eleven_v3_conversational"   # hard-locked
  asr_keywords: ["attestation", "scolaire", "enfant", "fraude", "arnaque"]
```

### 4.3 Composition phase outputs

Phase 2 produces, per module:

- A patch to `gateway/src/gateway/synthdata/direct_assurance.py` adding new entities + `generate_<entity>()` methods.
- A patch to `gateway/src/gateway/tools/direct_assurance.py` adding the UC-specific tool functions and registering them in `TOOL_REGISTRY`.
- A patch to `gateway/src/gateway/routers/da_tools_router.py` adding the new POST endpoints.
- New files: `prompts/direct-assurance/<uc-slug>/system.txt`, `prompts/direct-assurance/<uc-slug>/safety.txt`.
- A new file: `gateway/tests/test_<uc>_golden.py` and a JSON file with the golden cases.
- A new file: `infra/elevenlabs/<uc>-agent-config.json`.
- A patch to `.env.local` (and Railway variables) with `ELEVENLABS_UC<XX>_*` entries.

These compose into a **`repo_change_set`** row presented in the Movement VIII repo-changes panel for user review before ship is triggered.

Pilot-level phase-2 outputs (run once, not per module):

- Twilio templates (if any of the modules use SMS).
- Salesforce metadata diff (if any of the modules write to Salesforce).
- Genesys mapping (if any of the modules answer Genesys calls).

### 4.4 Wire chain (phase 4)

In strict order:

1. Commit the change set as a single signed commit on a fresh branch `deliver/builder/<pilot-slug>/<module-slug>/<ts>`.
2. Trigger Railway deploy on `agentic-voice-gateway` (single shared service per the open-question default).
3. Poll `mcp__Railway__list-deployments` until `SUCCESS`. Fail-timeout 5 minutes → cancel + roll back.
4. `curl {railway_url}/healthz`. Non-200 → cancel + roll back.
5. For each module:
   1. List existing ElevenLabs tools matching the module's tool URLs.
   2. Delete them (clean slate).
   3. POST `/v1/convai/tools` for each new tool with URL = `{railway_url}/tools/<name>`.
   4. Capture `tool_id` for each.
   5. POST `/v1/convai/agents/create` (or PATCH if `agent_id` already in `pilot_module`) with the full config + `tool_ids`.
   6. Verify the response: `tts.model_id == eleven_v3_conversational`, `linked_tools.length == module.tools.length`.

All ElevenLabs calls idempotent. Cancellation at any sub-step undoes that step before propagating cancel up.

### 4.5 Lint hard rules (learned from UC-01)

These are **blocking** in phase 3, not warnings:

- `tts.model_id == "eleven_v3_conversational"` for every module's ElevenLabs config.
- No `localhost` in any tool URL.
- Tool URLs match the Railway URL of the latest healthy deploy.
- `system.txt` length ≥ 2 000 characters.
- `safety.txt` covers all module's `escalation_triggers`.
- Golden test count ≥ tier minimum (40 / 50 / 60 by risk_level).
- ASR keywords include at least 3 domain terms + 2 fraud terms (`fraude`, `arnaque`, `pas mon contrat`, `je porte plainte`).
- Capability manifest lint green (existing `run_lint`).
- Anti-PII regex on the synth corpus (existing `run_synthetic_test` validator).
- RGPD Art. 22 conformance for any module with `has_payment: true` and threshold > €4 000 (must have HITL gate or explicit user override at Movement III).
- AI Act Art. 50 disclosure must be in `system.txt` for every module.

### 4.6 Failure modes & rollback

If any phase fails:

1. Overlay **pauses** at that phase. Diagram freezes on failed node (red halo).
2. Build-log shows failure line in red with one-sentence plain-language explanation by the Compagnon.
3. Chat rail receives a Compagnon message proposing concrete next steps.
4. Status-ribbon buttons appear: `Let companion fix · Jump to source · Cancel ship`.
5. **Nothing partial is left wired.** Cancel after phase 4 → orchestrators roll back created ElevenLabs agents/tools, undo Railway-set variables, delete the unmerged branch (or leave it for manual review per user preference, configurable). Compagnon confirms each rollback step.

`ship_phase_event` records every step including its rollback equivalent, so a failed ship can be **resumed** rather than re-run from zero (idempotency keys make this safe).

### 4.7 Repo-changes panel (Movement VIII)

The user does not press "ship" without seeing the repo changes. Layout:

- **Header** — module count, total file count, total lines added/removed.
- **Per-module group**, collapsible. Each shows:
  - File list (synthdata patch, tools.py patch, router.py patch, system.txt, safety.txt, golden tests, agent-config.json, .env.local entries).
  - Per-file: unified diff with syntax highlighting, accept/reject toggle.
  - "Inspect ElevenLabs config" button → modal with the agent-config JSON pretty-printed.
- **Footer** — "Generate & ship to L1 →" CTA, disabled until at least one module has all files accepted.

Reject of any single file in a module → that module is dropped from this ship (user can re-include in a later ship). Accept-all per module / accept-all everything are toggles.

The change set is hashed (`bundle_sha`) at the moment of ship trigger; the same hash is signed and written to `provenance.json` in phase 5.

---

## 5. L1 first-arrival + L2 architectural sketch

### 5.1 L1 hero + module selector

The user lands on `/pilots/da-direct-assurance/test` after a successful ship. The hero shows:

- An eyebrow `YOUR PILOT IS LIVE AT L1 · v0.4.2`.
- Title `Call your pilot — it's listening.`
- A 3-step guide: dial → say voucher code → describe a fictional case.
- A **module card** showing the currently-selected module's DNIS + voucher code.
- Below: "3 first-call scenarios I'd recommend ↓" expander.

The left rail at L1 is a **module selector**: one row per module shipped (UC-01 Attestation, UC-02 Justificatifs, …) with the DNIS + voucher visible. Clicking a module switches the hero card. Below the selector: recent runs (newest first) and the L1→L2 readiness tile.

### 5.2 Live narration mode

When a call hits ElevenLabs, the Compagnon switches to **live narration mode**. Short time-stamped messages every 2-4s, each tied to an actual Langfuse span:

- *"14:58:02 · agent picked up · disclosure delivered (1.4 s)"*
- *"14:58:11 · policy lookup OK · POL-2024-7741 valid"*
- *"14:58:18 · KYC verified (pass on 1st try)"*
- *"14:58:34 · attestation generated · Pierre, 11 ans"*
- *"14:58:41 · sent via SMS · +33 6 XX XX XX XX"*
- *"14:58:48 · run complete · 49 s · €0.034 · all gates clean"*

The narration prompt is a Langfuse Prompt (`compagnon/level/l1_solo_test`); it is short, factual, time-stamped, plain-language. Failures are marked with a `▼` and an explanation in the next message.

### 5.3 Post-run review panel

Slides in from the right after call ends. Sections, top to bottom:

1. **Run header** — id, duration, cost, end-state, Langfuse trace deep-link.
2. **KPI scorecard** — every Movement VII KPI with this-run value vs target, green/amber/red dots.
3. **Gate-by-gate** — each gate fired (or not), AI reasoning, operator action.
4. **Audio playback** — actual ElevenLabs conversation playable in-place (transcript next to waveform; click any word to seek).
5. **Operator feedback prompt** — *"What surprised you? What worked? What didn't?"* Free-text → `pilot_feedback` artifact, fuels L1→L2 promotion.
6. **What I'd change** — Compagnon observations, e.g. *"Latency was 49 s, target 35 s. The KYC step took 14 s — I'd cache the rubric. Want me to draft the change?"*

### 5.4 L1 → L2 promotion checklist

| # | Criterion | EN | FR |
|---|---|---|---|
| AC-L1.1 | At least 5 successful end-to-end runs (per module) | "≥ 5 successful runs per module" | "≥ 5 runs réussis par module" |
| AC-L1.2 | Business-user signoff (`pilot_feedback` with `signoff=true`) | "Business owner has signed off" | "Le métier a validé" |
| AC-L1.3 | Zero critical Langfuse alerts in last 24h | "No critical alerts in 24h" | "Aucune alerte critique sur 24h" |
| AC-L1.4 | Cost per run under target | "Cost-per-run ≤ target" | "Coût par run ≤ cible" |
| AC-L1.5 | No open critical concerns from Compagnon | "No open critical concerns" | "Aucune préoccupation critique ouverte" |

When all five green, `Promote to L2` enables. Click → mini ship overlay (~ 10 s) re-anchors bundle, switches L2 sandbox runner to active, centre pane swaps to L2 sandbox-load surface. Staircase fills segment 3.

### 5.5 L2 sandbox-load architectural sketch

Full UI design deferred. **What we deliver in S5:** the route exists, the centre pane renders the six-panel layout, the cohort runner controller posts to a stub endpoint, the drift-detector reads from Langfuse but doesn't alarm. Compagnon at L2 stays in narration mode but with the analyst overlay (`compagnon/level/l2_sandbox`).

Six panels per the [2026-05-04 spec §7.1](./2026-05-04-builder-rework-design.md#71-l2--sandbox-load-synthetic-cohort): cohort run controller / live throughput / gate trigger heat-map / latency distribution / drift detector / comparative analysis. Operator UI sketches in that document remain the reference for full-build sprints.

L2 → L3 + L3 → L4 promotion checklists: see 2026-05-04 spec §7.

---

## 6. Backend

### 6.1 Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│ Next.js cockpit · /pilots/:slug (replaces /builder)                    │
│   <PilotWorkspace>                                                     │
│     ├ <Staircase>                                                      │
│     ├ <LeftRail>  (movements + module selector)                        │
│     ├ <MovementCanvas>  (8 panes, swappable)                           │
│     │    ├ <ArtifactProposalDiff>  (blue strips)                       │
│     │    ├ <PerMovementToolPanels>                                     │
│     │    └ <RepoChangesPanel>  (Movement VIII)                         │
│     ├ <CompanionRail>  (extends chat-slide-over.tsx SSE pattern)       │
│     │    ├ <OpenConcernsList>                                          │
│     │    └ <ChatStream>  (cite gate, audit posting)                    │
│     ├ <ShipOverlay>  (build log + live diagram)                        │
│     └ <L1Hero> + <ModuleSelector> + <RunReview>                        │
└──────────────────┬─────────────────────────────────────────────────────┘
                   │ NEXT_PUBLIC_GATEWAY_URL
                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ agent-gateway (FastAPI) · existing service, extended                   │
│   routers/                                                             │
│     pilots_router.py            ← extend                                │
│     chat_router.py              ← re-key (/pilots/{slug}/messages)      │
│     hermes_tools.py             ← extend (5 new tools)                  │
│     da_tools_router.py          ← unchanged                             │
│     audit_router.py             ← unchanged                             │
│     builder_router.py           ← deprecate (S5)                        │
│   orchestrators/                                                        │
│     module_composer.py          ← NEW                                   │
│     railway_orchestrator.py     ← NEW                                   │
│     elevenlabs_orchestrator.py  ← NEW                                   │
│     ship_runner.py              ← NEW                                   │
│   hermes/                       ← NEW module                            │
│     prompts/charter.py                                                  │
│     prompts/level_overlays.py                                           │
│     prompts/movement_overlays.py                                        │
│     conversation_engine.py                                              │
│     diff_engine.py                                                      │
│     concern_tracker.py                                                  │
│     compaction.py                                                       │
│     adaptive_questions.py                                               │
│   citation_gate.py              ← unchanged                             │
│   builder_fsm.py                ← extend (widen states)                 │
└────────────────────────────────────────────────────────────────────────┘
                   │
   ┌───────────────┼───────────────────────────────────────┐
   ▼               ▼                                       ▼
Supabase        Langfuse                          ElevenLabs / Railway
(10 new mig.)   (Compagnon prompts +              (orchestrator targets)
                per-UC system/safety)
```

### 6.2 Supabase migrations 0009 → 0018

| # | Migration | What it adds |
|---|---|---|
| 0009 | `0009_pilots.sql` | `pilot` table (id, slug, domain, level, version, owner, facilitator, parent_id, language, tenant_id) + RLS |
| 0010 | `0010_pilot_modules.sql` | `pilot_module` (id, pilot_id, uc_code, slug, agent_name, risk_level, kyc_level, has_payment, status, agent_id, gateway_url, module_spec jsonb) + RLS |
| 0011 | `0011_chat_thread_per_pilot.sql` | `chat_thread` (id, pilot_id, opened_at, last_active_at, total_tokens, total_cost_eur, message_count, active_compaction_id, tenant_id) + `chat_message` (id, thread_id, role, content jsonb, attachments, citations, tools_called, langfuse_trace_id, ts, tokens_in, tokens_out, cost_eur, tenant_id) + RLS |
| 0012 | `0012_pilot_artifacts.sql` | `pilot_artifact` (id, pilot_id, module_id null, kind, version, content jsonb, parent_id, retired_at, created_by, signed_off_by, signed_off_at, tenant_id) — kind enum covers all 28 types from §2.3 |
| 0013 | `0013_artifact_proposals.sql` | `artifact_proposal` (id, pilot_id, artifact_id, artifact_kind, version_from, proposed_content jsonb, rationale, citations jsonb, originating_message_id, status, decided_at, decided_by, tenant_id) |
| 0014 | `0014_pilot_concerns.sql` | `pilot_concern` (id, pilot_id, severity, title, body, origin_movement, origin_message_id, status, resolution_artifact_id, ts, acked_at, resolved_at, tenant_id) |
| 0015 | `0015_pilot_level_history.sql` | `pilot_level_history` (id, pilot_id, level, entered_at, exited_at, signed_by, ac_passed jsonb, signoff_note, tenant_id) |
| 0016 | `0016_ship_runs.sql` | `ship_run` (id, pilot_id, started_at, finished_at, status, langfuse_session_id, total_cost_eur, bundle_sha, tenant_id) + `ship_phase_event` (id, ship_run_id, phase, module_id null, event_type, line, ts, status, payload jsonb, tenant_id) |
| 0017 | `0017_pilot_citations.sql` | `pilot_citation` (id, pilot_id, ref, title, snippet, url, retrieved_at, verdict, must_address, binding, source_movement, tenant_id) — promotes the in-message citation cache to first-class |
| 0018 | `0018_repo_change_sets.sql` | `repo_change_set` (id, pilot_id, module_id, branch, files jsonb [{path, op, before_sha, after_sha, content}], status, commit_sha, ts, tenant_id) |

Every new table: `tenant_id text not null references tenants(id)` + RLS policy in same migration. Service-role bypasses (single-tenant MVP).

### 6.3 Gateway routes

Reproduced compactly (full per-route schema lives in the implementation plan):

- `/pilots` GET POST · `/pilots/{slug}` GET PATCH
- `/pilots/{slug}/modules` GET POST · `/pilots/{slug}/modules/{slug}` GET PATCH
- `/pilots/{slug}/messages` GET POST(SSE) — re-keyed chat
- `/pilots/{slug}/artifacts` GET · `/pilots/{slug}/artifacts/proposals` GET POST
- `/pilots/{slug}/concerns` GET POST PATCH
- `/pilots/{slug}/exit-criteria/{movement}` GET — R10 closure
- `/pilots/{slug}/repo-changes` GET POST
- `/pilots/{slug}/ship` POST(SSE)
- `/pilots/{slug}/level/{n}/promote` POST
- `/hermes/tools/propose_business_case` POST (new)
- `/hermes/tools/seed_synth_dataset` POST(SSE) (new)
- `/hermes/tools/generate_simulated_hitl` POST (new)
- `/hermes/tools/propose_module_spec` POST (new)
- `/hermes/tools/eval_exit_criteria` POST (new — R10)
- `/hermes/tools/generate_compliance_memo` POST (new)
- `/hermes/tools/generate_eval_rubrics` POST (new)
- `/orchestrators/{composer,railway,elevenlabs}/*` — server-only, called by ship_runner

### 6.4 Langfuse Prompts registry

```
Compagnon (cocreation):
  compagnon/charter                       v1
  compagnon/level/l0_build                v1
  compagnon/level/l1_solo_test            v1
  compagnon/level/l2_sandbox              v1
  compagnon/movement/i_personas           v1
  compagnon/movement/ii_research          v1
  compagnon/movement/iii_plan             v1
  compagnon/movement/iv_business_case     v1
  compagnon/movement/v_synth_seed         v1
  compagnon/movement/vi_charter           v1
  compagnon/movement/vii_rehearsal        v1
  compagnon/movement/viii_summary         v1
  compagnon/ship_overlay                  v1
  compagnon/exit_criteria/{i…viii}        v1   (closes R10)

Per-UC runtime (registered at ship):
  direct_assurance/uc01/system            v1
  direct_assurance/uc01/safety            v1
  direct_assurance/uc02/system            …
  …
```

Update flow for a per-UC prompt: edit the source file → next ship registers a new Langfuse version → ElevenLabs agent config inlines the new content → the previous version is preserved in Langfuse for traceability.

### 6.5 Three orchestrators

**`module_composer.py`** — pure-function module: `compose(module_spec) → list[FilePatch]`. Templates from `agent_setup §2-§5`. No I/O; the caller writes the patches.

**`railway_orchestrator.py`** — wraps Railway MCP tools (`mcp__Railway__*`). Methods: `deploy(branch, service)`, `wait_for_deployment(deploy_id, timeout)`, `health_check(url)`, `set_variables(service, kv)`, `generate_domain(service)`, `rollback(service, to_deploy_id)`. All idempotent.

**`elevenlabs_orchestrator.py`** — wraps ElevenLabs REST API. Methods: `list_tools(filter)`, `delete_tool(id)`, `create_tool(spec)`, `create_or_update_agent(spec, agent_id?)`, `link_tools(agent_id, tool_ids)`, `verify_agent_config(agent_id, expected)`. All idempotent. Reads `ELEVEN_LABS_KEY` from env.

### 6.6 `ship_runner.py`

Orchestrates the six phases per pilot. Pseudocode shape:

```python
async def run_ship(pilot_id, modules_to_ship, sse_send):
    run_id = await create_ship_run(pilot_id)
    try:
        for phase in (provision, compose, lint, wire, anchor, verify):
            await sse_send(f"phase {phase.id} · starting")
            await phase.execute(pilot_id, modules_to_ship, run_id, sse_send)
            await sse_send(f"phase {phase.id} · done")
        await mark_run_complete(run_id, "success")
    except ShipFailure as e:
        await sse_send(f"phase {e.phase} · failure: {e.user_message}")
        await rollback(run_id, up_to_phase=e.phase)
        await mark_run_complete(run_id, "failed")
```

Each phase is a separate function that records `ship_phase_event` rows. Cancel at any phase triggers rollback for that phase + all earlier phases.

### 6.7 Builder FSM widening

Today: `intake → research → plan → approve → build → lint → preview → deploy`. The 8 movements map to the existing states for back-compat:

| Movement | Existing FSM state |
|---|---|
| Movement I — Personas | `research` |
| Movement II — Research | `research` |
| Movement III — Plan | `plan` |
| Movement IV — Business case | `plan` |
| Movement V — Synth seed | `plan` |
| Movement VI — Charter | `approve` |
| Movement VII — Rehearsal | `preview` |
| Movement VIII — Summary | `preview` |
| Ship overlay | `build → lint → deploy` |

`pilot.level` is the new authoritative field; the FSM `state` is computed from `level + movement` for back-compat with existing tests. After S5, `BuilderSession` is replaced by `pilot` directly; migration 0009 carries the data forward.

### 6.8 Citation gate, audit, RLS continuity

The existing `citation_gate.py` is unchanged; the chat router invokes it on every Compagnon turn before responding. Every artifact proposal that includes citations runs through the gate; rejected citations are returned with a `verdict` field, the user sees the verdict on the proposal card.

Every artifact mutation (proposal accept, repo-change-set commit, level promotion, ship phase event) writes an `audit_log` row via the existing fire-and-forget pattern. Audit row schema unchanged.

RLS: every new table follows the `tenant_id` + `using (tenant_id = current_setting(...))` policy from migrations 0001-0008. Service-role bypasses; the gateway uses the service role; the chat router rotates per-tenant before queries (single-tenant MVP → always `gdai-default`).

---

## 7. Hermes AI deliverables

This section enumerates what we have to **write**, not what we have to wire (the wiring is in §6).

### 7.1 BASE Charter

`compagnon/charter` — ~ 2 500 tokens. Sections:

1. Persona & voice (§2.1)
2. Authority matrix (§2.2)
3. Forbidden phrases (§2.10)
4. Calibrated honesty patterns (§2.10)
5. UC-01-derived hard rules: never invent a tool URL · never deploy without a healthy Railway probe · never register an ElevenLabs agent with TTS ≠ `eleven_v3_conversational`.
6. Tool surface contract (calls expected, output schema).

### 7.2 Level overlays

- `compagnon/level/l0_build` — ~ 1 000 tokens. Goal: co-create the pilot. Tone: opinionated, asks questions, proposes diffs. Context: open-concerns + recent artifacts + current movement state.
- `compagnon/level/l1_solo_test` — ~ 1 000 tokens. Goal: narrate live calls. Tone: terse, time-stamped, factual. Context: Langfuse spans of live run + module spec.
- `compagnon/level/l2_sandbox` — ~ 1 000 tokens. Goal: analyse cohort. Tone: analyst-grade observations. Context: cohort run aggregates + drift signals.

### 7.3 Movement overlays

Eight prompts, each ~ 800-1 500 tokens. Per movement: mission, allowed tools, exit-criteria reminder, opening dialogue template, push-back triggers, sample push-back phrasings, output expectations (when to write `propose_diff`, when to write a chat reply).

### 7.4 Exit-criteria specs

Eight JSON contracts (per §3.9 + §3.1-§3.8). Implementation: `eval_exit_criteria` reads the contract, queries `pilot_artifact` rows for the pilot+movement, returns `met / missing / suggested_questions`. The Compagnon's movement overlay prompt instructs it to call the tool before suggesting "we can move on".

### 7.5 `agent_setup` skill upgrade

The skill at `.agents/skills/hermes/agent_setup/SKILL.md` is kept as the human-readable canonical pattern. Add:

- `.agents/skills/hermes/agent_setup/scripts/agent_setup_runner.py` — programmatic runner. Accepts `module_spec.yaml` + flags (`--dry-run`, `--skip-deploy`, `--skip-elevenlabs`). Runs sections 1-11 idempotently. Returns a structured JSON of artefacts produced + IDs.
- `.agents/skills/hermes/agent_setup/templates/` — extracted Jinja templates for `system.txt`, `safety.txt`, `tools/<name>.py`, `tests/test_<uc>_golden.py`, `infra/elevenlabs/<uc>-agent-config.json`.

The gateway's `module_composer` imports the runner; the skill stays usable by Claude Code from the CLI for manual fallback or one-off recovery.

### 7.6 Eval rubrics

Three new LLM-judge rubrics, registered in Langfuse, run on every Compagnon turn at L0 and sampled at 10% at L1+:

- **factual** — every numeric / regulatory / system claim must have either a citation or a "research pending" caveat.
- **policy** — no forbidden phrases (§2.10); no localhost / no TTS-not-v3 / no claim of having deployed without verification.
- **tone** — direct, infinitive verbs, no exclamation marks, no sycophantic preambles, FR vouvoiement when language is FR.

Failures auto-create a critical concern.

### 7.7 Ship overlay overlay

`compagnon/ship_overlay` — narration mode for build phases. Tone: terse, monospace-friendly lines, plain-language failure explanations, "let me fix · jump to source · cancel" chip set always offered on failure.

---

## 8. Migration plan

### 8.1 Five sprint slices

| Slice | Scope | Risk | Old code state |
|---|---|---|---|
| **S1 · Foundation** | Migrations 0009-0014; `pilots`/`messages`/`artifacts`/`concerns`/`proposals` routes; `hermes/conversation_engine` + `diff_engine` + `concern_tracker` + `adaptive_questions`; charter + level + movement Langfuse prompts (i, ii, iii); `/pilots`, `/pilots/new`, `/pilots/:slug/build` shell with movements i-iii live | Low — runs alongside | `/builder` still serves `<DirectAssuranceStudio>`; new builder behind feature flag |
| **S2 · Composition** | Movements iv-viii (business case, synth seed streaming, charter, rehearsal, summary); repo-changes panel; `propose_business_case` + `seed_synth_dataset` + `generate_simulated_hitl` + `propose_module_spec` + `generate_compliance_memo` + `generate_eval_rubrics` tools; exit-criteria endpoint per movement; compaction | Medium | `/builder` still default; flag flip enables new path internally |
| **S3 · Ship** | Migrations 0016-0018; `module_composer` + `railway_orchestrator` + `elevenlabs_orchestrator` + `ship_runner`; ship overlay UI (build log + live diagram); `agent_setup_runner.py` + templates; lint hard rules; **UC-01 byte-for-byte reproduction test green** | Highest — touches Railway, ElevenLabs, repo | `/builder` still on; new ship gated to non-prod first |
| **S4 · L1** | L1 hero + module selector + live narration mode + post-run review panel + L1→L2 promotion checklist UI; `scenario-workspace.tsx` refit as the live-run mode | Medium | `/builder` redirects to `/pilots` for new sessions; old route 410-stays for shared links |
| **S5 · L2 sketch + cleanup** | L2 sandbox-load shell + cohort runner stub + drift detector wiring (architecture only per scope decision D3); full removal of `<DirectAssuranceStudio>` + `<HermesOnboarding>` + builder uses of `<ChatSlideOver>`; deprecation of `/builder/sessions` in favour of pilots routes | Low | `/builder` retired; `builder_router.py` deleted in a final cleanup PR |

### 8.2 Feature flag strategy

- `NEXT_PUBLIC_PILOT_WORKSPACE_V2` (client) — gates the route resolver. Enabled per-user via `localStorage` override during S1-S2; default-on at S3; hard-removed at S5.
- PostHog `pf_pilot_workspace_v2` (server) — gates the chat router re-key (so `/chat/{country}/messages` continues to work for the legacy builder while `/pilots/{slug}/messages` runs in parallel). Same lifecycle as the client flag.
- During S3, the ship pipeline is gated by an additional `pf_ship_v2` flag so we can dry-run against staging before letting the production-tied user trigger.

### 8.3 Old code cleanup

In S5 we remove:

- `components/studio/direct-assurance-studio.tsx`
- `components/studio/hermes-onboarding.tsx`
- The builder usage of `components/shared/chat-slide-over.tsx` (the chat-slide-over file itself stays for any other surface that needs a generic chat).
- `app/builder/page.tsx` becomes a 308 redirect to `/pilots`.
- `gateway/src/gateway/routers/builder_router.py` archived.

### 8.4 Rollback path

Every Langfuse prompt has a v1.0.0 release tag. Rollback to v1 is a metadata flip. Migrations are forward-only; rollback at the schema layer is a tombstone migration that drops the new tables (data loss accepted; v2 data is not load-bearing for L0-L1 demos until S4). The feature flags allow a per-user instant rollback to the legacy builder at any point during S1-S4.

---

## 9. Acceptance criteria

### 9.1 Per-slice DoD

**S1 Foundation:**
- Migrations 0009-0014 applied; RLS verified by service-role + tenant-role read tests.
- `POST /pilots` creates a pilot draft from a single chat message; `chat_thread` + first `chat_message` rows persist.
- Movement I-III work end-to-end: Compagnon proposes personas/journey/citations/plan as `artifact_proposal` rows; user accept/reject writes `pilot_artifact` versions.
- Open-concerns CRUD live; `critical` severity blocks ship attempt.
- Adaptive question generator returns at least 3 contextual questions when exit-criteria miss for I/II/III.
- `pnpm typecheck` + `cd gateway && uv run pytest` green; new tests cover routes + diff engine + concern lifecycle.

**S2 Composition:**
- Movement IV business case sliders update ROI band < 100ms; sensitivity_scenario[3] persisted.
- Movement V synth seed streams ≥ 10 records/sec via SSE; pause/resume respected; per-module fork visible in left rail.
- Movement VI charter signs (rule[]/integration_contract[]/agreement[] locked); tension banner reproducible from contradicting Movement I/III input.
- Movement VII generates simulated HITL preview for at least one gate per module; KPI table split human-baseline vs AI-target.
- Movement VIII summary lists every artifact + repo-changes panel renders > 0 file diffs for at least one module.
- Compaction memo generated when test thread crosses 100k tokens; new chapter starts with memo in `[CONTEXT]`.
- Eval rubrics (factual / policy / tone) pass on a 50-turn synthetic conversation.

**S3 Ship:**
- Migrations 0016-0018 applied.
- **UC-01 byte-for-byte reproduction test:** ship a pilot containing only UC-01 from a clean state and verify the resulting `infra/elevenlabs/uc01-agent-config.json` + tool wiring matches what was wired by hand (modulo agent_id + tool_ids).
- **End-to-end UC-02 test:** a fresh pilot with the canonical UC-01 + a draft UC-02 module ships green from press-button to L1-ready in < 4 min wall-clock against a live Railway+ElevenLabs sandbox.
- Lint hard rules block: localhost in tool URL / TTS ≠ v3_conversational / system prompt < 2000 chars / golden tests below tier minimum / ASR keywords missing fraud terms.
- Failure path tested: kill Railway mid-phase 4 → overlay rolls back ElevenLabs agent + tools, no orphans on Eleven side, pilot stays at L0.
- Cancel mid-build tested at every phase; rollback is symmetric and audited.

**S4 L1:**
- L1 hero shows per-module DNIS + voucher; module selector reflects only modules in the pilot.
- Real call on UC-01: Compagnon posts > 5 narration lines tied to actual Langfuse spans within the call window.
- Post-run review panel shows KPI scorecard, gate-by-gate AI rationale, ElevenLabs audio playable, "what I'd change" Compagnon block.
- L1→L2 readiness tile updates as criteria hit: 5+ runs / business signoff / no critical alerts 24h / cost ≤ target / no open critical concerns.
- Concerns from L0 carry forward; Compagnon posts an opening message at L1 entry with "three things I'm watching".

**S5 L2 + cleanup:**
- `/pilots/:slug/sandbox` route renders the six-panel L2 shell (UI is sketches; cohort runner is a stub).
- `<DirectAssuranceStudio>` + `<HermesOnboarding>` + builder usage of `<ChatSlideOver>` deleted; no imports remain.
- `/builder` 308-redirects to `/pilots`; `builder_router.py` archived; `NEXT_PUBLIC_PILOT_WORKSPACE_V2` flag removed.
- All Langfuse prompts have a v1.0.0 release tag; rollback path documented.

### 9.2 Cross-cutting business-user demo rubric

Three independent business users (claims operator, underwriter, plateau head) — none of whom were in the brainstorm — open an empty pilot, follow the Compagnon through movements I-VIII, press ship, make a real test call. We measure:

| Metric | Target |
|---|---|
| Time-to-comprehension (each user can describe what each movement is for, in their own words) | ≤ 5 min |
| Time-to-shipped-pilot (from `/pilots/new` to L1 first call) | ≤ 45 min |
| Compagnon pushback events the user found genuinely useful (interview) | ≥ 2 per pilot |
| Compagnon refusal patterns triggered correctly (no invented citation; refused un-signed promotion) | 100% |
| Forbidden-string violations (eval rubric) | 0 |
| Stakeholder-fidelity rubric (carry-over from `builder-hermes-prd`) | ≥ 8/10 |

### 9.3 UC-01 byte-for-byte test (key acceptance)

Test setup:

1. Fresh database (no pilot rows).
2. Fresh Railway + ElevenLabs sandbox account.
3. Through the new builder, create a pilot named `da-direct-assurance` with one module `UC-01 Attestation`. Walk through movements I-VIII (use canned chat replies for repeatability).
4. Press ship.

Test assertions:

- Resulting `infra/elevenlabs/uc01-agent-config.json` matches the manually-written config (deep-equal, modulo `agent_id` and `tool_ids`).
- Resulting `gateway/src/gateway/tools/direct_assurance.py` after the patch contains all 4 UC-01-specific tool functions with same signatures + idempotency keys as the manual version.
- Resulting `gateway/src/gateway/routers/da_tools_router.py` exposes the 4 new POST routes.
- Resulting `prompts/direct-assurance/uc01-attestation/system.txt` matches the manual version (or ≥ 95% similarity by LLM-judge if Compagnon's draft varies stylistically).
- Resulting `tests/test_uc01_golden.py` runs with all 40 golden cases green.
- ElevenLabs agent has `tts.model_id == "eleven_v3_conversational"` and 6 linked tools.
- `pytest gateway/tests/` passes 253+/253+ (the existing baseline plus any new tests).

---

## 10. Risks & mitigations

| # | Risk | Mitigation |
|---|---|---|
| R1 | **Repo-write blast radius.** Movement VIII commits to a real branch and Railway redeploys live. | Every ship is a fresh branch `deliver/builder/<pilot>/<module>/<ts>`; PR-open and review optional but enabled; rollback = `git push --delete` + ElevenLabs cleanup; staging Railway service per pilot domain in S3. |
| R2 | **ElevenLabs / Railway flakiness mid-ship.** External APIs fail. | Every phase idempotent; `ship_phase_event` records last-known state; resume-from-failure (not restart-from-zero) implemented in `ship_runner`; orphan tools garbage-collected by hourly job. |
| R3 | **DeepSeek context budget under multi-movement memory.** 8 movements × 7 modules × 30+ artifacts → context will blow. | Visible compaction (built into S2); `[CONTEXT]` retrieves only artifacts relevant to current movement+module via pgvector on `pilot_artifact`; cost meter caps per-thread spend. |
| R4 | **Compagnon hallucinated citations or pushbacks.** | Existing `citation_gate` already intercepts; charter forbids "I haven't found a source" being skipped; eval rubric `factual` sample-checks 100% of L0 turns and 10% of L1+; any failure pages a critical concern automatically. |
| R5 | **Conversation feels chatty & slow.** | Every Compagnon turn declares "I'm asking" / "I'm proposing" / "I'm doing" so the user knows when to engage vs let it work; tool spans visible in the rail prove progress; SSE streams keep latency perceived as "alive" even when DeepSeek is slow. |
| R6 | **Multi-module fan-out cost at ship time.** 7 UCs ship-time = 7× ElevenLabs agents + 7× golden test runs ≈ minutes. | Ship orchestrator parallelises composition (independent), serialises wire (Railway is single-target). Per-module checkbox in Movement VIII so user can ship a subset. |
| R7 | **Per-UC system prompts drift between ElevenLabs config and Langfuse Prompt registry.** | Single source of truth: file content in `prompts/direct-assurance/<uc-slug>/system.txt`. ElevenLabs config inlines on ship; Langfuse Prompt is registered with the same content + version tag. CI lint asserts equality. |
| R8 | **`hermes/agent_setup` skill drift after we add `agent_setup_runner.py`.** | Skill markdown + runner share Jinja templates; CI test renders both and asserts identity. Skill remains the human-readable doc; runner is the executable form. |

---

## 11. Open questions

Each item below has a default decision (in **bold**) so the spec is actionable; reviewers can flip any of them.

1. **One Railway gateway per pilot, or one shared gateway hosting all pilots?** Defaulting to **one shared `agentic-voice-gateway` service** (matches today's UC-01 deploy). Per-pilot isolation deferred until a second tenant exists.
2. **Compaction trigger threshold?** Defaulting to **120k tokens** (DeepSeek-V4 has 256k context, leaves headroom). Configurable per-pilot via `compagnon/level/*` overlay.
3. **Repo-changes panel diff format?** Defaulting to **per-file unified diff with collapse-by-default file headers + accept-all / reject-all toggles**. Inline syntax-highlighted.
4. **Concerns severity escalation policy?** Defaulting to: an `info` open > 7 days promotes to `warning`; a `warning` open > 14 days promotes to `critical`. Compagnon flags the auto-promotion. Override-able by user.
5. **Multi-language Compagnon defaults?** **French primary** (matching DA pilot reality); Charter prompt is FR-tone-anchored with EN parity strings; left rail labels follow `pilot.language`. Other AXA EU languages added as overlays (no extra prompt — tone-only delta).
6. **Should the user be able to "branch" a pilot for what-if exploration?** Defaulting to **yes — pilot has `parent_id`** (added to migration 0009); not surfaced in v1 but the schema accommodates it.
7. **Should the ship overlay run pytest in the deploy itself, or in CI after merge?** Defaulting to **deploy itself (phase 6 verify)** — the user pressed ship, they need feedback in the same flow. CI on merge stays as a safety net.
8. **What happens to a module that fails to ship inside a multi-module ship?** Defaulting to: **other modules continue**; failed module stays at L0; the pilot's level remains L0 until at least one module ships green; subsequent ships re-attempt the failed module as if it were a fresh module. Configurable to "abort all on first failure" via a Movement VIII checkbox.

---

## Appendix A — Vocabulary deltas vs. 2026-05-04 spec

- **Compagnon** is the working name for the chat companion (renamed from "Compagnon" in the original spec; same persona, sharper authority matrix). At L0 the Compagnon also goes by "Hermes" in user-facing copy because that's the name AXA business users have heard during UC-01 rollout. Both names route to the same `compagnon/charter` prompt.
- **Movement** is unchanged from the 2026-05-04 spec.
- **Module** is **new** in this spec — replaces the original spec's implicit "single agent per pilot" assumption.
- **Module spec** is **new** — the canonical per-module artifact that drives the ship pipeline; mirrors `agent_setup §1`.
- **Repo change set** is **new** — the Movement VIII repo-diff panel data model.
- **Ship phase event** is **new** — the audit trail of ship progression.

## Appendix B — What's deferred to later sprints

- Full L2 sandbox-load UI (cohort runner, drift detector, comparative analysis).
- L3 canary cockpit.
- L4 live-ops dashboard.
- Pilot branching UI (schema is in place, no UI in v1).
- Multi-tenant; single-tenant `gdai-default` only.
- Visual / UX polish per [2026-05-04 spec §6](./2026-05-04-builder-rework-design.md#6-motion-icons-density--progressive-disclosure) — applied to new components from S1 onwards but not back-fitted to surviving old surfaces.
- A future Langflow-hosted Compagnon brain, replacing the gateway-only one. The contract is designed to accommodate this swap; the code does not implement it.

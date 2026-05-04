# Cockpit & Scenario Builder Redesign — 3 Approaches

**Date:** 2026-05-04
**Status:** Mockups in build (autonomous mode — user away)
**Targets:** http://localhost:4173/design-proposal/{atelier,dossier,copilot}/
**Replaces:** http://localhost:4173/design-proposal/command-studio.html (rejected)

## 1. Brief

The cockpit's current `/scenario/property-fast-track` page (Next.js, dark dotted canvas, horizontal kanban of agents) is too cluttered and the previous redesign attempt (`command-studio.html`, single unified canvas with mode tabs) was rejected. The user wants 3 distinct directions, each delivering on **both**:

- **Workflow Editor** — Langflow-style graph authoring with Plan/Build/Preview/Deploy gates (S3, S8)
- **Scenario Builder** — composes flows into agent topology with G0→G3 data gates, HITL bridge, run telemetry (S4, S6, S8)

All three should:
- Inherit AXA Canopée tokens (`docs/misc/axa-design-system/project/colors_and_type.css`) — Slash B2B angular, indigo `--axa-azur` `#3032C1`, primary `--axa-blue` `#00008F`, Source Sans 3 + Publico Headline + JetBrains Mono.
- Steal from Railway: dark dotted canvas, glass cards, slide-over inspector, ⌘K palette, activity timeline drawer, agent chat panel.
- Use the new taste-skill family (`design-taste-frontend`, `high-end-visual-design`, `industrial-brutalist-ui`, `minimalist-ui`).

## 2. Experimental thesis — testing the taste-skills

The user installed 12 skills from `Leonxlnx/taste-skill` (now under `.agents/skills/taste/`). Three of them have radically different visual DNA. Each mockup commits **fully** to one skill stack so the user can compare faithful executions side by side and pick the winner.

| Mockup | Primary skill | Companion skills | Visual DNA | Risk |
|---|---|---|---|---|
| **Atelier** | `industrial-brutalist-ui` (Tactical Telemetry CRT mode) | `design-taste-frontend` (RSC safety, anti-emoji), `full-output-enforcement` | Dark `#0A0A0A`, JetBrains Mono dominant, ALL CAPS, ASCII brackets, hazard-red accent, scanlines, no border-radius, `display:grid; gap:1px` hairlines | May feel hostile / hard to read for execs |
| **Dossier** | `minimalist-ui` | `design-taste-frontend`, `brandkit` (AXA tokens) | Warm bone `#F7F6F3`, Newsreader serif H1, Geist Sans body, muted pastels for status, hairline 1px borders, max 12px radius, document layout | Risk of feeling "marketing site", not operational |
| **Copilot** | `high-end-visual-design` (Awwwards-tier) | `design-taste-frontend`, `imagegen-frontend-web` patterns | OLED `#050505`, Geist + Clash Display, Double-Bezel architecture, button-in-button trailing icons, fluid-island nav, radial mesh gradient orbs, magnetic hover, py-24 macro-whitespace | High visual ambition; risk of overdesign for ops |

## 3. Assumptions (locked autonomously)

| # | Decision | Rationale |
|---|---|---|
| A1 | **Primary persona = AXA operator** running pilots, not exec demo. Exec demo (S6) reuses the same UI in read-only. | v3 §2 + S4/S6 specs. |
| A2 | Each mockup commits to **one taste-skill stack** end-to-end, no mixing across mockups. | The whole point of the experiment. |
| A3 | Mockups are **HTML/CSS/JS prototypes** under `/design-proposal/<name>/`, 3 screens each, real interactions. | Matches the `/design-proposal/` precedent. |
| A4 | AXA Canopée tokens (`--axa-blue`, `--axa-azur`, semantic colors) are preserved across all 3 mockups but **recontextualized** by each skill's palette discipline. | AXA brand integrity is non-negotiable; expression varies. |
| A5 | All copy in **English**. No emoji anywhere (taste-skill rule). Realistic AXA-pilot content (FNOL, claim_id `CLM-…`, `wf-004`, NemoClaw, ChatWoot). | v3 + taste-skill rule. |
| A6 | The 3 IA philosophies are **inherited** from skill choice, not chosen separately: Atelier = canvas+inspector (CRT cockpit), Dossier = linear stepper (document), Copilot = chat+canvas split (premium experience). | One decision per mockup. |

## 4. Three Approaches (one taste-skill stack each)

### Approach 1 — **Atelier** · Tactical Telemetry Cockpit
**Skill stack:** `industrial-brutalist-ui` (Tactical Telemetry CRT mode) + `design-taste-frontend`

**Tagline:** *"A declassified blueprint. The cockpit reads like a deactivated CRT terminal — every glyph is data."*

**Why this skill on this surface:** the daily ops cockpit is a high-density, signal-saturated workplace where ornament is a liability. Brutalism rewards density and disambiguation: ASCII frames, monospace tabular data, hazard-red as the only accent. This commits to the skill's *Tactical Telemetry & CRT Terminal* paradigm exclusively (not mixing with Swiss Industrial Print, per the skill's "pick ONE" rule).

**Skill-rules applied (verbatim):**
- Background `#0A0A0A`, foreground `#EAEAEA` (white phosphor), accent `#E61919` (hazard red) — no other colours.
- JetBrains Mono dominant for all body/data; Neue Haas Grotesk Black (or Archivo Black fallback) for macro headings only, `clamp(4rem, 10vw, 12rem)`.
- **Zero `border-radius`** anywhere. 90° corners enforced.
- ASCII syntax decoration: `[ STAGE 02 — TRIAGE ]`, `<< RE-IND >>`, `///`, `+` crosshairs at grid intersections, `>>>` directional pointers.
- `display: grid; gap: 1px; background: #EAEAEA;` to draw razor-thin dividing lines without per-cell borders.
- CRT scanlines via `repeating-linear-gradient` overlay on canvas zones.
- ALL CAPS labels with `letter-spacing: 0.1em`.
- AXA Canopée tokens reinterpreted: `--axa-blue` only as a `█` block-glyph severity marker; never as decoration.

**IA shape:**
```
[ HEADER:: PROJECT/REV/COMMIT ]==============================
[ RAIL ]  [ CANVAS::SCENARIO_TOPOLOGY ]  [ INSPECTOR::DATA ]
                                          
[ TELEMETRY STREAM ============================ T+00:14:22 ]
```

**Screens:**
1. `/atelier/` — `OPERATIONS // ROSTER` (pilot landing as a barcode-flanked manifest)
2. `/atelier/workflow.html` — `WORKFLOW EDITOR // wf-004` (graph canvas with crosshair grid)
3. `/atelier/scenario.html` — `SCENARIO RUN // CLM-…` (live run with HITL hazard banner)

**Wins:** density, disambiguation, ops-room legitimacy, irrefutable difference vs. SaaS norm.
**Loses:** first-time learnability, palatability for execs unfamiliar with monospace UIs.

---

### Approach 2 — **Dossier** · Editorial Document Workspace
**Skill stack:** `minimalist-ui` + `design-taste-frontend` + `brandkit` (AXA tokens)

**Tagline:** *"Every scenario is a signed dossier. The UI is a structured document, not a canvas."*

**Why this skill on this surface:** scenarios are regulated artefacts AXA Compliance must read months later. Minimalism's editorial-document discipline (warm bone canvas, hairline borders, muted-pastel status, serif headlines) treats each scenario as an audit-grade record. Removing canvas chrome makes the *content* the interface.

**Skill-rules applied (verbatim):**
- Canvas `#F7F6F3` (warm bone), surfaces `#FFFFFF`, body text `#2F3437` with `line-height: 1.6`.
- Borders: `1px solid #EAEAEA` only. Max radius `12px`. **No** `shadow-md/lg/xl` — only ultra-diffuse `0 2px 8px rgba(0,0,0,0.04)` on hover.
- Headings: Newsreader serif (`letter-spacing: -0.03em`, `line-height: 1.1`); body Geist Sans / SF Pro Display; mono Geist Mono.
- Status pastels (skill-defined): pale-blue `#E1F3FE` / text `#1F6C9F` (Validated), pale-green `#EDF3EC` / `#346538` (Live), pale-red `#FDEBEC` / `#9F2F2D` (Blocked), pale-yellow `#FBF3DB` / `#956400` (Needs review).
- Macro-whitespace: section padding `py-24`+, content `max-w-5xl`.
- `<kbd>` keystrokes physical: `border 1px #EAEAEA; bg #F7F6F3; radius 4px; mono`.
- Faux-OS window chrome on scenario preview cards (3-circle macOS controls).
- AXA `--axa-blue` reserved for primary CTA only (filled `#00008F`, white text, `4px` radius, no shadow).

**IA shape:**
```
[ Top breadcrumb · scenario name · status pill ]
[ Left vertical stepper :: Intake → Steps → Gates → Tools → Validation → Publish ]
[ Main: section content (forms, evidence, dry-run preview) ]
[ Right: "Justification & approvals" rail ]
```

**Screens:**
1. `/dossier/` — workspace as an editorial table of scenarios
2. `/dossier/builder.html` — linear stepper authoring view
3. `/dossier/hitl.html` — operator decision card with full evidence packet

**Wins:** audit, governance, learnability, exec-comprehensibility, AXA-compliance-friendly.
**Loses:** real-time signal density, operator velocity for power users.

---

### Approach 3 — **Copilot** · Awwwards-Tier Conversational Authoring
**Skill stack:** `high-end-visual-design` + `design-taste-frontend`

**Tagline:** *"Describe the scenario. Watch it materialise. Diff before you ratify."*

**Why this skill on this surface:** the chat-canvas authoring flow is the most exec-facing and conceptually novel surface — the one S6's demo will headline. High-end-visual-design's premium spatial rhythm, double-bezel architecture and motion choreography turn a feature into a presentation moment.

**Skill-rules applied (verbatim):**
- **Vibe archetype:** Ethereal Glass — OLED background `#050505`, radial mesh gradient orbs (azur `#3032C1` + grape `#6657F0`), `backdrop-blur-2xl` glass cards with `border-white/10` hairlines.
- **Layout archetype:** Editorial Split — chat 38% LHS, materialised canvas 62% RHS.
- Premium fonts: Geist (UI), Clash Display (display headings), JetBrains Mono (code/IDs). Banned: Inter, Roboto.
- **Double-Bezel architecture** on every major card: outer shell `bg-white/5 ring-1 ring-white/10 p-1.5 rounded-[2rem]`, inner core `rounded-[calc(2rem-0.375rem)]` with `inset 0 1px 1px rgba(255,255,255,0.15)` highlight.
- **Button-in-Button** trailing icons: arrow inside `w-8 h-8 rounded-full bg-white/10` flush-right.
- **Fluid Island nav:** floating glass pill `mt-6 mx-auto w-max rounded-full`.
- Magnetic hover: `active:scale-[0.98]`, inner icon `group-hover:translate-x-1 -translate-y-[1px]`.
- Motion: `transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]` on every state change.
- Macro-whitespace `py-24+`. Eyebrow tags: `rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em]`.
- AXA `--axa-azur` lives inside the radial-mesh gradient and on the focused button shelf only. AXA `--axa-blue` deep is the deepest accent on dark glass.

**IA shape:**
```
[ Floating-island top nav (glass pill, centered) ]
[ LEFT 38% — chat assistant, streaming proposal ]
[ RIGHT 62% — canvas materialising ]
[ Bottom strip — telemetry as natural language ]
```

**Screens:**
1. `/copilot/` — split chat-canvas authoring (hero state)
2. `/copilot/scenario.html` — running scenario with chat-controlled inspection
3. `/copilot/diff.html` — proposed-change diff overlay (accept/reject)

**Wins:** exec demo wow, time-to-first-pilot, approachability, presentation polish.
**Loses:** density, audit clarity, build complexity, risk if AI hallucinates a scenario (mitigated by hard diff-ratify gate).

## 5. Cross-cutting rules (only the irreducible minimum)

Each mockup commits **fully** to its skill's palette, type, and spatial rules — that's the experiment. The only rules that cross all 3:

- AXA Canopée tokens (`--axa-blue` `#00008F`, `--axa-azur` `#3032C1`, semantic colours) are imported in every mockup; **expression** varies (Atelier reduces them to severity markers; Dossier confines to CTA; Copilot uses azur in mesh gradients).
- No emoji anywhere (skill rule, all 3).
- No `h-screen` — `min-h-[100dvh]` everywhere (skill rule).
- All copy is realistic AXA-pilot content: `CLM-2026-0042`, `wf-004 / NemoClaw`, `wfmcp03 / claims_facade`, ChatWoot operator names, Langfuse trace IDs.
- Each mockup ships a tiny `app.js` mocking: ⌘K palette, status transitions, HITL banner toggle, fake stream tick.

## 6. Comparison rubric (how to evaluate)

| Criterion | Atelier (brutalist) | Dossier (minimalist) | Copilot (high-end) |
|---|---|---|---|
| Skill applied faithfully? | Tactical Telemetry rules | Document/pastel/serif rules | Double-bezel/glass/motion rules |
| Operator velocity | ★★★★★ | ★★★ | ★★★ |
| Audit / governance | ★★★ | ★★★★★ | ★★ |
| Learnability (new user) | ★★ | ★★★★★ | ★★★★ |
| Time-to-first-pilot | ★★★ | ★★ | ★★★★★ |
| Real-time signal density | ★★★★★ | ★★ | ★★★ |
| Exec demo polish | ★★★ | ★★★★ | ★★★★★ |
| First-impression "wow" | ★★★★ (alien) | ★★★ (calm) | ★★★★★ (premium) |
| Risk of AI design failure | none | none | medium (LLM proposal) |

**Evaluation procedure for the user:**
1. Open all three at the same viewport, side-by-side if possible.
2. For each, judge whether the **skill rules are clearly visible** — that's the primary axis.
3. Then judge whether the *cockpit task* (running CLM-…, approving HITL, authoring a workflow) feels *right* in that aesthetic.
4. Pick a winner, a runner-up, and a "graft this from B onto A" note.

## 7. Build plan

1. **Atelier** folder: `index.html` (operations roster), `workflow.html` (graph editor), `scenario.html` (live run + HITL banner), `studio.css` (rewritten for tactical-telemetry rules, ~700 LoC), `studio.js` (~120 LoC).
2. **Dossier** folder: `index.html`, `builder.html`, `hitl.html`, `dossier.css` (~600 LoC), `dossier.js` (~80 LoC).
3. **Copilot** folder: `index.html`, `scenario.html`, `diff.html`, `copilot.css` (~700 LoC, double-bezel + motion), `copilot.js` (~150 LoC for streaming sim).
4. Update `/design-proposal/index.html` as a comparison landing linking to all 3 with skill-stack badges.
5. Verify all routes serve at `:4173`.

Each mockup is self-contained — no shared CSS — so a reviewer can open one in isolation and judge the skill on its own merits.

## 8. What's deliberately NOT included

- React/Next.js integration. These are HTML/CSS/JS prototypes only.
- Real WebSocket telemetry. Animations are scripted.
- Real Langflow runtime. The graph is a static SVG with mock state transitions.
- Real authentication, RLS, audit hashing. The dossier shows the affordance, not the implementation.

These are pure UX taste-experiments. Production wiring is S3/S4/S8 work tracked in `docs/sprints/`.

---

*Design doc — autonomously authored, then reframed as a taste-skill experiment per user feedback. User to review and pick a winner (or commission a hybrid) before any production-code work begins per S8 Definition of Done.*


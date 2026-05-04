---
name: design
description: "Production-grade visual design skill for the GDAI Agentic Cockpit. Synthesizes the taste skills (codex / dossier / atelier influences, AXA Canopée tokens, Railway-style flow animations, image-to-code, redesign-existing-projects discipline) into one opinionated design language. USE WHEN: building UI, designing a new screen, restyling an existing page, creating a mockup, or producing assets that must look hand-crafted (not generic AI). DO NOT USE for backend-only work."
---

# Design — AXA Agentic Cockpit visual language

> **Hand-built editorial software**, not a SaaS dashboard template. Every screen reads like a print spread first, an app second.

This skill is the **operational distillation** of what worked across rounds 1–5 of the cockpit/builder design experiments. Use it before touching CSS, before sketching a component, and before asking taste-questions of a sub-agent. It composes:

- **Codex editorial** — serif headlines, mono microcopy, pillar-sectioned long-form pages.
- **Dossier discipline** — measured horizontal rhythm, "//" eyebrow, oversized leading.
- **Atelier rail pattern** — left navigator with roman-numerals, status pips, sub-headers.
- **Railway flow animations** — connection-line shimmers, instant-network green flow, deploy-ladder reveals.
- **AXA Canopée tokens** — the brand colour, typography and spacing primitives are the **only** allowed palette.
- **Image-to-code** workflow — when a Railway / AXA / Vercel screenshot is in `docs/misc/`, encode the visual signal in CSS, do not paraphrase.
- **Redesign-existing-projects** discipline — mockups must visibly improve on the prior iteration; if you cannot articulate the delta, do not ship it.

---

## 0. The 30-second test

Before you write the first line of CSS, your design must answer **yes** to all five:

1. **Does it feel hand-built?** Bespoke typography pairing, intentional whitespace, deliberate alignment. Not a Tailwind starter.
2. **Could it ship in *Le Monde* or *Bloomberg*?** Editorial spacing, serif voice, pull-quotes have a place.
3. **Is the AXA colour story honoured?** Azur (`#00008f`) or Bleu Marine (`#000050`) as the only saturated colour. Never improvise greens, oranges, or accent palettes outside the Canopée tokens.
4. **Does motion serve the data?** Animation only when it explains state change (run head moving, MCP pulse, HITL siren). No decorative shimmer.
5. **Will the *next* designer recognise the pattern?** Reuse `.shell-*`, `.rail-*`, `.runhead-*`, `.inspector-*` namespaces — do not invent parallel ones.

---

## 1. Tokens (the only palette)

```css
:root {
  /* AXA Canopée — primary */
  --axa-azur:        #00008f;   /* primary brand · CTAs · live state */
  --axa-bleu-marine: #000050;   /* deep brand · headlines · trust */
  --axa-blanc:       #ffffff;
  --axa-noir:        #1a1a1a;

  /* Editorial neutrals */
  --paper:    #f5f4ef;          /* page background — never pure white */
  --cream:    #faf9f5;          /* card surface */
  --rule:     #e8e6df;          /* borders, dividers */
  --ink:      #1c1c1c;          /* body type */
  --ink-mute: #6b6960;          /* metadata, microcopy */
  --mute:     #9a978d;          /* placeholder, disabled */

  /* State (always used together with .live / .hitl / .hazard classes) */
  --state-live:   #00008f;      /* azur — running */
  --state-hitl:   #c9a35e;      /* warm gold — waiting on human */
  --state-hazard: #b04a3f;      /* terracotta — error / breach */
  --state-done:   #5a7a5a;      /* deep sage — completed */

  /* Type */
  --font-serif: "Source Serif 4", "EB Garamond", Georgia, serif;
  --font-sans:  "Inter", "Helvetica Neue", system-ui, sans-serif;
  --font-mono:  "JetBrains Mono", "IBM Plex Mono", ui-monospace, monospace;

  /* Rhythm */
  --rad-sm: 6px;   --rad: 10px;   --rad-lg: 14px;   --rad-pill: 999px;
  --shadow-soft: 0 4px 14px rgba(0,0,91,0.06);
  --shadow-lift: 0 12px 32px rgba(20,20,30,0.08);
}
```

**Rule:** if you find yourself reaching for a colour outside this list, stop and rethink. If you need a new one, add it to the AXA Canopée extension table in `docs/architecture.md` first.

---

## 2. Typographic hierarchy

| Use | Family | Size · Weight · Letter-spacing |
|---|---|---|
| Hero `h1` | serif | `clamp(48px, 6vw, 88px)` · 350 · `-0.02em` |
| Section `h2` | serif | `clamp(32px, 4vw, 56px)` · 350 · `-0.015em` |
| Card title | serif | `20–24px` · 500 · `-0.005em` |
| Body | serif | `17px` · 400 · `0` · `line-height: 1.65` |
| Eyebrow / kicker | mono | `10.5px` · 500 · `0.18em` · UPPERCASE |
| Microcopy / metadata | mono | `11–12px` · 400 · `0.05em` |
| Pull-quote | serif italic | `28px` · 350 · `-0.01em` |

Never mix three families in the same row. Eyebrow above heading is mono → serif; never serif → mono.

---

## 3. Layout primitives

### 3.1 Editorial pillars (long-form pages)

```
┌─────────────────────┬─────────────────────────────────────┐
│  rail-eyebrow       │                                     │
│  rail-num (roman)   │   pillar headline (serif h2)        │
│                     │                                     │
│  rail-meta          │   body copy, 60–72ch max-width      │
│  · key-value pairs  │                                     │
│  · status pips      │   inline visualisation              │
└─────────────────────┴─────────────────────────────────────┘
```

Used for: builder steps, sprint pages, scenario detail.

### 3.2 Canvas chrome (operational pages) — **Layout Zone Contract**

The canvas chrome is built as a set of **non-overlapping zones**. Bounding-box collisions between zones (other than documented overlays) are a designqa block.

```
   ┌──────────────────────────────────────────────────────────────────────────┐
24 │  RUNHEAD-C   left:24  right:516  height: 92–120                          │  zone A
   │  (id+progress+meta+toolbar-cluster all inline — no separate float)       │
   ├──────────────────────────────────────────────────────────────────────────┤
+24│                                                                          │
   │   PAN-C    top: A.bottom+24    right:516    bottom: D.top+24             │  zone B
   │   (canvas nodes + edges)                                                 │
   │                                                                          │
   │   …banner-zone overlays at left:24, bottom: D.top+16, width:540…        │  zone C
   │                                                                          │
   ├──────────────────────────────────────────────────────────────────────────┤
+24│  ACTIVITY-C  left:24  right:516  bottom:24  collapsed:56  open:280       │  zone D
   └──────────────────────────────────────────────────────────────────────────┘
                                                                            ↑
                            INSPECTOR-C  top:24 right:24 bottom:24 width:460  zone E
```

**Authoritative offsets** (paste into CSS — these numbers are the contract):

| Zone | id | top | right | bottom | left | width | min-h | max-h |
|---|---|---|---|---|---|---|---|---|
| A — runhead | `runhead-c` | 24 | 516 | — | 24 | auto | 92 | 120 |
| B — pan | `pan-c` | A.bottom+24 (≈140) | 516 | D.top+24 (≈104) | 24 | auto | — | — |
| C — banner | `hitl-banner` | — | — | D.top+16 (≈96) | 24 | 540 | — | — |
| D — activity | `activity-c` | — | 516 | 24 | 24 | auto | 56 | 280 |
| E — inspector | `inspector-c` | 24 | 24 | 24 | — | 460 | — | — |

`516 = 460 (inspector width) + 24 (gutter) + 32 (visual breathing)`. **Never change 516 without updating every zone right-offset.**

**Toolbar lives inside the run-head right cluster.** A separate floating `toolbar-c` pill is forbidden — it caused the iter-01 collision shipped on 2026-05-04. Tabs (Trace / Layers / Compare) and `+ Node` belong in the run-head action row.

**Zoombar + minimap** sit inside `pan-c` as overlays: bottom-right, `right: 24` *of the pan box*, not of the viewport. They scroll with the canvas.

**Z-order ladder** (locked):

| Layer | z-index | Why |
|---|---|---|
| canvas-bg + edges-c | 1 | underlay |
| nodes (`.node-c`) | 2 | over edges |
| pan overlays (zoombar, minimap) | 8 | above nodes |
| activity-c | 14 | above canvas |
| run-head | 14 | above canvas |
| inspector-c | 25 | top right rail |
| hitl banner | 30 | above inspector |
| toast | 40 | absolute top |

**Reduced-motion**: every animated zone must honour `@media (prefers-reduced-motion: reduce)` — `animation: none; transition: none`.

### 3.3 Three-column compose (chat builder)

```
┌──────────┬───────────────────────────┬───────────┐
│  RAIL    │   CHAT (AI scenario       │  PREVIEW  │
│  (240px) │     builder)              │  (320px)  │
│          │                           │           │
│  I.      │   ⌬  hi, what scenario…   │  Title    │
│  II.     │   me  triage water…       │  Topology │
│  III.    │   ⌬  drafted Property…    │  Stats    │
│  IV.     │   me  add fraud-check…    │           │
│          │   ⌬  inserting Vesta…     │           │
│  ─────   │                           │  ─────    │
│  saved   │   [ input · ⌘⏎ to send ]  │  est 4min │
└──────────┴───────────────────────────┴───────────┘
```

This is the **compose** signature. Never put the form fields as the primary surface.

---

## 4. Component conventions

| Component | Prefix | Notes |
|---|---|---|
| Canvas (graph view) | `cn-`, `runhead-c`, `toolbar-c`, `inspector-c`, `activity-c` | one source of truth: `codex.css` |
| Builder | `b`, `bcompose-*`, `brail-*`, `bchat-*`, `bnav-*` | three-column shell |
| Editorial pillars | `pillar`, `marg`, `body` | for long-form pages |
| Studio rail | `shell-rail`, `rail-section`, `rail-heading` | atelier flavour |
| Buttons | `.btn` `.btn-primary` `.btn-ghost` | never raw `<button>` outside a token |
| Status | `.live` `.hitl` `.hazard` `.done` | always paired with semantic class |

**Naming discipline:** never two prefixes for the same thing. If a `cn-` class collides with a `b-` class semantically, refactor — do not duplicate.

---

## 5. Motion library (Railway-inspired, AXA-restrained)

The cockpit borrows Railway's *physics* but never its colour or hyperactivity. Every animation must:

- Resolve in **≤ 600ms** (longer feels lazy on AXA-grade ops surfaces).
- Use cubic-bezier `(0.22, 0.61, 0.36, 1)` (the Railway "trust" curve) or linear for indeterminate states.
- Stop when the user requests reduced-motion (`@media (prefers-reduced-motion: reduce)`).

### 5.1 Catalogue

| Name | When to use | CSS shape |
|---|---|---|
| **edge-flow** | Run is live, edge between two nodes is the active path | linear-gradient stroke that translates left→right; loop while `.live` |
| **mcp-pulse** | An agent calls an MCP tool | radial halo on the agent node, expanding to ~1.4× then fading; 480ms |
| **hitl-siren** | A node is waiting for operator | gold dashed border slowly rotating, soft inner glow at 1.6s ease-in-out |
| **runhead-fill** | Run-head progress segments fill | scaleX from 0→1, transform-origin left, 320ms |
| **inspector-slide** | Right rail opening from a node click | translateX(24px) → 0 with opacity 0→1, 280ms |
| **node-snap-in** | A node is created in the canvas | scale 0.92→1 with shadow-soft → shadow-lift, 240ms |
| **chat-typing** | AI assistant composing | three dots fading 0.2 → 1 → 0.2 in sequence, 1200ms total |
| **toast-slide** | A toast or banner | translateY(8px) → 0 + opacity, 200ms |

### 5.2 The "instant network" reference

Railway's homepage section *Instant networking. Zero setup.* shows a green flow tracing between service icons. **Borrow the trace, not the green.**

Implementation:

```css
.edge-flow {
  stroke: var(--axa-azur);
  stroke-dasharray: 6 8;
  stroke-dashoffset: 0;
  animation: flow 1200ms linear infinite;
  opacity: 0.85;
}
@keyframes flow { to { stroke-dashoffset: -28; } }
```

For **MCP-pulse**, a single radial halo from the agent node toward the edge anchor is enough — no continuous pulse.

---

## 6. Page recipes

When asked to design a new screen, pick a recipe; do not invent a layout from scratch.

### Recipe A — **Editorial long-form**
*Sprint pages, architecture docs, "About this scenario" detail.*
- 240px left rail (eyebrow + roman numerals + status meta)
- 720px content column (serif body, inline figures, pull-quotes)
- No right rail. Footer with prev/next-section links.

### Recipe B — **Operational canvas**
*Scenario run, debug session, live ops.*
- Full-bleed canvas
- `runhead-c` ribbon (top:24px, right:488px)
- `toolbar-c` pill (top:96px, centered)
- `inspector-c` right rail (width:460px, slides in)
- `activity-c` bottom rail (toggleable)
- HITL banner anchored bottom-left

### Recipe C — **Three-column compose**
*Builder Compose step, agent definition.*
- 240px rail (sections + auto-save)
- elastic chat column (max 760px)
- 320px preview column

### Recipe D — **Card grid**
*Cockpit landing, scenario list, ops queue.*
- 12-col grid with 24px gutter
- Card: 1× cream surface · 24px padding · serif title · mono meta · status row at bottom
- One hero card spans cols 1–8; secondary cards 4-wide

---

## 7. Anti-patterns (do not do this)

- ❌ Generic SaaS gradient hero (purple → pink, blue → cyan). The cockpit is monochrome with one azur accent.
- ❌ Shadcn-style `<Card><CardHeader/></Card>` boilerplate. Hand-craft the card.
- ❌ Raw rounded-full pill buttons everywhere. The pill is reserved for *centerpieces* (toolbar, primary CTA).
- ❌ Emoji as decoration. Use SVG icons or roman numerals.
- ❌ Three+ font weights on the same screen.
- ❌ Animations on hover for elements that don't change state. Hover = subtle border darken only.
- ❌ Tailwind `bg-blue-500`. The colour is `var(--axa-azur)`, by name, always.

---

## 8. When to load other taste skills

This skill is the **default**. Reach for individual taste skills when:

| Sub-skill | When |
|---|---|
| `taste/image-to-code` | A screenshot exists in `docs/misc/` you must reproduce |
| `taste/redesign-existing-projects` | Refactoring a page that exists; need the diff discipline |
| `taste/high-end-visual-design` | A leadership-facing surface (board demo, exec summary) |
| `taste/minimalist-ui` | A read-only surface (audit log, archived run) where chrome must vanish |
| `taste/brandkit` | First time setting up tokens in a new file |
| `taste/full-output-enforcement` | Long mockup; you've been outputting half-files |

Never load `industrial-brutalist-ui` or `imagegen-frontend-mobile` for cockpit work — wrong register.

---

## 9. Workflow checklist

Before opening a CSS file:

- [ ] I have read the screen's parent recipe (A/B/C/D) above.
- [ ] I have the AXA Canopée tokens loaded in the file.
- [ ] I have the prior version's screenshot or HTML to diff against.
- [ ] I have one — and only one — animation in mind, mapped to a state change.
- [ ] I can articulate in one sentence why this iteration is better than the last.

After saving:

- [ ] No new colours outside §1.
- [ ] No new font families.
- [ ] No new component prefixes that duplicate existing ones (§4).
- [ ] All animations respect reduced-motion.
- [ ] Z-index ladder (§3.2) preserved.
- [ ] If you added a recipe, you appended it to §6 of this file.

### Handoff — assign the Copilot coding agent

**This is the mandatory last step.** Design is not done until the Copilot coding agent is assigned to run `designqa` on the surface you just produced.

1. **Create a GitHub issue** titled `[DesignQA] Sprint N — <surface> — <brief description>` in `edupazogle/agentic_cockpit`.
2. **Body must include:**
   - URL of the surface (e.g. `http://localhost:4173/design-proposal/codex/canvas.html`)
   - Viewport matrix to test: `1440x900`, `1024x768`, `375x812`
   - Sprint spec doc path (e.g. `docs/sprints/sprint-N-*.md`)
   - Link to the mockup file(s) changed in this round
3. **Assign** `copilot-swe-agent[bot]` with the `designqa-reviewer` agent profile:
   ```bash
   gh api repos/edupazogle/agentic_cockpit/issues/<NUMBER>/assignees \
     --method POST \
     --field "assignees[]=copilot-swe-agent[bot]" \
     --raw-field "agent_assignment[target_repo]=edupazogle/agentic_cockpit" \
     --raw-field "agent_assignment[base_branch]=main" \
     --raw-field "agent_assignment[custom_agent]=designqa-reviewer"
   ```
4. **Post the issue URL as a comment** on the related Linear issue so it syncs.
5. Copilot will run the full designqa loop (shoot → axe → diff → critique → report → figma → linear) and post its verdict on the issue. **Do not ask the user to review the design until Copilot's verdict is PASS or PASS-WITH-NOTES.**

---

## 10. Cross-references

- `design-proposal/codex/` — canonical implementation of recipes A, B, C
- `design-proposal/atelier/` — recipe B + D variant
- `design-proposal/dossier/` — recipe A reference
- `docs/architecture.md` §15 — scenario-builder design contract
- `docs/sprints/sprint-3-langflow-cutover-canary.md` — cockpit surface acceptance
- `docs/sprints/sprint-8-scenario-builder-synthdata-factory.md` — Compose chat builder spec
- `docs/misc/axa-design-system/` — Canopée token source
- `docs/misc/railway/railway_landing/` — animation reference

---

*This skill is updated whenever a new recipe ships. If you invent something new during a round, append it before closing the task.*

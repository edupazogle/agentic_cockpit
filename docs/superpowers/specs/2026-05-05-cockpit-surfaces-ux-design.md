# Cockpit Surfaces — Landing, Scenarios, KPI Dashboard, HITL Chat

> **Project:** GDAI Agentic Cockpit — Four public-facing surfaces
> **Author:** Brainstorm session 2026-05-05 (Eduardo + Claude Opus 4.7)
> **Date created:** 2026-05-05
> **Status:** Design spec v1 — ready for implementation planning
> **Supersedes:** `design-proposal/codex-axa/index.html` (landing), `design-proposal/codex-axa/scenarios.html` (catalog)
> **Sibling spec:** `docs/superpowers/specs/2026-05-04-builder-rework-design.md` (Pilot Workspace — this spec's interior)
> **References:**
> - `docs/architecture.md` (single source of truth for technical decisions)
> - `docs/refactor_main_v3.md` (canonical delivery plan)
> - `docs/superpowers/specs/2026-05-04-builder-rework-design.md` (§6 motion/icon/density system — inherited unchanged)
> - `design-proposal/codex-axa/` (existing index.html, scenarios.html, codex.css/js)
> - `design-proposal/codex-axa/PRD.md` (Canopée brand alignment)
> - `.superpowers/brainstorm/34849-1777930096/content/agent-sphere-demo.html` (sphere companion prototype)

---

## 0. Executive summary

### 0.1 What this document is

A complete UX/UI design spec for the four public-facing surfaces of the GDAI Agentic Cockpit — the **shell** that wraps around the Pilot Workspace defined in `builder-rework-design.md`. This is the front door every country operator walks through before drilling into any single pilot.

The builder spec defines what happens *inside* a pilot. This spec defines what happens *around* all pilots — discovery, governance, measurement, and communication.

The four surfaces:

| Surface | Route | Purpose | Current state |
|---|---|---|---|
| **Landing** | `/:country/` | Per-country executive bento, customizable module composition | Exists as `index.html` — editorial magazine style, single hardcoded layout |
| **Scenarios** | `/:country/scenarios` | Per-country pilot catalog, filterable by level/domain/status | Exists as `scenarios.html` — card grid, segmented filter |
| **Business KPI dashboard** | `/:country/kpis` | Three-pillar governance: Business · Operational · Quality | **Missing** — no dashboard exists today |
| **Live HITL chat** | `/:country/chat` (slide-over) | Embedded companion chat, PoC-native, architected for external escalation | **Missing** — no cockpit-native chat exists today |

### 0.2 What changes

- **The landing page stops being one hardcoded editorial layout.** It becomes a per-country bento composition where each country's plateau head configures which modules are visible, in what order, with what prominence.
- **The scenario view graduates from a static card grid.** It becomes a living catalog of every pilot in that country, filterable by level (L0→L4), domain, and status, with live-glow on running pilots and a "compose new" entry point.
- **A business KPI dashboard is created.** Three pillars — Business (ROI, savings, cost), Operational (throughput, HITL load, latency), Quality (eval scores, compliance gates, audit status) — with per-pilot drill-down, agent-level trace inspection, and business-impact measurement.
- **Live HITL chat is embedded in the cockpit.** One persistent companion thread per country, accessible from anywhere via the sphere. Architected for future push-to-Teams/Salesforce/ServiceNow but requiring zero external integrations to launch a PoC.
- **The sphere companion becomes the gravitational center.** Always visible, always one click from chat, with contextual actions that change per surface.
- **A cross-country blueprint library** enables opt-in sharing of agents, flows, synthetic data, and dashboard configurations.

### 0.3 Locked decisions

| # | Decision | Source |
|---|---|---|
| Q1 | Navigation = **Tab bar (Landing \| Scenarios \| KPIs) + floating sphere companion** | User choice |
| Q2 | Companion model = **Sphere as persistent overlay, always visible, bottom-center** | Approach 1 selection |
| Q3 | Per-country sovereignty = **each country has its own instance, own bento, own scenarios, own KPIs** | User clarification |
| Q4 | Cross-country sharing = **opt-in blueprint library (agents, flows, synth data, dashboard configs)** | User clarification |
| Q5 | KPI framework = **three balancing pillars: Business (ROI/savings), Operational (throughput/HITL), Quality (evals/compliance/gates)** | User clarification |
| Q6 | HITL chat = **cockpit-native first (educational + scenario building), external notifications later, architected for transition from day 1** | User clarification |
| Q7 | Design system = **inherits builder spec §6 (motion tokens, progressive disclosure, density rules, icon system) unchanged** | Inherited |
| Q8 | Audience = **business users (claims operators, underwriters, fraud officers, plateau heads), not engineers** | Builder spec Q8 |
| Q9 | Copy = **EN + FR throughout, sentence case, infinitive CTAs, AXA vouvoiement, Publico Headline + Source Sans 3 + JetBrains Mono** | Builder spec + Canopée |
| Q10 | Country = **first routing segment, separate Supabase tenant per country** | Architecture constraint |

### 0.4 Reading order

1. **§1 Cockpit shell IA** — the architectural spine (top bar, tabs, sphere zone, centre pane)
2. **§2 The sphere companion** — the gravitational center, radial menu, contextual actions, nudge system
3. **§3 Landing page** — per-country bento, module catalog, composition rules, EN/FR copy
4. **§4 Scenario view** — pilot catalog, card design, filtering, live indicators
5. **§5 Business KPI dashboard** — three-pillar layout, per-agent drill-down, business-impact measurement
6. **§6 Live HITL chat** — embedded chat, companion thread, external escalation architecture
7. **§7 Cross-surface patterns** — notifications, ⌘K, search, country switching, blueprint library
8. **§8 Motion / icon / density system** — inherited from builder spec §6, applied to these surfaces
9. **§9 Backend services & contracts** — gateway routes, Supabase schema additions, streaming
10. **§10 Sprint & architecture impact map**
11. **§11 Acceptance criteria, risks, open questions**

---

## 1. Cockpit shell IA & navigation

### 1.1 The unit — Country

```
Country {
  id:            uuid
  slug:          'fr' | 'de' | 'es' | 'it' | …
  display_name:  'France' | 'Deutschland' | 'España' | 'Italia' | …
  language:      'fr' | 'de' | 'es' | 'it'
  tenant_id:     uuid                          -- separate Supabase tenant
  bento_config:  jsonb                         -- which modules, in what order
  blueprint_library_enabled: boolean
  created_at, updated_at
}
```

A country is the top-level organisational unit. Every country has its own data, its own bento, its own pilots, its own KPIs. The country selector in the top bar switches between them.

### 1.2 Routes

| Route | Purpose | Surface |
|---|---|---|
| `/:country` | Landing (default tab) | Executive bento |
| `/:country/scenarios` | Scenario catalog | Pilot grid |
| `/:country/kpis` | Business KPI dashboard | Three pillars |
| `/:country/pilots/:slug` | Drill into pilot workspace | Hands off to builder spec routes |

Chat is accessed via the sphere (slide-over panel), not a route. The slide-over is available on every route. On rare occasions, `/:country/chat` opens the full chat view for deep-dive conversations.

### 1.3 Shell anatomy

Four chrome elements present on every surface. Only the centre pane and the sphere's contextual actions swap.

```
┌─ TOP BAR · 52 px ────────────────────────────────────────────────────────────┐
│ AXA · GDAI          [Landing] [Scenarios] [KPIs]     [France ▼]  ⌘K   ⚙️   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                         CENTRE PANE — surface-aware                          │
│                         scrollable, padding: 48 px                           │
│                                                                              │
│   Landing → per-country executive bento (configurable module grid)           │
│   Scenarios → pilot catalog (filterable card grid + compose entry)           │
│   KPIs → three-pillar dashboard (Business · Operational · Quality)           │
│                                                                              │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                          SPHERE ZONE · 180 px                                │
│                                                                              │
│                              ╭──────────╮                                   │
│                              │  SPHERE  │  ← 130×130 px, breathing glow     │
│                              │ companion│     click → radial menu (6 actions)│
│                              ╰──────────╯                                   │
│                         "3 pilots crossed €100k this month."                 │
│                              ↑ companion nudge                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Top bar (52 px):** AXA brand mark + GDAI label, three tab segments (Landing · Scenarios · KPIs) with animated 2 px AXA-blue underline on active, country selector dropdown (chevron-down icon), ⌘K command palette trigger (JetBrains Mono kbd styling), settings gear.

**Centre pane:** Fills remaining viewport height minus 180 px sphere zone. Each surface manages its own scroll via `overflow-y: auto`. Surface transitions cross-fade at 240 ms (`--motion-base`).

**Sphere zone:** Fixed 180 px at viewport bottom. Sphere (130×130 px) centered. Companion nudge line 12 px below. Background: transparent, allowing centre-pane content to show through beneath the sphere. A subtle gradient mask fades the centre-pane content as it approaches the sphere zone (bottom 60 px of centre pane → 0.6 opacity).

### 1.4 Tab bar behavior

| State | Visual | Motion |
|---|---|---|
| Active | AXA-blue `#00008F`, 600 weight, 2 px underline | Underline slides 240 ms (`--motion-base`) |
| Inactive | gray-500 `#6E6E6E`, 400 weight, no underline | — |
| Hover | gray-1000 `#1A1A1A`, 400 weight | 140 ms color transition |
| Notification | Amber pip (6 px dot) next to label, pulses 1.4s | Pip scale 0→1→0.9, two cycles |

Tab switching does not trigger a full-page reload. The centre pane cross-fades (opacity 1→0→1, 240 ms) and the URL updates via `history.pushState`. The sphere's actions and nudge update to match the new surface after a 300 ms delay (so the transition completes first).

### 1.5 Country selector

Dropdown in the top bar, right of the KPIs tab. Displays current country name + flag emoji (FR / DE / ES / IT). Click opens a 240 ms popover:

```
┌─────────────────────────┐
│ ○ France          · 12 pilots │
│ ○ Deutschland      · 8 pilots │
│ ○ España           · 3 pilots │
│ ○ Italia           · 5 pilots │
│ ─────────────────────────────  │
│ + Add country                 │
└─────────────────────────────┘
```

Switching country: full centre-pane reload (different tenant, different data). The sphere does a brief "blink" animation (opacity 1→0.4→1, 240 ms) to signal the context switch. Companion nudge updates immediately.

### 1.6 Per-country routing & data isolation

Each country is a separate Supabase tenant. The gateway resolves `:country` → `tenant_id` via a `countries` lookup table. All subsequent queries are scoped to that tenant. RLS policies enforce tenant isolation at the database level.

The country selector is only visible to users with multi-country access. Single-country users see their country as a fixed label (not a dropdown).

---

## 2. The sphere companion

### 2.1 Design rationale

The sphere is the cockpit's signature. It is NOT decorative — it is the persistent embodiment of the AI companion, always visible, always one click from chat. In a platform where AI agents make decisions that affect real claims, the companion's *visibility* is a trust mechanism: it doesn't hide in a tab, it lives in the room.

### 2.2 Visual design

**Closed state (resting):**

| Attribute | Value |
|---|---|
| Size | 130×130 px |
| Shape | Perfect circle (`border-radius: 50%`) |
| Surface | Video/rendered water sphere, white-background removed (`.webm` with alpha, or pure-CSS layered radial gradients as fallback) |
| Glow | `box-shadow: 0 0 0 8px rgba(0,0,143,0.08), 0 0 0 20px rgba(0,0,143,0.03)` — breathing 3s `ease-in-out` infinite, 0→1→0 opacity on the outer ring |
| Hover | `transform: scale(1.04)`, shadow deepens to `0 14px 28px rgba(0,0,143,0.12)` |
| Cursor | `pointer` |
| Shadow | `filter: drop-shadow(0 14px 28px rgba(0,0,143,0.10)) drop-shadow(0 4px 10px rgba(0,0,0,0.05))` |

**Open state (radial menu active):**

On click, the sphere scales 1→1.08 (`--motion-spring`, 400 ms). Three concentric ripple rings expand outward (360 ms, `--motion-slow`). The backdrop dims from 0→0.85 opacity (240 ms). Six action options fan out in an arc:

- 3 options to the left, staggered 0 ms / 50 ms / 100 ms
- 3 options to the right, staggered 0 ms / 50 ms / 100 ms

Each action option is a pill: Lucide icon (28 px) + label (Source Sans 3, 14 px, 500 weight) + keyboard shortcut hint (JetBrains Mono, 10 px, gray-500). Options animate in with `transform: translate(...) scale(0.8→1)` and `opacity: 0→1`, using spring easing (`cubic-bezier(0.34, 1.56, 0.64, 1)`, 400 ms).

**Close:** Escape key, clicking backdrop, or clicking an action — all three close the menu. The sphere scales back 1.08→1, actions collapse with reverse stagger (right side first), backdrop fades out. 240 ms total.

### 2.3 Contextual actions per surface

Each surface gets its own set of 6 radial actions. "Open chat" is always the bottom-right action — chat is always one click away.

**Landing:**

| Position | Icon | Label | Shortcut | Action |
|---|---|---|---|---|
| Left-top | `file-text` | Executive report | ⌘1 | Generate status deck from all active pilots |
| Left-mid | `bar-chart-3` | Review analytics | ⌘2 | Jump to KPIs tab |
| Left-bot | `lightbulb` | Identify improvements | ⌘3 | Companion proposes top 3 optimisation opportunities |
| Right-top | `message-circle-question` | HITL questions | ⌘4 | Jump to open HITL queue |
| Right-mid | `users-round` | Brainstorm together | ⌘5 | Start a collaborative session |
| Right-bot | `bot-message-square` | Open chat | ⌘6 | Open chat slide-over |

**Scenarios:**

| Position | Icon | Label | Shortcut | Action |
|---|---|---|---|---|
| Left-top | `plus-circle` | New pilot | ⌘1 | Jump to `/pilots/new` |
| Left-mid | `git-compare` | Compare scenarios | ⌘2 | Side-by-side pilot comparison |
| Left-bot | `download` | Export catalog | ⌘3 | Download CSV/PDF of current view |
| Right-top | `message-circle-question` | HITL questions | ⌘4 | Jump to open HITL queue |
| Right-mid | `users-round` | Brainstorm together | ⌘5 | Start a collaborative session |
| Right-bot | `bot-message-square` | Open chat | ⌘6 | Open chat slide-over |

**KPIs:**

| Position | Icon | Label | Shortcut | Action |
|---|---|---|---|---|
| Left-top | `search` | Drill into pilot | ⌘1 | Search and jump to any pilot |
| Left-mid | `file-text` | Generate report | ⌘2 | Draft executive KPI summary |
| Left-bot | `sliders-horizontal` | Adjust thresholds | ⌘3 | Modify KPI alert thresholds |
| Right-top | `message-circle-question` | HITL questions | ⌘4 | Jump to open HITL queue |
| Right-mid | `users-round` | Brainstorm together | ⌘5 | Start a collaborative session |
| Right-bot | `bot-message-square` | Open chat | ⌘6 | Open chat slide-over |

### 2.4 Companion nudge system

One line of text 12 px below the sphere. Changes every 30s (rotating through a pool) or immediately on surface switch. Pool per surface, curated for business relevance. Examples:

**Landing pool (6 items):**
1. *"3 pilots crossed €100k savings this month. Want the breakdown?"*
2. *"Motor-fnol-tow is 2 ACs away from L3. Need a push?"*
3. *"Sophie's team handled 47 HITL cases this week — 12% fewer than last week."*
4. *"Property fast-track has been live for 22 days. Time for a retrospective?"*
5. *"Deutschland just shared a fraud-detection agent. Available in your blueprint library."*
6. *"Cost-per-claim dropped 8% across all live pilots. The trend is holding."*

**Scenarios pool (6 items):**
1. *"4 pilots are drafts. 2 are live. 1 is in canary. Where do you want to focus?"*
2. *"Motor-fnol-tow has been in L2 sandbox for 5 days. Ready to review the cohort report?"*
3. *"PFT-014 hasn't been updated in 14 days. Want me to suggest improvements?"*
4. *"You have 3 blueprint agents available from other countries. Want to browse?"*
5. *"Subrogation pre-screen is stuck at Gate C. The companion flagged a regulatory issue."*
6. *"Two new pilot templates were published this week: SME underwriting + flood claims."*

**KPIs pool (6 items):**
1. *"Quality pillar dropped 2 points. Fraud-rubric drift in 4 pilots."*
2. *"Operational pillar at all-time high — 94% auto-resolution across live pilots."*
3. *"Business pillar: €1.2M projected annual savings. €340k realised to date."*
4. *"Gate B is the most-triggered HITL gate this month. Worth a threshold review?"*
5. *"Eval scores: factual 0.96, policy 0.98, tone 0.94. All above thresholds."*
6. *"3 pilots have audit anomalies this week. Companion flagged all 3 before ops noticed."*

### 2.5 Chat slide-over panel

Clicking "Open chat" (or the sphere itself, double-click) slides a 380 px panel from the right edge. The panel overlays the centre pane (not pushing it). It contains:

- **Header:** "Compagnon · AXA GDAI" + close button + pop-out button (opens `/:country/chat`)
- **Message list:** Companion + user messages, timestamps, citation chips, artifact cards
- **Composer:** Text input + attachment button + send button, at the bottom
- **Thread persistence:** One thread per country (separate from per-pilot threads in the builder spec)

The chat panel is dimissible via: close button, Escape, clicking outside the panel, or clicking the sphere again.

### 2.6 Companion identity (country-level)

The country-level companion is the same entity as the pilot-level companion from the builder spec — same charter, same voice, same refusal patterns — but its context window at the country level spans all pilots. It can answer questions like "which pilot saved the most this month?" or "show me every HITL gate that fired more than 10 times this week."

**Country-level tools (in addition to builder spec §2.5):**
- `list_country_pilots` — all pilots in this country, with level + domain + status
- `aggregate_kpis` — Business / Operational / Quality roll-up across all pilots
- `compare_pilots` — side-by-side KPI comparison for 2+ pilots
- `search_blueprint_library` — cross-country shared assets
- `propose_pilot_template` — suggest a new pilot from blueprint library

---

## 3. Landing page — per-country executive bento

### 3.1 Purpose

The landing page is the country's front page. It answers, in one scroll: *"How are our AI pilots performing, what needs attention, and what should I do next?"*

It is NOT a static page. Each country's plateau head configures which modules appear, in what order, with what size (small / medium / large / tall / wide). The companion helps compose the bento during onboarding, then the plateau head adjusts over time.

### 3.2 Module catalog

Every module is a self-contained card that can be placed in the bento grid. Modules pull live data from the country's Supabase tenant.

| Module | Size options | Tier 1 content | Tier 2 (expand) | Tier 3 (hover/click) |
|---|---|---|---|---|
| **Pilot highlight** | M, L, tall | Featured pilot: icon + name + level + 1 hero KPI | Full pilot summary, last 5 runs sparkline | Jump to pilot workspace |
| **KPI hero strip** | L, wide | 3–5 KPIs as a horizontal strip: each = icon + big number + label + sparkline | 14-KPI full table | Drill into any KPI → per-pilot breakdown |
| **Active pilots grid** | M, L, wide | Mini-cards: pilot icon + name + level pip + live/stable indicator | Pilot detail cards | Jump to pilot workspace |
| **HITL queue snapshot** | S, M | "4 cases awaiting operator" + oldest case age | Full queue with CLM-IDs + timestamps | Jump to HITL chat |
| **Recent activity feed** | M, tall | Chronological: pilot promotions, runs completed, gates fired, anomalies flagged | Full activity log with filters | Jump to event |
| **Blueprint library** | M, L | "3 new blueprints available" + top 2 cards | Full library browser | Import blueprint → new pilot draft |
| **Country comparison** (opt-in) | M, L | "Your KPIs vs. Deutschland: +12% throughput, −3% latency" | Full comparison table | Toggle which countries to compare |
| **Companion insight card** | S, M, L | One companion-generated insight per day, with citation | Full insight with supporting data | Open chat to discuss |
| **Pilot health map** | L, wide | One-glance grid: every pilot as a green/amber/red dot on level × domain | Click dot → pilot summary card | Jump to pilot workspace |
| **Savings tracker** | M, L | "€340k saved to date · €1.2M projected annual" + progress bar toward target | Monthly breakdown, per-pilot contribution | Sensitivity: "what if we add 2 more pilots?" |
| **Quality gate completion** | M, L | % of pilots that passed all quality gates, per level | Gate-by-gate breakdown, per pilot | Drill into specific gate failures |
| **Announcements** | S | System-wide or country-specific announcements (new features, maintenance) | Full announcement | — |

### 3.3 Grid system

A 12-column CSS Grid with `gap: 16px` and configurable row spans.

```
Module sizes:
  S     = 3 cols × 1 row   ( ~280×200 px )
  M     = 3 cols × 2 rows  ( ~280×420 px )
  L     = 6 cols × 2 rows  ( ~580×420 px )
  tall  = 3 cols × 4 rows  ( ~280×880 px )
  wide  = 12 cols × 2 rows ( ~1180×420 px )
```

Default bento for France (first-time onboarding):

```
┌──────────┬──────────┬──────────┬──────────┐
│  KPI hero strip (wide)                    │
├──────────┬──────────┬──────────┬──────────┤
│ Pilot    │ Active   │ HITL     │ Companion│
│ highlight│ pilots   │ queue    │ insight  │
│ (M)      │ grid (L) │ snap (S) │ card (S) │
├──────────┤          ├──────────┼──────────┤
│ Savings  │          │ Quality  │ Blueprint│
│ tracker  │          │ gate (S) │ library  │
│ (M)      │          │          │ (S)      │
├──────────┴──────────┴──────────┴──────────┤
│  Recent activity feed (wide)              │
└───────────────────────────────────────────┘
```

### 3.4 Bento configuration

Plateau heads configure their bento via: Settings gear → "Customise landing page" → drag-and-drop grid editor.

The companion can also propose a bento: *"Based on your 5 active pilots and the KPIs you watch most, I'd suggest: KPI hero strip at top, active pilots grid centre-left, HITL queue top-right, and companion insight bottom-right. Want me to set that up?"*

Configuration is stored in `country.bento_config` as JSON:
```json
{
  "modules": [
    { "id": "kpi-hero-strip", "size": "wide", "order": 0 },
    { "id": "pilot-highlight", "size": "M", "order": 1, "pilot_slug": "motor-fnol-tow" },
    { "id": "active-pilots-grid", "size": "L", "order": 2 },
    …
  ],
  "version": 3,
  "updated_by": "user_id",
  "updated_at": "2026-05-05T10:00:00Z"
}
```

### 3.5 Live indicators

Modules that reflect live state (KPI hero strip, active pilots grid, HITL queue) pulse subtly when their data updates:
- KPI numbers: brief azur halo (600 ms) when the value changes
- Live pilot cards: the existing `c-shimmer` animation on the top border (inherited from Codex)
- HITL queue count: amber pulse (1.4s) when a new case enters the queue
- Quality gate completion: green check-circle scale-in (360 ms) when a gate passes

### 3.6 Copy (EN | FR)

| Element | EN | FR |
|---|---|---|
| Page title | "AXA GDAI · Cockpit" | "AXA GDAI · Cockpit" |
| Welcome lede | "Your pilots, your numbers, your decisions." | "Vos pilotes, vos chiffres, vos décisions." |
| KPI hero — savings | "Saved to date" | "Économisé à date" |
| KPI hero — throughput | "Claims processed · 30d" | "Sinistres traités · 30j" |
| KPI hero — auto-resolve | "Auto-resolved · 30d" | "Auto-résolus · 30j" |
| KPI hero — eval pass | "Eval pass · 7d" | "Eval validés · 7j" |
| KPI hero — HITL queue | "Awaiting operator" | "En attente opérateur" |
| HITL queue empty | "No cases waiting. Your team is clear." | "Aucun dossier en attente. L'équipe est au clair." |
| Blueprint library empty | "No blueprints shared yet. Be the first." | "Aucun blueprint partagé. Soyez le premier." |
| Customise CTA | "Customise this page" | "Personnaliser cette page" |
| Companion insight label | "Today's insight from your companion" | "L'analyse du jour par votre compagnon" |

---

## 4. Scenario view — per-country pilot catalog

### 4.1 Purpose

The scenario view is the country's full pilot catalog. Every pilot the country owns — from L0 draft to L4 live — is visible here, filterable and searchable. Operators use it to find a pilot, check its status, and drill in.

### 4.2 Card design

Each pilot is a card in a responsive grid (3 columns at 1440 px, 2 at 1024 px, 1 at 768 px).

**Card anatomy (Tier 1 — always visible):**

```
┌─────────────────────────────────┐
│ ● Live · L3              🚗 Motor │  ← status pip + level + domain badge
│                                   │
│ Motor FNOL + Tow Dispatch        │  ← pilot name (Publico Headline, 24 px)
│                                   │
│ 14 nodes · 4 HITL gates          │  ← one-line summary
│                                   │
│ ─────────────────────────────────│  ← hairline rule
│                                   │
│ €340k saved · 98.4% eval · 12.4k │  ← 3 mini KPIs (tabular-nums)
│ claims · this month              │
│                                   │
│ [live shimmer on top border]      │  ← green/blue animated border if running
└─────────────────────────────────┘
```

**Card anatomy (Tier 2 — click expand / hover):**

Clicking a card or hovering for 400 ms expands it inline (240 ms, `--motion-base`):

```
┌─────────────────────────────────┐
│ … Tier 1 content …              │
│ ─────────────────────────────────│
│ Last run: 14:42 · 87s · pass    │  ← most recent run summary
│ HITL queue: 0 cases waiting     │  ← current HITL status
│ Companion: "Gate B threshold     │  ← last companion message excerpt
│   worth reviewing — 23 fires    │
│   this week."                   │
│                                   │
│ [Open canvas] [View KPIs] [Chat] │  ← action buttons
└─────────────────────────────────┘
```

**Status indicators:**

| State | Pip | Border | Label |
|---|---|---|---|
| Draft (L0) | gray-500 `●` | none | "Draft · v0.4" |
| Solo test (L1) | azur `●` pulsing 1.4s | none | "Solo test · 3 runs today" |
| Sandbox (L2) | azur `●` | none | "Sandbox · cohort running" |
| Canary (L3) | amber `●` pulsing 1.4s | amber ribbon left 3px | "Canary · 5% traffic" |
| Live (L4) | green `●` | green live-shimmer top 2px | "Live · full traffic" |
| Blocked | red `●` | red left 3px | "Blocked · Gate C" |
| Archived | gray-140 `●` | none, 70% opacity | "Archived · Q1 2026" |

### 4.3 Filtering & search

**Segmented filter tabs (inherited from current scenarios.html):**

```
[All 08] [Drafts 03] [Solo test 01] [Sandbox 01] [Canary 01] [Live 02] [Blocked 00]
```

Active segment: AXA-blue background, white text, 4 px radius (`--radius-sm`).

**Search bar (right of filter tabs):**

Magnifying glass icon + input, JetBrains Mono placeholder "Search pilots…". Searches pilot name, domain, and description. Results filter as you type (140 ms debounce).

**Sort dropdown (right of search):**

"Sort by: Recently updated · Name A–Z · Level (high→low) · Savings (high→low) · Eval score (high→low)"

### 4.4 Empty states

| State | Visual | Copy (EN) | Copy (FR) |
|---|---|---|---|
| No pilots at all | Empty grid + large `plus-circle` icon + CTA | "No pilots yet. Your companion can help you compose the first one." [Compose a pilot →] | "Aucun pilote. Votre compagnon peut vous aider à composer le premier." [Composer un pilote →] |
| No results for filter | Empty grid + `search` icon | "No pilots match this filter. Try a different level or clear the search." | "Aucun pilote ne correspond à ce filtre. Essayez un autre niveau ou effacez la recherche." |
| All pilots blocked | Amber banner at top of grid | "2 pilots are blocked and need attention. The companion has suggestions." | "2 pilotes sont bloqués et nécessitent votre attention. Le compagnon a des suggestions." |

### 4.5 "Compose new pilot" entry point

A distinct card at the start of the grid (or at the end if pilots exist) with a dashed border, `plus-circle` icon centered, and the label "Compose a new pilot" / "Composer un nouveau pilote". Click navigates to `/pilots/new` (the Step 0 chat hero from the builder spec).

### 4.6 Copy (EN | FR)

| Element | EN | FR |
|---|---|---|
| Page title | "Scenarios" | "Scénarios" |
| Filter — All | "All" | "Tous" |
| Filter — Drafts | "Drafts" | "Brouillons" |
| Filter — Solo test | "Solo test" | "Test solo" |
| Filter — Sandbox | "Sandbox" | "Sandbox" |
| Filter — Canary | "Canary" | "Canary" |
| Filter — Live | "Live" | "En production" |
| Filter — Blocked | "Blocked" | "Bloqués" |
| Search placeholder | "Search pilots…" | "Rechercher un pilote…" |
| Compose CTA | "Compose a new pilot" | "Composer un nouveau pilote" |
| Sort — Recent | "Recently updated" | "Mis à jour récemment" |
| Sort — Savings | "Savings (high→low)" | "Économies (décroissant)" |

---

## 5. Business KPI dashboard — three pillars

### 5.1 Purpose

The KPI dashboard is the country's governance cockpit. It answers: *"Is our AI working, is it safe, and is it worth the investment?"*

Three pillars — Business, Operational, Quality — must balance for AI to work responsibly. Any pillar drifting triggers the companion to surface it. The dashboard is NOT an AI technical monitor — it is a business governance tool that happens to be powered by AI traces.

### 5.2 Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  KPIs · France                                    Last updated: now │
│                                                                   │
│  "Three forces. One view. Every number auditable."               │
│                                                                   │
│ ┌─── BUSINESS ──────┬─── OPERATIONAL ────┬─── QUALITY ─────────┐ │
│ │                   │                    │                      │ │
│ │ €340k             │ 94.2%              │ 96.8%               │ │
│ │ saved to date     │ auto-resolve · 30d │ eval pass · 7d      │ │
│ │ ▁▂▃▄▅▆▇ sparkline │ ▁▂▃▄▅▆ sparkline   │ ▁▂▃▅▆▇ sparkline     │ │
│ │                   │                    │                      │ │
│ │ €1.2M projected   │ 12,481 claims      │ Factual  · 0.96     │ │
│ │ annual            │ processed · 30d    │ Policy   · 0.98     │ │
│ │                   │                    │ Tone     · 0.94     │ │
│ │ €18.40 / claim    │ 1.4s median        │                      │ │
│ │ avg cost          │ latency            │ 4/4 gates passing   │ │
│ │                   │                    │                      │ │
│ │ Per-pilot ▼       │ Per-pilot ▼       │ Per-pilot ▼         │ │
│ └───────────────────┴────────────────────┴──────────────────────┘ │
│                                                                    │
│ ┌─── DETAIL PANEL (Tier 2 — opens on pillar click) ─────────────┐ │
│ │ … per-pilot breakdown table + sparklines + drill-down CTAs …  │ │
│ └────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

### 5.3 Pillar 1 — Business (ROI, savings, cost)

**Tier 1 KPIs (always visible, ≤ 5 numbers):**

| KPI | Visual | Source |
|---|---|---|
| Saved to date | Big number (coins icon) + sparkline (30d) | Sum of `pilot.total_savings_eur` across all live pilots |
| Projected annual | Medium number, muted label "estimate, refine in pilot" | Companion projection from Movement IV business cases |
| Avg cost / claim | Medium number | Total LLM+integration cost / claims processed |
| Cost trend | Sparkline only, 30d, green if declining | Per-day cost aggregation |
| ROI % | Big number (trending-up icon) + "since pilot launch" | (Savings − Cost) / Cost × 100 |

**Tier 2 (click "Business" header to expand):**

Per-pilot savings breakdown table. Columns: Pilot name, Level, Savings (€), Cost (€), ROI %, Trend sparkline. Sortable by any column. Click a row → jump to that pilot's workspace.

**Tier 3 (hover any per-pilot row):**

Mini-detail card with: pilot domain, months live, total claims, avg savings/claim, companion's latest assessment.

### 5.4 Pillar 2 — Operational (throughput, HITL, latency)

**Tier 1 KPIs (always visible, ≤ 5 numbers):**

| KPI | Visual | Source |
|---|---|---|
| Auto-resolve % · 30d | Big number (radio icon) + sparkline | Claims resolved without HITL / total claims |
| Claims processed · 30d | Big number (bar-chart icon) | Count of `pilot_run` completed |
| Median latency | Medium number (timer icon) | p50 end-to-end from Langfuse traces |
| HITL queue depth | Medium number (shield-check icon) + "oldest: 14m" | Current `open_concerns` count across all pilots |
| Operator load | Horizontal bar: green ≤5, amber 5–10, red >10 cases/operator | HITL cases / operator on shift |

**Tier 2 (expand):**

Per-pilot throughput table + HITL gate heat-map (rows = gates, cols = severity bands, cell intensity = trigger frequency — inherited from builder spec §7.1 panel 3).

**Tier 3 (hover a gate cell):**

Sample of 3 most recent HITL cases that triggered this gate, with CLM-IDs, timestamps, and operator decisions.

### 5.5 Pillar 3 — Quality (evals, compliance, gates)

**Tier 1 KPIs (always visible, ≤ 5 numbers):**

| KPI | Visual | Source |
|---|---|---|
| Eval pass · 7d | Big number (shield-check icon) + sparkline | Langfuse eval scores aggregated: (factual + policy + tone) / 3 |
| Factual accuracy | Medium number (book-open icon) | LLM-judge factual score, rolling 7d |
| Policy compliance | Medium number (gavel icon) | LLM-judge policy score, rolling 7d |
| Customer tone | Medium number (message-circle icon) | LLM-judge tone score, rolling 7d |
| Gates passing | "4/4 gates passing" or "3/4 · Gate C amber" | Count of gates where all recent runs passed / total gates |

**Tier 2 (expand):**

Per-pilot eval score table + per-gate compliance status. Each gate row: gate name, pass rate (30d), last failure date, companion diagnosis if failing. Gate failures are ranked by business impact (€ at risk).

**Tier 3 (hover a gate failure):**

Full Langfuse trace of the most recent failure: the span that failed, the rubric score, the companion's suggested remediation.

### 5.6 Agent-level drill-down

From any pillar, clicking "Per-pilot ▼" expands to a full per-agent breakdown:

```
┌─── Agent-level analysis · motor-fnol-tow · L3 canary ─────────────┐
│                                                                     │
│ Agent topology (reused from builder spec canvas):                  │
│                                                                     │
│  i. ElevenLabs voice agent  ──── ● 98.2% pass · 1.1s p50          │
│ ii. AI intent classify      ──── ● 97.8% pass · 0.3s p50          │
│ iii. Guidewire policy lookup ─── ● 99.1% pass · 0.8s p50          │
│ iv. AI fraud-score          ──── ◉ 94.3% pass · 0.6s p50  ← amber │
│  v. ⚠ Gate A — fraud > 0.65 ─── ● 96.1% pass · 87s avg handle     │
│ …                                                                   │
│                                                                     │
│ Click any node → inspector panel with:                             │
│   · Last 5 runs (pass/fail + traces)                               │
│   · Eval rubric scores for this node                               │
│   · Cost per execution                                             │
│   · Open concerns related to this node                             │
│   · "Ask companion about this node →" affordance                   │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.7 Business-impact measurement

Beyond technical KPIs, the dashboard surfaces **business impact** through companion-generated insights:

- **Cost avoidance:** *"Gate A catches €4,800/error. This month: 47 catches = €225,600 avoided. Last month: 39 catches."*
- **Time returned to operators:** *"Auto-resolution saves Sophie's team ~5.4 h/day across all pilots. That's 0.7 FTE."*
- **Regulatory safety margin:** *"All 4 gates are above their legal minimum thresholds. Gate C has the smallest margin (+2.1%)."*
- **Customer experience proxy:** *"NPS prediction model shows +8 points for auto-resolved claims vs. traditional process."*

These insights appear as cards in a "Business impact" row below the three pillars, updated daily by the companion.

### 5.8 Copy (EN | FR)

| Element | EN | FR |
|---|---|---|
| Page title | "KPIs" | "KPIs" |
| Lede | "Three forces. One view. Every number auditable." | "Trois forces. Une vue. Chaque chiffre est auditable." |
| Business pillar | "Business" | "Business" |
| Operational pillar | "Operational" | "Opérationnel" |
| Quality pillar | "Quality" | "Qualité" |
| Saved to date | "Saved to date" | "Économisé à date" |
| Projected annual | "Projected annual · estimate, refine in pilot" | "Projection annuelle · estimation, à raffiner au pilote" |
| Auto-resolve | "Auto-resolved · 30d" | "Auto-résolus · 30j" |
| Eval pass | "Eval pass · 7d" | "Eval validés · 7j" |
| Gates passing | "Gates passing" | "Portes validées" |
| Business impact row | "Business impact · companion analysis" | "Impact business · analyse du compagnon" |
| Per-pilot breakdown | "Per-pilot breakdown" | "Détail par pilote" |
| Agent-level drill | "Agent-level analysis" | "Analyse par agent" |
| Gate failure hover | "Last failure: [date] · Companion diagnosis →" | "Dernier échec : [date] · Diagnostic du compagnon →" |

---

## 6. Live HITL chat — embedded companion communication

### 6.1 Purpose

The HITL chat is the cockpit's communication layer. It serves three functions:

1. **Educational tool during PoC:** operators learn what the AI does by watching the companion narrate runs and explain decisions. They ask questions, the companion answers with citations.
2. **Scenario builder companion:** operators compose pilots together with the companion (the Step 0 chat hero from the builder spec, accessible from anywhere).
3. **HITL decision support:** when a gate fires, the operator sees the evidence packet in chat, asks the companion for context, and makes the decision — all without leaving the cockpit.

### 6.2 Chat architecture

One persistent chat thread per country. This is separate from the per-pilot chat threads defined in the builder spec. The country-level thread is for cross-pilot questions, HITL decision support, and general companion interaction.

```
Country chat thread:
  - "Show me all blocked pilots"
  - "Why did Gate C fire 23 times this week?"
  - "Compare motor-fnol-tow and property-fast-track on cost-per-claim"
  - "Draft the monthly steering committee update"

Pilot chat thread (builder spec):
  - "Add a fraud check after the policy lookup"
  - "What if we raised Gate A to 0.75?"
  - "Ship this to L1"
```

Users can @-reference a pilot in the country chat to pull in pilot-specific context: *"@motor-fnol-tow show me the last 5 Gate B decisions"*.

### 6.3 Chat UI

The chat slide-over panel (§2.5) is the primary interface. On `/:country/chat`, the chat becomes the full centre pane.

**Message types:**

| Type | Visual | Example |
|---|---|---|
| User message | Right-aligned, white bg, gray-800 text, 14 px Source Sans 3 | "Why did Gate C fire 23 times this week?" |
| Companion message | Left-aligned, gray-50 bg, gray-1000 text, 14 px, with avatar (sphere mini, 24 px) | "Gate C fired 23 times because 23 claims exceeded €4,000 with an auto-decision recommendation. RGPD Art. 22 requires human review above this threshold. [citation: RGPD Art. 22 §1]." |
| System message | Centered, gray-500, 11 px JetBrains Mono | "Pilot motor-fnol-tow promoted to L3 · 14:42" |
| Artifact card | Left-aligned, white card with 1 px border, embedded in companion message | A mini KPI card, a gate decision packet, a generated deck link |
| Citation chip | Inline in companion message, superscript number, hover-expands to 240 px card | `¹` → "ACPR Art. L113-2 · binding · View source →" |
| Thinking indicator | Three breathing dots + bot-message-square icon, gray-500, 600 ms loop | Companion is calling tools or retrieving data |

### 6.4 HITL decision in chat

When a gate fires and requires operator attention, the companion posts a **decision packet** into the chat:

```
┌─ ⚠ Gate B — severity high · CLM-2026-0054 ──────────────────────┐
│                                                                   │
│ Claim: Motor FNOL · A6 Paris · multi-vehicle collision           │
│ AI severity: HIGH · confidence 0.92                              │
│ Gate triggers: severity high → must be reviewed within 5 min     │
│                                                                   │
│ Evidence packet:                                                  │
│  · AI damage estimate: €14,200 (from MMS photos)                 │
│  · Guidewire policy: COMP-88432 · €25,000 cover                  │
│  · Fraud score: 0.23 · low risk                                  │
│  · Tow dispatched: Dépannage Lyon · ETA 18 min                   │
│                                                                   │
│ Cost if wrong: €25,000 / error                                   │
│ Operator SLA: 5 min                                               │
│                                                                   │
│ [Approve AI assessment]  [Override + explain]  [Escalate]        │
│                                                                   │
│ "Ask companion: explain the severity logic →"                    │
└───────────────────────────────────────────────────────────────────┘
```

Operator clicks Approve → the run resumes, the decision is audit-logged, the companion posts a confirmation. Operator clicks Override → a text field opens, the operator explains, the companion acknowledges and logs. Operator clicks Escalate → the packet is queued for a senior operator, the companion posts the handover confirmation.

### 6.5 External escalation — architected, not deployed

The chat is designed so that pushing a decision packet to Teams, Salesforce, or ServiceNow is an **adapter swap**, not a rebuild.

```
  ┌─ Cockpit chat ──────────────────────────┐
  │                                          │
  │  Companion posts decision packet         │
  │  Operator sees it in chat                │
  │  Operator decides (Approve / Override)   │
  │  Decision logged to audit_log            │
  │                                          │
  │  [Future: push to external]  ←─── adapter layer                │
  │    ├─ Teams: adaptive card via webhook                          │
  │    ├─ Salesforce: Case object via REST API                     │
  │    └─ ServiceNow: incident via REST API                        │
  │                                                                 │
  │  External replies flow back via webhook → chat thread           │
  └──────────────────────────────────────────────────────────────────┘
```

The adapter interface:
```python
class ExternalNotificationAdapter(ABC):
    async def push_decision_packet(self, packet: DecisionPacket) -> str: …
    async def receive_external_reply(self, payload: dict) -> ChatMessage: …
    async def check_delivery_status(self, external_id: str) -> DeliveryStatus: …
```

At PoC launch, the adapter is a **no-op** — all communication stays in the cockpit. When a country is ready, they configure their Teams/SF/ServiceNow credentials in the admin panel, flip a feature flag, and the adapter activates. No code changes. No redeploy.

### 6.6 Copy (EN | FR)

| Element | EN | FR |
|---|---|---|
| Chat header | "Compagnon · AXA GDAI" | "Compagnon · AXA GDAI" |
| Thinking | "Thinking…" | "Je réfléchis…" |
| Decision — Approve | "Approve AI assessment" | "Approuver l'évaluation IA" |
| Decision — Override | "Override + explain" | "Remplacer + expliquer" |
| Decision — Escalate | "Escalate" | "Escalader" |
| SLA warning | "4m 32s remaining · SLA: 5 min" | "4m 32s restantes · SLA : 5 min" |
| Citation hover | "View source →" | "Voir la source →" |
| Companion opening | "I'm here. Ask me about any pilot, any KPI, any decision." | "Je suis là. Interrogez-moi sur n'importe quel pilote, KPI, ou décision." |
| Empty chat | "Your companion is ready. Ask a question or open a pilot to start." | "Votre compagnon est prêt. Posez une question ou ouvrez un pilote pour commencer." |

---

## 7. Cross-surface patterns

### 7.1 ⌘K command palette

Triggered by ⌘K or clicking the top-bar button. A centered modal overlay (glass, `backdrop-blur-xl`, dark background 0.85 opacity) with a search input at top. Results grouped:

```
┌─────────────────────────────────────────┐
│ [search input]                           │
│                                          │
│ ── GO TO ──                              │
│  → Landing                    ⌘1        │
│  → Scenarios                  ⌘2        │
│  → KPIs                       ⌘3        │
│  → Open chat                  ⌘6        │
│                                          │
│ ── PILOTS ──                             │
│  → motor-fnol-tow · L3       canary     │
│  → property-fast-track · L4  live       │
│  → subrogation-pre-screen · L0  draft   │
│  …                                       │
│                                          │
│ ── ACTIONS ──                            │
│  → Compose new pilot                     │
│  → Generate executive report             │
│  → Browse blueprint library              │
│  → Customise landing page               │
│                                          │
│ ── RECENT ──                             │
│  → motor-fnol-tow · Gate B decision      │
│  → KPIs · Business pillar               │
│  …                                       │
└─────────────────────────────────────────┘
```

Navigation via arrow keys + Enter. 140 ms debounce on search. Results ranked by recency + relevance. `Escape` closes.

### 7.2 Notification system

Notifications appear as:
1. **Amber pip** on the relevant tab (KPIs if a quality gate failed, Scenarios if a pilot is blocked)
2. **Companion nudge** update within 30s
3. **Toast** in top-right corner for time-sensitive items (HITL SLA approaching, pilot promoted)

Toasts auto-dismiss after 5s. Clicking a toast navigates to the relevant surface.

### 7.3 Country switching

The country selector dropdown (§1.5) switches the active country. The entire shell re-renders with the new country's data. The sphere does a brief "blink" to signal the context switch. The companion's country-level thread switches. Pilot-level threads are unaffected (they belong to the pilot, not the country selector).

### 7.4 Blueprint library

Accessible from the landing page module, ⌘K, or the sphere's "Brainstorm together" action. A modal browser showing cross-country shared assets:

```
┌─── Blueprint library ────────────────────────────────────────────┐
│  [Search blueprints…]  [Agents] [Flows] [Synth data] [Dashboards] │
│                                                                   │
│  ┌─ Fraud detection agent ──────────────────────────────────────┐ │
│  │ Shared by: Deutschland · 3 countries using this              │ │
│  │ "Rubric-driven fraud score with ACPR-aligned thresholds."     │ │
│  │ Compatible with: Motor, Property, SME underwriting           │ │
│  │ [Preview] [Import to my pilots →]                             │ │
│  └──────────────────────────────────────────────────────────────┘ │
│  …                                                                │
└───────────────────────────────────────────────────────────────────┘
```

Importing a blueprint creates a draft pilot or adds the asset to the country's library. The companion helps adapt it to the country's specific requirements during import.

### 7.5 Settings & administration

Accessible from the gear icon in the top bar. Country-level settings:

- **Landing page:** customise bento layout
- **KPIs:** adjust alert thresholds per pillar
- **Chat:** configure external escalation (Teams/SF/ServiceNow credentials)
- **Blueprint library:** manage shared assets, set visibility
- **Country profile:** name, language, flag, users with access

---

## 8. Motion / icon / density system

### 8.1 Inheritance from builder spec

The builder spec §6 defines the complete motion/icon/density/progressive-disclosure system. This spec inherits it unchanged. The key elements applied to these surfaces:

**Motion tokens (unchanged from builder spec §6.3):**

| Token | Duration | Easing | Usage in cockpit surfaces |
|---|---|---|---|
| `--motion-tap` | 80 ms | `cubic-bezier(0.32, 0.72, 0, 1)` | Button press, tab switch |
| `--motion-fast` | 140 ms | `cubic-bezier(0.32, 0.72, 0, 1)` | Hover transitions, pip pulses |
| `--motion-base` | 240 ms | `cubic-bezier(0.32, 0.72, 0, 1)` | Surface transitions, card expands, chat slide-over, backdrop fade |
| `--motion-slow` | 600 ms | `cubic-bezier(0.32, 0.72, 0, 1)` | Sphere glow breathing, KPI number tweens |
| `--motion-spring` | 400 ms | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Radial menu fan-out, ripple rings |

**Density rules (unchanged from builder spec §6.4):**

| Rule | Threshold | Applied to |
|---|---|---|
| Visible KPIs per screen | ≤ 5 primary; rest behind "+ more" | KPI dashboard (each pillar ≤ 5), landing page modules |
| Tags / chips per card | ≤ 4; overflow as +N chip | Scenario cards, KPI breakdown rows |
| One expanded section per screen | ≤ 1; auto-collapse others | KPI pillar expand, scenario card expand |
| One halo per screen | exactly one "loud" element | Sphere glow (always the halo), live-shimmer on 1 featured card |
| Copy above fold | ≤ 60 words; longer → "Read more" | Landing lede, KPI explanations |
| Chat message length | ≤ 180 chars; longer → artifact | Companion messages in chat |
| Numbers visible together | ≤ 4; tabular-nums always | KPI numbers, savings displays |

**Progressive disclosure (unchanged from builder spec §6.5):**

| Tier | Trigger | Content |
|---|---|---|
| Tier 1 — Headline | Always visible, ~64 px | Icon + title + 1 number + status pip |
| Tier 2 — Detail | One click, 240 ms expand | Key/value rows, 4–6 max, citation chips |
| Tier 3 — Depth | One more click or hover, 240 ms | Full trace, per-pilot table, agent-level analysis |
| Tier 4 — Ask | Always available via sphere/chat | "Tell me more about…" → companion expands in chat |

### 8.2 Icon mapping (cockpit surfaces — additive to builder spec §6.2)

| Concept | Lucide icon | Size | Usage |
|---|---|---|---|
| Landing tab | `layout-dashboard` | 16 px | Tab bar |
| Scenarios tab | `grid-3x3` | 16 px | Tab bar |
| KPIs tab | `bar-chart-3` | 16 px | Tab bar |
| Country selector | `globe` | 16 px | Top bar dropdown |
| Settings | `settings` | 16 px | Top bar gear |
| Command palette | `command` | 16 px | ⌘K button |
| Business pillar | `coins` | 24 px | KPI dashboard |
| Operational pillar | `radio` | 24 px | KPI dashboard |
| Quality pillar | `shield-check` | 24 px | KPI dashboard |
| Saved to date | `coins` | 20 px | KPI hero, business pillar |
| Auto-resolve % | `radio` | 20 px | Operational pillar |
| Eval pass % | `shield-check` | 20 px | Quality pillar |
| Latency | `timer` | 16 px | Operational pillar |
| Cost | `receipt` | 16 px | Business pillar |
| HITL queue | `message-circle-question` | 20 px | Landing module, chat |
| Blueprint library | `package-open` | 20 px | Landing module |
| New pilot | `plus-circle` | 24 px | Scenarios, ⌘K |
| Chat | `bot-message-square` | 24 px | Sphere action, chat header |
| Thinking | `bot-message-square` + breathing dots | 16 px | Chat indicator |
| Gate passed | `shield-check` | 16 px | Quality pillar, KPI cards |
| Gate warning | `shield-alert` | 16 px | Quality pillar, notifications |
| Gate failed | `octagon-alert` | 16 px | Quality pillar |
| Escalate | `arrow-up-right` | 16 px | HITL decision packet |
| External tool | `external-link` | 12 px | Future: Teams/SF/ServiceNow |

### 8.3 Per-surface animation specs (new to this spec)

| Element | Trigger | Animation | Duration |
|---|---|---|---|
| Tab underline | Tab switch | `translateX` slide to new position | 240 ms (`--motion-base`) |
| Centre pane | Tab switch | Opacity cross-fade 1→0→1 | 240 ms (`--motion-base`) |
| Sphere glow | Always | `box-shadow` breathing 0→1→0 opacity, outer ring | 3000 ms `ease-in-out` infinite |
| Sphere hover | Mouse enter | `scale(1.04)`, shadow deepens | 240 ms (`--motion-base`) |
| Sphere click | Click | `scale(1→1.08)`, three ripple rings expand | 400 ms (`--motion-spring`) + 360 ms rings |
| Radial actions | Sphere open | 6 actions fan out, staggered 0/50/100 ms per side | 400 ms each (`--motion-spring`) |
| Backdrop | Sphere open | Opacity 0→0.85 | 240 ms (`--motion-base`) |
| Companion nudge | Surface switch / 30s rotate | Opacity 0→1, `translateY(4→0)` | 240 ms (`--motion-base`) |
| Chat slide-over | Open chat action | Panel slides from right, `translateX(380→0)`, opacity 0→1 | 240 ms (`--motion-base`) |
| Card expand | Scenario card click/hover | Height auto, child content fades in | 240 ms (`--motion-base`) |
| KPI number update | Data change | Number counts to new value (eased tween), brief azur halo | 600 ms (`--motion-slow`) |
| Live shimmer | Live pilot on scenarios grid | `background-position` animation, left→right | 2000 ms linear infinite (inherited from Codex) |
| HITL pulse | New case enters queue | Amber border pulse, 2 cycles | 1400 ms (700 ms × 2) |
| Toast enter | Notification appears | `translateX(24→0)`, opacity 0→1 | 240 ms (`--motion-base`) |
| Toast exit | Notification dismisses | `translateX(0→24)`, opacity 1→0 | 240 ms (`--motion-base`) |
| Gate pass check | Quality gate passes | `scale(0→1.2→1)` check-circle icon, green | 360 ms (`--motion-slow`) |
| Country switch | Country selector change | Centre pane opacity 1→0.4→1, sphere blink | 240 ms each phase |
| Reduced motion | `prefers-reduced-motion: reduce` | All animations → `--motion-instant` (0 ms) | 0 ms |

---

## 9. Backend services & contracts

### 9.1 New gateway routes

All routes are prefixed by country. The gateway resolves `:country` → `tenant_id` via the `countries` table.

```
GET   /api/countries                         list countries accessible to user
GET   /api/:country/landing                  get bento config + module data
PUT   /api/:country/landing/config           update bento configuration
GET   /api/:country/scenarios                list pilots (filter: level, domain, status, search)
GET   /api/:country/kpis                     aggregate KPIs across all pilots
GET   /api/:country/kpis/:pilot_slug         per-pilot KPI breakdown
GET   /api/:country/kpis/:pilot_slug/agents  per-agent trace analysis
GET   /api/:country/chat/thread              get or create country-level chat thread
POST  /api/:country/chat/messages            user → companion (streamed SSE)
GET   /api/:country/blueprints               list available blueprints from other countries
POST  /api/:country/blueprints/:id/import    import a blueprint into this country
POST  /api/:country/chat/escalate            future: push decision packet to external tool
```

### 9.2 New Supabase migrations (additive)

```
db/migrations/
  0017_countries.sql          -- countries table (slug, display_name, language, tenant_id, bento_config)
  0018_country_users.sql      -- country_users (user ↔ country access, role)
  0019_blueprints.sql         -- blueprint_library (shared agents, flows, synth data, dashboard configs)
  0020_chat_threads_country.sql -- country-level chat threads (separate from per-pilot threads)
  0021_kpi_snapshots.sql      -- daily KPI snapshots for trend sparklines
  0022_notification_prefs.sql -- per-user notification preferences
```

Every table includes `tenant_id text not null references tenants(id)` + RLS policy in the same migration.

### 9.3 KPI snapshot materialization

KPIs are computed from Langfuse traces + Supabase pilot data + cost accumulators. To keep the dashboard responsive (≤ 500 ms load), daily KPIs are materialized into `kpi_snapshots` via a cron job (every 6h). Real-time KPIs (HITL queue depth, currently-running pilots) are live-queried. Sparklines read from snapshots.

### 9.4 Streaming

- **Chat token streaming:** SSE, same as builder spec §8.5.
- **KPI live updates:** WebSocket. When a pilot's state changes (run completed, gate fired, level promoted), the gateway broadcasts a `kpi_update` event to the country's WebSocket channel. The dashboard updates the relevant KPI number inline (eased tween, 600 ms).

---

## 10. Sprint & architecture impact map

### 10.1 Architecture.md — sections to update

| § | Section | Change |
|---|---|---|
| §1 | High-level topology | Add country routing layer, blueprint library service |
| §3 | Wire format | Add WebSocket `kpi_update` contract, SSE chat-stream for country thread |
| §5 | Feature flags | Add per-country bento config flag, external escalation adapter flags |
| §6 | State machines | Add `CountrySettings` and `BlueprintImport` state machines |
| §10 | Database | Reference 0017–0022 migrations |
| §13 | Observability | Add country-level Langfuse project, KPI snapshot materialization |
| §16 | Scenario Builder | Add cockpit shell wrapper around Pilot Workspace routes |
| §18 | Pilot Workspace | Add cross-country blueprint sharing to workspace IA |
| §19 | Chat Companion | Add country-level companion identity + tools |
| §21 (new) | Cockpit Shell | New section documenting the four surfaces, sphere companion, per-country routing |
| §22 (new) | Business KPI Dashboard | New section documenting the three-pillar model, KPI materialization, agent-level drill-down |
| §23 (new) | Blueprint Library | New section documenting cross-country asset sharing |

### 10.2 Sprint changes

| Sprint | Status | Change |
|---|---|---|
| Sprint 4 (Pilot + HITL Product Surface) | ongoing/planned | Add HITL decision packet UI in chat, per-country chat thread |
| Sprint 5 (Ops + Eval Control Loop) | planned | Add KPI dashboard three-pillar layout, KPI materialization cron |
| Sprint 6 (Executive Demo + Experimentation) | planned | Demo the full cockpit shell: landing + scenarios + KPIs + sphere + chat, end-to-end with motor-fnol-tow |
| Sprint 8 (Pilot Workspace L0) | gated | Add cockpit shell wrapper, country routing, per-country bento |
| Sprint 13 (new) | post-MVP | Cockpit shell — landing page with configurable bento, blueprint library browser |
| Sprint 14 (new) | post-MVP | Scenario view — full catalog with live indicators, filtering, search |
| Sprint 15 (new) | post-MVP | KPI dashboard — agent-level drill-down, business-impact companion insights |
| Sprint 16 (new) | post-MVP | External escalation adapters — Teams, Salesforce, ServiceNow webhook integrations |

### 10.3 What gets reframed vs. created

| Item | Status | Notes |
|---|---|---|
| codex-axa/index.html | reframed | Becomes the landing page template, per-country bento configuration replaces hardcoded layout |
| codex-axa/scenarios.html | reframed | Becomes the scenario view, per-country filtering + live indicators added |
| codex-axa/codex.css | reframed | Keep Canopée tokens + components; add sphere, tab bar, KPI dashboard, chat panel styles |
| codex-axa/codex.js | reframed | Keep canvas/Builder sim; add sphere interaction, tab switching, chat SSE client, KPI WebSocket |
| KPI dashboard | created | New surface — no existing code to reframe |
| HITL chat | created | New surface — chat slide-over + full chat view + decision packet UI |
| blueprint library | created | New cross-country feature |

### 10.4 Files to create / reframe (not exhaustive)

```
app/                                                  ← Next.js App Router
  [country]/                                          ← new: country-first routing
    page.tsx                                          ← landing (executive bento)
    scenarios/page.tsx                                ← pilot catalog
    kpis/page.tsx                                     ← three-pillar dashboard
    kpis/[pilot_slug]/page.tsx                        ← per-pilot KPI drill-down
    chat/page.tsx                                     ← full chat view
    blueprints/page.tsx                               ← blueprint library browser
    pilots/[slug]/                                    ← existing: hands off to builder spec routes

components/cockpit/
    CockpitShell.tsx                                   ← top bar + tabs + sphere zone + centre pane
    TopBar.tsx                                         ← brand + tabs + country selector + ⌘K + gear
    TabBar.tsx                                         ← three-segment tab navigation
    CountrySelector.tsx                                ← dropdown with country list
    SphereCompanion.tsx                                ← the sphere + radial menu + nudge
    RadialMenu.tsx                                     ← 6-action fan-out menu
    CompanionNudge.tsx                                 ← contextual suggestion text
    ChatSlideOver.tsx                                  ← 380 px chat panel, slide from right
    CommandPalette.tsx                                 ← ⌘K overlay with grouped results

components/landing/
    LandingBento.tsx                                   ← configurable grid
    modules/                                           ← bento module components
      PilotHighlight.tsx, KPIHeroStrip.tsx,
      ActivePilotsGrid.tsx, HITLQueueSnapshot.tsx,
      ActivityFeed.tsx, BlueprintLibraryModule.tsx,
      SavingsTracker.tsx, QualityGateCompletion.tsx,
      CompanionInsightCard.tsx, PilotHealthMap.tsx

components/scenarios/
    ScenarioGrid.tsx                                   ← responsive card grid
    ScenarioCard.tsx                                   ← Tier 1 card + Tier 2 expand
    ScenarioFilters.tsx                                ← segmented tabs + search + sort

components/kpis/
    KPIDashboard.tsx                                   ← three-pillar layout
    PillarCard.tsx                                     ← single pillar (Business / Operational / Quality)
    KPINumber.tsx                                      ← eased-tween KPI display
    PerPilotTable.tsx                                  ← Tier 2 per-pilot breakdown
    AgentLevelAnalysis.tsx                             ← Tier 3 agent topology drill-down
    BusinessImpactRow.tsx                              ← companion-generated insights

components/chat/
    ChatMessage.tsx                                    ← user / companion / system messages
    DecisionPacket.tsx                                 ← HITL gate decision card
    CitationChip.tsx                                   ← inline citation hover-expand
    ThinkingIndicator.tsx                              ← breathing dots
    ChatComposer.tsx                                   ← text input + attach + send

lib/cockpit/
    bento-config.ts                                    ← read/write country.bento_config
    kpi-client.ts                                      ← WebSocket KPI updates
    chat-client.ts                                     ← SSE chat streaming
    country-resolver.ts                                ← :country → tenant_id
    blueprint-client.ts                                ← cross-country library API

gateway/src/gateway/
    cockpit/                                           ← new module
        landing.py                                     ← bento config + module data endpoints
        scenarios.py                                   ← per-country pilot listing
        kpis.py                                        ← KPI aggregation + materialization
        chat.py                                        ← country-level chat thread
        blueprints.py                                  ← cross-country sharing
        country_admin.py                               ← country settings + users
    cockpit/kpi_snapshotter.py                         ← cron: materialize daily KPIs
```

---

## 11. Acceptance criteria, risks, open questions

### 11.1 Acceptance criteria

| # | Criterion | Evidence |
|---|---|---|
| AC-01 | A country operator opens the cockpit, sees their country's landing page with configured bento modules, and all KPIs reflect their country's pilots only | E2E Playwright |
| AC-02 | Switching country in the selector reloads all data for the new country; sphere blinks; chat thread switches | E2E Playwright |
| AC-03 | The sphere companion is visible on all four surfaces; clicking it opens the radial menu with correct contextual actions for the active surface | E2E Playwright + manual |
| AC-04 | Clicking "Open chat" from the sphere's radial menu opens the chat slide-over from the right; the chat thread persists across surface switches | E2E Playwright |
| AC-05 | The companion nudge changes within 30s and immediately on surface switch | E2E Playwright |
| AC-06 | Landing page bento can be reconfigured via drag-and-drop in settings; configuration persists and renders correctly | E2E Playwright |
| AC-07 | Scenario view shows all pilots for the current country, filterable by level; live pilots have animated borders; blocked pilots have red indicators | E2E Playwright |
| AC-08 | KPI dashboard shows three pillars with ≤ 5 primary KPIs each; all numbers are tabular-nums; sparklines render from snapshot data | Manual audit + E2E |
| AC-09 | Clicking "Per-pilot breakdown" in any pillar expands a table of per-pilot KPIs; clicking a pilot navigates to that pilot's workspace | E2E Playwright |
| AC-10 | Agent-level drill-down shows each agent node with pass rate, latency, and cost; clicking a node shows the last 5 runs | E2E Playwright |
| AC-11 | HITL decision packet appears in chat when a gate fires; operator can Approve, Override, or Escalate; every decision is audit-logged | E2E Playwright + DB inspection |
| AC-12 | Companion never invents a citation; every citation chip hover-expands with source title + snippet | E2E with adversarial input |
| AC-13 | The external escalation adapter layer exists as a no-op at launch; configuring Teams/SF/ServiceNow credentials + flipping a feature flag activates it without code changes | Integration test |
| AC-14 | Every animation respects `prefers-reduced-motion: reduce` → 0 ms | axe-core + manual a11y audit |
| AC-15 | All copy ships in EN + FR; switching language in country settings updates all surface copy without breaking chat thread continuity | E2E Playwright |
| AC-16 | First-Contentful-Paint ≤ 1.5 s on throttled connection for landing page | Lighthouse CI |
| AC-17 | KPI dashboard loads ≤ 500 ms (reading from materialized snapshots) | Performance test |
| AC-18 | Blueprint library allows browsing and importing shared assets from other countries; imported assets appear in the receiving country's catalog | E2E Playwright |
| AC-19 | Every Tier 1 card on every surface carries a Lucide icon with aria-label | axe-core |
| AC-20 | Cross-country data isolation: a user with access only to France cannot see Deutschland's pilots, KPIs, or chat | Security test |

### 11.2 Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R-01 | Per-country bento configurability leads to fragmented UX where operators can't find things | medium | medium | Default bento for every country is opinionated and companion-aided; customisation is additive, not replacement |
| R-02 | Sphere companion perceived as gimmicky by serious insurance operators | low | high | Sphere is a container for real functionality (chat, actions, nudge); the video/rendering is the "delight" layer, not the value prop |
| R-03 | KPI materialization lags behind real-time data, causing operator confusion | medium | medium | Snapshot timestamp is always visible; real-time KPIs (HITL queue) are live-queried; "last updated" label prominent |
| R-04 | Country-level chat thread grows unbounded, context window overflows | medium | high | Same compaction model as builder spec §2.3: compaction memos at ~120k tokens, visible to user |
| R-05 | Blueprint import creates incompatible pilots (different regulations, different tools) | medium | medium | Companion gate-checks every import against the importing country's regulatory context; incompatible items are flagged before import |
| R-06 | Four surfaces + sphere + chat = too much to build in one sprint cycle | high | high | Decompose: landing + scenarios first (Sprint 13), KPIs second (Sprint 14–15), external escalation last (Sprint 16) |
| R-07 | External tool integration (Teams/SF/ServiceNow) requires procurement/security signoff that blocks the adapter architecture | low | medium | Adapter layer is built and tested with mock endpoints; real credentials are a config change, not a code change; PoC launches without external integrations |
| R-08 | The sphere's contextual actions feel different enough per surface to confuse muscle memory | low | low | "Open chat" and "HITL questions" are always in the same position (right-bot and right-top); only 3 actions change per surface |

### 11.3 Open questions (to resolve in writing-plans pass)

1. **Country onboarding flow.** When a new country joins, what's the default bento? Does the companion interview the plateau head?
2. **Blueprint versioning.** When Deutschland updates a shared agent, do importing countries get notified? Auto-update or manual re-import?
3. **KPI alert thresholds.** Who sets the amber/red thresholds per pillar — GDAI central team or each country? Default thresholds vs. custom?
4. **Chat thread ownership.** The country-level chat thread — who can see it? All users in that country or just the plateau head + facilitators?
5. **Sphere fallback.** If the water sphere video fails to load (bandwidth, format), what's the fallback? Pure CSS gradient sphere?
6. **Mobile / tablet.** The spec assumes ≥ 1024 px viewport. What happens at 768 px? The sphere and tab bar need a responsive pass.
7. **Multi-country operators.** A user with access to France + Deutschland — can they see a unified view across both, or must they switch?

---

*Design spec — authored from brainstorming session 2026-05-05. Inherits builder spec §6 (motion/icon/density/progressive-disclosure) unchanged. Ready for writing-plans pass: implementation plan, architecture.md updates, sprint creation, Linear sync.*

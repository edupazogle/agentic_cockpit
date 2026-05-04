# PRD — Codex × AXA Canopée

> **Project:** GDAI Agentic Cockpit — Codex design proposal
> **Author:** Frontend-design × brandkit synthesis
> **Date:** 2026-05-04
> **Status:** Draft v1 — for review
> **References:**
> - Brand minisite (running): http://localhost:8765/
> - Source: `design-proposal/brand/` (canonical Canopée tokens + `.ds-*` components)
> - Source: `docs/misc/axa-design-system/project/` (foundations, README narrative)
> - Public: https://designsystem.axa.com (zeroheight, JS-rendered)
> - Code under change: `design-proposal/codex/` (`index.html`, `scenarios.html`, `builder.html`, `canvas.html`, `codex.css`, `codex.js`)

---

## 1. Executive summary

Codex today is a beautifully crafted **editorial-magazine** cockpit (Newsreader serif, italics, drop caps, cream paper). The craft bar is high, but the dialect is wrong: it reads as *NYT Magazine for AI agents*, not as **AXA**. AXA's Canopée system is sober, structured, sentence-case, dominated by **AXA blue `#00008F`**, and disciplined about typography (Publico Headline + Source Sans 3 + Söhne Mono).

This PRD proposes a **single coordinated redesign pass** to keep Codex's strongest moves — the asymmetric bento, the marginalia canvas, the eight-movement composer, the live-glow seams — but **re-skin them in Canopée**, raising AXA presence from ~10 % to ~85 %, while preserving a thin "editorial signature" (≈15 %) that makes Codex feel like AXA's *flagship internal product* rather than another corporate intranet.

**One-line direction:** *Slash discipline, with a quiet editorial seam.*

**What changes:**
- Typography → **Publico Headline** (display) + **Source Sans 3** (UI) + **JetBrains Mono** (run IDs / numerics).
- Color → AXA blue `#00008F` becomes the dominant brand voice; cream/paper canvas → white + neutral 50; semantic stack hard-aligned to Canopée.
- Components → migrate to `.ds-*` contract from `design-proposal/brand/components.css` (with universe = "Slash" for the cockpit, "LF" for content density, "Apollo" for marketing surfaces).
- Voice → French vouvoiement, sentence case, infinitive CTAs, no italic flourish in product chrome (italic kept only for *true* editorial moments — pull-quotes, the hero lede).

**What stays:**
- The marginalia canvas, the live-glow shimmer on running pilots, the eight-movement stepper, the inspector tabs, the activity dock, the asymmetric bento grid.
- The information density and tabular-nums discipline.
- The "magazine" architectural rhythm of the index page (eyebrow → display headline → lede → bento → pull-quote → index → footer) — but rendered in Publico, not Newsreader.

---

## 2. Current state audit

### 2.1 Inventory

| Page | Lines | Role | Current strength | Current weakness |
|---|---:|---|---|---|
| `index.html` | 163 | Landing / pitch | Asymmetric bento, pull-quote, hero rail with KPIs | "№ 04 · A new issue" cosplays NYT; italic display dominant; cream canvas |
| `scenarios.html` | 240 | Pilot catalog | Card grid, segmented filter, live-shimmer top border | "Six scenarios. *One claims-table.*" — italic-led headline; AXA blue absent from card chrome |
| `builder.html` | 78 | Pilot composer | 3-rail: movements + canvas + chat; budget meter | Stepper labelled `i. ii. iii.` Roman italic; "eight movements" voice is editorial |
| `canvas.html` | 322 | Live run visualiser | Marginalia, inspector tabs, activity dock, replay overlay | Node cards on cream paper feel scrapbook-ish; lacks AXA "shelf" affordance for primary actions |
| `codex.css` | 2408 | All styles | Token system already partially Canopée-aware | Newsreader + Geist + cream variables override the AXA tokens added in §"ROUND 4" |
| `codex.js` | 1095 | Builder + canvas state machines, replay, simulation | Strong simulation choreography | n/a (no design impact) |

### 2.2 Token state

`codex.css` already declares AXA tokens at line 1121–1143 (added in a later round) — but the **earlier** `:root` block at line 16–45 sets cream/paper/ink variables that win the cascade order in most rules. Result: AXA tokens are present but mostly *unused*. The redesign formalises the reverse: **Canopée tokens are the canonical layer**, codex-flavour tokens become a **thin overlay**.

### 2.3 Typography state

| Use | Today | Target |
|---|---|---|
| Display | Newsreader 96–120 px italic | **Publico Headline** Roman 64–96 px (italic only on opt-in editorial seam) |
| UI / body | Geist 13–15 px | **Source Sans 3** 14–16 px |
| Numerals / IDs | JetBrains Mono | **JetBrains Mono** (kept) — already correct |
| Eyebrows / labels | JetBrains Mono uppercase | **Söhne Mono** OR JetBrains Mono uppercase, tracked +0.14em (kept) |

Publico Headline woff2 files **already exist on disk** at `design-proposal/brand/fonts/`; codex must `@import` `fonts/publico.css` (relative path adjustment) instead of pulling Newsreader from Google Fonts.

### 2.4 Color state

| Surface | Today | Target |
|---|---|---|
| Canvas | `#F7F6F3` cream | `#FFFFFF` paper (Canopée Slash) |
| Section background | `#FCFBF8` `paper-2` | `#F4F4F4` `--gray-50` |
| Text strong | `#131416` | `#1A1A1A` `--gray-1000` (Canopée) |
| Text mute | `#6E6F70` | `#6E6E6E` `--gray-500` |
| Brand voice | `--axa-azur #3032C1` (B2B Slash) | **`--axa-blue #00008F`** (dominant) + `--axa-azur` (table headers, secondary chrome) |
| Editorial accent | `--axa-cream #EFE8D8` | Keep as `--paper-warm`, but use sparingly — only for the editorial seam |
| Semantic | `pale-*` pastel set | Canopée semantic: `--color-success`, `--color-warning`, `--color-error`, `--color-info` |

### 2.5 Component state

`codex.css` defines its own buttons, tags, cards, fields, steppers — **none** import from `design-proposal/brand/components.css`. The redesign **replaces** these with `.ds-*` classes from the brand minisite, keeping `.codex-*` only for *codex-specific composites* (the marginalia, the inspector, the activity dock).

---

## 3. Design direction — *"Slash discipline, editorial seam"*

### 3.1 Core proposition

Codex is an **internal AXA cockpit for power users** (operators, agent designers, GDAI ops). It must feel:

1. **Trustworthy** — operators are touching live insurance claims; AXA blue + Canopée typography signal "this is sanctioned, this is your tool."
2. **Dense but legible** — every screen is operational; tabular nums, fixed gutters, low chroma chrome.
3. **Slightly distinctive** — Codex is the *flagship* GDAI product. A whisper of editorial restraint (drop cap on the index hero, Publico italic only on pull-quotes, the marginalia canvas) keeps it from being a generic admin panel.
4. **AXA-recognisable in 1.5 seconds** — if you screenshot any view and crop the logo, an AXA employee should instantly identify the brand.

### 3.2 The 85 / 15 rule

| Layer | % | What it is |
|---|---:|---|
| **Canopée core** | 85 | Tokens, typography, semantic colors, button & form & alert & tag contracts, voice (FR vouvoiement, sentence case, infinitive CTAs), header/footer chrome, `--axa-blue` dominance, table headers in azur. |
| **Codex signature** | 15 | The marginalia canvas (unique to Codex), drop cap on landing hero, one Publico-italic pull-quote per page, the eight-movement stepper using small caps Roman numerals (in Source Sans, not italic Newsreader), the live-shimmer top border on running pilots, the editorial bento on the index page. |

If a designer or stakeholder asks "remove the editorial signature entirely" — the system **still works** because every Canopée component remains untouched. The signature is *additive*, never load-bearing.

### 3.3 Three-universe mapping (Codex specifically)

Codex is one product but spans three contexts:

| Context | Canopée universe | Why |
|---|---|---|
| Marketing / index landing | **Apollo** (B2C) — pill buttons, generous radii, hero imagery | The index page is a *pitch* to internal stakeholders; warmer feel justified |
| Scenarios catalog | **LF** (Luxembourg/France banking-style) — 8 px rounded, denser cards | Scenarios is a *catalog of systems*; needs density without coldness |
| Builder + Canvas | **Slash** (B2B) — 4 px square cards, shelf-shadowed CTAs, table headers in `--axa-azur`, tabular nums everywhere, `0` radius on inputs | Operator tools; precision and compactness > friendliness |

Each context picks the relevant `.ds-btn--apollo` / `.ds-btn--lf` / `.ds-btn--slash` modifier from the brand minisite contract.

---

## 4. Brand alignment principles

Every redesign decision must satisfy these gates. If a decision fails any gate, it does not ship.

| # | Principle | Test |
|---|---|---|
| 1 | **AXA blue is the brand voice, not an accent.** It owns hero CTAs, primary buttons (Slash variant), top-bar logo block, focus rings (with 2 px outline). | Screenshot + fast scan: do you see `#00008F` in the first 3 seconds on every page? |
| 2 | **Sentence case everywhere.** No "All Caps Headlines"; eyebrows and tag labels in tracked uppercase mono are the *only* uppercase. | Run a regex pass on `[A-Z]{2,}` outside `<span class="eyebrow\|kbd\|chip\|tag">`. |
| 3 | **Italic is editorial, not chrome.** Italics appear in: pull-quotes, the hero lede, one drop-cap intro, *never* in primary CTAs, navigation, status pills, table headers, form labels. | Visual audit per screen. |
| 4 | **Tabular nums on everything operational.** All run IDs, durations, costs, percentages must use `font-variant-numeric: tabular-nums` for stable column alignment. | CSS audit. |
| 5 | **Sober color, loud focus.** Surfaces stay near-white / near-grey. Energy comes from focus rings, the live-shimmer, the AXA blue CTA. No purple gradients, no neon. | Visual audit. |
| 6 | **One halo, not five.** Each screen has at most one "loud" element: the live shimmer on scenarios; the HITL halo on canvas; the AXA-blue CTA on the hero. Resist the urge to glow everything. | Visual audit. |
| 7 | **Voice = AXA insurance, not Silicon Valley.** No "Let's get you started!" — instead "Composer un pilote." Direct, infinitive, no exclamation marks. | Copy audit pass. |
| 8 | **Accessibility ≥ AA.** All text on white ≥ 4.5:1; AXA blue on white = 13.0:1 (✅); azur on white = 7.6:1 (✅); pale-yellow-ink on pale-yellow = check; focus rings 2 px solid `--axa-blue` with 2 px offset. | axe-core run after each phase. |

---

## 5. Token migration plan

### 5.1 New `:root` (replaces lines 16–45 and 1121–1143 of `codex.css`)

```css
@import url('./fonts/publico.css');                       /* Publico Headline */
@import url('https://api.fontshare.com/v2/css?f[]=söhne-mono@400&display=swap'); /* if available; else fallback to JetBrains Mono */
@import url('https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
  /* === Canopée canonical (verbatim from design-proposal/brand/colors_and_type.css) === */
  --axa-blue:        #00008F;
  --axa-blue-dark:   #000072;
  --axa-blue-deeper: #00005B;
  --axa-blue-light:  #E4E4FF;
  --axa-blue-bg:     #EEEEFF;
  --axa-azur:        #3032C1;
  --axa-cream:       #EFE8D8;

  --gray-1000: #1A1A1A;
  --gray-800:  #3D3D3D;
  --gray-500:  #6E6E6E;
  --gray-140:  #C8C8C8;
  --gray-50:   #F4F4F4;
  --white:     #FFFFFF;

  --color-success:    #0C7D3B;
  --color-success-bg: #E7F5EC;
  --color-warning:    #BC4C2D;
  --color-warning-bg: #FBEBE6;
  --color-error:      #C7102E;
  --color-error-bg:   #FDECEF;
  --color-info:       #3871B5;
  --color-info-bg:    #E7F0F8;

  --sp-1: 4px;  --sp-2: 8px;  --sp-3: 12px; --sp-4: 16px;
  --sp-5: 24px; --sp-6: 32px; --sp-7: 48px; --sp-8: 64px; --sp-9: 96px;

  --radius-sm: 4px;  --radius-md: 8px;  --radius-lg: 12px; --radius-pill: 999px;

  --shadow-card:  0 1px 2px rgba(0,0,0,.04), 0 4px 12px rgba(0,0,0,.06);
  --shadow-pop:   0 12px 36px rgba(0,0,0,.10);
  --shadow-shelf: inset 0 -2px var(--axa-blue-deeper);   /* Slash universe primary CTA */
  --shadow-halo:  0 0 9px rgba(0,0,0,.18);               /* Slash card hover */

  --font-display: "Publico Headline", "Newsreader", Georgia, serif;
  --font-sans:    "Source Sans 3", -apple-system, "Segoe UI", sans-serif;
  --font-mono:    "JetBrains Mono", "SF Mono", monospace;

  --t-base: 240ms cubic-bezier(0.32, 0.72, 0, 1);
  --t-fast: 140ms cubic-bezier(0.32, 0.72, 0, 1);

  /* === Codex signature (the 15%) — overlays, never overrides === */
  --paper-warm:    #FAF8F2;          /* used only on the editorial seam: hero lede card, pull-quote panel */
  --rule:          var(--gray-140);
  --rule-strong:   #A8A8A8;
  --canvas:        var(--white);     /* was #F7F6F3 cream — now plain white */
  --paper-2:       var(--gray-50);   /* was #FCFBF8 — now Canopée gray-50 */
  --ink-strong:    var(--gray-1000);
  --ink:           var(--gray-800);
  --ink-mute:      var(--gray-500);
  --ink-faint:     var(--gray-140);
  --axa-edge:      rgba(48,50,193,.55);   /* live azur — kept */
  --axa-edge-pulse:#428a72;                /* Railway-green pulse — kept (codex signature) */
}
```

### 5.2 Mapping table — old → new

| Old | New | Note |
|---|---|---|
| `--canvas: #F7F6F3` | `var(--white)` | Cream → paper white |
| `--paper: #FFFFFF` | `var(--white)` | Same |
| `--paper-2: #FCFBF8` | `var(--gray-50)` | Section bg |
| `--paper-3: #F2EFE8` | `var(--axa-cream)` | Reserved for editorial seam |
| `--ink: #2A2C2F` | `var(--gray-800)` | Slight darkening |
| `--ink-strong: #131416` | `var(--gray-1000)` | Slight lightening to Canopée standard |
| `--ink-mute: #6E6F70` | `var(--gray-500)` | Same hue, adjusted |
| `--mute: #8A8B8C` | `var(--gray-500)` | Consolidated |
| `--rule: #E8E5DE` | `var(--gray-140)` at 50% opacity (`#C8C8C880`) | Cooler, less warm |
| `--pale-blue/green/red/yellow` | `--color-info-bg/success-bg/error-bg/warning-bg` | Drop the "pale" prefix; these *are* Canopée semantic backgrounds |
| `--font-serif: Newsreader` | `var(--font-display)` Publico Headline | Display only |
| `--font-sans: Geist` | `var(--font-sans)` Source Sans 3 | UI |
| `--r-card: 14px` | `var(--radius-lg)` 12px | Tighter |

---

## 6. Typography migration

### 6.1 Type scale

| Role | Element | Font / size / weight / tracking | Note |
|---|---|---|---|
| Display XL | `h1.hero` (index landing) | Publico Headline Roman 96 px / 1.02 / -0.025em | Editorial seam — italic permitted on the second clause only |
| Display L | `h1` (scenarios, builder, canvas runhead) | Publico Headline Roman 56 px / 1.05 / -0.022em | No italic |
| Display M | `h2` (section headers, builder rail title) | Publico Headline Roman 32 px / 1.1 / -0.02em | No italic |
| Title | `h3` (cards, bento cells) | Publico Headline Medium 22 px / 1.2 / -0.014em | No italic |
| Body L | hero lede, pull-quote | Publico Headline **Italic** 22 px / 1.45 / -0.012em | The editorial seam |
| Body | paragraph copy | Source Sans 3 Regular 15 px / 1.6 | Canopée body |
| Body S | card blurb, helper text | Source Sans 3 Regular 13.5 px / 1.55 | |
| Eyebrow | section label, tag, breadcrumb | JetBrains Mono 11 px / 0.18em / uppercase | Stays |
| Numeric XL | KPI value (hero rail, bento stat) | JetBrains Mono Medium 28 px tabular-nums | No italic |
| Numeric M | run cost / latency / id | JetBrains Mono 13 px tabular-nums | |
| Caption | timestamp, footnote | JetBrains Mono 10.5 px | |

### 6.2 Italic policy

Italic appears in **exactly five places** across all of Codex:

1. The hero lede (Body L, Publico italic) — "Codex est le visage opérationnel de la plateforme agentique de GDAI."
2. The hero subhead second clause — "*Pour les agents qui traitent les vrais sinistres.*"
3. One pull-quote per page (`.codex-pullquote`, optional).
4. The drop-cap opening of the long-form section on the index (one occurrence).
5. The marginalia annotations on the canvas (small body italic, 12 px).

**Italic is forbidden** in: navigation, buttons, form labels, status pills, table headers, KPI numerics, eyebrow labels, breadcrumbs, footer.

### 6.3 Drop cap (the one editorial flourish)

Allowed on the index landing only, on the first paragraph after the hero. Publico Headline **Black** weight, 90 px, 4-line drop, 8 px right margin, color `var(--axa-blue)`. Implementation via `:first-letter` pseudo-element with `float: left`.

---

## 7. Color migration

### 7.1 Primary

The redesign elevates **AXA blue `#00008F`** from "occasional accent" to "brand voice." It owns:

- The wordmark logo on the topbar.
- The primary CTA (`btn-primary`) — Slash variant: `background: var(--axa-blue); color: var(--white); border-radius: 0; box-shadow: var(--shadow-shelf);`.
- The hero "Compose a pilot" CTA on the index — Apollo variant on landing only: pill, `var(--axa-blue)` fill.
- Focus rings: 2 px solid `var(--axa-blue)`, 2 px offset.
- The drop-cap letter.
- The footer wordmark.
- Top-of-bento accent bars on selected cells (3 px height, full width, `var(--axa-blue)`).

`--axa-azur #3032C1` is **demoted to** structural blue:

- Table column headers (Slash table contract).
- The `live` border + shimmer on scenarios cards.
- Marginalia link color.
- Canvas edge "ghost pulse" (the always-on flow).
- Inspector tab active underline.

### 7.2 Semantic

Replace every `pale-*` reference:

| Use | Old | New |
|---|---|---|
| Success pill / canary success | `pale-green / pale-green-ink` | `--color-success-bg / --color-success` |
| Warning pill / canary | `pale-yellow / pale-yellow-ink` | `--color-warning-bg / --color-warning` |
| Error / blocked | `pale-red / pale-red-ink` | `--color-error-bg / --color-error` |
| Info / "draft" | `pale-blue / pale-blue-ink` | `--color-info-bg / --color-info` |

### 7.3 Editorial cream (kept, contained)

`--paper-warm #FAF8F2` and `--axa-cream #EFE8D8` are kept — but used only on:

- The hero lede tile (index only).
- The pull-quote panel.
- The "editorial gate" rows in the builder flow-list (`.flow-list .row.gate` — keep cream gradient).

Nowhere else.

---

## 8. Component migration

### 8.1 Inheritance contract

`codex.css` will `@import url('../brand/components.css');` at the top, then **replace** its own button, tag, card, alert, form, header/footer rules. Codex composites (marginalia, inspector, activity dock, run head, stepper, scenario card, bento cell) keep their own rules but are *re-skinned* to use `.ds-*` primitives where possible.

### 8.2 Button audit

| Today | New class | Variant | Where |
|---|---|---|---|
| `.btn` (default) | `.ds-btn .ds-btn--lf .ds-btn--secondary` | LF rounded 8 px, white bg, 1 px gray border | All ghost / secondary navigation buttons |
| `.btn.btn-primary` | `.ds-btn .ds-btn--slash .ds-btn--primary` | Slash square, AXA blue fill, shelf shadow, white text | Hero CTA, "Open canvas", "+ New scenario", "Play simulation" |
| `.btn.btn-ghost` | `.ds-btn .ds-btn--lf .ds-btn--tertiary` | Transparent, gray text, no border | ⌘K, "saved 12s" |
| `.rh-btn` (canvas play/pause/replay) | `.ds-btn .ds-btn--slash .ds-btn--secondary .ds-btn--sm` | Slash compact icon + label | Run head |
| Index marketing CTAs only | `.ds-btn .ds-btn--apollo .ds-btn--primary` | Apollo pill, AXA blue fill | Index hero only |

### 8.3 Card

| Use | Old | New |
|---|---|---|
| Bento cells (index) | `.cell` | `.ds-card .ds-card--lf` (12 px radius, 1 px gray border, hover → AXA blue 2 px border) |
| Scenario card | `.scen-card` | `.ds-card .ds-card--slash` (4 px radius, halo `0 0 9px rgba(0,0,0,.18)`, transparent border → AXA blue on hover) |
| Canvas node card | `.node-c` | `.ds-card .ds-card--slash .codex-node` — keep codex-specific composites (handles, halo) |

### 8.4 Tag / chip

Replace all current `.tag`, `.chip`, `.scen-tag`, `.chip.agent`, `.chip.mcp` with `.ds-tag` + intent variant:

```html
<span class="ds-tag ds-tag--info">● live · 1 in HITL</span>
<span class="ds-tag ds-tag--warning">canary</span>
<span class="ds-tag ds-tag--neutral">draft</span>
<span class="ds-tag ds-tag--success">stable</span>
<span class="ds-tag ds-tag--brand">NemoClaw</span>      <!-- agents -->
<span class="ds-tag ds-tag--success-soft">claims_facade</span>  <!-- MCP tools -->
```

The shimmer (`@keyframes c-shimmer`) on **live** scenario cards is **kept** as Codex signature, but uses `--axa-azur` (already correct), not the old generic accent.

### 8.5 Alert

Replace any inline `<div style="…">` warnings with `.ds-alert .ds-alert--info|success|warning|error` — used in the canvas HITL banner, the builder lint panel, the inspector evidence rows.

### 8.6 Form

Builder fields today use `border-bottom: 1px solid var(--rule)` underline-only inputs. **Keep this aesthetic** but rename to `.codex-field-bare` and additionally introduce `.ds-input` (Slash variant: 0 radius, 1 px gray border, 2 px AXA blue focus outline) for any **new** form (scenario filter dialog, deploy modal). Underline-only stays for the editorial composer experience; bordered Slash inputs ship for everything else.

### 8.7 Header & footer

| Element | Today | New |
|---|---|---|
| Topbar | sticky, blurred cream, custom Newsreader brand wordmark | `.ds-header` (white, 1140 px wrapper) — keep sticky behavior; brand wordmark in Publico Headline Medium, AXA blue, with the small "CKPT" mark in mono next to it |
| Footer | small cream-on-cream | `.ds-footer` Slash variant — compact 11 px AXA blue text with `axa.com` wordmark on the left, copyright on the right, all on white |

---

## 9. Per-screen redesign brief

### 9.1 Index (`index.html`) — *Pitch + at-a-glance*

**Goal:** "If a head of GDAI lands here for 8 seconds, they understand what Codex does, see live KPIs, and find the entry to the canvas."

**Top to bottom:**

1. **Topbar** — `.ds-header` Slash variant. Logo block: AXA Canopée red square logo + " · " + Publico "Codex" + mono "CKPT" badge. Crumbs: `AXA · GDAI · Cockpit`. Right: ⌘K, Scenarios, Compose, **Open canvas →** (Slash primary, AXA-blue, shelf).
2. **Hero** — full-bleed, white. Eyebrow: `№ 04 · ÉDITION DU 13 MAI 2026` (mono 11 px, `--gray-500`). Display: Publico Headline Roman 96 px — "Un cockpit pour les pilotes agentiques d'AXA." Then *italic* second line: "*Conçu pour les opérateurs qui décident en quinze secondes.*" — that one italic clause is the editorial seam. Lede: Source Sans 16 px Body, max 56 ch. Two CTAs: Apollo pill primary "Composer un pilote →" and LF secondary "Inspecter un run en direct".
3. **Hero rail (right column, 320 px)** — vertical KPI list on `--paper-warm` panel with 1 px AXA-cream border. Each row: mono label (`Active runs`), JetBrains Mono Medium 28 px tabular-num value. AXA-blue `Live` pulsing dot at top.
4. **Bento (12-column asymmetric)** — keep current geometry, restyle each cell:
   - Tall cell PFT-014 → `.ds-card--lf` white, 1 px AXA-blue 3 px top accent bar, Publico Headline 26 px title, num-stack at bottom in JetBrains Mono.
   - Confidence cell → same, KPI dominant, `--color-success` mini-badge.
   - HITL queue dark cell → flip to `.ds-card--slash`, AXA-blue **deep** background `#00005B`, white text, 4 px radius — this becomes the one "loud" card on the page.
   - Wide motor-fleet cell → `.ds-card--lf` cream `--paper-warm` background — editorial seam moment with small drop cap.
5. **Pull-quote section** — Publico Headline italic 48 px, max 22 words, with attribution in mono 11 px below. AXA-blue accent rule (1 px) above and below.
6. **Index list (long-form TOC of pilots)** — kept as is, restyled: serif numerals → JetBrains Mono Medium tabular numerals + Publico Headline Roman names + `var(--gray-500)` descriptors.
7. **Footer** — `.ds-footer` Slash variant + small "Composé à Paris pour AXA GDAI" line in italic Publico (the only italic in the footer).

### 9.2 Scenarios (`scenarios.html`) — *Catalog*

**Goal:** "An operator scanning the table in 4 seconds knows which pilots are live, which are canary, which are drafts."

- **Hero** — eyebrow `CATALOGUE · 06 SCÉNARIOS`, Display L Publico 56 px Roman: "Six scénarios. Une table de sinistres." (no italic — sober for the catalog). Lede in Source Sans 15 px (drop the italic Newsreader lede).
- **Toolbar** — replace pill segmented control with **`.ds-tabs`** (Slash variant: square underline, AXA-blue active underline). Search becomes a `.ds-input` Slash. The "+ Nouveau scénario" CTA is a `.ds-btn--slash--primary` (square, AXA blue, shelf).
- **Card grid** — `.ds-card--slash` halo, AXA-blue 2 px border on hover, **3 px AXA-blue accent bar at top of `.live` cards** (replacing the current shimmer-only treatment) + the shimmer kept underneath. Card head: JetBrains Mono ID + `.ds-tag` status. Card title: Publico Headline 22 px (no italic). Stats row: 3-column tabular nums, mono labels. Chips: `.ds-tag` brand/success-soft.
- **Empty state per filter** — illustration slot reserved (32:9 ratio, 480 × 135 px) for a future hand-drawn editorial illustration. Until then: a 1 px rule with a Publico italic 18 px line "*Aucun pilote dans cet état.*"

### 9.3 Builder (`builder.html`) — *Composer*

**Goal:** "An agent designer composes a pilot conversationally; every movement is auditable; budget and tokens are never out of sight."

- **Topbar** — adds a compact saved indicator (`.ds-tag--neutral` "⌘S · enregistré il y a 12 s"), a status tag with pip (`.ds-tag` with intent matching simulation state), Reset (`.ds-btn--lf--secondary`), and Play simulation (`.ds-btn--slash--primary`).
- **Left rail (320 px)** — `--paper-warm` background to mark this as the *editorial composer side*. Eyebrow `COMPOSITION DU PILOTE`. Title in Publico Headline Roman 28 px (no italic): "Huit mouvements, de l'intake au déploiement." Stepper: replace italic Roman numerals with **JetBrains Mono small caps Roman**: `I.  II.  III.  …` in `--gray-500`, active in `--axa-blue` with a 2 px AXA-blue left rail. Movement names in Source Sans 15 px Medium, sublabels in Source Sans 12 px `--gray-500`. Budget meter at bottom: progress bar fills in `--axa-azur`, label in mono.
- **Center canvas (fluid)** — white. Runhead: eyebrow + Display M Publico Headline Roman 32 px title (no italic) + Source Sans 15 px lede. Body streams in Source Sans 15 px paragraph runs with marginalia on a 200 px left gutter (mono labels, Publico italic 13 px annotations).
- **Right chat rail (380 px)** — white. Header `.ds-header` mini variant. Messages: user in `--axa-blue-bg` rounded bubble (12 px LF radius); assistant in `--gray-50` 4 px radius (Slash) — the asymmetry signals the speaker. Composer input at bottom: `.ds-input` Slash with a `.ds-btn--slash--primary` "Envoyer".

### 9.4 Canvas (`canvas.html`) — *Live run, the marquee screen*

**Goal:** "An operator watches a real claim flow through 8 nodes, sees confidence, intervenes when HITL fires."

This is **the** Codex signature surface and gets the most attention.

- **Topbar** — keeps live status tag (intent matches state); Replay (`.ds-btn--lf--secondary`); "Edit flow →" (`.ds-btn--slash--primary` AXA-blue, the one strong CTA).
- **Run head ribbon** — full-width sticky. Eyebrow `RUN · CLM-2026-0042` in mono. Title: Publico Headline Roman 28 px (no italic): "Property Fast-Track / 7f4a-31bd". Progress bar: 8 segments, currently-active in `--axa-blue`, completed in `--gray-500`, queued in `--gray-140`. Meta row: stage, elapsed (mono tabular), SLA, cost — all in JetBrains Mono Medium tabular nums. Action group on the right: Play / Pause / Replay (Slash compact buttons).
- **Canvas pan area** — white background with a subtle dot grid (`background-image: radial-gradient(var(--gray-140) 1px, transparent 1px); background-size: 24px 24px;`) instead of the current cream — far more "AXA infrastructure dashboard."
- **Nodes** — `.ds-card--slash` (4 px, halo, transparent border → AXA-blue on hover/focus). Header: JetBrains Mono Medium 11 px node id + Publico Headline Medium 16 px name. Body: 2-row `<dl>` with mono keys and Source Sans values. Footer: tabular timing. **HITL halo:** kept — but recolored to `--color-warning` instead of generic yellow, with a Canopée chevron `.ds-alert--warning` inline at the top of the affected node ("Operator action required").
- **Edges** — `--axa-edge` 1 px stroke quiet, `--axa-blue` 2 px stroke + animated pulse (`--axa-edge-pulse` Railway-green) traveling along on every active edge. The replay overlay edge is bright `--axa-blue` and animated draw.
- **Marginalia (the editorial signature on canvas)** — kept, restyled. A 220 px right gutter strip; each annotation is anchored to a node by SVG dotted leader line. Annotation text: Publico Headline italic 13.5 px, max 32 ch, color `--gray-800`. Annotation eyebrow in mono 10 px. *This is where the magazine flavour earns its keep.*
- **Inspector** — slides up from bottom. Tabs (`.ds-tabs--slash`): Decision · Evidence · Trace · History. Decision pane uses `.ds-card--lf` confidence meters; Evidence pane uses `.ds-table` Slash (azur header, white font-weight-200, tabular nums); Trace pane is a JetBrains Mono code block with line numbers; History pane is a vertical timeline.
- **Activity dock** — bottom-left collapsed pill, expands to a 320 × 480 panel. Header: mono "Activity · 14:42 CEST". Body: stream of events in Source Sans 13 px with mono timestamps. Each event has a 4 px AXA-blue / azur / success / warning / error left border that signals severity.

---

## 10. Motion & a11y

### 10.1 Motion principles

- **One-second budget.** No motion on a single interaction may exceed 1000 ms.
- **140 ms** for hover / focus state changes.
- **240 ms** for surface transitions (panel open, accordion).
- **400–600 ms** for page-level reveals (hero stagger, bento entrance).
- **1500 ms** for ambient flow (edge pulse, live shimmer) — these loop.
- All transitions use `cubic-bezier(0.32, 0.72, 0, 1)` (matches Canopée default `--t-base`).
- **`prefers-reduced-motion: reduce`** clamps all transitions to 0.01 ms (already done in brand `components.css`; verify it covers Codex animations: `c-shimmer`, `c-pulse-pip`, the edge pulse, the HITL halo breathing, the ignite flash).

### 10.2 A11y checklist (WCAG 2.2 AA)

1. **Color contrast** — every text/background pair ≥ 4.5:1; verify with axe.
2. **Focus rings** — visible on every interactive element; 2 px solid `--axa-blue`, 2 px offset; never removed.
3. **Keyboard navigation** — full canvas pan/zoom must be reachable via keyboard (arrow keys to pan, +/- to zoom, Tab to traverse nodes, Enter to open inspector, Esc to close).
4. **ARIA** — run head progress bar already has `role="progressbar" aria-valuemin/max/now`. Tabs need `role="tablist" tab-> role="tab" aria-selected aria-controls`. Live-region for streaming chat: `aria-live="polite"`.
5. **Skip-to-main** — add a hidden-until-focus `Skip to canvas` link as the first focusable element on `canvas.html`.
6. **Language** — `<html lang="fr">` on screens that ship in FR (currently `en` — fix as part of the migration).
7. **Reduced transparency** — backdrop-filter blur in topbar must have a solid fallback for `prefers-reduced-transparency: reduce`.

---

## 11. Interaction details

| Element | State | Behavior |
|---|---|---|
| Primary Slash CTA | rest | AXA-blue fill, white text, shelf shadow, 0 radius |
| | hover | bg → `--axa-blue-dark`, shelf shadow becomes 3 px deep |
| | focus | 2 px solid `--axa-blue` ring, 2 px offset |
| | active | shelf compresses to 0 px, slight 1 px translateY |
| | disabled | bg → `--gray-140`, text → `--gray-500`, no shelf, cursor not-allowed |
| Scenario card | rest | white, 4 px radius, halo `0 0 9px rgba(0,0,0,.18)` |
| | hover | transparent border → 2 px AXA-blue, halo grows to `0 4px 14px rgba(0,0,143,.12)`, translateY -2 px |
| | live (rest) | 3 px AXA-blue accent bar at top + shimmer animation underneath |
| Node card on canvas | running | 2 px AXA-blue border + 0 0 0 4 px AXA-blue at 12% alpha glow |
| | waiting (HITL) | 2 px `--color-warning` border + breathing halo + inline `.ds-alert--warning` chevron at top |
| | done | 2 px `--color-success` border, 70% opacity until hovered |
| | failed | 2 px `--color-error` border, error background tint |
| Form input | rest | 1 px gray border, 0 radius (Slash) |
| | focus | 2 px solid AXA-blue outline, 2 px offset |
| | error | 1 px `--color-error` border + `.ds-form-error` message below |
| Tab | rest | underline 2 px transparent |
| | active | underline 2 px `--axa-blue` |
| | hover (inactive) | underline 2 px `--gray-140` |

---

## 12. Implementation plan

### Phase 1 — Foundations (1 day of focused work)

- [ ] Update `codex.css` `:root` block — replace tokens per §5.1.
- [ ] Replace `@import` for Newsreader with the local `fonts/publico.css` from the brand minisite (copy or symlink the `fonts/` folder to `design-proposal/codex/fonts/`).
- [ ] Add `@import url('../brand/components.css');` at top of `codex.css`.
- [ ] Visual smoke test: open all 4 pages, verify nothing is catastrophically broken.

### Phase 2 — Chrome (½ day)

- [ ] Top bar: rebuild with `.ds-header` markup; AXA wordmark + Codex Publico wordmark; right-side action group as `.ds-btn--slash--primary` for the primary CTA.
- [ ] Footer: rebuild with `.ds-footer` markup.
- [ ] Apply on all 4 pages.

### Phase 3 — Index page (1 day)

- [ ] Hero block: Publico typography, italic seam clause only, AXA-blue CTA.
- [ ] Hero rail: KPI list in JetBrains Mono tabular.
- [ ] Bento: re-skin each cell to `.ds-card` variant per §9.1.
- [ ] Pull-quote section in Publico italic.
- [ ] Index list: tabular numerals.

### Phase 4 — Scenarios page (½ day)

- [ ] Hero copy: French, sober (no italic).
- [ ] Toolbar: `.ds-tabs--slash` segmented + `.ds-input--slash` search + `.ds-btn--slash--primary` new-scenario.
- [ ] Card grid: `.ds-card--slash` with AXA-blue accent bar on `.live`.

### Phase 5 — Builder page (1 day)

- [ ] Left rail: `--paper-warm` background, JetBrains Mono Roman numerals, Source Sans labels.
- [ ] Center canvas: Publico Headline Roman titles, Source Sans body, marginalia annotations in italic Publico.
- [ ] Right chat: AXA-blue-bg user bubbles, Slash assistant bubbles.
- [ ] Budget meter recolored to `--axa-azur` fill.

### Phase 6 — Canvas page (1.5 days, the marquee)

- [ ] Run head: AXA-blue progress bar segments, Publico title.
- [ ] Canvas background: dot grid on white.
- [ ] Nodes: `.ds-card--slash` re-skin; HITL halo recolored to `--color-warning` with inline chevron alert.
- [ ] Edges: keep flow, ensure colors match `--axa-blue` / `--axa-edge`.
- [ ] Marginalia: re-typeset in Publico italic 13.5 px.
- [ ] Inspector tabs: `.ds-tabs--slash`, table in Slash azur header.
- [ ] Activity dock: 4 px severity left border, mono timestamps.

### Phase 7 — Polish (½ day)

- [ ] Reduced-motion audit.
- [ ] axe-core full pass on all 4 pages.
- [ ] Screenshot diff against http://localhost:8765 brand minisite — confirm shared tokens render identically (e.g., a button on the brand showcase and the same button on Codex are pixel-equivalent).
- [ ] French copy pass (nav, eyebrows, status tags, lede).
- [ ] Commit + Linear update.

---

## 13. Acceptance criteria

The redesign is **done** when:

1. **Brand recognition** — A first-time AXA viewer identifies the brand within 2 seconds on every screen (verified by opening each page next to designsystem.axa.com in a side-by-side screenshot).
2. **Token compliance** — Every CSS color, font, radius, spacing value resolves to a Canopée token (or the explicit `--paper-warm` editorial overlay). No raw hex codes outside the `:root` block.
3. **Italic policy** — A grep for `font-style: italic` returns ≤ 7 occurrences in `codex.css` (one per allowed location in §6.2).
4. **A11y** — axe-core reports 0 critical / 0 serious findings; all interactive elements have visible focus rings; contrast ratios ≥ 4.5:1.
5. **Voice** — Every UI string is in French, sentence case, vouvoiement, no exclamation marks, no English fragments outside run IDs and CLI mnemonics (`⌘K`, `npm run dev`).
6. **Motion** — `prefers-reduced-motion: reduce` produces a fully static, fully usable cockpit.
7. **Code reuse** — `codex.css` `@import`s `../brand/components.css` and uses `.ds-*` classes for buttons, cards, tags, alerts, forms, header, footer. Codex-specific composites (marginalia, inspector, dock, run head, stepper) remain in `codex.css` but use Canopée tokens exclusively.
8. **Pixel parity with the brand minisite** — A `.ds-btn--slash--primary` rendered on the brand minisite and on any Codex page is visually identical.
9. **Performance** — First Contentful Paint ≤ 1.5 s on a throttled connection; cumulative layout shift < 0.05.
10. **No regression in choreography** — The replay simulation, the live shimmer, the HITL halo, the eight-movement composer, the inspector tab streaming, the marginalia leader lines all continue to function exactly as before — only the skin changes.

---

## 14. Risks & mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Publico Headline licensing — woff2 files on disk may not be cleared for production use | Medium | High | Use the on-disk woff2 files for the design proposal *only*; for production, gate the redesign on legal sign-off. Fall back to **Newsreader** as Publico-substitute if blocked. Document this in `README.md`. |
| Removing the editorial dialect alienates stakeholders who liked v1 | Medium | Medium | Keep the 5 italic moments (§6.2), the marginalia, the drop cap, the pull-quote — visible "soul" remains. Show before/after side-by-side at design review. |
| `.ds-*` classes from brand minisite don't cover every Codex composite | High | Low | Codex composites remain — only primitive components (button, card, tag, alert, form) migrate. |
| AXA-blue overuse causes visual fatigue | Medium | Medium | Enforce the "one halo per screen" rule (§4 gate 6). Run a saturation audit per page. |
| French copy quality | Low | Medium | Translate copy with native FR speaker review before merge; until then, ship in EN with a French-copy task tracked in Linear. |

---

## 15. Open questions

1. **Logo lockup** — Should the topbar show the AXA red square logo, or only the Codex wordmark? *Proposal: AXA red square, 24 × 24 px, then a hairline divider, then "Codex" in Publico, then the "CKPT" mono badge.*
2. **Apollo vs. Slash on the index hero CTA** — Marketing-warm Apollo pill, or operational Slash square with shelf? *Proposal: Apollo pill, because the index page is the only "marketing" surface; everywhere else is Slash.*
3. **Should we re-name `Codex` → something more AXA-native** (e.g., "Pilote", "Atelier")? *Out of scope of this PRD; flag for naming review.*
4. **Drop the "magazine voice" entirely from copy** ("№ 04 · A new issue", "Eight movements from intake to deploy") and replace with sober AXA copy? *Proposal: keep the editorial voice only in marginalia and pull-quotes; sober copy everywhere else.*
5. **Should the canvas dot-grid background be turned off by default for accessibility / reduced visual noise?** *Proposal: dot grid at 4 % opacity by default, toggleable in user prefs (future).*

---

## 16. Out of scope

- Mobile / responsive treatment (Codex is a desktop-first operator tool; mobile is explicitly not addressed in this PRD).
- Dark mode (deferred to a future PRD).
- Animation library swap (CSS-only is sufficient).
- Backend / data wiring (this PRD only covers visual layer).
- Internationalisation beyond FR ↔ EN.
- The bugclaw-widget surface (separate proposal).

---

## 17. Appendix — Quick reference

### 17.1 Token quick reference (after migration)

```
Brand:     --axa-blue (#00008F) · --axa-azur (#3032C1) · --axa-cream (#EFE8D8)
Neutrals:  --gray-1000 #1A1A1A · --gray-800 · --gray-500 · --gray-140 · --gray-50 · --white
Semantic:  --color-success #0C7D3B · --color-warning #BC4C2D · --color-error #C7102E · --color-info #3871B5
Codex:     --paper-warm #FAF8F2 (editorial seam only)
Type:      --font-display Publico · --font-sans Source Sans 3 · --font-mono JetBrains Mono
Radius:    --radius-sm 4 · --radius-md 8 · --radius-lg 12 · --radius-pill 999
Spacing:   --sp-1..9 (4 8 12 16 24 32 48 64 96)
Shadow:    --shadow-card · --shadow-pop · --shadow-shelf · --shadow-halo
Easing:    --t-base 240ms · --t-fast 140ms (cubic-bezier(.32,.72,0,1))
```

### 17.2 Class inventory

| Layer | Source | Examples |
|---|---|---|
| Canopée primitives | `../brand/components.css` | `.ds-btn`, `.ds-card`, `.ds-tag`, `.ds-alert`, `.ds-input`, `.ds-tabs`, `.ds-table`, `.ds-header`, `.ds-footer` |
| Canopée variants | same | `.ds-btn--apollo|--lf|--slash`, `.ds-btn--primary|--secondary|--tertiary|--success|--danger|--ghost|--sm|--lg`, `.ds-card--apollo|--lf|--slash`, `.ds-tag--info|success|warning|error|brand|neutral|success-soft` |
| Codex composites | `codex.css` | `.codex-bento`, `.codex-pullquote`, `.codex-stepper`, `.codex-marginalia`, `.codex-runhead`, `.codex-inspector`, `.codex-dock`, `.codex-node`, `.codex-edge`, `.codex-shimmer` |

### 17.3 Files touched by the redesign

```
design-proposal/codex/
├── PRD.md                      ← this document
├── README.md                   ← rewrite to reference Canopée + brand minisite
├── codex.css                   ← major rewrite (tokens, components, composites re-skinned)
├── codex.js                    ← unchanged (state machines preserved)
├── fonts/                      ← new: copy from ../brand/fonts/ (Publico Headline 6 weights + publico.css)
├── index.html                  ← markup updates: .ds-* classes, FR copy, Publico typography
├── scenarios.html              ← same
├── builder.html                ← same
└── canvas.html                 ← same
```

---

*End of PRD — ready for review.*

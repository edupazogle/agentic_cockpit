# Codex-AXA — Cockpit redesign

A redesign of `design-proposal/codex/` aligned with AXA Canopée brand guidelines.
**Direction:** *« Slash discipline, editorial seam »* — 85% Canopée core (typography, color, components), 15% Codex signature (asymmetric bento, marginalia, pull-quotes, drop cap).

Implements the spec at [`PRD.md`](./PRD.md).

## What changed vs. `codex/`

### Tokens (PRD §5)
- Replaced cream `#F7F6F3` ground with Canopée `--paper` (#FAFBFC) on a `#FFFFFF` cockpit canvas
- Primary brand color: `--axa-blue` (`#00008F`) — Apollo deep navy, replaces `--axa-azur` as the dominant accent
- Full Canopée gray ramp (`--gray-50` → `--gray-1000`) replaces the editorial `--ink-strong` / `--ink-mute` / `--mute` triad (kept as aliases for backwards-compat with un-touched rules)
- Semantic palette: `--color-success` `#1A7F37`, `--color-warning` `#A05A00`, `--color-error` `#B22222`, `--color-info` `--axa-azur`
- `--ease` switched from springy `cubic-bezier(0.16, 1, 0.3, 1)` to Canopée default `cubic-bezier(0.32, 0.72, 0, 1)`
- `--radius-*` tightened: 4px / 8px / 12px (Slash 4-corner discipline)
- `prefers-reduced-motion` global guard added

### Typography (PRD §6)
- **Display:** Publico Headline (Canopée headline face, weights 300 / 400 / 500 / 600 / 700 / 900) — replaces Newsreader on h1/h2/h3
- **Body:** Source Sans 3 — replaces Geist Sans
- **Mono:** JetBrains Mono — kept (already Canopée-aligned)
- **Italic seam:** Newsreader italic (Publico has no italic woff2 on disk) limited to 5 hand-picked moments:
  1. Hero lede 2nd clause (`.hero .display-xl em`)
  2. Pull-quote (`.pull-quote`)
  3. Drop cap (`.dropcap` — currently non-italic upright Black for AXA blue weight)
  4. Marginalia annotations (`.marg-c`, `[data-marg]`)
  5. One scenario card emphasis (`.scen-h1 em`)
- **Italic policy:** every other italic in the original Codex CSS (steps Roman numerals, flow-list rows, builder field placeholders, AI message bubbles, brand wordmark, scenario subtitles) is forced to `font-style: normal` by an override layer at the cascade tail.

### Components (PRD §8)
- **Topbar** — White Slash chrome, AXA-blue wordmark, 56px height with 1px bottom rule
- **Buttons** — 4px radius default (`.btn`); AXA-blue `.btn-primary` with shelf shadow; `.btn-pill` Apollo modifier (full-rounded) reserved for the index hero CTA
- **Tags** — Canopée semantic stack (info / success / warning / error / brand) with status pill geometry; `.tag.brand` uses AXA-blue tint
- **Bento cells** — Slash card with 12px radius, 1px AXA-blue accent bar that fades in on hover; `.cell.dark` re-skinned to `--axa-blue-deeper` (#000033) instead of editorial ink-black
- **Index list** — long-form pilot table, no italic subtitles, AXA-blue arrow
- **Pull-quote** — preserved as the editorial seam, on a `--paper-warm` panel with AXA-blue smart quotes
- **Builder rail** — Roman numerals replaced by JetBrains Mono small caps; active step gets `--axa-blue` left bar
- **Builder fields** — underline focus changes from `--axa-azur` to `--axa-blue` 2px, label color becomes AXA-blue uppercase mono
- **Chat rail** — message bubbles re-skinned: AI messages get `--axa-blue` left border on `--gray-50`; user messages on `--axa-blue-bg`
- **Canvas runhead** — Publico title, AXA-blue progress bar, mono tabular nums for elapsed/budget
- **Canvas nodes** — square Slash radius, AXA-blue 4px halo when running, success-green when done, error-red when failed
- **Canvas background** — dot-grid (24px radial dots) replaces the editorial line-grid
- **HITL halo** — recolored from azur to `--color-warning` per PRD §9.4
- **Inspector tabs** — AXA-blue active underline
- **Activity dock** — severity left-border (4px) keyed to the semantic palette
- **Footer** — Slash compact 13px text in `--axa-blue`

### Copy (PRD §9)
- All four pages set to `<html lang="fr">`
- Index hero / scenarios h1 / builder h1 / canvas runhead translated to FR
- Top nav: Workspace → Cockpit · Scenarios → Scénarios · Compose → Composer · Open canvas → Ouvrir le canevas
- Numbers localized to FR convention (87,3 % · 1,4s · 96,2 %)

## What is **preserved** from `codex/`

- `codex.js` — **untouched** (PRD §13 acceptance #10: "no regression in choreography"). All canvas pan/zoom, stepper, run simulation, HITL gate, marginalia stagger, activity dock, and inspector logic continues to work.
- All HTML structure and markup classes — only text content and a few button modifiers changed
- The asymmetric bento grid, marginalia annotations, drop cap, and one pull-quote per page (the *Codex signature*)
- The viewport rhythm, hero rail, run-head choreography, and canvas pan area positioning

## Files

| File | Role |
|---|---|
| `index.html` | Cockpit landing — hero, bento grid, pull-quote, pilot index list |
| `scenarios.html` | Scenario gallery (six pilots) |
| `builder.html` | Composer — left rail steps, center canvas, right chat rail, simulated 8-movement run |
| `canvas.html` | Live run view — runhead, draggable canvas, marginalia, inspector, activity dock |
| `codex.css` | 2668 lines — Canopée tokens + chrome rewrite + AXA override layer |
| `codex.js` | 1095 lines — choreography (untouched from `codex/`) |
| `fonts/publico.css` | 6 Publico Headline weights (Roman, no italic) |
| `PRD.md` | Source spec — read this before editing |

## Running locally

```bash
cd design-proposal
python3 -m http.server 8766
# open http://localhost:8766/codex-axa/index.html
```

Sister sites:
- `http://localhost:8765/index.html` — `design-proposal/brand/` (canonical AXA brand minisite)
- `http://localhost:8766/codex/index.html` — original editorial-magazine Codex (for A/B comparison)
- `http://localhost:8766/codex-axa/index.html` — this redesign

## Open work

- [ ] Replace inline-SVG `.brand::before` hack with the real `assets/axa_logo.svg` (available in `../brand/assets/`)
- [ ] Optional: import `../brand/components.css` to gain access to `.ds-btn--slash` markup variants (currently codex-axa is self-contained)
- [ ] FR copy polish on bento cells / index list / scenario card subtitles (currently EN inside the cards; chrome is FR)
- [ ] Stylelint rule to enforce `.cockpit-*` namespace boundary
- [ ] Visual diff against running brand minisite (`design-proposal/brand/`) to verify color drift ≤ 0%

## Decisions log

- **AXA blue (#00008F) is the dominant accent**, not azur (#3032C1). Azur is reserved for `--color-info` and select hover states.
- **Italic seam is preserved but constrained.** Codex's editorial DNA was 90% italic; this redesign keeps it as a 5-spot signature, not a typographic attitude.
- **Drop cap is non-italic.** Publico Black upright in AXA blue is the editorial moment; Newsreader italic was an EN-magazine cliché that doesn't suit French claims copy.
- **No new HTML structure.** Every change is a CSS or copy change. JS unmodified. This keeps the redesign reviewable as a "skin," not a fork.

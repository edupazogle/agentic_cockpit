---
name: axa-design
description: Use this skill to generate well-branded interfaces and assets for AXA France, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

# AXA France — Canopée Design System

Read `README.md` first for the full picture (three universes, content fundamentals, visual foundations, iconography). Then explore the other available files as needed.

## Quick orientation

AXA France ships **three universes** of the same brand under the Canopée design system:

- **Apollo (Prospect, B2C marketing)** → `ui_kits/prospect/` — pill CTAs, Publico serif headlines, hero photography. Used for axa.fr-style funnels.
- **LF (Look & Feel, B2C client)** → `ui_kits/client/` — `Espace client` (authenticated) — sidebar, dashboard, 8-px button radius, claim flows.
- **Slash (B2B Distributeur)** → `ui_kits/distributeur/` — back-office for agents/brokers — square buttons with inset bottom-shelf shadow, dense tables, monospace IDs.

Match the universe to your audience before picking patterns — they share `#00008F` AXA blue and Publico/Source Sans, but **diverge sharply** on radius, density, and chrome.

## Core tokens

- `colors_and_type.css` — all CSS variables. Brand is **AXA blue `#00008F`**. Hover `#000072`, active `#00005B`. Business orange `#BC4C2D` for Pro CTAs.
- Type: **Publico Headline** (display, serif) + **Source Sans Pro / Source Sans 3** (body, UI). Sentence case throughout. Never ALL-CAPS.
- Material Symbols Outlined (weight 400) is the **only** sanctioned icon set. No emoji.

## Working modes

- **Visual artifacts (slides, mocks, throwaway prototypes):** copy assets out of `assets/` (the AXA logo SVG, hero JPGs), link `colors_and_type.css`, and lift components from `ui_kits/<universe>/*.jsx`. Build static HTML files.
- **Production code:** apply the rules in `README.md` (CONTENT FUNDAMENTALS, VISUAL FOUNDATIONS, ICONOGRAPHY) directly. The reference Canopée packages live at `@axa-fr/canopee-css`, `@axa-fr/canopee-react-prospect`, `@axa-fr/canopee-react-client`, `@axa-fr/canopee-react-distributeur`.

## When invoked without specifics

Ask the user:
1. Which **universe** — Prospect / Client / Distributeur — and who's the audience?
2. **Output:** marketing page, app screen, slide deck, prototype, production component?
3. Any **product / vertical** — Auto, Habitation, Santé, Épargne, Pro?
4. **Tone:** standard reassuring-but-direct French insurer voice, or something more playful/editorial?

Then act as an expert AXA designer and produce HTML artifacts or production code as needed. **Always French (`vous`)** unless the user explicitly asks for English.

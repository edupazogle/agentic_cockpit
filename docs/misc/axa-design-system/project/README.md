# AXA France — Canopée Design System

A design system reconstruction of **AXA France's Canopée** (`@axa-fr/canopee-css`, `@axa-fr/canopee-react`), the unified design system that powers AXA France's digital surfaces.

> **AXA** is one of the world's largest insurance and asset management groups, headquartered in Paris. AXA France is the local operating arm. Canopée consolidates three previously-separate design systems into a single npm scope (`@axa-fr/canopee-*`).

## The three universes

Canopée ships three "universes" — same brand, distinct contexts:

| Universe | Audience | Codename | Surface examples |
|---|---|---|---|
| **Prospect** | B2C — public, prospects | _Apollo_ | axa.fr marketing, quote funnels, landing pages |
| **Client** | B2C — authenticated customers | _Look & Feel (LF)_ | Espace client, account management, claims |
| **Collab-Distrib** | B2B — internal & broker tools | _Slash_ | Distributor / agent back-office apps |

Prospect leans editorial and emotive (Publico serif headlines, pill CTAs, generous white). Client is a more compact, dense version of the same B2C language (rounded buttons but smaller radius, tighter type scale). Slash is utilitarian: angular zero-radius buttons with an inset bottom-shelf shadow, denser tables, work-app density.

## Sources

- **GitHub repo:** https://github.com/AxaFrance/design-system (main branch, commit `6df7bcb…`)
- **Storybooks:**
  - Prospect — https://axafrance.github.io/design-system/prospect/react/latest/
  - Client — https://axafrance.github.io/design-system/client/react/latest/
  - Distributeur (Slash) — https://axafrance.github.io/design-system/distributeur/react/latest/
- **ZeroHeight:**
  - B2C — https://zeroheight.com/49b6215d6/v/latest/p/923242-design-system-b2c
  - B2B — https://zeroheight.com/4b1e27a45/v/latest/p/36b4a2-slash-design-system-b-to-b
- **Figma:**
  - B2C — https://www.figma.com/design/vwprvN2ELfI50pjU6MK1Ea/Design-System-B2C
  - B2B Slash — https://www.figma.com/design/reZserxMfytQ9M82bt20Bi/DS-Slash-V3

(Links recorded for reference — readers may not have access. We worked entirely from the public GitHub repo.)

---

## CONTENT FUNDAMENTALS

AXA France copy is **French**, formal-but-warm, written for a regulated industry where clarity is non-negotiable.

- **Language:** French (`fr-FR`). Where English appears in code (component names, story titles), the *user-facing* strings are always FR.
- **Person:** **"vous"** (formal you) — never tutoyer. Customers are addressed respectfully. The brand speaks as **"nous"**.
- **Tone:** *Reassuring, expert, direct*. Sentences are short; jargon is unpacked. Headlines often ask a question or state a benefit ("Quelle est votre situation ?", "Votre devis en 3 minutes").
- **Casing:** Sentence case for all UI copy and headings. **Never ALL-CAPS** except for the AXA wordmark itself and tight tracking eyebrows.
- **Numbers & money:** French formatting — `1 234,56 €` (space thousands separator, comma decimal, euro after). Phone: `01 23 45 67 89`.
- **Dates:** `JJ/MM/AAAA` placeholder, full month names lower-case (`12 janvier 2026`).
- **Calls to action:** Verbs in infinitive — "Demander un devis", "Souscrire", "Déclarer un sinistre", "Accéder à mon espace".
- **Microcopy:** Reassuring qualifiers — "en 3 minutes", "sans engagement", "gratuit". Accessibility footer always includes "Mentions légales", "Données personnelles", "Cookies".
- **Emoji:** **Not used.** No emoji in product UI, marketing, or transactional copy.
- **Iconography over decoration:** Material Symbols (outlined, weight 400) are the *only* sanctioned icon set in code; they replace what other systems would solve with emoji.
- **Vibe:** Trustworthy French insurer. Editorial elegance from the serif (Publico) tempered by Source Sans Pro's plain-spoken neutrality.

**Examples (lifted from the repo's Storybook):**
- Heading: *"Bienvenue dans votre espace client"*
- Lead: *"Retrouvez tous vos contrats, déclarez un sinistre et contactez votre conseiller."*
- Primary CTA: *"Demander un devis"* / *"Accéder à mon espace"*
- Secondary CTA: *"En savoir plus"*
- Error: *"Ce champ est obligatoire."*
- Success: *"Votre demande a bien été enregistrée."*

---

## VISUAL FOUNDATIONS

### Colors
- **Brand primary:** AXA Blue `#00008F` — used everywhere: buttons, links, headings (Apollo H1/H2/H3 are blue), header bars.
- **Hover:** darker blue `#000072`. **Active:** `#00005B`.
- **Neutrals:** True grayscale (`#333` body, `#5C5C5C` secondary, `#999` muted, `#E3E3E3` borders, `#F6F6F6` surfaces). No tinted neutrals.
- **Business orange** `#BC4C2D` — reserved for "Pro" / business CTAs to differentiate from consumer flows. Used sparingly.
- **Tarif palette** (Apollo product-tier highlights): blue → light purple → purple → dark purple → green-teal. Used as backgrounds for tier comparisons.
- **Decorative B2C:** grape, sky, cotton-candy, sunshine, teal — used in illustrations and hero compositions, never as primary UI surfaces.

### Type
- **Display / serif:** **Publico Headline** (Light 300, Medium 500, Bold 700, Extrabold 800, Black 900). H1 in Apollo is Publico Headline Bold.
- **Body serif:** Publico Roman 400.
- **Sans:** **Source Sans Pro** (Source Sans 3 as Google Fonts substitute) — body, labels, buttons, all UI chrome.
- Apollo H1 is **48/60 desktop**, **32/40 mobile**. H2 is Light 300 — the airy, elegant moment in the hierarchy.

### Backgrounds
- **Predominantly white** with selective `#F8F8FF` blue-tint surfaces.
- **Hero photography** is full-bleed with deep AXA-blue overlays — see `assets/hero-*.jpg`. Imagery skews **warm, candid, human** — real customers, real homes, low-key smiles. No stock-photo gloss.
- No gradients on UI surfaces (only as photography overlays). No repeating patterns. No grain or noise.

### Animation
- **Subtle and linear.** `transition: all 0.2s linear` is the default everywhere.
- Honors `prefers-reduced-motion` (transitions clamped to `0.01ms`).
- No bounces, no spring physics, no parallax. Hover is a color/shadow swap, full stop.

### Hover & press states
- **Hover:** darker brand blue. Buttons get `--axa-blue-dark`; ghost links lose underline.
- **Press / active:** even darker blue (`#000072` → `#00005B`). Slash buttons use a 2px inset bottom-border that *disappears* on press, simulating a physical depress.
- **Focus-visible:** 2px solid AXA blue outline with 2px offset — accessibility-first.

### Borders
- **Slash B2B:** square (radius 0 on buttons), 1px borders, inset bottom shelf.
- **Apollo B2C prospect:** **fully rounded pill** CTAs (`border-radius: 100vmax`). Cards get `12px`.
- **LF B2C client:** `8px` button radius (rectangular but softened), `12px` cards.

### Shadow systems
- **Slash card:** `0 0 9px rgba(0,0,0,0.18)` — soft halo, no offset.
- **Apollo / LF:** lighter, blue-tinted: `0 2px 8px rgba(0,0,128,0.15)`. Cards rely on outline (1px → 2px on hover) more than shadow.
- **No inner shadows** on inputs. **Inset shadows** are reserved for Slash button shelves.

### Layout
- **Container max-width 1140px** (Slash header), 1272px on Apollo desktop.
- **Breakpoints:** Apollo `mobile / 668 / 1024 / 1280 / 1600`. Slash `0 / 576 / 772 / 1016 / 1272 / 1432`.
- **Grid:** 12-column with `--rem-*` based gutters.
- Header is white, sticky, ~80px tall. Footer is dark blue (`--axa-blue`) with white text.

### Transparency & blur
- Used **sparingly** — `var(--blue-1000-20)` (20% AXA blue) for selected-row tinting, `var(--white-1000-20)` for over-photo overlays. **No backdrop-filter blur** in the system.

### Imagery vibe
- **Warm, natural, candid.** Real-life moments — families at home, cyclists, professionals at desks. Lighting is daylight, neutral white-balance. No b&w. No grain. No fashion gloss.

### Corner radii
- Buttons: `0` (Slash) / `8` (LF) / `100vmax` (Apollo pill).
- Cards: `12px` consistently.
- Modals: `16px`.
- Inputs: `0` Slash / `8` Apollo.

### Cards
- **Slash:** `4px` radius, white, `0 0 9px rgba(0,0,0,0.18)` shadow, no border. Hover thickens border to 2px AXA blue.
- **Apollo/LF:** `12px` radius, white, `1px` outline (`--gray-140`), no shadow by default. Outline becomes `2px AXA blue` on hover.

---

## ICONOGRAPHY

- **Primary icon system:** **Google Material Symbols Outlined** (weight 400). The repo officially recommends `@material-symbols/svg-400`; consumers import individual SVGs and pass them to a `<Svg>` component that handles sizing/coloring via `currentColor`.
- We mirror this here by linking Material Symbols Outlined from the Google Fonts CDN — see `colors_and_type.css` doesn't link it directly; the UI kit pulls it in. **No hand-drawn replacements.**
- **Icon font:** Slash (`distributeur`) ships an internal `icons` font with a small set of glyph codepoints (`\EABA` for the success checkmark, etc) used in form validation. We've imported `source/distributeur/icons.css` for reference; substitute with Material Symbols when prototyping.
- **Stroke / fill style:** Outlined, 24×24 default canvas, `fill: currentColor`. Buttons set icon `height: 1.25rem`. Cards set `width/height: 3rem` for hero icons.
- **SVG vs PNG:** SVG-only. PNG icons are not used. Rasters are reserved for photography.
- **Logo:** SVG at `assets/axa_logo.svg` — solid AXA blue wordmark with the diagonal slash. Use at 60–80px tall in headers; never recolor outside `--axa-blue` or pure white (on dark backgrounds).
- **Emoji:** Not used.
- **Unicode glyphs as icons:** Not used (chevrons in pagination, etc., are Material Symbols).

---

## INDEX — what's where

```
README.md                  ← you are here
SKILL.md                   ← Agent Skill manifest (Claude Code-compatible)
colors_and_type.css        ← all CSS variables + base typography
fonts/                     ← Publico Headline + publico.css @font-face block
assets/
  axa_logo.svg
  hero-client.jpg          ← B2C Client hero photography
  hero-prospect.jpg        ← B2C Prospect hero photography
  hero-distributeur.jpg    ← B2B Slash hero photography
  typography-publico.jpg   ← Publico specimen reference
  typography-sourcesanspro.jpg
source/                    ← original Canopée CSS files imported from GitHub for reference
  distributeur/            ← Slash B2B
  prospect-client/         ← Apollo + LF B2C
preview/                   ← design-system cards (registered for the Design System tab)
ui_kits/
  prospect/                ← B2C Prospect (Apollo) — axa.fr-style marketing & quote
  client/                  ← B2C Client (LF) — Espace client account area
  distributeur/            ← B2B Slash — internal back-office
```

## Caveats

- **Publico Headline** is a licensed font. We've used the woff2 files committed to the AxaFrance public repo for fidelity. If you redistribute, verify your AXA license covers your use case.
- **Source Sans Pro** is substituted with Google Fonts' **Source Sans 3** (very close, free). Flag if pixel-perfect fidelity to the original Source Sans Pro is required.
- We did **not** import every component — focus was on tokens, typography, buttons, cards, headings, headers, tags, forms. The full Storybook has ~40 components per universe.

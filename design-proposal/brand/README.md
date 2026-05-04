# AXA France — Canopée Design System (mini-site de référence)

A self-contained, single-page reconstruction of **AXA France's Canopée Design
System** (`@axa-fr/canopee-*`). Use it as a global brand reference for any
project — marketing, product, prototypes, slides — when you need the official
tokens, type, components, and content rules at hand without standing up the
full npm packages.

> **Not affiliated with AXA.** Reconstruction from the public GitHub repo at
> `github.com/AxaFrance/design-system`. In case of divergence, the repo and
> the official ZeroHeight pages are the source of truth.

## What's inside

```
brand/
├── index.html          ← The minisite (single page, sticky TOC)
├── colors_and_type.css ← Canonical tokens (--axa-blue, --gray-*, --color-*) + base type
├── components.css      ← Cross-universe components (.ds-btn, .ds-card, .ds-tag, .ds-alert, .ds-input…)
├── site.css            ← Page-level layout for the minisite (hero, TOC, sections, swatches)
├── fonts/              ← Publico Headline woff2 + @font-face block
└── assets/
    ├── axa_logo.svg
    ├── hero-prospect.jpg     (Apollo)
    ├── hero-client.jpg       (LF)
    └── hero-distributeur.jpg (Slash)
```

The minisite covers **everything** needed to ship a Canopée-branded surface in
any of the three universes:

### Vue d'ensemble
- The system in one paragraph, the three universes in a comparison table
  (radius, density, header, container, tone, package).
- Voice & content — French formal (`vous`), sentence case, FR number/date
  formats, infinitive CTAs, no emoji, error-message style.

### Fondations
- **Logo** — wordmark on white and AXA blue, do/don't.
- **Couleurs** — full brand ramp (`#F8F8FF` → `#000072`), Slash azur accent,
  pure-grayscale neutrals, semantic (success/error/warning/info) with
  light-bg companions, Apollo Tarif scale (5 hues), B2C decoratives (5 hues).
- **Typographie** — Publico Headline (300 / 500 / 700 / 800 / 900) + Source
  Sans 3 (300/400/600/700) specimens, full hierarchy from H1 48/60 down to
  eyebrow 12 UPPER.
- **Espacement** — base-4 scale `--sp-1` … `--sp-11` rendered as bars.
- **Rayons** — 0 (Slash button) · 4 (Slash card) · 8 (LF button) · 12 (card) ·
  16 (modal) · 32 (XL) · ∞ (Apollo CTA).
- **Élévation** — three canonical shadows (halo Slash, soft Apollo, pop modal).
- **Mouvement** — `0.2s linear` default, `prefers-reduced-motion` policy.
- **Iconographie** — Material Symbols Outlined weight 400, sample grid.
- **Imagerie** — three hero JPGs, do/don't on photography style.

### Composants
- **Boutons** — full Apollo (pill), LF (rounded), Slash (square + shelf)
  galleries with primary/secondary/tertiary/business/ghost/disabled/sizes.
- **Cartes** — Apollo, LF, Slash variants in one row.
- **Étiquettes & badges** — 9 variants.
- **Alertes** — info / success / warning / error.
- **Formulaires** — input, textarea, select, checkbox; hint, success, error
  messages; `aria-invalid` styling.
- **En-tête & pied** — white 1140 px header + AXA-blue footer pattern.

### Ressources
- Direct links to the GitHub repo, the three Storybooks, ZeroHeight overview &
  foundations pages, ZeroHeight B2C / Slash B2B docs, and both Figma libraries.
- License notes for Publico, Source Sans, the AXA logo, and this minisite.

## How to use

```bash
# from anywhere on your machine — no build step
cd design-proposal/brand
python3 -m http.server 8765
# open http://localhost:8765/
```

Or open `index.html` directly. Fonts are loaded from `fonts/` (Publico) +
Google Fonts (Source Sans 3, JetBrains Mono, Material Symbols Outlined).

To use the components in your own project, copy the three CSS files
(`colors_and_type.css`, `components.css`, optionally `site.css`) and the
`fonts/` + `assets/` folders. All classes are namespaced `.ds-*` to avoid
collisions; tokens are exposed as CSS custom properties on `:root`.

## Component classes — quick reference

### Buttons (`.ds-btn`)
Universe (one of these): `--apollo` · `--lf` · `--slash`
Intent: `--primary` · `--secondary` · `--tertiary` · `--business` · `--success` · `--danger`
Size:   `--sm` · `--lg`
Plus universe-agnostic `.ds-btn--ghost`.

### Cards (`.ds-card`)
Variant: `--apollo` · `--lf` · `--slash`
Slots:   `.ds-card__eyebrow`, `.ds-card__title`, `.ds-card__body`.

### Tags (`.ds-tag`)
Variants: `--info` · `--success` · `--warning` · `--error` · `--dark` · `--gray` · `--purple` · `--outline`

### Alerts (`.ds-alert`)
Variants: `--info` · `--success` · `--warning` · `--error`
Slot: `.ds-alert__icon`.

### Form (`.ds-field`, `.ds-input`, `.ds-textarea`, `.ds-select`, `.ds-checkbox`)
Slots: `.ds-field__label`, `.ds-field__hint`, `.ds-field__success`, `.ds-field__error`.
Slash variant: `.ds-input--slash` etc. (radius 0).

## Tokens — quick reference

All tokens live in `colors_and_type.css` on `:root`.

| Group | Examples |
|---|---|
| Brand | `--axa-blue` `#00008F`, `--axa-blue-dark` `#000072`, `--axa-blue-deeper` `#00005B`, `--axa-azur` `#3032C1` |
| Neutrals | `--gray-1000` `#333`, `--gray-800` `#5C5C5C`, `--gray-500` `#999`, `--gray-140` `#E3E3E3`, `--gray-50` `#F6F6F6` |
| Semantic | `--color-success` `#0C7D3B`, `--color-error` `#C7102E`, `--color-warning` `#BC4C2D`, `--color-info` `#3871B5` |
| Tarif | `--bluetarif`, `--purplelighttarif`, `--purpletarif`, `--purpledarktarif`, `--greentarif` |
| Decorative | `--grape`, `--sky`, `--cotton-candy`, `--sunshine`, `--teal` |
| Type | `--font-display` (Publico), `--font-sans` (Source Sans 3), `--font-mono` (JetBrains Mono) |
| Scale | `--fs-h1` 3rem · `--fs-h2` 2.5rem · `--fs-h3` 2rem · `--fs-h4` 1.5rem · `--fs-lead` 1.125rem · `--fs-body` 1rem · `--fs-sm` 0.875rem · `--fs-xs` 0.75rem |
| Spacing | `--sp-1` 4px → `--sp-11` 120px |
| Radii | `--radius-0` · `--radius-sm` 4 · `--radius-md` 8 · `--radius-lg` 12 · `--radius-xl` 16 · `--radius-3xl` 32 · `--radius-pill` 100vmax |
| Elevation | `--shadow-card` (halo) · `--shadow-soft` (Apollo lift) · `--shadow-pop` (modal) · `--shadow-inset` (Slash shelf) |
| Motion | `--t-fast` 0.15s · `--t-base` 0.2s · `--t-slow` 0.3s — all `linear` |

## Caveats

- **Publico Headline** is licensed (Commercial Type). The `woff2` files come
  from the public AxaFrance repo for fidelity — verify your AXA license covers
  your use case before redistributing.
- **Source Sans Pro** is substituted with **Source Sans 3** (OFL, free). Flag
  if pixel-perfect fidelity to the original Source Sans Pro is required.
- This minisite covers tokens, type, foundations, and the most-used components
  (buttons, cards, tags, alerts, forms, header, footer). The full official
  Storybooks ship ~40 components per universe — for production work, install
  the actual `@axa-fr/canopee-react-*` packages.

---
name: design
description: "Visual design and frontend aesthetics. Use when designing UI components, pages, or applications; applying design systems; image-to-code conversion; or reviewing visual quality. Triggers: /design, design, UI, visual, frontend design, styling, taste, brand"
---

# Design Hub

IRON LAW: Every design must use AXA Canopée design tokens. Never invent colors, fonts, or spacing values. The design system is non-negotiable.

## Sub-Skill Catalog

| User says... | Load sub-skill |
|---|---|
| "brand kit", "AXA branding", "brand colors", "logo" | `brandkit/SKILL.md` |
| "design this frontend", "make this look good", "polish UI" | `design-taste-frontend/SKILL.md` |
| "full output", "complete design", "production ready UI" | `full-output-enforcement/SKILL.md` |
| "GPT design taste", "GPT aesthetic", "ChatGPT style UI" | `gpt-taste/SKILL.md` |
| "high end design", "premium UI", "luxury visual" | `high-end-visual-design/SKILL.md` |
| "screenshot to code", "image to HTML", "convert mockup" | `image-to-code/SKILL.md` |
| "minimalist design", "clean UI", "simple aesthetic" | `minimalist-ui/SKILL.md` |
| "redesign X", "restyle existing project", "UI overhaul" | `redesign-existing-projects/SKILL.md` |

## Decision Tree

1. Need **AXA-specific branding** (colors, logos, fonts)? → `brandkit/SKILL.md`
2. **General UI polish** / make it look professional? → `design-taste-frontend/SKILL.md`
3. Need **production-grade complete output**? → `full-output-enforcement/SKILL.md`
4. Going for a **specific aesthetic**?
   - Minimalist → `minimalist-ui/SKILL.md`
   - Premium/luxury → `high-end-visual-design/SKILL.md`
   - GPT/ChatGPT-style → `gpt-taste/SKILL.md`
5. **Converting image/mockup to code**? → `image-to-code/SKILL.md`
6. **Redesigning an existing project**? → `redesign-existing-projects/SKILL.md`

## Related Domains

Before executing, check if the task touches:
- **Code review** → also load `../qa/SKILL.md` (for `/designqa` workflow)
- **Brainstorming** → also load `../brainstorming/SKILL.md` (for design exploration)

## Anti-Patterns

- NEVER use non-Canopée colors or fonts for AXA surfaces
- NEVER skip accessibility (a11y) audit on UI changes
- NEVER generate generic "AI slop" aesthetics — be distinctive
- NEVER use placeholder lorem ipsum in final designs

## Confirmation Gates

⛔ ASK before: changing brand elements, modifying design tokens, final production publish

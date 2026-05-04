# AXA Flow — Atelier d'agents (workflow canvas)

An n8n / Railway-style infinite-canvas workflow builder, dressed in the AXA Canopée design language. Drop nodes from the palette, wire them up by dragging from output ports to input ports, click any node to inspect & configure it, and hit **Exécuter** to watch the flow animate end-to-end.

## What's branded AXA

- **AXA blue** `#00008F` everywhere — selection ring, primary CTA, headings, inspector accents.
- **Publico Light** for inspector titles & palette section header (the editorial "moment").
- **Source Sans** body throughout.
- Six node categories tinted with AXA's broader palette:
  - **Trigger** — `#0C7D3B` success green
  - **Données** — `#3871B5` info blue
  - **Agent IA** — `#5A3976` Apollo tarif purple
  - **Logique** — `#00008F` AXA blue
  - **Action AXA** — `#BC4C2D` business orange
  - **Sortie** — `#333` neutral
- Dot grid in `#00008F18` (faint AXA blue), 24-px lattice — a softer take on the Railway dotted canvas.
- Pill primary CTA matches Apollo; cards use 12-px radius matching LF.
- Material Symbols icons for every node head + chrome control.

## Interactions

| Action | How |
|---|---|
| Pan | Click & drag the empty canvas |
| Zoom | Mouse-wheel anywhere on the canvas (centered on cursor) — or +/− buttons |
| Move a node | Click & drag the node card |
| Add a node | Click any item in the left palette |
| Wire two nodes | Drag from a coloured **output port** (right side) onto an **input port** (left side) of another node |
| Inspect | Click any node → right-side inspector with config + last run + JSON output preview |
| Execute | Hit "Exécuter" in the top bar → traversal animates with green pulses + dashed flow on edges |

## Demo workflow

The canvas opens with a real claims-handling pipeline:

```
Sinistre déclaré → Lookup contrat → ┬─ Extraction docs
                                    └─ Triage sinistre → Condition (montant) ─┬─ Indemnisation ─┐
                                                                              │                  ├─ E-mail client → Fin
                                                                              └─ Tâche Slash ────┘
```

Realistic AXA scenario: webhook from Espace Client, enrichment via core insurance + CRM, a Claude-powered triage agent that either auto-pays low-severity claims or routes high-severity to a distributor task in Slash, then a customer e-mail, then archive.

## Files

- `Flow.jsx` — the whole canvas (≈ 12 KB, single component)
- `index.html` — loader (React 18 + Babel, links AXA tokens & Material Symbols)
- This README

## Caveats

- Edges flow **left → right only** (drag from output → input). No reverse wiring.
- No undo/redo — drop a wrong wire, click another node and add a new one.
- One demo workflow; saving / loading / exporting is mocked.

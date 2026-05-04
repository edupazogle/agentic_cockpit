# Slash — B2B Distributeur UI Kit

Recreation of AXA's distributor (agent/broker) workspace. Based on `apps/slash-stories`. This is the densest, most utilitarian of the three universes.

**Signature moves**
- Sharp 90° corners everywhere — no rounding
- "Bottom-shelf" inset shadow on buttons (`inset 0 -2px <darker>`) instead of border-radius for affordance
- Cards float on a `0 0 9px rgba(0,0,0,.18)` halo against `#F2F2F2` page bg
- Tabular numerics, monospace IDs (`fontFamily: ui-monospace`)
- Dense tables with `#F2F2F2` header rows and zebra striping
- Brand-blue topbar with monospace chrome label

**Components:** `TopBar`, `Tabs`, `Kpi`, `Table`, `Detail` (modal), `Workspace` (composed).

**Click-thru:** Click "Ouvrir" on any contract row to open its detail modal with Modifier / Avenant / Résilier actions.

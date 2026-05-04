# LF (Look & Feel) — B2C Client UI Kit

Recreation of AXA's Espace client (authenticated customer area). Based on `apps/look-and-feel-stories`.

**Signature moves**
- Sidebar nav with brand-blue active state (left border + tinted background)
- Publico Light topbar greeting — "Bienvenue, {name}"
- Stat cards + 3-up contract grid + brand-blue gradient promo card
- 8-px button radius (denser than Apollo's pill)
- Claim flow modal with success confirmation

**Components:** `SideNav`, `TopBar`, `Card`, `ContractCard`, `Dashboard`, `ClaimModal`.

**Click-thru:** Click "Déclarer un sinistre" to open the claim modal → submit → success.

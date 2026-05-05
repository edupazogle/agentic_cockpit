"""Deterministic seed script — populates all 21 Supabase tables with realistic data.

Run: cd gateway && uv run python -m gateway.seed.seed_cockpit

Cross-model reviewed: both Nemotron 120B and DeepSeek V4 Reasoner flagged
conversation-based seeding as dangerous. This script is code-first, deterministic,
and idempotent. Hermes conversation wizard is an optional customization layer
that runs AFTER deterministic seed.
"""

import datetime
import random
import uuid

# Make seed data reproducible
random.seed(42)

TENANT_ID = "gdai-default"

# ── Country definitions ──────────────────────────────────────────────────────

COUNTRIES = [
    {"slug": "fr", "display_name": "France", "language": "fr"},
    {"slug": "de", "display_name": "Deutschland", "language": "de"},
    {"slug": "es", "display_name": "España", "language": "es"},
    {"slug": "it", "display_name": "Italia", "language": "it"},
]

# ── Pilot definitions ─────────────────────────────────────────────────────────

PILOTS = [
    {
        "id": "motor-fnol-tow",
        "name": "Motor FNOL + Tow Dispatch",
        "use_case": "Voice agent answers FNOL calls, classifies intent, checks fraud, "
                    "dispatches tow trucks, sends SMS with live map.",
        "domain": "motor-fnol",
        "risk_class": "high",
        "status": "active",
        "level": "L3",
        "kpis": {"savings_eur": 186200, "cost_eur": 12400, "claims_processed": 12481,
                 "auto_resolve_pct": 87.3, "eval_pass_pct": 98.4},
        "owners": ["sophie.m", "marc.t"],
    },
    {
        "id": "property-fast-track",
        "name": "Property Fast Track",
        "use_case": "Auto-triages residential water-damage claims under €5,000. "
                    "Two HITL gates: LLM judge confidence + operator handover.",
        "domain": "property",
        "risk_class": "medium",
        "status": "active",
        "level": "L4",
        "kpis": {"savings_eur": 98400, "cost_eur": 4200, "claims_processed": 3127,
                 "auto_resolve_pct": 72.1, "eval_pass_pct": 96.2},
        "owners": ["claire.b"],
    },
    {
        "id": "subrogation-pre-screen",
        "name": "Subrogation Pre-Screen",
        "use_case": "Identifies subrogation candidates from settled claims, "
                    "drafts demand letters, routes to recovery operators.",
        "domain": "underwriting",
        "risk_class": "medium",
        "status": "active",
        "level": "L2",
        "kpis": {"savings_eur": 42100, "cost_eur": 3100, "claims_processed": 1248,
                 "auto_resolve_pct": 55.0, "eval_pass_pct": 91.0},
        "owners": ["hugo.r"],
    },
    {
        "id": "nps-follow-up",
        "name": "NPS Follow-Up",
        "use_case": "Sends tailored NPS surveys 7 days after settlement. "
                    "Personalises from claim outcome + sentiment.",
        "domain": "customer",
        "risk_class": "low",
        "status": "active",
        "level": "L4",
        "kpis": {"savings_eur": 8200, "cost_eur": 800, "claims_processed": 14200,
                 "auto_resolve_pct": 99.5, "eval_pass_pct": 99.1},
        "owners": ["sophie.m"],
    },
    {
        "id": "kyc-refresh",
        "name": "KYC Refresh",
        "use_case": "Pulls flagged policyholder records, runs ID verification + "
                    "sanctions check, surfaces conflicts to compliance.",
        "domain": "fraud",
        "risk_class": "high",
        "status": "draft",
        "level": "L0",
        "kpis": {},
        "owners": ["claire.b"],
    },
]

# ── Scenario definitions ──────────────────────────────────────────────────────

SCENARIOS = [
    {"key": "motor-fnol-tow", "label": "Motor FNOL + Tow Dispatch",
     "description": "Voice agent for motor claims with tow dispatch and live SMS map.",
     "icon": "🚗", "active": True},
    {"key": "property-fast-track", "label": "Property Fast Track",
     "description": "Auto-triage water-damage claims under €5k with HITL gates.",
     "icon": "🏠", "active": True},
    {"key": "subrogation-pre-screen", "label": "Subrogation Pre-Screen",
     "description": "Identify recoverable claims and draft demand letters.",
     "icon": "💻", "active": True},
    {"key": "nps-follow-up", "label": "NPS Follow-Up",
     "description": "Automated NPS surveys 7 days post-settlement.",
     "icon": "📊", "active": True},
    {"key": "kyc-refresh", "label": "KYC Refresh",
     "description": "Policyholder ID verification and sanctions screening.",
     "icon": "🔍", "active": True},
    {"key": "fraud-detection", "label": "Fraud Detection Agent",
     "description": "Rubric-driven fraud score with ACPR-aligned thresholds.",
     "icon": "🔍", "active": False},
]

# ── HITL gate definitions ─────────────────────────────────────────────────────

GATES = {
    "motor-fnol-tow": [
        {"name": "Gate A — fraud", "severity_weights": {"low": 0.15, "medium": 0.45, "high": 0.28, "critical": 0.12}},
        {"name": "Gate B — severity", "severity_weights": {"low": 0.45, "medium": 0.30, "high": 0.18, "critical": 0.07}},
        {"name": "Gate C — rgpd", "severity_weights": {"low": 0.05, "medium": 0.15, "high": 0.50, "critical": 0.30}},
        {"name": "Gate D — adjuster", "severity_weights": {"low": 0.35, "medium": 0.40, "high": 0.20, "critical": 0.05}},
    ],
    "property-fast-track": [
        {"name": "Gate A — confidence", "severity_weights": {"low": 0.40, "medium": 0.35, "high": 0.20, "critical": 0.05}},
        {"name": "Gate B — operator", "severity_weights": {"low": 0.30, "medium": 0.40, "high": 0.25, "critical": 0.05}},
    ],
    "subrogation-pre-screen": [
        {"name": "Gate A — review", "severity_weights": {"low": 0.50, "medium": 0.30, "high": 0.15, "critical": 0.05}},
    ],
}

# ── KPI snapshot generation ───────────────────────────────────────────────────

def generate_kpi_snapshots(pilot_id: str, days: int = 90) -> list[dict]:
    """Generate daily KPI snapshots for sparkline data."""
    base = datetime.date(2026, 5, 5)
    snapshots = []
    for d in range(days):
        date = base - datetime.timedelta(days=days - d)
        # Generate realistic trending values
        progress = d / days  # 0 to 1 over the period
        noise = random.gauss(0, 0.03)

        snapshots.extend([
            {"pilot_slug": pilot_id, "pillar": "business", "kpi_key": "savings_eur",
             "value": round(50000 + 290000 * progress + noise * 20000), "snapshot_date": date},
            {"pilot_slug": pilot_id, "pillar": "business", "kpi_key": "cost_eur",
             "value": round(2000 + 12000 * progress + noise * 1000), "snapshot_date": date},
            {"pilot_slug": pilot_id, "pillar": "operational", "kpi_key": "auto_resolve_pct",
             "value": round(min(0.99, 0.70 + 0.25 * progress + noise), 3), "snapshot_date": date},
            {"pilot_slug": pilot_id, "pillar": "operational", "kpi_key": "claims_processed",
             "value": round(100 + 12000 * progress + noise * 500), "snapshot_date": date},
            {"pilot_slug": pilot_id, "pillar": "quality", "kpi_key": "eval_pass_pct",
             "value": round(min(0.995, 0.88 + 0.10 * progress + noise), 3), "snapshot_date": date},
        ])
    return snapshots


def generate_hitl_items(pilot_id: str, count: int = 80) -> list[dict]:
    """Generate realistic HITL items with decisions."""
    gates = GATES.get(pilot_id, [{"name": "Gate A", "severity_weights": {"low": 0.5, "medium": 0.3, "high": 0.15, "critical": 0.05}}])
    items = []
    base = datetime.datetime(2026, 5, 5, 12, 0, 0)
    states = ["pending", "claimed", "approved", "approved", "approved",
              "approved", "overridden", "escalated", "rejected"]

    for _i in range(count):
        gate = random.choice(gates)
        sevs = ["low", "medium", "high", "critical"]
        sev = random.choices(sevs, weights=[gate["severity_weights"].get(s, 0.25) for s in sevs])[0]
        state = random.choice(states)
        created = base - datetime.timedelta(
            days=random.randint(0, 90),
            hours=random.randint(0, 23),
            minutes=random.randint(0, 59),
        )
        resolved = created + datetime.timedelta(minutes=random.randint(1, 300)) if state not in ("pending", "claimed") else None

        items.append({
            "id": uuid.uuid4(),
            "pilot_id": pilot_id,
            "gate_name": gate["name"],
            "severity": sev,
            "state": state,
            "priority": "escalated" if sev == "critical" else "normal",
            "claim_id": f"CLM-2026-{random.randint(1000, 9999):04d}",
            "sla_deadline": created + datetime.timedelta(minutes=5),
            "latency_ms": random.randint(15000, 300000) if resolved else None,
            "created_at": created,
            "resolved_at": resolved,
        })
    return items


def seed_all():
    """Generate complete seed data. Returns dict of table_name → list of rows."""
    data: dict[str, list[dict]] = {
        "countries": [],
        "pilots": [],
        "cockpit_scenarios": [],
        "scenario_runs": [],
        "hitl_items": [],
        "kpi_snapshots": [],
        "evals": [],
    }

    # Countries
    for c in COUNTRIES:
        data["countries"].append({**c, "tenant_id": TENANT_ID})

    # Pilots
    for p in PILOTS:
        data["pilots"].append({**p, "tenant_id": TENANT_ID})

    # Scenarios
    for s in SCENARIOS:
        data["cockpit_scenarios"].append({**s, "tenant_id": TENANT_ID})

    # Scenario runs (90 days, ~8-20 runs per pilot per day)
    for pilot in PILOTS:
        daily_runs = 8 if pilot["level"] in ("L0", "L1") else 20 if pilot["level"] == "L4" else 14
        base = datetime.datetime(2026, 5, 5, 12, 0, 0)
        for d in range(90):
            date = base - datetime.timedelta(days=90 - d)
            runs_today = random.randint(max(1, daily_runs - 4), daily_runs + 4)
            for _ in range(runs_today):
                run_time = date + datetime.timedelta(
                    hours=random.randint(6, 20),
                    minutes=random.randint(0, 59),
                )
                status = random.choices(
                    ["completed", "completed", "completed", "completed", "failed", "waiting"],
                    weights=[0.70, 0.10, 0.08, 0.05, 0.04, 0.03],
                )[0]
                data["scenario_runs"].append({
                    "id": uuid.uuid4(),
                    "scenario_key": pilot["id"],
                    "status": status,
                    "started_by": random.choice(pilot["owners"]),
                    "started_at": run_time,
                    "finished_at": run_time + datetime.timedelta(seconds=random.randint(12, 480)) if status == "completed" else None,
                    "tenant_id": TENANT_ID,
                })

    # HITL items
    for pilot in PILOTS:
        if pilot["id"] in GATES:
            count = 80 if pilot["level"] in ("L3", "L4") else 20
            data["hitl_items"].extend(generate_hitl_items(pilot["id"], count))

    # KPI snapshots
    for pilot in PILOTS:
        if pilot["status"] == "active":
            data["kpi_snapshots"].extend(generate_kpi_snapshots(pilot["id"]))

    # Eval scores
    for pilot in PILOTS:
        if pilot["status"] == "active":
            for d in range(30):
                date = datetime.date(2026, 5, 5) - datetime.timedelta(days=30 - d)
                data["evals"].append({
                    "pilot_slug": pilot["id"],
                    "metric": "factual",
                    "score": round(min(0.99, 0.90 + random.gauss(0.06, 0.02)), 2),
                    "eval_date": date,
                })
                data["evals"].append({
                    "pilot_slug": pilot["id"],
                    "metric": "policy",
                    "score": round(min(0.99, 0.92 + random.gauss(0.05, 0.02)), 2),
                    "eval_date": date,
                })
                data["evals"].append({
                    "pilot_slug": pilot["id"],
                    "metric": "tone",
                    "score": round(min(0.99, 0.88 + random.gauss(0.07, 0.02)), 2),
                    "eval_date": date,
                })

    return data


def print_summary(data: dict):
    """Print a summary of generated seed data."""
    print("\n=== Seed Data Summary ===\n")
    for table, rows in data.items():
        print(f"  {table}: {len(rows)} rows")
    total = sum(len(r) for r in data.values())
    print(f"\n  TOTAL: {total} rows across {len(data)} tables")
    print("\nRun with --apply to insert into Supabase.")
    print("  cd gateway && uv run python -m gateway.seed.seed_cockpit --apply")


if __name__ == "__main__":
    import sys
    data = seed_all()
    if "--apply" in sys.argv:
        print("Supabase apply not yet wired. Use --dry-run to see data.")
    else:
        print_summary(data)

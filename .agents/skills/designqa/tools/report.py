#!/usr/bin/env python3
"""
designqa report assembler — combines shots, axe.json, diff.json, and agent critique
into a structured report.md + report.json.

Usage:
    python3 report.py \
        --shots-dir  /tmp/designqa-2026-05-04 \
        --axe-json   /tmp/designqa-2026-05-04/axe.json \
        --diff-json  /tmp/designqa-2026-05-04/diff.json \
        --critique   /tmp/designqa-2026-05-04/critique.md \
        --surface    canvas \
        --sprint-doc docs/sprints/sprint-8-scenario-builder-synthdata-factory.md \
        --out-dir    docs/designqa-reports

Outputs:
    docs/designqa-reports/<DATE>--<surface>/report.md
    docs/designqa-reports/<DATE>--<surface>/report.json
"""
import sys, json, argparse, pathlib, datetime, re


def load_json(path: str | None) -> dict | None:
    if not path or not pathlib.Path(path).exists():
        return None
    try:
        return json.loads(pathlib.Path(path).read_text())
    except Exception:
        return None


def load_text(path: str | None) -> str:
    if not path or not pathlib.Path(path).exists():
        return ""
    return pathlib.Path(path).read_text()


def severity_emoji(impact: str) -> str:
    return {"critical": "🔴", "serious": "🟠", "moderate": "🟡", "minor": "⚪"}.get(impact, "❓")


def compute_verdict(axe: dict | None, diff: dict | None, critique_text: str) -> str:
    """Derive overall verdict from axe + diff data + any BLOCK/FAIL in critique text."""
    # Any serious/critical a11y violations → FAIL
    if axe and axe.get("serious_critical", 0) > 0:
        return "FAIL"
    # Any visual diffs that exceeded threshold → PASS-WITH-NOTES minimum
    has_diffs = diff and bool(diff.get("exceeded_threshold"))
    # Look for explicit FAIL/BLOCK in critique
    critique_upper = critique_text.upper()
    if "VERDICT: FAIL" in critique_upper or "VERDICT: BLOCK" in critique_upper:
        return "FAIL"
    if "VERDICT: REVISE" in critique_upper or has_diffs:
        return "PASS-WITH-NOTES"
    if "VERDICT: PASS" in critique_upper:
        return "PASS"
    # Default — we cannot pass without explicit agent critique
    return "PENDING-CRITIQUE"


def build_report(args) -> tuple[str, dict]:
    now = datetime.datetime.now(datetime.timezone.utc)
    date_str = now.strftime("%Y-%m-%d")
    ts = now.isoformat().replace("+00:00", "Z")

    axe = load_json(args.axe_json)
    diff = load_json(args.diff_json)
    critique = load_text(args.critique)
    sprint_doc = load_text(args.sprint_doc)

    # Shots
    shots_dir = pathlib.Path(args.shots_dir) if args.shots_dir else None
    shots: list[str] = []
    if shots_dir and shots_dir.exists():
        shots = sorted(str(p) for p in shots_dir.glob("*.png"))

    verdict = compute_verdict(axe, diff, critique)

    # ── Markdown report ──────────────────────────────────────────────────────
    lines = [
        f"# DesignQA Report — {args.surface}",
        f"> Generated: {ts}  |  Surface: `{args.surface}`  |  Verdict: **{verdict}**",
        "",
        "---",
        "",
        "## 1. Summary",
        "",
        f"| Field | Value |",
        f"|---|---|",
        f"| Surface | `{args.surface}` |",
        f"| Verdict | **{verdict}** |",
        f"| Timestamp | {ts} |",
        f"| A11y: serious/critical | {axe['serious_critical'] if axe else 'n/a'} |",
        f"| A11y: advisory | {axe['advisory'] if axe else 'n/a'} |",
        f"| Visual diffs exceeded threshold | {len(diff['exceeded_threshold']) if diff else 'n/a'} |",
        f"| Screenshots | {len(shots)} |",
        "",
        "---",
        "",
        "## 2. Screenshots",
        "",
    ]

    if shots:
        for s in shots:
            name = pathlib.Path(s).name
            lines.append(f"- `{name}`  →  `{s}`")
    else:
        lines.append("_No screenshots found in shots-dir._")
    lines.append("")

    # A11y
    lines += [
        "---",
        "",
        "## 3. A11y Violations (axe-core)",
        "",
    ]
    if not axe:
        lines.append("_axe.json not provided — a11y audit skipped._")
    else:
        violations = axe.get("violations", [])
        if not violations:
            lines.append("✅ No violations found.")
        else:
            for v in sorted(violations, key=lambda x: x.get("impact", "minor")):
                impact = v.get("impact", "?")
                lines.append(f"### {severity_emoji(impact)} `{v['id']}` ({impact})")
                lines.append(f"> {v.get('description', '')}")
                nodes = v.get("nodes", [])[:3]  # top 3 examples
                if nodes:
                    lines.append("**Examples:**")
                    for n in nodes:
                        html = n.get("html", "")[:120]
                        lines.append(f"- `{html}`")
                lines.append("")
    lines.append("")

    # Visual diffs
    lines += [
        "---",
        "",
        "## 4. Visual Diffs",
        "",
    ]
    if not diff:
        lines.append("_diff.json not provided — visual regression skipped._")
    else:
        results = diff.get("results", [])
        exceeded = diff.get("exceeded_threshold", [])
        for r in results:
            if r.get("seeded"):
                lines.append(f"- `{r['file']}` — 🌱 seeded as new baseline")
            else:
                pct = r.get("changed_pct", 0)
                marker = "⚠️" if r["file"] in exceeded else "✓"
                lines.append(f"- `{r['file']}` — {marker} {pct:.2f}% changed")
                if r.get("diff_png"):
                    lines.append(f"  Diff image: `{r['diff_png']}`")
    lines.append("")

    # Agent critique
    lines += [
        "---",
        "",
        "## 5. Agent Critique",
        "",
    ]
    if critique:
        lines.append(critique)
    else:
        lines.append(
            "⚠️ **No agent critique provided.** "
            "Per designqa SKILL.md §4, the agent MUST view every screenshot and write a critique. "
            "This report CANNOT be signed off until a critique is appended."
        )
    lines.append("")

    # AC checklist from sprint doc
    lines += [
        "---",
        "",
        "## 6. Acceptance-Criteria Checklist",
        "",
    ]
    if sprint_doc:
        # Extract any markdown checkboxes from the sprint doc
        ac_items = re.findall(r"- \[ \] .+", sprint_doc)
        if ac_items:
            for item in ac_items[:20]:  # cap at 20
                lines.append(item)
        else:
            lines.append("_No checkbox ACs found in sprint doc._")
    else:
        lines.append("_Sprint doc not provided._")
    lines.append("")

    # Sign-off
    lines += [
        "---",
        "",
        "## 7. Sign-off",
        "",
        f"**Verdict: {verdict}**",
        "",
    ]
    if verdict == "PASS":
        lines.append("✅ All zones clean. A11y OK. Agent critique issued. Cleared to publish to Figma + Linear.")
    elif verdict == "PASS-WITH-NOTES":
        lines.append("🟡 Minor notes remain. Not blocking. Track in Linear. Proceed with Figma publish.")
    elif verdict == "FAIL":
        lines.append("🔴 FAIL — do not publish. Return to design skill with the concrete fix list above.")
    else:
        lines.append("⏳ PENDING — agent critique must be added before a verdict can be issued.")

    lines += [
        "",
        "---",
        "",
        f"_Report generated by `designqa/tools/report.py`. Surface: `{args.surface}`. Date: {date_str}._",
    ]

    md = "\n".join(lines)

    # JSON summary
    report_json = {
        "surface": args.surface,
        "verdict": verdict,
        "timestamp": ts,
        "axe_summary": {
            "serious_critical": axe["serious_critical"] if axe else None,
            "advisory": axe["advisory"] if axe else None,
        },
        "diff_exceeded": diff["exceeded_threshold"] if diff else None,
        "screenshots": shots,
        "critique_provided": bool(critique),
        "sprint_doc": args.sprint_doc,
    }

    return md, report_json


def main():
    parser = argparse.ArgumentParser(description="Assemble designqa report from tool outputs")
    parser.add_argument("--shots-dir", default=None)
    parser.add_argument("--axe-json", default=None)
    parser.add_argument("--diff-json", default=None)
    parser.add_argument("--critique", default=None, help="Path to critique.md file (agent-written)")
    parser.add_argument("--surface", required=True, help="Surface slug, e.g. 'canvas'")
    parser.add_argument("--sprint-doc", default=None)
    parser.add_argument("--out-dir", default="docs/designqa-reports")
    args = parser.parse_args()

    date_str = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d")
    out_dir = pathlib.Path(args.out_dir) / f"{date_str}--{args.surface}"
    out_dir.mkdir(parents=True, exist_ok=True)

    md, report_json = build_report(args)

    md_path = out_dir / "report.md"
    json_path = out_dir / "report.json"
    md_path.write_text(md)
    json_path.write_text(json.dumps(report_json, indent=2))

    print(f"report.md  → {md_path}")
    print(f"report.json → {json_path}")
    print(f"Verdict: {report_json['verdict']}")

    sys.exit(0 if report_json["verdict"] in ("PASS", "PASS-WITH-NOTES") else 1)


if __name__ == "__main__":
    main()

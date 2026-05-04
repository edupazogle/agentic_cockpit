#!/usr/bin/env python3
"""
regen-langflow-catalog.py

Queries the running Langflow instance at http://127.0.0.1:7860 and regenerates
  .agents/skills/langflow/components/SKILL.md

Usage:
    python3 scripts/regen-langflow-catalog.py

The script preserves the existing YAML frontmatter and Composio appendix.
It replaces everything between them with a freshly generated component catalog.

Run this whenever:
- A new custom component is added
- A built-in component is discovered with incorrect documentation
- Langflow is upgraded to a new version
"""

from __future__ import annotations

import sys
import textwrap
from pathlib import Path

import requests

# ── Configuration ────────────────────────────────────────────────────────────

LANGFLOW_BASE = "http://127.0.0.1:7860"
REPO_ROOT = Path(__file__).resolve().parent.parent
SKILL_FILE = REPO_ROOT / ".agents/skills/langflow/components/SKILL.md"

# Categories rendered first (display order in the skill)
PRIORITY_CATEGORIES = [
    "inputs", "outputs", "prompts",
    "models", "embeddings",
    "vectorstores", "memory",
    "agents", "chains",
    "tools", "toolkits",
    "retrievers", "documentloaders",
    "textsplitters", "helpers",
    "logic", "data",
    "prototypes", "custom_components",
    "axa", "hitl", "scorers", "testing",
]

# Categories that form the "Composio appendix" — kept separately
COMPOSIO_KEYS = {"composio"}


# ── Helpers ───────────────────────────────────────────────────────────────────

def get_token() -> str:
    resp = requests.get(f"{LANGFLOW_BASE}/api/v1/auto_login", timeout=10)
    resp.raise_for_status()
    return resp.json()["access_token"]


def get_all_components(token: str) -> dict[str, dict]:
    resp = requests.get(
        f"{LANGFLOW_BASE}/api/v1/all",
        headers={"Authorization": f"Bearer {token}"},
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()


def fmt_param_row(name: str, field: dict) -> str:
    required = "✓" if field.get("required") else ""
    ftype = field.get("type", "")
    default = str(field.get("value", "")) if field.get("value") not in (None, "", []) else ""
    default = default[:40]  # truncate long defaults
    # Escape pipe chars so they don't break the markdown table
    default = default.replace("|", "\\|")
    label = field.get("display_name") or name
    return f"| {label} | {required} | {ftype} | {default} |"


def render_component(name: str, comp: dict) -> str:
    lines = []
    display = comp.get("display_name") or name
    desc = comp.get("description") or ""
    # Outputs — collect output type list
    outputs = comp.get("outputs") or []
    out_types: list[str] = []
    for o in outputs:
        out_types.extend(o.get("types") or [])
    out_str = ", ".join(sorted(set(out_types))) or "—"

    lines.append(f"### {display} `[{name}]`")
    if desc:
        lines.append(textwrap.fill(desc, width=100))
    lines.append(f"**Output:** {out_str}")

    # Parameter table — skip internal fields
    template = comp.get("template") or {}
    skip = {"code", "_type"}
    visible = {k: v for k, v in template.items() if k not in skip and isinstance(v, dict)}

    if visible:
        lines.append("")
        lines.append("| Parameter | Req | Type | Default |")
        lines.append("|---|---|---|---|")
        for fname, field in visible.items():
            lines.append(fmt_param_row(fname, field))

    lines.append("")
    return "\n".join(lines)


def render_category(cat_key: str, comps: dict) -> str:
    heading = cat_key.replace("_", " ").title()
    lines = [f"## {heading}\n"]
    for name in sorted(comps.keys()):
        lines.append(render_component(name, comps[name]))
    return "\n".join(lines)


def read_existing_file(path: Path) -> tuple[str, str]:
    """Return (frontmatter_block, composio_appendix) from the existing skill file."""
    if not path.exists():
        return ("", "")
    content = path.read_text()
    # Frontmatter: everything up to and including the first `---` close + title line
    # We keep everything up to the first `## ` section heading
    fm_end = content.find("\n## ")
    frontmatter = content[:fm_end] if fm_end != -1 else ""

    # Composio appendix: everything from `## Composio` onward
    composio_start = content.find("\n## Composio")
    appendix = content[composio_start:] if composio_start != -1 else ""

    return frontmatter, appendix


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    print("Connecting to Langflow …")
    try:
        token = get_token()
    except requests.exceptions.ConnectionError:
        print(f"ERROR: Cannot reach {LANGFLOW_BASE}. Is Langflow running?", file=sys.stderr)
        sys.exit(1)

    print("Fetching component registry …")
    all_comps = get_all_components(token)

    # Separate Composio from main catalog
    composio_cats = {k: v for k, v in all_comps.items() if k.lower() in COMPOSIO_KEYS}
    main_cats = {k: v for k, v in all_comps.items() if k.lower() not in COMPOSIO_KEYS}

    # Build ordered category list
    ordered_keys: list[str] = []
    for k in PRIORITY_CATEGORIES:
        if k in main_cats:
            ordered_keys.append(k)
    for k in sorted(main_cats.keys()):
        if k not in ordered_keys:
            ordered_keys.append(k)

    # Stats
    total = sum(len(v) for v in main_cats.values())
    print(f"Found {total} components across {len(main_cats)} categories")
    for k in ordered_keys:
        print(f"  {k}: {len(main_cats[k])} components")

    # Read existing frontmatter + Composio appendix
    existing_fm, existing_appendix = read_existing_file(SKILL_FILE)

    # Build new body
    body_parts: list[str] = []

    # Quick index table
    body_parts.append("## Component Index\n")
    body_parts.append("| Category | Count |")
    body_parts.append("|---|---|")
    for k in ordered_keys:
        heading = k.replace("_", " ").title()
        body_parts.append(f"| {heading} | {len(main_cats[k])} |")
    body_parts.append("")

    # Full catalog
    for k in ordered_keys:
        body_parts.append(render_category(k, main_cats[k]))

    new_body = "\n".join(body_parts)

    # Composio appendix — regenerate if Composio data present, otherwise keep existing
    if composio_cats:
        composio_lines = ["\n## Composio\n"]
        composio_lines.append(
            "Composio provides 60+ pre-built connectors. "
            "Each connector is a separate Langflow component.\n"
        )
        for cat_key, comps in composio_cats.items():
            for name, comp in sorted(comps.items()):
                display = comp.get("display_name") or name
                composio_lines.append(f"- **{display}** `[{name}]`")
        appendix = "\n".join(composio_lines) + "\n"
    else:
        appendix = existing_appendix  # keep the hand-written one

    # Assemble final file
    if existing_fm:
        final = f"{existing_fm}\n\n{new_body}\n{appendix}"
    else:
        # No existing file — write a minimal header
        header = textwrap.dedent("""\
            ---
            name: langflow/components
            description: >
              Catalog of all Langflow components available in this instance.
              Auto-generated by scripts/regen-langflow-catalog.py.
              Do not edit by hand — re-run the script instead.
            ---

            # Langflow Component Catalog

            > Auto-generated. Run `python3 scripts/regen-langflow-catalog.py` to refresh.
            """)
        final = f"{header}\n{new_body}\n{appendix}"

    SKILL_FILE.parent.mkdir(parents=True, exist_ok=True)
    SKILL_FILE.write_text(final)
    print(f"\nWrote {SKILL_FILE}")
    print(f"File size: {SKILL_FILE.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()

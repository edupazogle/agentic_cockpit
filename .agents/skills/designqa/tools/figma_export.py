#!/usr/bin/env python3
"""
designqa Figma export — pushes named frames to the canonical Figma file.

Transport priority:
  1. Figma Dev Mode MCP server (http://127.0.0.1:3845/mcp) — if reachable
  2. Figma REST API — if FIGMA_TOKEN is set in env / .env.local
  3. Payload mode — writes docs/qa/<DATE>--figma-rebuild-payload.json for human runner

Usage:
    python3 figma_export.py \
        --page   "02 · Cockpit Screens" \
        --frames canvas idle hitl-pause complete \
        --shots-dir /tmp/designqa-2026-05-04

Environment:
    FIGMA_TOKEN      — personal access token (Bearer auth for REST)
    FIGMA_FILE_KEY   — key from the file URL (e.g. b4kOiuhQS8A4TniozYG8pH)

Both are read from .env.local in the repo root if not set in environment.
"""
import sys, os, json, pathlib, datetime, argparse, urllib.request


CANONICAL_FILE_URL = "https://www.figma.com/design/b4kOiuhQS8A4TniozYG8pH/AXA-Agentic-Cockpit-Design-Proposal"
MCP_ENDPOINT = "http://127.0.0.1:3845/mcp"
FIGMA_REST_BASE = "https://api.figma.com/v1"

# Page map — keep in sync with plan §6
CANONICAL_PAGES = [
    "01 · Cover",
    "02 · Cockpit Screens",
    "03 · Scenario Builder",
    "04 · Scenario Canvas",
    "05 · Components",
    "06 · Tokens",
    "07 · Animations",
]


def load_env() -> dict[str, str]:
    env: dict[str, str] = {}
    env_file = pathlib.Path(__file__).parents[4] / ".env.local"
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            line = line.strip()
            if "=" in line and not line.startswith("#"):
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip().strip('"').strip("'")
    env.update({k: v for k, v in os.environ.items() if k.startswith("FIGMA")})
    return env


def mcp_available() -> bool:
    try:
        req = urllib.request.Request(MCP_ENDPOINT, method="GET")
        urllib.request.urlopen(req, timeout=2)
        return True
    except Exception:
        return False


def rest_push_comment(token: str, file_key: str, frame_name: str, comment: str) -> dict:
    """Post a comment on the file as a lightweight 'frame updated' signal (REST doesn't allow creating frames directly)."""
    url = f"{FIGMA_REST_BASE}/files/{file_key}/comments"
    body = json.dumps({"message": f"[designqa-export] Frame updated: {frame_name}\n\n{comment}"}).encode()
    req = urllib.request.Request(url, data=body, headers={"X-Figma-Token": token, "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read())


def write_payload(page: str, frames: list[str], shots_dir: pathlib.Path | None, out_dir: pathlib.Path) -> pathlib.Path:
    date_str = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d")
    payload = {
        "_instructions": (
            "Figma REST API cannot create or replace frames. "
            "Open the Figma desktop app, enable Dev Mode MCP (Preferences → Enable Dev Mode MCP Server), "
            "then re-run this script. OR manually import screenshots as frames to the page listed below."
        ),
        "canonical_file": CANONICAL_FILE_URL,
        "target_page": page,
        "frames_to_update": frames,
        "screenshot_paths": [str(p) for p in (shots_dir.glob("*.png") if shots_dir and shots_dir.exists() else [])],
        "naming_convention": "Cockpit/<Component>/<Variant>",
        "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z"),
    }
    out_path = out_dir / f"{date_str}--figma-rebuild-payload.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(payload, indent=2))
    return out_path


def main():
    parser = argparse.ArgumentParser(description="Push designqa frames to Figma")
    parser.add_argument("--page", default="02 · Cockpit Screens", help="Figma page name")
    parser.add_argument("--frames", nargs="+", default=[], help="Frame names to update")
    parser.add_argument("--shots-dir", default=None, help="Directory of screenshot PNGs")
    parser.add_argument("--out-dir", default="docs/qa", help="Where to write payload JSON")
    args = parser.parse_args()

    shots_dir = pathlib.Path(args.shots_dir) if args.shots_dir else None
    out_dir = pathlib.Path(args.out_dir)
    env = load_env()

    figma_token = env.get("FIGMA_TOKEN")
    file_key = env.get("FIGMA_FILE_KEY", "b4kOiuhQS8A4TniozYG8pH")

    # Transport 1: MCP
    if mcp_available():
        print("Figma Dev Mode MCP reachable — using MCP transport.")
        print("TODO: MCP tool calls for frame push not yet implemented (MCP schema TBD after Figma Beta stabilises).")
        print("Falling back to payload mode.")

    # Transport 2: REST (limited — can only post comments, not replace frames)
    if figma_token:
        print(f"FIGMA_TOKEN found — posting update comment via REST to file {file_key}")
        for frame in args.frames:
            try:
                result = rest_push_comment(
                    figma_token, file_key, frame,
                    f"DesignQA export: page '{args.page}', frame '{frame}'"
                )
                print(f"  Commented on frame '{frame}': {result.get('id', 'ok')}")
            except Exception as e:
                print(f"  REST comment failed for '{frame}': {e}")

        manifest = {
            "file_key": file_key,
            "file_url": CANONICAL_FILE_URL,
            "page": args.page,
            "frames": args.frames,
            "note": "Frame replacement requires Figma desktop MCP. REST transport limited to comments.",
        }
        manifest_path = out_dir / "figma-manifest.json"
        manifest_path.parent.mkdir(parents=True, exist_ok=True)
        manifest_path.write_text(json.dumps(manifest, indent=2))
        print(f"Manifest → {manifest_path}")
        return

    # Transport 3: Payload mode
    print("No MCP or FIGMA_TOKEN available — writing payload for human runner.")
    payload_path = write_payload(args.page, args.frames, shots_dir, out_dir)
    print(f"Payload → {payload_path}")
    print("Action required: follow _instructions in the payload JSON to complete the Figma update manually.")


if __name__ == "__main__":
    main()

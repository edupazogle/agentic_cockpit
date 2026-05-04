#!/usr/bin/env python3
"""
designqa a11y helper — runs axe-core against a URL and writes violations JSON.

Usage:
    python3 axe.py <url> <out_json> [--include <css_selector>] [--exclude <css_selector>]

Exit codes:
    0  — no serious/critical violations
    1  — serious or critical violations found (advisory violations still written)
    2  — tool/browser error
"""
import sys, json, argparse, pathlib

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print("playwright python missing — run: pip install --user playwright && playwright install chromium")
    sys.exit(2)

# axe-core CDN (pinned version for reproducibility)
AXE_CDN = "https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.9.0/axe.min.js"

# Fallback: inline minimal axe-core if CDN unreachable — we vendor just enough to enumerate violations
AXE_FALLBACK_URL = None  # set to local file:// path if needed


def run_axe(url: str, out_json: str, include_sel: str | None = None, exclude_sel: str | None = None) -> int:
    out = pathlib.Path(out_json)
    out.parent.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context(viewport={"width": 1440, "height": 900})
        page = ctx.new_page()

        try:
            page.goto(url, wait_until="networkidle", timeout=20000)
        except Exception:
            page.goto(url, wait_until="load", timeout=15000)
        page.wait_for_timeout(800)

        # Inject axe-core from CDN
        try:
            page.add_script_tag(url=AXE_CDN)
            page.wait_for_function("typeof window.axe !== 'undefined'", timeout=10000)
        except Exception as e:
            print(f"WARNING: CDN unavailable ({e}), trying local axe-core bundle")
            # Try to find a local copy
            local_paths = [
                pathlib.Path(__file__).parent / "axe.min.js",
                pathlib.Path.home() / ".local/share/axe-core/axe.min.js",
            ]
            for lp in local_paths:
                if lp.exists():
                    page.add_script_tag(path=str(lp))
                    page.wait_for_function("typeof window.axe !== 'undefined'", timeout=5000)
                    break
            else:
                print("ERROR: axe-core not available (CDN and local). Install: npm install axe-core && cp node_modules/axe-core/axe.min.js .agents/skills/designqa/tools/")
                browser.close()
                sys.exit(2)

        # Build axe config
        axe_context: dict = {}
        if include_sel:
            axe_context["include"] = [[include_sel]]
        if exclude_sel:
            axe_context["exclude"] = [[exclude_sel]]

        axe_options: dict = {
            "runOnly": {
                "type": "tag",
                "values": ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"],
            }
        }

        axe_js = f"""
        () => new Promise(resolve => {{
            axe.run(
                {json.dumps(axe_context) if axe_context else 'document'},
                {json.dumps(axe_options)},
                (err, results) => {{
                    if (err) resolve({{ error: String(err) }});
                    else resolve(results);
                }}
            );
        }})
        """
        results = page.evaluate(axe_js)
        browser.close()

    if "error" in results:
        print(f"axe error: {results['error']}")
        sys.exit(2)

    violations = results.get("violations", [])

    # Classify
    serious_critical = [v for v in violations if v.get("impact") in ("serious", "critical")]
    advisory = [v for v in violations if v.get("impact") in ("moderate", "minor")]

    summary = {
        "url": url,
        "timestamp": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat().replace("+00:00", "Z"),
        "total_violations": len(violations),
        "serious_critical": len(serious_critical),
        "advisory": len(advisory),
        "violations": violations,
    }

    out.write_text(json.dumps(summary, indent=2))
    print(f"axe: {len(serious_critical)} serious/critical, {len(advisory)} advisory → {out}")

    if serious_critical:
        for v in serious_critical:
            print(f"  [{v['impact'].upper()}] {v['id']}: {v['description']}")
        return 1
    return 0


def main():
    parser = argparse.ArgumentParser(description="Run axe-core a11y audit on a URL")
    parser.add_argument("url")
    parser.add_argument("out_json")
    parser.add_argument("--include", dest="include_sel", default=None)
    parser.add_argument("--exclude", dest="exclude_sel", default=None)
    args = parser.parse_args()
    sys.exit(run_axe(args.url, args.out_json, args.include_sel, args.exclude_sel))


if __name__ == "__main__":
    main()

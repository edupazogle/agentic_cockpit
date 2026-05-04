#!/usr/bin/env python3
"""
designqa screenshot helper — supports both single-shot and scripted-flow modes.

Modes:
  Single-shot:
    python3 shoot.py <url> <out.png> [w=1440] [h=900] [wait_ms=800]

  Scripted flow (drives clicks/waits, captures multiple frames):
    python3 shoot.py --flow <url> <out_dir> <flow.json> [w=1440] [h=900]

Flow JSON schema (list of steps):
  [
    {"action": "wait",       "ms": 800},
    {"action": "shot",       "name": "idle"},
    {"action": "click",      "selector": "#rh-play"},
    {"action": "shot_at",    "name": "tick-01", "delay_ms": 1000},
    {"action": "wait_for",   "selector": ".node-c.wait", "timeout": 8000},
    {"action": "shot",       "name": "hitl-pause"},
    {"action": "click",      "selector": "[data-act=approve]"},
    {"action": "shot_at",    "name": "approve-after", "delay_ms": 250},
    {"action": "scroll",     "selector": ".activity-content", "y": 400},
    {"action": "hover",      "selector": "#cn-atlas"}
  ]

Outputs PNGs as <out_dir>/<surface-slug>--<name>.png so they can be opened
by the Copilot CLI `view` tool one by one. Prints "OK <path>" per shot
so the caller can parse the list.
"""
import sys, json, pathlib

try:
    from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout
except ImportError:
    print("playwright python missing — pip install --user playwright && playwright install chromium")
    sys.exit(2)


def single_shot(url, out, w, h, wait_ms):
    out = pathlib.Path(out)
    out.parent.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        b = p.chromium.launch()
        ctx = b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=1)
        pg = ctx.new_page()
        try:
            pg.goto(url, wait_until='networkidle', timeout=20000)
        except Exception:
            pg.goto(url, wait_until='load', timeout=15000)
        pg.wait_for_timeout(wait_ms)
        pg.screenshot(path=str(out), full_page=False)
        b.close()
    print(f"OK {out} ({w}x{h})")


def flow(url, out_dir, flow_path, w, h):
    out_dir = pathlib.Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    steps = json.loads(pathlib.Path(flow_path).read_text())
    slug = pathlib.Path(url.split('?')[0]).stem or "page"
    with sync_playwright() as p:
        b = p.chromium.launch()
        ctx = b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=1)
        pg = ctx.new_page()
        try:
            pg.goto(url, wait_until='networkidle', timeout=20000)
        except Exception:
            pg.goto(url, wait_until='load', timeout=15000)
        pg.wait_for_timeout(400)
        for step in steps:
            act = step.get('action')
            try:
                if act == 'wait':
                    pg.wait_for_timeout(int(step['ms']))
                elif act == 'wait_for':
                    pg.wait_for_selector(step['selector'], timeout=int(step.get('timeout', 5000)))
                elif act == 'click':
                    pg.click(step['selector'], timeout=int(step.get('timeout', 4000)))
                elif act == 'hover':
                    pg.hover(step['selector'], timeout=int(step.get('timeout', 4000)))
                elif act == 'scroll':
                    pg.evaluate(
                        "([sel, y]) => { const el = document.querySelector(sel); if (el) el.scrollTop = y; }",
                        [step['selector'], int(step.get('y', 0))],
                    )
                elif act == 'eval':
                    pg.evaluate(step['js'])
                elif act == 'shot':
                    name = step['name']
                    out = out_dir / f"{slug}--{name}.png"
                    pg.screenshot(path=str(out), full_page=False)
                    print(f"OK {out}")
                elif act == 'shot_at':
                    pg.wait_for_timeout(int(step.get('delay_ms', 0)))
                    name = step['name']
                    out = out_dir / f"{slug}--{name}.png"
                    pg.screenshot(path=str(out), full_page=False)
                    print(f"OK {out}")
                else:
                    print(f"WARN unknown action: {act}")
            except PWTimeout as e:
                print(f"WARN timeout on {act} {step}: {e}")
            except Exception as e:
                print(f"WARN error on {act} {step}: {e}")
        b.close()


def main():
    args = sys.argv[1:]
    if not args:
        print(__doc__); sys.exit(1)
    if args[0] == '--flow':
        if len(args) < 4:
            print(__doc__); sys.exit(1)
        url = args[1]
        out_dir = args[2]
        flow_path = args[3]
        w = int(args[4]) if len(args) > 4 else 1440
        h = int(args[5]) if len(args) > 5 else 900
        flow(url, out_dir, flow_path, w, h)
    else:
        if len(args) < 2:
            print(__doc__); sys.exit(1)
        url = args[0]
        out = args[1]
        w = int(args[2]) if len(args) > 2 else 1440
        h = int(args[3]) if len(args) > 3 else 900
        wait_ms = int(args[4]) if len(args) > 4 else 800
        single_shot(url, out, w, h, wait_ms)


if __name__ == '__main__':
    main()

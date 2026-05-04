#!/usr/bin/env python3
"""
designqa visual regression helper — compares screenshot sets vs baselines.

Usage:
    python3 diff.py <baseline_dir> <current_dir> <out_json> [--threshold 0.1]

- Compares every PNG in <current_dir> against the matching file in <baseline_dir>.
- If no baseline exists for a file, the file is treated as "new" (no diff produced,
  marked `seeded: true`).
- Writes diff PNGs to <current_dir>/diffs/<filename>--diff.png.
- Writes <out_json> with per-file pixel-change percentages.
- Exits 0 if all diffs are below threshold, 1 if any exceed it.

Threshold: default 0.1% changed pixels triggers a warning (not a block alone —
the agent critique is the final arbiter).
"""
import sys, json, argparse, pathlib

try:
    from PIL import Image, ImageChops, ImageEnhance
    import numpy as np
except ImportError:
    print("Pillow / numpy missing — run: pip install --user Pillow numpy")
    sys.exit(2)


DEFAULT_THRESHOLD = 0.1  # percent


def compare_images(baseline_path: pathlib.Path, current_path: pathlib.Path, diff_out: pathlib.Path) -> dict:
    """Return per-file comparison result dict."""
    try:
        base = Image.open(baseline_path).convert("RGB")
        curr = Image.open(current_path).convert("RGB")
    except Exception as e:
        return {"error": str(e), "file": current_path.name}

    # Resize current to match baseline if needed (different viewport runs)
    if base.size != curr.size:
        curr = curr.resize(base.size, Image.LANCZOS)

    base_arr = np.array(base, dtype=np.int16)
    curr_arr = np.array(curr, dtype=np.int16)

    delta = np.abs(base_arr - curr_arr)
    # Pixels where ANY channel differs by more than 8 (noise floor)
    changed_mask = np.any(delta > 8, axis=2)
    total_px = changed_mask.size
    changed_px = int(changed_mask.sum())
    pct = round(changed_px / total_px * 100, 4)

    # Build diff image: highlight changed pixels in azur (#00008f)
    diff_arr = np.array(base).copy()
    diff_arr[changed_mask] = [0, 0, 143]  # azur
    diff_img = Image.fromarray(diff_arr.astype(np.uint8))
    diff_out.parent.mkdir(parents=True, exist_ok=True)
    diff_img.save(str(diff_out))

    return {
        "file": current_path.name,
        "baseline": str(baseline_path),
        "current": str(current_path),
        "diff_png": str(diff_out),
        "total_pixels": total_px,
        "changed_pixels": changed_px,
        "changed_pct": pct,
    }


def main():
    parser = argparse.ArgumentParser(description="Visual regression diff between baseline and current screenshots")
    parser.add_argument("baseline_dir")
    parser.add_argument("current_dir")
    parser.add_argument("out_json")
    parser.add_argument("--threshold", type=float, default=DEFAULT_THRESHOLD,
                        help=f"Warn threshold in percent changed pixels (default {DEFAULT_THRESHOLD})")
    args = parser.parse_args()

    baseline_dir = pathlib.Path(args.baseline_dir)
    current_dir = pathlib.Path(args.current_dir)
    out_json = pathlib.Path(args.out_json)
    out_json.parent.mkdir(parents=True, exist_ok=True)

    diffs_dir = current_dir / "diffs"

    current_pngs = sorted(current_dir.glob("*.png"))
    if not current_pngs:
        print(f"No PNGs found in {current_dir}")
        sys.exit(2)

    results = []
    exceeded = []
    seeded = []

    for curr_path in current_pngs:
        base_path = baseline_dir / curr_path.name
        if not base_path.exists():
            # Seed — copy current as new baseline
            baseline_dir.mkdir(parents=True, exist_ok=True)
            import shutil
            shutil.copy2(curr_path, base_path)
            print(f"SEED {curr_path.name} → baselines/")
            results.append({
                "file": curr_path.name,
                "seeded": True,
                "changed_pct": 0.0,
            })
            seeded.append(curr_path.name)
            continue

        diff_out = diffs_dir / curr_path.with_suffix("").name + "--diff.png"
        result = compare_images(base_path, curr_path, diff_out)
        results.append(result)

        pct = result.get("changed_pct", 0)
        marker = "✓" if pct < args.threshold else "⚠"
        print(f"  {marker} {curr_path.name}: {pct:.2f}% changed")
        if pct >= args.threshold and "seeded" not in result:
            exceeded.append(curr_path.name)

    summary = {
        "baseline_dir": str(baseline_dir),
        "current_dir": str(current_dir),
        "threshold_pct": args.threshold,
        "seeded": seeded,
        "exceeded_threshold": exceeded,
        "results": results,
    }
    out_json.write_text(json.dumps(summary, indent=2))
    print(f"\ndiff: {len(exceeded)} file(s) exceeded {args.threshold}% threshold → {out_json}")

    sys.exit(1 if exceeded else 0)


if __name__ == "__main__":
    main()

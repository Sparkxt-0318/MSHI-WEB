#!/usr/bin/env python3
"""Build the /biosensor gallery data from the real MSHI sample corpus.

Source of truth: Sparkxt-0318/MSHI @ main, biosensor_samples/
  (raw provenance: https://raw.githubusercontent.com/Sparkxt-0318/MSHI/main/biosensor_samples/<id>/...)

This script reads the locally-checked-out MSHI repo (which tracks main),
parses each CHI660E potentiostat export, and emits:

  public/data/biosensor_samples.json     parsed + downsampled traces
  public/data/biosensor_raw/<id>/*.txt   verbatim copies for download

It NEVER fabricates a sample or a trace. A sample is only emitted if it
passes the same hard gate as Phase 0: a parseable metadata.json with the
required fields, plus non-empty ca.txt AND cv.txt (and ocp.txt for
Phase II). Samples that fail are skipped and reported, not invented.

No DPV is parsed, generated, or referenced — the corpus contains none.
"""

from __future__ import annotations

import json
import math
import os
import re
import shutil
import sys

# MSHI sister repo, checked out alongside MSHI-WEB. This is the main-branch
# data verified in Phase 0 (commit 2090e2e, == origin/main tip).
SRC_DEFAULT = os.path.join(os.path.dirname(__file__), "..", "..", "MSHI", "biosensor_samples")
RAW_BASE = "https://raw.githubusercontent.com/Sparkxt-0318/MSHI/main/biosensor_samples"

REQUIRED_META = ("id", "name", "mshi_score", "classification", "phase", "trial_id")
TECHNIQUES = ("ca", "cv", "ocp")  # NO dpv: not in the corpus, never invented
MAX_POINTS = 1500

# A column-header line is two slash-bearing tokens, e.g. "Time/sec, Current/A".
COLHDR_RE = re.compile(r"^\s*([A-Za-z][\w ]*?/[A-Za-z]+)\s*,\s*([A-Za-z][\w ]*?/[A-Za-z]+)\s*$")
UNIT_NORMALISE = {"sec": "s", "s": "s", "A": "A", "V": "V", "mA": "mA", "uA": "uA"}


def axis_label(token: str) -> str:
    """'Time/sec' -> 'Time (s)'. Derived from the file header, not assumed."""
    quantity, _, unit = token.strip().partition("/")
    unit = UNIT_NORMALISE.get(unit.strip(), unit.strip())
    return f"{quantity.strip()} ({unit})"


def parse_trace(path: str) -> dict | None:
    """Strip the CHI660E header, read the two-column data, label axes from
    the column header. Returns None if no real two-column data is found."""
    xs: list[float] = []
    ys: list[float] = []
    xlabel = ylabel = None
    in_data = False
    with open(path, "r", errors="replace") as fh:
        for line in fh:
            s = line.strip()
            if not in_data:
                m = COLHDR_RE.match(s)
                if m:
                    xlabel = axis_label(m.group(1))
                    ylabel = axis_label(m.group(2))
                    in_data = True
                continue
            if not s:
                continue
            parts = s.split(",")
            if len(parts) != 2:
                continue
            try:
                x = float(parts[0])
                y = float(parts[1])
            except ValueError:
                continue
            xs.append(x)
            ys.append(y)
    if not in_data or len(xs) < 2 or len(xs) != len(ys):
        return None
    n_raw = len(xs)
    if n_raw > MAX_POINTS:
        stride = math.ceil(n_raw / MAX_POINTS)
        xs = xs[::stride]
        ys = ys[::stride]
    return {
        "x": [round(v, 4) for v in xs],
        "y": [float(f"{v:.6g}") for v in ys],
        "xlabel": xlabel,
        "ylabel": ylabel,
        "n_raw": n_raw,
        "n_plotted": len(xs),
    }


def main() -> int:
    src = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else SRC_DEFAULT)
    web_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    out_json = os.path.join(web_root, "public", "data", "biosensor_samples.json")
    raw_root = os.path.join(web_root, "public", "data", "biosensor_raw")

    if not os.path.isdir(src):
        print(f"FATAL: source dir not found: {src}", file=sys.stderr)
        return 2

    folders = sorted(
        d for d in os.listdir(src)
        if os.path.isdir(os.path.join(src, d))
    )
    samples = []
    skipped = []

    for fid in folders:
        fdir = os.path.join(src, fid)
        mpath = os.path.join(fdir, "metadata.json")
        if not os.path.exists(mpath):
            skipped.append((fid, "no metadata.json"))
            continue
        try:
            meta = json.load(open(mpath))
        except Exception as exc:  # noqa: BLE001
            skipped.append((fid, f"metadata parse error: {exc}"))
            continue
        missing = [k for k in REQUIRED_META if k not in meta]
        if missing:
            skipped.append((fid, f"missing metadata fields: {missing}"))
            continue
        if not isinstance(meta["mshi_score"], (int, float)):
            skipped.append((fid, "mshi_score not numeric"))
            continue

        is_phase2 = "II" in str(meta["phase"])
        traces: dict[str, dict] = {}
        raw_files: dict[str, str] = {}
        for tech in TECHNIQUES:
            tpath = os.path.join(fdir, f"{tech}.txt")
            if not os.path.exists(tpath) or os.path.getsize(tpath) <= 1024:
                continue
            parsed = parse_trace(tpath)
            if parsed is None:
                continue
            traces[tech] = parsed
            raw_files[tech] = f"/data/biosensor_raw/{fid}/{tech}.txt"

        # Hard gate (mirrors Phase 0): require real ca + cv; Phase II also ocp.
        if "ca" not in traces or "cv" not in traces:
            skipped.append((fid, "missing required ca/cv trace data"))
            continue
        if is_phase2 and "ocp" not in traces:
            skipped.append((fid, "Phase II but missing ocp trace data"))
            continue

        # Copy raw files verbatim so they stay downloadable offline.
        dst_dir = os.path.join(raw_root, fid)
        os.makedirs(dst_dir, exist_ok=True)
        for tech in traces:
            shutil.copyfile(
                os.path.join(fdir, f"{tech}.txt"),
                os.path.join(dst_dir, f"{tech}.txt"),
            )

        samples.append({
            "id": meta["id"],
            "name": meta["name"],
            "mshi_score": meta["mshi_score"],
            "classification": meta["classification"],
            "phase": meta["phase"],
            "trial_id": meta["trial_id"],
            "techniques": list(traces.keys()),
            "traces": traces,
            "raw_files": raw_files,
        })

    samples.sort(key=lambda s: (s["classification"], s["phase"], s["trial_id"]))

    payload = {
        "generated_from": "Sparkxt-0318/MSHI@main:biosensor_samples/",
        "raw_provenance": RAW_BASE,
        "note": (
            "Validated electrochemistry from the published MSHI dataset. "
            "Variable techniques per sample by study design (Phase I: CA+CV; "
            "Phase II: CA+CV+OCP). No DPV traces exist in this corpus."
        ),
        "sample_count": len(samples),
        "samples": samples,
    }

    os.makedirs(os.path.dirname(out_json), exist_ok=True)
    with open(out_json, "w") as fh:
        json.dump(payload, fh, separators=(",", ":"))

    print(f"Wrote {out_json}")
    print(f"Samples emitted: {len(samples)}")
    for s in samples:
        techs = ", ".join(
            f"{t}({s['traces'][t]['n_plotted']}/{s['traces'][t]['n_raw']})"
            for t in s["techniques"]
        )
        print(f"  {s['id']:22s} {s['phase']:9s} {s['classification']:9s} "
              f"score={s['mshi_score']}  traces=[{techs}]")
    if skipped:
        print("Skipped (NOT fabricated, excluded by gate):")
        for fid, why in skipped:
            print(f"  {fid}: {why}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

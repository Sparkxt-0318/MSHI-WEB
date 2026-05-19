#!/usr/bin/env python3
"""Emit the DPV reference figure for /biosensor.

PROVENANCE — read this before trusting the curve.

The published MSHI corpus (Sparkxt-0318/MSHI@main:biosensor_samples/)
contains NO dpv.txt for any sample. This file is therefore NOT produced
by the corpus parser (build_biosensor_data.py) and is NOT attributed to
any gallery sample.

These control points were hand-digitized from the author's own CHI660E
DPV export screenshot (Trial 1 of the published differential-pulse
voltammetry series — Current vs. Potential), provided directly by the
researcher and credited to the paper. It is shown ONCE on the page as a
sourced reference for what the technique looks like and where the OmcZ
cytochrome redox feature sits (~ -0.13 V), not as a per-sample
measurement. Axis units match the source: Potential in V, Current in A
(screenshot y-axis is "Current / 1e-5 A").

Regenerate: python3 scripts/build_dpv_reference.py
"""

from __future__ import annotations

import json
import os

# (Potential / V, Current / 1e-5 A) digitized from the Trial 1 panel of
# the author-supplied DPV screenshot. ~0.025 V steps; the gentle shoulder
# near -0.13 V is the OmcZ cytochrome redox feature discussed in the paper.
POINTS_V_AND_1E5A = [
    (-0.700, 3.00), (-0.675, 2.88), (-0.650, 2.76), (-0.625, 2.64),
    (-0.600, 2.53), (-0.575, 2.42), (-0.550, 2.32), (-0.525, 2.23),
    (-0.500, 2.14), (-0.475, 2.06), (-0.450, 1.99), (-0.425, 1.93),
    (-0.400, 1.88), (-0.375, 1.83), (-0.350, 1.79), (-0.325, 1.76),
    (-0.300, 1.74), (-0.275, 1.72), (-0.250, 1.71), (-0.225, 1.71),
    (-0.200, 1.71), (-0.175, 1.72), (-0.150, 1.73), (-0.130, 1.735),
    (-0.110, 1.73), (-0.090, 1.71), (-0.070, 1.69), (-0.050, 1.67),
    (-0.025, 1.65), (0.000, 1.64), (0.025, 1.63), (0.050, 1.62),
    (0.075, 1.62), (0.100, 1.61),
]


def main() -> int:
    web_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    out = os.path.join(web_root, "public", "data", "biosensor_dpv_reference.json")
    xs = [round(p, 4) for p, _ in POINTS_V_AND_1E5A]
    ys = [float(f"{i * 1e-5:.6g}") for _, i in POINTS_V_AND_1E5A]
    payload = {
        "kind": "reference",
        "digitized": True,
        "source": (
            "Hand-digitized from the author's CHI660E DPV export "
            "(Trial 1), as published in the paper. Representative measured "
            "trace — not tied to any gallery sample; no per-sample dpv.txt "
            "exists in the corpus."
        ),
        "technique": "Differential Pulse Voltammetry",
        "omcz_peak_v": -0.13,
        "x": xs,
        "y": ys,
        "xlabel": "Potential (V)",
        "ylabel": "Current (A)",
        "n_points": len(xs),
    }
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, "w") as fh:
        json.dump(payload, fh, separators=(",", ":"))
    print(f"Wrote {out} ({len(xs)} digitized points)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

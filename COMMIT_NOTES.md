# COMMIT_NOTES — biosensor gallery from real data

Branch: `claude/biosensor-gallery-CxQED` (both repos). Not merged.

## What shipped

**Phase 0 — verify real data (PASS).** Pulled `biosensor_samples/` from
`Sparkxt-0318/MSHI@main` (commit `2090e2e`, == origin/main tip; also
spot-checked via `raw.githubusercontent.com`). 6 sample folders; each
`metadata.json` parses with all required fields. 5 pass the hard gate;
1 (`saline_p2_trial1`) fails it (no `cv.txt`/`ocp.txt`). 5 ≥ 3 → no
global halt. No data fabricated.

**Phase 1 — parse traces (GATE 1 PASS).**
`scripts/build_biosensor_data.py` strips each CHI660E header, reads the
two-column data, derives axis labels *from the file's column header*
(not assumed), downsamples >1500-point traces to ≤1500 by even stride
(shape preserved), and writes `public/data/biosensor_samples.json` +
verbatim raw copies under `public/data/biosensor_raw/<id>/`. Verified:
one entry per real sample, every trace has equal-length non-empty x/y,
`mshi_score`/`classification` match source exactly, no `dpv` key, no
fabricated traces.

**Phase 2 — gallery page (typecheck + build clean; GATE 2 PASS).**
Rewrote `/biosensor` to render only from the JSON: header + three-tier
framing linking the paper, one-sentence CA/CV/OCP explainer, the
**required one-sentence DPV explanation linking the word "paper" to
/paper**, cards grouped by classification, and a detail dialog with one
Recharts chart per technique the sample actually has (no empty slots),
MSHI score + plain interpretation, metadata, and raw-file downloads.
Deleted `sample-fixtures.ts`; removed `is_placeholder` from the schema
and every branch reading it; removed all PLACEHOLDER badges; refit the
home teaser to a real featured run. Verified headless (Playwright):
5 cards, Phase II → 3 charts, Phase I → 2 charts, all varied real data,
zero "placeholder" in output.

**Phase 3 — reproducible notebook: HALTED (see BLOCKERS.md).** The
biosensor MSHI model (XGBoost + 1D-CNN + scalers) is not public — the
only public models are the unrelated geo/atlas XGBoost models. Per the
brief's Phase 3 HALT rule, no notebook was fabricated; Phases 1–2
shipped. The page links the paper + code repo instead of a fake Colab.

## Samples in the gallery (5)

| id | class | phase | MSHI | techniques | raw points → plotted |
|---|---|---|---|---|---|
| healthy_p1_trial4   | healthy   | Phase I  | 0.669 | CA, CV       | CA 133254→1498, CV 9600→1372 |
| healthy_p1_trial5   | healthy   | Phase I  | 0.633 | CA, CV       | CA 211207→1498, CV 9600→1372 |
| healthy_p2_trial7   | healthy   | Phase II | 0.903 | CA, CV, OCP  | CA 178410→1500, CV 1168→1168, OCP 120→120 |
| unhealthy_p1_trial7 | unhealthy | Phase I  | 0.370 | CA, CV       | CA 197850→1499, CV 9600→1372 |
| unhealthy_p2_trial4 | unhealthy | Phase II | 0.572 | CA, CV, OCP  | CA 46483→1500, CV 9600→1372, OCP 120→120 |

Excluded: `saline_p2_trial1` (Phase II, score 0.893, saline) — only
`ca.txt`; missing `cv.txt`/`ocp.txt`. Not fabricated. No saline card
results (the only saline folder is the incomplete one).

## Gate status

- GATE 0: PASS (5 valid samples ≥ 3; no halt; nothing fabricated)
- GATE 1: PASS (JSON 1:1 with samples; equal-length x/y; metadata exact; no dpv)
- GATE 2: PASS (real cards = 5; Phase II 3 / Phase I 2 charts, no empty
  slots; varied real data; DPV sentence links paper; no "placeholder";
  `sample-fixtures.ts` deleted; `is_placeholder` removed; typecheck +
  build clean)
- GATE 3: N/A — Phase 3 halted by the brief's rule (model not public)

## Blocked

- Phase 3 Colab notebook — biosensor model artifacts not public.
- No `saline` class in gallery — only saline folder is data-incomplete.

Full detail in `BLOCKERS.md`.

## Reproduce

```
# from MSHI-WEB/ with the MSHI sister repo checked out alongside
python3 scripts/build_biosensor_data.py
pnpm install && pnpm typecheck && pnpm build
PORT=3210 pnpm start &
node scripts/verify-biosensor-gallery.mjs
```

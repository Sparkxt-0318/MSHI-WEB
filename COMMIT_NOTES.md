# COMMIT_NOTES — biosensor gallery from real data

Branch: `claude/biosensor-gallery-CxQED` (both repos). Not merged.

## Feedback round (post-PR #21)

Researcher feedback on the section, addressed in one follow-up commit:

1. **CA initial transient cut.** The near-vertical opening of every CA
   chart is the capacitive charging spike the researcher disregards as
   instrument noise. `build_biosensor_data.py` now drops the leading
   transient (robust 5–95th-pct working-band detection, capped at 10%,
   CA only) before downsampling, so charts show the working-range
   biofilm signal. Raw `.txt` downloads remain verbatim and complete.
2. **Grey box removed.** `electrochem-traces.tsx` no longer uses the
   `bg-rule`/`gap-px` container (which left a filled empty 4th cell for
   3-trace samples). Each panel is self-bordered; an odd trailing panel
   spans both columns. No empty cell, no grey box.
3. **DPV added — digitized from the author's screenshot.** The corpus
   still has no `dpv.txt`; per the researcher's chosen option, the
   author-supplied DPV screenshot (Trial 1) was hand-digitized into
   `scripts/build_dpv_reference.py` →
   `public/data/biosensor_dpv_reference.json` and shown ONCE on
   `/biosensor` as a sourced reference (OmcZ marker at −0.13 V, full
   provenance caption, paper credit) — explicitly not attributed to any
   gallery sample. The corpus parser is unchanged: no sample gets a
   fabricated DPV. The required DPV sentence was reworded to match.

typecheck + build clean; `verify-biosensor-gallery.mjs` extended with
DPV / grey-box / CA-trim regression checks — GATE 2 still PASS.

**Round 2.** Per follow-up: the digitized DPV is now a fourth uniform
square inside every sample detail dialog (and the home featured panel)
alongside CA/CV/OCP — no stretched/extended OCP. All panels are equal
size with a reserved header height so charts align even when a name
wraps; header code↔name spacing widened. The DPV square is tagged
"· ref" and the dialog note states it is the shared digitized published
reference, not that sample's measurement (corpus still has no per-sample
DPV; none fabricated). Phase II → CA·CV·OCP·DPV (2×2); Phase I →
CA·CV·DPV. Verifier updated; GATE 2 PASS.

**Round 3 (visual cleanup).** Panel headers were clipping ("Chronoampe…")
and bleeding across cells because code↔name shared one line with a wide
gap. Headers are now stacked (code over full name, `break-words`, reserved
height) so every label stays inside its panel. Found and fixed a
pre-existing dialog bug: the `fade-in` keyframe (fill `forwards`,
animates `transform`) overwrote the `-translate-x/y-1/2` centering, so a
wide dialog rendered off-centre/off-screen — switched DialogContent to an
opacity-only entrance and a responsive `w-[92vw] max-w-4xl` with
`overflow-x-hidden`; verified centered + contained at 1024/1280/1500 px.
Home section rebalanced (prose + compact score in a 4-col column; the
2×2 trace box gets a roomy 8-col column). typecheck + build clean; GATE 2 PASS.

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

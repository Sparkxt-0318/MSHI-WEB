# BLOCKERS — biosensor gallery + reproducible notebook

Log of what this task could not finish and the defensible decisions made
where reality diverged from the brief. No sample, trace, model, or
notebook was fabricated to paper over any blocker.

---

## HARD BLOCK — Phase 3: reproducible Colab notebook (NOT SHIPPED)

**Status: halted by the brief's own Phase 3 HALT rule. Phases 1–2 shipped.**

Phase 3 requires the *biosensor* MSHI model artifacts — the XGBoost +
1D-CNN ensemble and scalers that map electrochemistry traces to an MSHI
score and a healthy/unhealthy/saline classification — at a public
location so a Colab can load them from raw GitHub URLs.

These artifacts are **not public anywhere**. Verified exhaustively:

- `Sparkxt-0318/MSHI@main` tracks only two model files, both under
  `data/outputs/`: `F_NPP_model.json` and `Full_MODIS_model.json`.
  These are the **MSHI-Geo atlas** XGBoost models. They predict a soil
  **respiration anomaly from climate/satellite features** at continental
  scale. They take gridded environmental features as input and cannot
  accept electrochemistry `.txt` files, nor do they emit an MSHI
  score/classification. Wrong model entirely.
- There is **no 1D-CNN** in the repo. `requirements.txt` pins
  `xgboost`/`scikit-learn` for the geo pipeline and lists **no deep
  learning framework at all** (no tensorflow / torch / keras). No
  `conv1d`, no `.h5`/`.pt`, no electrochemistry scaler, and no code that
  turns a CA/CV/OCP trace into an MSHI score exists in either repo.
- The MSHI README explicitly frames MSHI-Geo as the *"geospatial twin of
  the **published** electrochemical MSHI biosensor."* The biosensor
  model is prior published work; its artifacts were never committed to
  the open repository. `CLAUDE_CODE_PROMPT.md` confirms the author keeps
  exported artifacts on a personal Google Drive.

Per the brief: *"If the model artifacts are NOT at a public location
(still only on personal Google Drive), HALT Phase 3 only, document in
BLOCKERS.md, and ship Phases 1–2. Do not block the gallery on this."*

**Action taken:** No notebook was created (a notebook that cannot load a
real model and cannot score real input would be a fabrication). The
`/biosensor` page does **not** link to a non-existent Colab; instead it
carries an honest note that the reproducible notebook is pending public
release of the model artifacts, and links to the paper and the MSHI
code repository. GATE 3 is therefore not applicable — Phase 3 is halted
by design, not failed.

**To unblock:** publish the biosensor classifier (XGBoost model, 1D-CNN
weights, feature scalers, and the trace→feature preprocessing) to a
public path in `Sparkxt-0318/MSHI`. Then the notebook can be authored to
load them via `raw.githubusercontent.com` with a bundled worked example.

---

## DATA EXCLUSION — `saline_p2_trial1` (1 of 6 folders dropped)

`biosensor_samples/saline_p2_trial1/` contains a valid `metadata.json`
(Phase II, score 0.893, class `saline`) and a real `ca.txt` (3.3 MB),
but **no `cv.txt` and no `ocp.txt`**. It fails the Phase 0 hard gate
("each sample has at minimum ca.txt and cv.txt; Phase II also ocp.txt").

Per the brief's absolute rule against fabricating traces, this sample is
**excluded**, not patched. Consequence: the gallery has no `saline`
class card (the only saline folder is the incomplete one). Healthy (3)
and Unhealthy (2) classes are fully represented. 5 valid samples ≥ 3, so
the Phase 0 global HALT did not trigger and Phases 1–2 shipped.

**To unblock:** add real `cv.txt` (and `ocp.txt`, Phase II) to
`saline_p2_trial1/` upstream and re-run `scripts/build_biosensor_data.py`.

---

## NOTE — upstream README lists DPV; corpus has none (handled correctly)

`MSHI/biosensor_samples/README.md` instructs that Phase II folders
should include `dpv.txt`. The uploaded corpus contains **zero DPV
files** (confirmed across all 6 folders). This matches the brief, which
states there are no DPV traces and forbids inventing one. The gallery
parses and renders only the techniques that physically exist
(CA/CV/OCP) and the page carries the required one-sentence explanation
of why DPV is presented in the paper rather than charted here. No DPV
trace was generated, mocked, or placeholdered. Not a blocker — recorded
so the README/corpus discrepancy is not mistaken for missing work.

---

## DECISION — branch name

The free-text brief said branch `claude/biosensor-gallery` from `main`.
The harness designated `claude/biosensor-gallery-CxQED` as the required
development branch for both repos and forbids pushing elsewhere without
explicit permission. Resolved in favour of the harness-designated
branch: **`claude/biosensor-gallery-CxQED`** (same intent, suffixed).
Note: `MSHI-WEB` has no `main` branch; its default is
`claude/build-mshi-website-mxv1R`, and the feature branch was cut from
the latest merged site state (PR #20), which is the correct base.

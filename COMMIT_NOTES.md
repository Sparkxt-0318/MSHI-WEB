# Atlas global coverage (UI) — commit notes

**Branch:** `claude/atlas-global-coverage`
**Base:** `claude/build-mshi-website-mxv1R` (the repo's default branch — there is
no `main` in MSHI-WEB; the brief said "from main", so the default branch was
used and this deviation is noted here).
**Companion:** MSHI `claude/atlas-global-lookup` (PR #13) — the data side.

## What this branch does

Loads the extended global `atlas_lookup.json` and adds **transfer framing** so
non-Asia cells can never be mistaken for validated Asia predictions.

### Data
- `public/data/atlas_lookup.json` replaced with the merged lookup: **27,393
  cells, 38 MB** (schema v4) = 20,678 Asia `domain:"training"` + 6,715 non-Asia
  `domain:"transfer"` (North America, Australia, parts of Africa). MODIS-absent
  regions (South America, most of Africa/Europe) have **no cells** — they are
  not predicted or invented (see MSHI `BLOCKERS.md`).

### Code
- `atlas-mock-types.ts` — `domain?: 'training' | 'transfer'` on the cell + the
  response; optional `coverage` block on the file. v3 files still parse.
- `atlas-lookup.ts` — `cellToResponse` now carries `domain` (defaults to
  `training` for legacy v3 cells). Schema comment v3 → v4.
- `atlas-detail-panel.tsx` — **mandatory transfer framing**:
  - amber `TRANSFER` chip in the panel header;
  - a distinct amber (`bedrock-warn`) banner **"Transfer prediction ·
    Asia-trained model"** plus the required caveat: *"The model is trained on
    Asian data and transfers across continents only weakly (R² = +0.145).
    Predictions outside Asia are illustrative extrapolations, not validated. See
    Methods."* (Methods links to `/methods`);
  - an "Extrapolated beyond the Asia training region" line at the prediction;
  - **shown only when `domain === 'transfer'`** — Asia panels are unchanged.
  - Coordinates now print N/S + E/W (global cells were reading as negative °E/°N).
  - "No prediction" copy updated for the MODIS-limited global coverage.
- `atlas-map.tsx`
  - Search no longer forces non-Asia → "outside training domain"; it resolves to
    the nearest cell, so non-Asia hits return transfer-framed predictions and
    MODIS-absent points fall through to "no prediction". Removed the now-unused
    `isInAsia`/`ASIA_BBOX` gate.
  - New `transfer-cells` circle layer renders the 6,715 non-Asia cells as
    anomaly-coloured points (same legend colormap), so the global extension is
    visible on the globe (the PMTiles raster is Asia-only). Recolours on the
    F+NPP / Full+MODIS toggle.
  - Legend note: Asia = training (raster), coloured points = transfer; MODIS-
    absent regions absent.
- Untouched: layer toggle, SHAP panels, training-site density, screenshot,
  city pins, Asia cell behaviour.

## Gate 4 verification

`pnpm typecheck` ✓ · `pnpm build` ✓ (clean).

`scripts/verify-atlas-transfer.mjs` (Playwright, swiftshader WebGL) — **PASSED**:
- Beijing / Tokyo (Asia) → prediction, **no** transfer badge.
- Denver / Brisbane (non-Asia) → prediction **with** badge **+ caveat**.
- São Paulo (no MODIS) → "no prediction" (honestly absent), no badge.
- 0 page errors.

Known-honest limit: even within covered continents the MODIS footprint is
patchy — e.g. SE Australia has no data, so Sydney/Melbourne return "no
prediction" while Brisbane/Perth and most US interior cities resolve.

Draft PR; do not merge.

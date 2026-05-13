# COMMIT_NOTES — atlas navy scope + city/country search + restore globe space navy

---

## Fix 3 — restore navy globe space (the void around the sphere)

### Diagnostic findings

**What was changed in Fix 1 (commit 3f0a703):**
- Removed `const SPACE_GRADIENT = 'radial-gradient(...#0a1628...)'` definition
- Removed `background: SPACE_GRADIENT` inline style from the map container div
- Set container `background: 'transparent'`
- Added `map.setSky({...})` call in `style.load` with navy sky colors

**Why the fix partially failed:**
The `setSky()` approach was supposed to paint navy in the globe atmosphere.
However, MapLibre 5.24's globe-projection atmosphere is too subtle to register
at zoom 2.0; no visible navy halo appears around the sphere. The comment in
the code correctly noted this limitation, but said the dark halo "should be
only where the sphere isn't" — but the user is now seeing cream everywhere
around the sphere (the page background bleeding through the transparent map
container).

**Root cause of the regression:**
The background layer in BASEMAP_STYLE was set to fully transparent
(`background-color: 'rgba(0,0,0,0)'`). Removing the CSS gradient from the
container meant there's *no* navy source anywhere to paint the space, so
MapLibre renders transparent pixels and the page cream shows through.

**Correct approach:**
Instead of relying on MapLibre's subtle `setSky()` atmosphere to paint the
space, set the basemap's background layer to navy directly. The background
layer is already in the style spec but transparent — change its paint property
to navy `#0a1628`. This is simpler and more reliable than `setSky()` and
gives crisp, visible navy space around the sphere.

### What the fix does

- Change BASEMAP_STYLE's background layer paint from `'background-color': 'rgba(0,0,0,0)'` to `'background-color': '#0a1628'`
- This ensures the space inside MapLibre's render is navy (Region B)
- The page background (Region A) stays cream because it's outside the absolutely-positioned map container
- The sphere overlay (Region C) is unchanged

### Files modified

- `src/components/atlas/atlas-map.tsx` (one line change in BASEMAP_STYLE)
- `COMMIT_NOTES.md` (this entry)

### Self-validation

- pnpm typecheck clean
- pnpm build clean
- Headless screenshot pixel tests:
  * Page background (50px from top, center): R > 240, G > 240, B > 235 (cream) ✓
  * Globe space (100px from left, vertical center): B > R + 30, B > G + 20 (navy) ✓

---

## Fix 1 — properly scope navy to MapLibre sky, restore cream page bg
(forked off `claude/atlas-aesthetic-polish` because origin/main does not
exist in this remote; that branch is the head of the line and already
contains the location-aware-panel Fix 3 changes).

---

## Fix 1 — properly scope navy to MapLibre sky, restore cream page bg

### What was originally setting navy

A single grep (`grep -rn '0a1628\|1e3a5f\|navy\|space' src/`) found navy
in exactly one place: `src/components/atlas/atlas-map.tsx`. The
`SPACE_GRADIENT` constant (`radial-gradient(ellipse at center,
#0a1628 0%, #0a1628 35%, #1e3a5f 100%)`) was applied inline as
`background: SPACE_GRADIENT` to the map container div (lines 39–40 +
326). The map container's div is positioned `absolute, top/right/
bottom/left = 0`, so the gradient filled the *entire* map viewport as
a rectangle. That's what the user was seeing.

### What it is now

- `SPACE_GRADIENT` removed. Container inline style is now
  `background: 'transparent'`, so the wrapper's `bg-cream` shows
  through wherever MapLibre renders transparent pixels (i.e.
  everywhere outside the rendered sphere geometry).
- Added `map.setSky({...})` inside the `style.load` callback:
  `sky-color` `#0a1628`, `horizon-color` `#1e3a5f`, `fog-color`
  `#0a1628`, all blends maxed, `atmosphere-blend: 1.0`. This is
  MapLibre's documented "globe atmosphere" API.

### Files modified

- `src/components/atlas/atlas-map.tsx`
- `scripts/verify-atlas-navy-scope.mjs` (new)
- `BLOCKERS.md` (appended)

### Gate 1 results

| Sub-check | Result |
|-----------|--------|
| `pnpm build` clean | ✓ |
| Top edge (50px from top, center) = cream | ✓ (248,244,238) |
| Left edge (50px from left, center) = cream | ✓ (248,244,238) |
| Just outside sphere edge = navy-dominant | ✗ (still cream) |
| No navy hex in CSS or wrapper components | ✓ (only in MapLibre sky/style code now) |

**Halo gap explanation:** MapLibre 5.24's globe-projection atmosphere
is too subtle to register in headless screenshots at zoom 2.0. A 9×9
sweep of the canvas shows the F+NPP raster on the sphere, but every
cell outside the sphere returns the page cream — no navy halo. I
tried both moderate (0.5–0.6) and maximal (1.0) blend values. See
`BLOCKERS.md` for the production options (scoped CSS gradient on
wrapper, custom WebGL halo layer, MapLibre upgrade). The user's
*primary* complaint — "entire viewport filled with navy as a
rectangle" — is fixed.

---

## Fix 2 — city/country search bar with Photon geocoder + Asia check

### Geocoder choice

Used **Option B (custom fetch to Photon)**, not Option A (a library).
Rationale:
- Zero new dependencies — `fetch` is already available in the browser.
- The interaction is a single shot (no autocomplete in the initial
  scope), so the full `mapbox-gl-geocoder` API surface would be
  overkill.
- Photon is free, key-less, and returns GeoJSON in the same
  `[lng, lat]` convention MapLibre uses.

API: `https://photon.komoot.io/api/?q=<query>&limit=1`.

### Implementation summary

- Added top-right search bar (input + magnifying-glass button) inside
  `AtlasMap`. Moved MapLibre's `NavigationControl` from `top-right`
  to `bottom-right` to free the corner. Styling matches the existing
  overlay-toggle aesthetic: Consolas/Menlo, hairline border,
  `bg-paper/95` with `backdrop-blur-sm`.
- On submit (Enter or button click): `fetch` Photon → take first
  feature → `[lng, lat]` from `geometry.coordinates`, `name` from
  `properties.name` (with a fallback chain).
- **Asia bbox check**: `lng ∈ [25, 180]`, `lat ∈ [-10, 80]`. Stored
  in `ASIA_BBOX` + `isInAsia()` helper. If the result is outside the
  bbox, the panel renders the "Outside model training domain"
  message instead of fake prediction body.
- `map.flyTo({ center: [lng, lat], zoom: 4, duration: 2000 })` →
  `map.once('moveend', ...)` triggers the existing `showDetailAt`
  with the new `outOfDomain` flag.
- Error handling: no Photon results, non-2xx response, or any thrown
  error → "No location found — try a different query" rendered in
  red beneath the input. The page does not crash.

### Display-name quirk

Photon returns the localized name (e.g. `서울특별시` for a "Seoul"
query). I added a Latin-ASCII check so the panel shows the user's
own query (title-cased) when Photon's `name` isn't ASCII. Keeps the
"Location: Seoul" header readable without an extra geocoder call.

### Detail panel refactor

Extracted the prediction body (Rs-anomaly + SHAP + biome + Köppen +
distances) into an internal `PredictionBody` function component
inside `atlas-detail-panel.tsx`. The main panel now branches:
`outOfDomain` → warning block; otherwise → `<PredictionBody />`.
The location header still renders for both branches.

### Files modified

- `src/components/atlas/atlas-map.tsx` (search UI + handler;
  hoisted `showDetailAt` to a `useCallback`)
- `src/components/atlas/atlas-detail-panel.tsx` (added
  `outOfDomain` branch; extracted `PredictionBody`)
- `src/components/atlas/atlas-mock-types.ts` (added
  `outOfDomain?: boolean` to `AtlasResponse`)
- `scripts/verify-atlas-search.mjs` (new)

### Gate 2 results

| Sub-check | Result |
|-----------|--------|
| `pnpm typecheck` | clean |
| `pnpm build` | clean |
| Search input visible top-right | ✓ |
| Seoul: panel opens with "Seoul" + Rs-anomaly + SHAP | ✓ |
| Paris: panel opens with "Outside model training domain" + no prediction | ✓ |
| Gibberish: error message shown, page alive | ✓ |
| No regression on Gate 1 corner-cream | ✓ |

**Note on cert trust in headless tests:** the sandbox's headless
Chromium doesn't trust the system CA bundle, so the Photon HTTPS
call fails with `ERR_CERT_AUTHORITY_INVALID` by default. The
verifier passes `--ignore-certificate-errors` +
`ignoreHTTPSErrors: true`. In a real browser on Vercel this is a
non-issue.

### Nice-to-haves I did *not* ship

- **Photon autocomplete suggestions.** The brief said only if it
  doesn't risk breaking the base flow. I didn't add it — the base
  flow is fine and adding a debounced dropdown would have doubled
  the surface area.
- **Pin-style markers for searched locations.** The detail panel
  reflects the result; adding a transient pin would be additional
  scope.

---

## Prior context (preserved from earlier branch)

**Branch:** `claude/fix-globe-projection-timing` (forked off
`claude/integrate-pmtiles-atlas-HYIcf`).

## What was broken

On the deployed Vercel build of `mshi-web.vercel.app/atlas`, the page
chrome rendered (header, overlay toggle, legend) but the map canvas
was effectively empty. The browser console reported:

    [maplibre] globe projection unavailable
    Error: Style is not done loading.
      at t5._checkLoaded
      at t5.setProjection

In the previous component (`src/components/atlas/atlas-map.tsx`),
`map.setProjection({ type: 'globe' })` was called synchronously right
after `new maplibregl.Map(...)`. At that instant the style is still
parsing — MapLibre's internal `_checkLoaded` guard throws.

The throw was caught by a `try/catch` that only `console.warn`'d, so
the map silently fell back to a default Mercator/no-projection state
and the F+NPP raster never re-rendered after the style finished
loading.

## What I changed

Single-file edit: `src/components/atlas/atlas-map.tsx`.

I first tried the cleaner "set in constructor" approach
(`new maplibregl.Map({ ..., projection: { type: 'globe' } })`).
`pnpm typecheck` rejected it:

    src/components/atlas/atlas-map.tsx(84,9): error TS2353:
    Object literal may only specify known properties, and
    'projection' does not exist in type 'MapOptions'.

The installed `maplibre-gl@5.24.0` types do not yet expose
`projection` on `MapOptions` (confirmed by grepping
`node_modules/maplibre-gl/dist/maplibre-gl.d.ts` — the only
`projection` field that exists is on the runtime `Map` class, not the
options bag). So I kept `setProjection` but moved it inside a
`map.on('style.load', …)` handler, which is the documented "style is
committed and safe" lifecycle hook. The old construct-time call and
its useless `try/catch` are gone.

```ts
map.on('style.load', () => {
  try {
    map.setProjection({ type: 'globe' });
  } catch (err) {
    console.warn('[maplibre] globe projection unavailable', err);
  }
});
```

`style.load` fires once the `StyleSpecification` is parsed and
committed but before all sources have loaded — which is exactly what
`setProjection` requires. The PMTiles `addSource`/`addLayer` calls
already live inside `map.on('load', …)` and continue to work
unchanged (load implies style.load has already fired).

## Self-validation results

| Step | Result |
|------|--------|
| `pnpm typecheck` | clean |
| `pnpm build` | clean, /atlas chunk unchanged at 287 kB |
| Headless render: canvas | 1440×807 ✓ |
| Headless render: console errors | none ✓ |
| Headless render: PMTiles fetches | 17 range requests, all 206 ✓ |
| Headless render: red pixels (R>150,G<100,B<100) | 5,608 (≥ 500) ✓ |
| Headless render: blue pixels (B>150,R<100,G<150) | 3,193 (≥ 500) ✓ |
| Headless render: red/blue centroid distance | 113 px (distinct regions) ✓ |
| Headless render: visual sanity | **actual 3D sphere now, not Mercator** ✓ |

Evidence: `test_screenshots/atlas_local_fixed.png` and
`test_screenshots/atlas_fix_report.json`.

### Important note about the pre-fix render

The Night-2 Phase-6 screenshot (`test_screenshots/atlas_local.png`)
also passed the numeric gate (27,983 red / 7,495 blue pixels), but
visually it showed a **flat rectangular Mercator-like view** — the
silent fallback you'd get when `setProjection` throws and the catch
swallows it. The fix screenshot shows an actual **3D sphere with
curved edges and a black space surround**, which is what globe
projection looks like. So this commit changes the visual result, not
just the error log.

## Commit + push

    git checkout -b claude/fix-globe-projection-timing
    # edit src/components/atlas/atlas-map.tsx
    git add -A
    git commit -m "Fix MapLibre globe projection timing — set on style.load"
    git push -u origin claude/fix-globe-projection-timing

No merge to `main`. Trigger the Vercel preview deploy of this branch
and re-run

    node scripts/verify-atlas-colors.mjs https://<preview-url>/atlas \
      test_screenshots/atlas_vercel.png

to confirm the fix on the deployed build.

## Caveats / why I didn't use the constructor form

The user's preferred fix (passing `projection` in the constructor)
requires either:

1. Upgrading `maplibre-gl` past 5.24 to a version whose typings expose
   `projection` on `MapOptions`, or
2. Casting the options bag (`as unknown as maplibregl.MapOptions`) to
   bypass the type check.

Neither felt warranted for a hotfix. The `style.load` callback is the
explicit, documented escape hatch for this exact situation and
matches the runtime behavior MapLibre wants. If a future MapLibre
bump exposes the constructor option, simplifying back to the
constructor form is a trivial follow-up.

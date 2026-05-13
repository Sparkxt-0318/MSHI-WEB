# COMMIT_NOTES — Fix MapLibre globe projection timing

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

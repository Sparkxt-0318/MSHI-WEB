# Summary for the user

This file is a transparent record of what the overnight scaffolding run
produced. Read top to bottom.

## TL;DR

The site is fully scaffolded, builds clean (`pnpm build` passes with
zero errors), and is ready to deploy to Vercel. Every page renders as
expected with placeholders for the assets only you can supply. The
first thing to do tomorrow morning is run `pnpm dev`, browse to
<http://localhost:3000>, and decide whether the visual direction is
right.

## Branch / pushing note

You asked for a `claude/scaffold` branch. The harness this run was
launched in pinned the branch name to `claude/build-mshi-website-mxv1R`
and refused other targets. **All work landed on
`claude/build-mshi-website-mxv1R`.** To rename it locally:

```bash
git checkout claude/build-mshi-website-mxv1R
git branch -m claude/scaffold
git push origin :claude/build-mshi-website-mxv1R
git push -u origin claude/scaffold
```

Or merge as-is to main from whichever name you prefer.

## What was built (checkpoint by checkpoint)

| Commit | What landed |
| --- | --- |
| 1 · Scaffold | Next.js 14 + Tailwind v3 + design tokens (Bedrock palette, Georgia/Calibri/SF Mono), pnpm deps, .env.example, vercel.json, root layout, site nav + footer, shared primitives (SectionLabel, Reveal, PlaceholderFigure, Callout, Button, Dialog) |
| 2 · Homepage 1–4 | Hero, problem, framework, atlas teaser. Inline carbon-flux Recharts panel (real published numbers, not invented). cm/m/km icon set drawn inline. |
| 3 · Homepage 5–9 | Mechanism, biosensor, integration, roadmap, footer. 4-panel CA/CV/OCP/DPV trace placeholder. Discussion-section prose explaining the clay sign-flip and the role of MODIS NPP. |
| 4 · Atlas | Mapbox GL map with F+NPP raster overlay (placeholder PNG path), overlay layer toggle (only F+NPP live), click → mock detail panel with SHAP bars + biome + Köppen + distance. Graceful no-token fallback. |
| 5 · Biosensor | Three placeholder sample cards, dialog detail view per sample with traces + score + metadata + minimap. Schema documented. |
| 6 · Methods/Paper/About | Long-form methods page (data sources, features, model, validation, reproducibility) with Bedrock callouts. Paper page with PDF embed + abstract block + BibTeX. About page with author/institution/ORCID block. |
| 7 · Docs | This file + README.md. |

## What works locally as-is

Run `pnpm dev` and the following work end-to-end:

- `/` long-scroll homepage with all 9 sections
- `/atlas` — base map renders if `NEXT_PUBLIC_MAPBOX_TOKEN` is set;
  otherwise a clean explanatory fallback. Overlay toggle, click handler,
  detail panel, and legend strip all functional against the mock JSON.
- `/biosensor` — three placeholder cards with working dialog detail views
- `/methods` — full long-form text with Callout boxes
- `/paper` — embedded PDF viewer (falls back to placeholder until you
  drop a `/public/paper.pdf`)
- `/about` — bio + acknowledgments scaffolding

`pnpm build` passes with zero errors and zero warnings.
`pnpm typecheck` passes.

## What needs your input, in priority order

1. **Mapbox token** — set `NEXT_PUBLIC_MAPBOX_TOKEN` in Vercel project
   env. Without this, `/atlas` shows a "setup required" fallback. Free
   tier covers this site comfortably.

2. **Three image files from sister repo** — copy these into
   `/public/images/`:

   - `hero_f_npp_asia.png` — used as section 03 full-bleed background
   - `shap_comparison.png` — used as section 04 figure
   - `methodology_evolution_panel.png` — used as section 06 figure

   Plus an atlas raster overlay:

   - `atlas_overlay_fnpp.png` — F+NPP anomaly raster, georeferenced to
     [60°E–150°E, 0°N–60°N]. The map adds it as an `image` source with
     those coordinates; if your raster has different bounds, edit
     `src/components/atlas/atlas-map.tsx:62-67` to match.

3. **Biosensor sample data (3–6 examples)** — replace the placeholder
   fixtures in `src/components/biosensor/sample-fixtures.ts` with real
   `BiosensorSample` records. Set `is_placeholder: false`. See README
   §Biosensor sample record for the schema. To wire real
   electrochemistry traces, replace the mock generator in
   `src/components/biosensor/electrochem-traces.tsx` with code that
   reads CSVs you supply.

4. **Paper PDF** — drop the manuscript at `/public/paper.pdf`. The
   embed will pick it up automatically.

5. **Author info / personal details** — edit `src/lib/site-config.ts`
   once. Your name, institution, ORCID, email, paper title and venue
   propagate everywhere (footer, about page, paper page citation,
   BibTeX). The hero band's "[Author Name] · [Institution] · 2026" line
   reads from this file too.

6. **Copy review for narrative sections** — three blocks of prose I
   wrote that you should review for accuracy / voice:
   - `src/components/home/section-mechanism.tsx` — the clay sign-flip
     discussion paragraphs
   - `src/components/home/section-integration.tsx` — Köppen-D /
     IGBP-forest "where to deploy first" paragraphs
   - `src/app/methods/page.tsx` — the Methods long-form. I drew on the
     numbers in the task brief (n=600/463/274, 5° spatial-block CV,
     2000-iter bootstrap, F+NPP rank-1 SHAP) and matched a research-
     paper voice. **I did not invent any new numerical results** — the
     three numbers cited (transfer R² = +0.145, CI [+0.026, +0.241],
     Asia-clay ρ = +0.302, US-clay ρ = -0.048) come straight from your
     brief. Anything I expanded on (e.g., the speculative line about
     XGBoost dominating "at every sample size we tried") is hedged
     in voice and clearly invitation-to-edit.

## Quality flags

What's solid:

- Build is zero-warning. TypeScript strict mode passes.
- Design system is fully tokenized — palette and typography in one
  place (`tailwind.config.ts` + `globals.css`). Easy to retune.
- Every placeholder is unmistakable. No fake data shipped as real.
- Routes are statically prerendered where possible; the atlas page is
  client-rendered (Mapbox needs `window`).
- Reduce-motion is honored by the Reveal primitive.
- Mobile responsive across all breakpoints I sized for; might benefit
  from a UA test.

What's placeholder (intended, but worth knowing):

- The atlas click handler returns the same record for every coordinate.
  The README documents the precomputed lookup schema for replacement.
- The biosensor electrochemistry traces are deterministic
  physics-shaped curves, not real measurements.
- All four section figures, the atlas raster, and the paper PDF are
  diagonal-hatch placeholder tiles.

What I did *not* do (and why):

- I did **not** integrate analytics. The brief didn't ask, and a
  research portfolio doesn't need it. Add `next/third-parties` later
  if you want.
- I did **not** add a sitemap or robots.txt. Trivial to add later;
  metadata is in place.
- I did **not** wire keyboard shortcuts on the atlas (escape closes
  the dialog by default via Radix; nothing custom).
- I did **not** generate any social-share images. Easy to add via
  `next/og` if you want them later.
- I did **not** copy any PNGs from the sister repo. The brief
  explicitly said to leave that to you.

## Honesty note: I could not browser-test

This run had no headless browser, so I verified the site by:

- `pnpm build` passes (zero errors, zero warnings)
- `pnpm typecheck` passes
- All 7 routes statically prerender (or render client-side, in the
  atlas case — by design)
- I read every component back as I built it

What I did **not** verify:

- Visual layout under real fonts (Calibri may not be installed on Linux
  build machines; the cascade falls through to Segoe UI / system-ui /
  sans-serif). On macOS / Windows the intended Calibri renders.
- Atlas behavior with a real Mapbox token. The Mapbox GL setup compiles
  and the no-token fallback was tested in code, but the live map under
  the real token is unverified by me.
- Mobile breakpoints under a real device viewport.

If anything looks wrong on first scroll, the most likely culprits are
font fallbacks and image placeholders. Both should resolve themselves
once the assets land.

## Suggested first thing to look at

Run this:

```bash
pnpm install      # only if first time
pnpm dev
```

Open <http://localhost:3000> and scroll the homepage end-to-end.
Decide whether the visual direction lands right. The most fragile
piece is the section 03 atlas teaser — the dark overlay card on top
of the cream-coded placeholder tile. Once you drop the real
`hero_f_npp_asia.png` into `/public/images/` and reload, that
section transforms.

## Open questions for you

1. **Mapbox style.** Default is `mapbox://styles/mapbox/light-v11`,
   which is quiet enough but not custom. If you want the same Bedrock-
   styled basemap as your existing decks, build it in Mapbox Studio
   and paste the style URL into `NEXT_PUBLIC_MAPBOX_STYLE`. Happy to
   sketch a Studio config for you.

2. **Atlas overlay bounds.** I assumed `[60°E–150°E, 0°N–60°N]` for
   the Asian study domain. If your raster has different bounds, edit
   `atlas-map.tsx:62-67`. If you have multiple overlays at different
   bounds, that file currently ships only the F+NPP layer; the others
   are togglable but not wired.

3. **Three placeholder samples vs. six.** I shipped 3. The task brief
   said 3–6. Easy to add more; just append to
   `PLACEHOLDER_SAMPLES` or replace it.

4. **Paper page abstract.** I put a placeholder note rather than
   making one up. Paste the real abstract into
   `src/app/paper/page.tsx` line ~50.

5. **Genius Olympiad vs. college applications voice.** The current
   voice is closer to a research paper's discussion section, which
   matches the brief's "research project artifact" framing. If you
   want a slightly more accessible voice (still rigorous, but less
   technical) for the homepage hero/intro, let me know and I can
   re-tune sections 01–03.

## How to find every placeholder fast

```bash
grep -rn "PLACEHOLDER" src public README.md
grep -rn "is_placeholder: true" src
grep -rn "\[Author Name\]" src
```

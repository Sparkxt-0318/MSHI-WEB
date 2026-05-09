# MSHI-WEB

Public-facing companion website for the **MSHI biosensor** and **MSHI-Geo
continental ML atlas** research portfolio. Long-scroll homepage,
interactive atlas, biosensor sample gallery, and supporting
methods/paper/about pages.

This repository is a sibling to the science repo at
[github.com/Sparkxt-0318/MSHI](https://github.com/Sparkxt-0318/MSHI).
The MSHI repo holds the model artifacts, training scripts, and PNG
exports; this repo renders the public artifact built from those outputs.

## Contents

- [Tech stack](#tech-stack)
- [Local development](#local-development)
- [Environment variables](#environment-variables)
- [Deploying to Vercel](#deploying-to-vercel)
- [File structure](#file-structure)
- [Schemas for user-supplied data](#schemas-for-user-supplied-data)
  - [Atlas grid-cell lookup](#atlas-grid-cell-lookup)
  - [Biosensor sample record](#biosensor-sample-record)
- [Image assets the site expects](#image-assets-the-site-expects)
- [What's a placeholder](#whats-a-placeholder)

## Tech stack

| Layer        | Choice                                                  |
| ------------ | ------------------------------------------------------- |
| Framework    | Next.js 14 (App Router) with TypeScript strict mode     |
| Styling      | Tailwind CSS v3 with custom design tokens               |
| UI prims     | Radix UI (Dialog, Tabs, Tooltip) + minimal shadcn-style |
| Charts       | Recharts                                                |
| Map          | Mapbox GL JS                                            |
| Long-form    | MDX (configured via `@next/mdx`)                        |
| Package mgr  | pnpm                                                    |
| Deploy       | Vercel                                                  |

## Local development

```bash
# Requires Node.js >= 18.18 and pnpm
pnpm install
cp .env.example .env.local
# Edit .env.local to set NEXT_PUBLIC_MAPBOX_TOKEN
pnpm dev
```

Then open <http://localhost:3000>.

Useful scripts:

```bash
pnpm dev          # next dev with HMR
pnpm build        # production build (runs TS + lint)
pnpm typecheck    # tsc --noEmit only
pnpm start        # serve the production build
```

## Environment variables

All environment variables are documented in `.env.example`.

| Variable                     | Required for       | Notes                                   |
| ---------------------------- | ------------------ | --------------------------------------- |
| `NEXT_PUBLIC_MAPBOX_TOKEN`   | `/atlas`           | Public token; set in Vercel project env |
| `NEXT_PUBLIC_SITE_URL`       | OG / canonical URLs | Vercel sets automatically              |
| `NEXT_PUBLIC_MAPBOX_STYLE`   | `/atlas` (optional) | Mapbox Studio style URL; default is `mapbox/light-v11` |

`NEXT_PUBLIC_*` variables are exposed to the browser at build time; do
not store secrets here.

## Deploying to Vercel

1. Push the repository to GitHub (already done if you're reading this).
2. In the Vercel dashboard, **Add New Project** → import this repo.
3. Vercel auto-detects Next.js. Confirm the detected settings match
   `vercel.json`:
   - Build command: `pnpm build`
   - Install command: `pnpm install`
   - Output directory: `.next`
4. **Project Settings → Environment Variables**, add at minimum:
   - `NEXT_PUBLIC_MAPBOX_TOKEN` — your Mapbox public access token
5. Trigger a deployment. The first build pulls the package set
   (~1 min) and produces the static site.

## File structure

```
.
├── public/
│   ├── data/
│   │   └── atlas_mock_response.json   # Stub for atlas click handler
│   ├── images/                        # User drops figure PNGs here
│   └── paper.pdf                      # User drops manuscript PDF here
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # Root layout (nav + metadata)
│   │   ├── page.tsx                   # Homepage long-scroll
│   │   ├── atlas/page.tsx             # Interactive map
│   │   ├── biosensor/page.tsx         # Sample gallery
│   │   ├── methods/page.tsx           # Long-form methods
│   │   ├── paper/page.tsx             # PDF embed
│   │   ├── about/page.tsx             # Bio
│   │   └── globals.css                # Tailwind layers + tokens
│   ├── components/
│   │   ├── site/                      # Cross-page primitives
│   │   ├── home/                      # Homepage sections
│   │   ├── atlas/                     # Map + detail panel
│   │   ├── biosensor/                 # Sample card + traces
│   │   └── ui/                        # Button, Dialog, etc.
│   └── lib/
│       ├── site-config.ts             # Author / institution placeholders
│       └── utils.ts                   # cn() helper
├── tailwind.config.ts                 # Design tokens (palette, fonts)
├── next.config.mjs                    # MDX + image config
├── vercel.json                        # Vercel hints
└── .env.example                       # Documented env vars
```

## Schemas for user-supplied data

The site renders placeholders until the user drops in real data. Two
data shapes matter.

### Atlas grid-cell lookup

The atlas click handler at
`src/components/atlas/atlas-map.tsx:97` fetches
`/public/data/atlas_mock_response.json` for every click. To wire real
predictions, replace that file with a precomputed lookup keyed by
0.5° grid cell.

The TypeScript shape (`src/components/atlas/atlas-mock-types.ts`):

```ts
interface AtlasResponse {
  coord: { lat: number; lon: number; _grid_id?: string };
  prediction: {
    rs_anomaly: number;          // ratio, 1 = climatological mean
    rs_anomaly_ci_low: number;
    rs_anomaly_ci_high: number;
    configuration: string;       // e.g. "F+NPP"
  };
  shap_top3: Array<{ feature: string; value: number }>;
  biome:    { igbp_class: string; igbp_code: number };
  koppen:   { zone: string; label: string };
  distance_km: {
    to_nearest_train_site: number;
    to_nearest_us_validation_site: number;
  };
}
```

Recommended JSON structure for the lookup:

```json
{
  "_grid_resolution_deg": 0.5,
  "cells": {
    "lat35.0_lon110.0": { /* AtlasResponse */ },
    "lat35.5_lon110.0": { /* AtlasResponse */ },
    ...
  }
}
```

Once that file is in place, update the `fetch(...)` call in
`atlas-map.tsx` to compute the grid-cell id from `e.lngLat` and look up
into `cells[id]`.

### Biosensor sample record

The biosensor gallery at `/biosensor` renders an array of
`BiosensorSample` records. The shape lives in
`src/components/biosensor/sample-types.ts`:

```ts
interface BiosensorSample {
  id: string;
  name: string;
  blurb: string;
  location: { lat: number; lon: number; site_label?: string };
  metadata: {
    sample_id: string;
    collection_date?: string;
    depth_cm?: string;
    notes?: string;
  };
  mshi_score: number;                                       // [0, 1]
  classification: 'Healthy' | 'Unhealthy' | 'Saline-stressed';
  classification_confidence: number;                        // [0, 1]
  is_placeholder: true;                                     // set false on real samples
}
```

Per-sample electrochemistry data is currently rendered from the mock
generator in `src/components/biosensor/electrochem-traces.tsx`. To
wire real measurements, extend `BiosensorSample` with paths to the
four CSV files (one each for CA, CV, OCP, DPV), then update
`ElectrochemTraces` to read those CSVs instead of the mock generators.

Suggested CSV schemas:

| File   | Columns                                        |
| ------ | ---------------------------------------------- |
| CA.csv | `t_seconds`, `i_microamps`                     |
| CV.csv | `e_volts`, `i_microamps`, `cycle`              |
| OCP.csv| `t_seconds`, `e_volts`                         |
| DPV.csv| `e_volts`, `i_microamps`                       |

To replace the placeholder gallery, edit
`src/components/biosensor/sample-fixtures.ts` and set
`is_placeholder: false` on real records.

## Image assets the site expects

Drop these into `/public/images/` (paths are referenced as `/images/...`
from the components). Until they exist, the diagonally-hatched
placeholder tiles render in their place.

| Path                                   | Used in                          |
| -------------------------------------- | -------------------------------- |
| `/images/hero_f_npp_asia.png`          | Homepage section 03 (atlas teaser) |
| `/images/shap_comparison.png`          | Homepage section 04 (mechanism)  |
| `/images/methodology_evolution_panel.png` | Homepage section 06 (integration) |
| `/images/atlas_overlay_fnpp.png`       | `/atlas` map overlay (F+NPP raster) |

`/public/paper.pdf` — Manuscript PDF; rendered via `<object>` on
`/paper`. Falls back to a placeholder tile when missing.

## What's a placeholder

The design rule: **never invent plausible-looking fake content**. Every
placeholder on this site declares itself as such — diagonally-hatched
tiles, a `Placeholder` chip, or a console-style "PLACEHOLDER ·
USER TO SUPPLY" badge. Search for `PLACEHOLDER` across the codebase to
find every spot that needs your input.

Author and institution metadata are centralized in
`src/lib/site-config.ts` so a single edit propagates everywhere.

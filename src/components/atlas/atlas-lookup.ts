// Atlas lookup loader + per-cell adapter.
//
// /public/data/atlas_lookup.json is fetched on first use, cached at
// module scope, and queried via `lookupCell(lat, lon)` which snaps to
// the nearest 0.5° grid cell. The lookup file is built by
// scripts/build_atlas_lookup.py in the MSHI repo.

import type {
  AtlasLookupCell,
  AtlasLookupFile,
  AtlasResponse,
} from './atlas-mock-types';

const LOOKUP_URL = '/data/atlas_lookup.json';
const GRID_DEG = 0.5;

interface LookupCache {
  byKey: Map<string, AtlasLookupCell>;
  model: AtlasLookupFile['model'];
  grid: AtlasLookupFile['grid'];
}

let cachePromise: Promise<LookupCache> | null = null;

function snapTo(value: number): number {
  // Cells are stored at half-step centres: 0.25, 0.75, 1.25, ... since
  // the grid was built as `np.arange(min, max, 0.5)` with cell centres at
  // edge + 0.25 (see scripts/build_atlas_lookup.py).
  return Math.round((value - 0.25) / GRID_DEG) * GRID_DEG + 0.25;
}

function cellKey(lat: number, lon: number): string {
  return `${snapTo(lat).toFixed(2)},${snapTo(lon).toFixed(2)}`;
}

// Maximum radius (in cell steps) to search outwards from the snap target
// when the immediate cell is missing from the lookup. 4 steps × 0.5° = 2°,
// or ≈ 220 km at the equator — generous enough to handle MODIS NaN holes
// near urban areas and coastal pixels, but small enough that an Indian-
// Ocean click won't find a cell.
const MAX_SEARCH_RADIUS = 4;

export async function loadLookup(): Promise<LookupCache> {
  if (cachePromise) return cachePromise;
  cachePromise = (async () => {
    const res = await fetch(LOOKUP_URL);
    if (!res.ok) throw new Error(`atlas_lookup fetch failed: ${res.status}`);
    const file = (await res.json()) as AtlasLookupFile;
    const byKey = new Map<string, AtlasLookupCell>();
    for (const c of file.cells) {
      byKey.set(`${c.lat.toFixed(2)},${c.lon.toFixed(2)}`, c);
    }
    return { byKey, model: file.model, grid: file.grid };
  })().catch((err) => {
    // Surface the error but allow retry on next call.
    cachePromise = null;
    throw err;
  });
  return cachePromise;
}

export function lookupCellSync(
  cache: LookupCache,
  lat: number,
  lon: number,
): AtlasLookupCell | undefined {
  const hit = cache.byKey.get(cellKey(lat, lon));
  if (hit) return hit;
  // Fall back to nearest-available cell within MAX_SEARCH_RADIUS steps.
  // Many lookup cells are dropped because their MODIS NPP / LST samples
  // are NaN (urban core pixels, MODIS composite edges). The user's
  // intent is "predict here-or-near-here", so we walk outward in a
  // spiral and return the first populated neighbour.
  const baseLat = snapTo(lat);
  const baseLon = snapTo(lon);
  for (let r = 1; r <= MAX_SEARCH_RADIUS; r++) {
    let best: AtlasLookupCell | undefined;
    let bestDist = Infinity;
    for (let dLat = -r; dLat <= r; dLat++) {
      for (let dLon = -r; dLon <= r; dLon++) {
        // Only inspect the ring at exactly radius r (skip interior).
        if (Math.max(Math.abs(dLat), Math.abs(dLon)) !== r) continue;
        const cLat = baseLat + dLat * GRID_DEG;
        const cLon = baseLon + dLon * GRID_DEG;
        const c = cache.byKey.get(`${cLat.toFixed(2)},${cLon.toFixed(2)}`);
        if (!c) continue;
        const d = (cLat - lat) ** 2 + (cLon - lon) ** 2;
        if (d < bestDist) {
          bestDist = d;
          best = c;
        }
      }
    }
    if (best) return best;
  }
  return undefined;
}

/**
 * Build the AtlasResponse the detail panel renders from a real lookup cell.
 * Confidence interval comes from the model's transfer R² CI (0.026, 0.241).
 * The CI is in R² space; we propagate it to anomaly space by treating it
 * as a relative uncertainty band around the point prediction. This is a
 * simplification — see Night-3 notes.
 */
export function cellToResponse(
  cache: LookupCache,
  cell: AtlasLookupCell,
  cityName?: string,
): AtlasResponse {
  const ciHalfWidth = 0.25; // ±25% band, approximating the F+NPP transfer CI
  return {
    coord: {
      lat: cell.lat,
      lon: cell.lon,
      _grid_id: `lat${cell.lat.toFixed(2)}_lon${cell.lon.toFixed(2)}`,
    },
    prediction: {
      rs_anomaly: cell.anomaly,
      rs_anomaly_ci_low: Math.max(0, cell.anomaly * (1 - ciHalfWidth)),
      rs_anomaly_ci_high: cell.anomaly * (1 + ciHalfWidth),
      configuration: cache.model.name,
    },
    shap_top3: cell.shap_top3,
    features: cell.features,
    biome: { igbp_class: cell.biome, igbp_code: cell.biome_code },
    koppen: { zone: cell.koppen_code, label: cell.koppen },
    distance_km: {
      to_nearest_train_site: cell.nearest_train_km,
      to_nearest_us_validation_site: cell.nearest_us_km,
    },
    ...(cityName && { name: cityName }),
    _schema_version: 'atlas.v1',
  };
}

/**
 * Build a "no prediction available" response — used when the clicked
 * coordinate (or geocoded search) falls outside the 0.5° land grid
 * (oceans, lakes, IGBP-water cells, or far outside Asia).
 */
export function noPredictionResponse(
  lat: number,
  lon: number,
  cityName?: string,
): AtlasResponse {
  return {
    coord: { lat, lon },
    prediction: {
      rs_anomaly: 1.0,
      rs_anomaly_ci_low: 1.0,
      rs_anomaly_ci_high: 1.0,
      configuration: 'F+NPP',
    },
    shap_top3: [],
    biome: { igbp_class: '—', igbp_code: -1 },
    koppen: { zone: '—', label: '—' },
    distance_km: {
      to_nearest_train_site: -1,
      to_nearest_us_validation_site: -1,
    },
    ...(cityName && { name: cityName }),
    noPrediction: true,
  };
}

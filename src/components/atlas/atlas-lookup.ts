// Atlas lookup loader + per-cell adapter.
//
// /public/data/atlas_lookup.json (schema v4) is fetched on first use,
// cached at module scope, and queried via `lookupCellSync(lat, lon)`
// which snaps to the nearest 0.5° grid cell. Each cell carries
// predictions for BOTH F+NPP and Full+MODIS — `cellToResponse` picks
// the active model based on the user's overlay toggle — and a `domain`
// flag ("training" for Asia, "transfer" for the non-Asia cells where real
// MODIS exists). The grid is global wherever the feature stack exists;
// MODIS-absent regions (e.g. South America) are simply not in the file.

import type {
  AtlasLookupCell,
  AtlasLookupFile,
  AtlasModelMeta,
  AtlasOverlayLayer,
  AtlasResponse,
} from './atlas-mock-types';

const LOOKUP_URL = '/data/atlas_lookup.json';
const GRID_DEG = 0.5;

interface LookupCache {
  byKey: Map<string, AtlasLookupCell>;
  models: AtlasLookupFile['models'];
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
// or ≈ 220 km — generous enough for MODIS NaN holes near urban areas and
// coastal pixels, small enough that an Indian-Ocean click still misses.
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
    return { byKey, models: file.models, grid: file.grid };
  })().catch((err) => {
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
  const baseLat = snapTo(lat);
  const baseLon = snapTo(lon);
  for (let r = 1; r <= MAX_SEARCH_RADIUS; r++) {
    let best: AtlasLookupCell | undefined;
    let bestDist = Infinity;
    for (let dLat = -r; dLat <= r; dLat++) {
      for (let dLon = -r; dLon <= r; dLon++) {
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

function modelKey(layer: AtlasOverlayLayer): 'fnpp' | 'fullmodis' {
  return layer === 'Full+MODIS' ? 'fullmodis' : 'fnpp';
}

export function getModelMeta(
  cache: LookupCache,
  layer: AtlasOverlayLayer,
): AtlasModelMeta {
  return cache.models[modelKey(layer)];
}

/**
 * Build the AtlasResponse the detail panel renders from a real lookup
 * cell. Selects the active model's block (fnpp or fullmodis). The CI
 * shown in the panel is derived from the model's transfer R² CI as a
 * relative ±band around the point anomaly.
 */
export function cellToResponse(
  cache: LookupCache,
  cell: AtlasLookupCell,
  layer: AtlasOverlayLayer,
  cityName?: string,
): AtlasResponse {
  const block = layer === 'Full+MODIS' ? cell.fullmodis : cell.fnpp;
  const meta = getModelMeta(cache, layer);
  // ± half-width: scale the model's transfer-R² CI half-width onto the
  // anomaly. CI is in R² space, but treating it as a relative band gives
  // visually-honest uncertainty (wider for Full+MODIS than F+NPP).
  const ciHalf = Math.max(
    0.05,
    (meta.transfer_ci_high - meta.transfer_ci_low) / 2,
  );
  return {
    coord: {
      lat: cell.lat,
      lon: cell.lon,
      _grid_id: `lat${cell.lat.toFixed(2)}_lon${cell.lon.toFixed(2)}`,
    },
    prediction: {
      rs_anomaly: block.anomaly,
      rs_anomaly_ci_low: Math.max(0, block.anomaly * (1 - ciHalf)),
      rs_anomaly_ci_high: block.anomaly * (1 + ciHalf),
      configuration: meta.name,
    },
    shap_top3: block.shap_top3,
    features: block.features,
    biome: { igbp_class: cell.biome, igbp_code: cell.biome_code },
    koppen: { zone: cell.koppen_code, label: cell.koppen },
    distance_km: {
      to_nearest_train_site: cell.nearest_train_km,
      to_nearest_us_validation_site: cell.nearest_us_km,
    },
    // Carry the per-cell domain so the panel can flag non-Asia cells as
    // transfer (extrapolation) predictions. v3 cells without a domain are
    // treated as training (the lookup was Asia-only).
    domain: cell.domain ?? 'training',
    ...(cityName && { name: cityName }),
    _schema_version: 'atlas.v4',
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
  layer: AtlasOverlayLayer,
  cityName?: string,
): AtlasResponse {
  return {
    coord: { lat, lon },
    prediction: {
      rs_anomaly: 1.0,
      rs_anomaly_ci_low: 1.0,
      rs_anomaly_ci_high: 1.0,
      configuration: layer,
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

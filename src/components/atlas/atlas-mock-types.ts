/**
 * Atlas click-response schema. As of Night 4, atlas_lookup.json schema v3
 * carries per-cell predictions for BOTH F+NPP and Full+MODIS. The
 * AtlasMap component picks one model based on the user-toggled overlay
 * and adapts its block into AtlasResponse for the detail panel.
 */
export interface AtlasResponse {
  coord: { lat: number; lon: number; _grid_id?: string };
  prediction: {
    rs_anomaly: number;
    rs_anomaly_ci_low: number;
    rs_anomaly_ci_high: number;
    configuration: string;
    _note?: string;
  };
  /** Top-3 SHAP entries. `key` is the raw model feature key (e.g. "npp"),
   *  joinable against AtlasResponse.features and the feature knowledge
   *  base in `src/lib/feature-descriptions.ts`. */
  shap_top3: Array<{ feature: string; key?: string; value: number }>;
  /** Raw model input values at this cell, keyed by feature name. */
  features?: Record<string, number>;
  biome: { igbp_class: string; igbp_code: number };
  koppen: { zone: string; label: string };
  distance_km: {
    to_nearest_train_site: number;
    to_nearest_us_validation_site: number;
  };
  name?: string;
  outOfDomain?: boolean;
  noPrediction?: boolean;
  /** "training" = Asia (validated domain); "transfer" = non-Asia cell, a
   *  cross-continental extrapolation that the detail panel must flag. */
  domain?: 'training' | 'transfer';
  _schema_version?: string;
  _note?: string;
}

/** Per-model prediction block stored at each lookup cell (v3 schema). */
export interface AtlasModelBlock {
  pred_log_rs: number;
  pred_climate_log_rs: number;
  anomaly: number;
  shap_top3: Array<{ feature: string; key?: string; value: number }>;
  features?: Record<string, number>;
}

/** Raw cell shape inside atlas_lookup.json["cells"].
 *  Schema v4 adds `domain` ("training" for Asia cells, "transfer" for the
 *  non-Asia cells where real MODIS exists). v3 files (no `domain`) load fine —
 *  cells are then treated as training. */
export interface AtlasLookupCell {
  lat: number;
  lon: number;
  fnpp: AtlasModelBlock;
  fullmodis: AtlasModelBlock;
  biome_code: number;
  biome: string;
  koppen_code: string;
  koppen: string;
  nearest_train_km: number;
  nearest_us_km: number;
  domain?: 'training' | 'transfer';
}

/** Per-model metadata at the file root (v3 schema). */
export interface AtlasModelMeta {
  name: string;
  n_features: number;
  features: string[];
  training_n_asia: number;
  validation_n_us: number;
  transfer_r2: number;
  transfer_ci_low: number;
  transfer_ci_high: number;
}

export interface AtlasLookupFile {
  schema_version: string;
  grid: {
    resolution_deg: number;
    bbox: {
      min_lng: number;
      min_lat: number;
      max_lng: number;
      max_lat: number;
    };
    n_cells: number;
  };
  models: {
    fnpp: AtlasModelMeta;
    fullmodis: AtlasModelMeta;
  };
  /** v4: describes the training (Asia) vs transfer (rest-of-globe) split and
   *  the MODIS-coverage limitation. Absent in v3 files. */
  coverage?: {
    training_region?: { name: string; bbox: number[]; n_cells: number };
    transfer_region?: { name: string; n_cells: number };
    note?: string;
  };
  cells: AtlasLookupCell[];
}

/** Overlay choices the user can toggle. Only F+NPP and Full+MODIS are
 *  live as of Night 4 — earlier placeholder configs (F, Köppen-C/D)
 *  have been removed from the UI per the methods-table refactor. */
export type AtlasOverlayLayer = 'F+NPP' | 'Full+MODIS';

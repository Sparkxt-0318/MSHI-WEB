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

/** Raw cell shape inside atlas_lookup.json["cells"] for schema v3. */
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
  cells: AtlasLookupCell[];
}

/** Overlay choices the user can toggle. Only F+NPP and Full+MODIS are
 *  live as of Night 4 — earlier placeholder configs (F, Köppen-C/D)
 *  have been removed from the UI per the methods-table refactor. */
export type AtlasOverlayLayer = 'F+NPP' | 'Full+MODIS';

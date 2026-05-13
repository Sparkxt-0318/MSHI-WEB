/**
 * Atlas click-response schema. As of Night 3 (Phase 3), this is built
 * client-side by the AtlasMap component from the real precomputed lookup
 * at /public/data/atlas_lookup.json — see atlas-map.tsx's
 * `respondAt(lat, lon, name?)`. The detail panel still renders this
 * AtlasResponse shape; only the source of the data changed.
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
  shap_top3: Array<{ feature: string; value: number }>;
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

/**
 * Raw cell shape inside atlas_lookup.json["cells"]. Produced by
 * scripts/build_atlas_lookup.py in the MSHI repo.
 */
export interface AtlasLookupCell {
  lat: number;
  lon: number;
  pred_log_rs: number;
  pred_climate_log_rs: number;
  anomaly: number;
  shap_top3: Array<{ feature: string; value: number }>;
  biome_code: number;
  biome: string;
  koppen_code: string;
  koppen: string;
  nearest_train_km: number;
  nearest_us_km: number;
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
  model: {
    name: string;
    n_features: number;
    features: string[];
    training_n_asia: number;
    validation_n_us: number;
    transfer_r2: number;
    transfer_ci_low: number;
    transfer_ci_high: number;
  };
  cells: AtlasLookupCell[];
}

export type AtlasOverlayLayer =
  | 'F'
  | 'F+NPP'
  | 'Full+MODIS'
  | 'Koppen-C'
  | 'Koppen-D';

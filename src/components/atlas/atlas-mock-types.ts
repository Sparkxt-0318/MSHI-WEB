/**
 * Atlas click-response schema. The mock JSON at
 * /public/data/atlas_mock_response.json conforms to this shape.
 *
 * When the user supplies a real precomputed lookup, it should be keyed
 * by 0.5° grid cell id (e.g. "lat35.0_lon110.0") and the value at each
 * key should match this AtlasResponse type.
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
  _schema_version?: string;
  _note?: string;
}

export type AtlasOverlayLayer =
  | 'F'
  | 'F+NPP'
  | 'Full+MODIS'
  | 'Koppen-C'
  | 'Koppen-D';

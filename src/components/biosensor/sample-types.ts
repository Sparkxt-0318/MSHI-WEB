/**
 * Schema for biosensor sample records. The user will supply real samples
 * matching this shape. Until then, the gallery renders three explicitly
 * labeled placeholder records.
 */
export interface BiosensorSample {
  id: string;
  /** Short human-readable name. */
  name: string;
  /** Two-sentence narrative blurb shown on the card. */
  blurb: string;
  /** Site location. lat in [-90,90], lon in [-180,180]. */
  location: { lat: number; lon: number; site_label?: string };
  /** Sample collection metadata. Free-form key/value. */
  metadata: {
    sample_id: string;
    collection_date?: string;
    depth_cm?: string;
    notes?: string;
  };
  /** MSHI score in [0,1]. Mocked for placeholders. */
  mshi_score: number;
  /** Classifier output. */
  classification: 'Healthy' | 'Unhealthy' | 'Saline-stressed';
  classification_confidence: number;
  /** Marks the record as a non-real placeholder. */
  is_placeholder: true;
}

import type { BiosensorSample } from './sample-types';

/**
 * PLACEHOLDER EXAMPLES — user will provide real biosensor sample data
 * including: 4 electrochemistry CSV files per sample (CA/CV/OCP/DPV),
 * location coordinates, MSHI score, and classification label
 * (healthy / unhealthy / saline-stressed). See README for data schema.
 *
 * Every record below has is_placeholder: true so the gallery can flag
 * itself unmistakably. None of these are real measurements.
 */
export const PLACEHOLDER_SAMPLES: BiosensorSample[] = [
  {
    id: 'ph-001',
    name: 'Healthy temperate forest',
    blurb:
      'PLACEHOLDER · A representative healthy soil profile from a temperate broadleaf forest. Substituted for a real sample until user data is supplied.',
    location: { lat: 41.97, lon: -72.18, site_label: 'PLACEHOLDER site A' },
    metadata: {
      sample_id: 'PLACEHOLDER-001',
      collection_date: 'YYYY-MM-DD',
      depth_cm: '0–10',
      notes: 'No real metadata — illustrative only.',
    },
    mshi_score: 0.78,
    classification: 'Healthy',
    classification_confidence: 0.92,
    is_placeholder: true,
  },
  {
    id: 'ph-002',
    name: 'Stressed agricultural soil',
    blurb:
      'PLACEHOLDER · Intended to represent a managed cropland sample with reduced microbial activity. Real values pending.',
    location: { lat: 39.46, lon: -98.91, site_label: 'PLACEHOLDER site B' },
    metadata: {
      sample_id: 'PLACEHOLDER-002',
      collection_date: 'YYYY-MM-DD',
      depth_cm: '0–10',
      notes: 'No real metadata — illustrative only.',
    },
    mshi_score: 0.41,
    classification: 'Unhealthy',
    classification_confidence: 0.81,
    is_placeholder: true,
  },
  {
    id: 'ph-003',
    name: 'Saline-stressed coastal soil',
    blurb:
      'PLACEHOLDER · Saline-stressed brackish margin, intended to demonstrate the third classifier output. Awaiting real sample.',
    location: { lat: 30.34, lon: 120.16, site_label: 'PLACEHOLDER site C' },
    metadata: {
      sample_id: 'PLACEHOLDER-003',
      collection_date: 'YYYY-MM-DD',
      depth_cm: '0–10',
      notes: 'No real metadata — illustrative only.',
    },
    mshi_score: 0.33,
    classification: 'Saline-stressed',
    classification_confidence: 0.74,
    is_placeholder: true,
  },
];

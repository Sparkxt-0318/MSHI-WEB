/**
 * Soil-condition scenarios for the simulated remediation console.
 *
 * The console can be loaded with one of several degraded-soil scenarios. Each
 * one carries a characteristic multi-parameter SENSOR SIGNATURE (the readings
 * the biosensor would return for that soil) plus the soil-science-backed
 * remediation RESPONSE that the AI advisor should recommend for it.
 *
 * The remediation logic mirrors how real bioelectrochemical / soil remediation
 * is tuned to the diagnosed problem — you do not apply the same treatment to
 * every degraded soil. Adding nitrogen fertilizer to a saline soil, for
 * instance, deepens the osmotic stress instead of helping. The whole point of
 * multi-parameter sensing is to catch *which* problem you have.
 *
 * Dashboard numbers are illustrative (simulated for presentation); the
 * techniques named (leaching, chelation + electrokinetic extraction, liming,
 * tillage/drainage, bioaugmentation + EAB stimulation) are genuine.
 */
import type { ActionKey, Priority } from './redox-ai';

export type SoilConditionKey =
  | 'healthy'
  | 'sterile'
  | 'saline'
  | 'heavy_metal'
  | 'acidic'
  | 'compacted';

export type MetricKey =
  | 'eh'
  | 'current'
  | 'ph'
  | 'salinity'
  | 'cadmium'
  | 'aeration';

export type Tone = 'good' | 'warn' | 'bad';

/** The full multi-parameter reading the biosensor returns for a soil. */
export interface SoilMetrics {
  eh: number; // redox potential, mV (vs. Ag/AgCl)
  current: number; // extracellular-electron-transfer current, µA
  ph: number; // soil pH
  salinity: number; // electrical conductivity, dS/m
  cadmium: number; // bioavailable Cd²⁺, mg/kg
  aeration: number; // soil O₂ / pore aeration, %
}

export interface SoilCondition {
  key: SoilConditionKey;
  /** Full name (table column 1). */
  label: string;
  /** Compact label for the selector chip. */
  short: string;
  /** Primary problem (table column 2). */
  problem: string;
  /** Short title for the remediation action card. */
  remediationTitle: string;
  /** Remediation response (table column 3). */
  remediation: string;
  /** The remediation action the AI executes for this condition. */
  action: ActionKey;
  /** Expected effect blurb shown under the recommendation. */
  expected: string;
  /** Severity used for card coloring + recommendation priority. */
  tone: Tone;
  /** Accent hex for the chip + recommendation. */
  hex: string;
  /** Characteristic sensor reading the console loads for this scenario. */
  signature: SoilMetrics;
  /** Base AI confidence (%) for the diagnosis. */
  baseConfidence: number;
}

/* ------------------------- healthy reference bands ------------------------- */

/**
 * Per-metric reference bands. `trigger` is the diagnostic threshold the AI uses
 * to flag the matching condition; the `warn` band only affects card coloring.
 */
export const METRIC_RANGES = {
  eh: { target: -200, idealLo: -220, idealHi: -180, safeLo: -260, safeHi: -120 },
  current: { ideal: 25, low: 12, sterile: 8 },
  ph: { idealLo: 6.5, idealHi: 7.5, warn: 6.2, trigger: 5.8 },
  salinity: { ideal: 2.5, warn: 4.0, trigger: 3.0 },
  cadmium: { ideal: 1.2, warn: 2.5, trigger: 2.0 },
  aeration: { ideal: 40, warn: 22, trigger: 25 },
} as const;

/** Display metadata for each diagnostic metric (units + label). */
export const METRIC_META: Record<
  MetricKey,
  { label: string; unit: string; format: (v: number) => string }
> = {
  eh: { label: 'Redox · Eh', unit: 'mV', format: (v) => v.toFixed(0) },
  current: { label: 'EET Current', unit: 'µA', format: (v) => v.toFixed(1) },
  ph: { label: 'Soil pH', unit: '', format: (v) => v.toFixed(2) },
  salinity: { label: 'Salinity · EC', unit: 'dS/m', format: (v) => v.toFixed(1) },
  cadmium: { label: 'Cadmium · Cd²⁺', unit: 'mg/kg', format: (v) => v.toFixed(1) },
  aeration: { label: 'Aeration · O₂', unit: '%', format: (v) => v.toFixed(0) },
};

/** Health tone of a single metric reading, for card coloring. */
export function metricTone(key: MetricKey, v: number): Tone {
  const R = METRIC_RANGES;
  switch (key) {
    case 'eh':
      if (v >= R.eh.idealLo && v <= R.eh.idealHi) return 'good';
      if (v < R.eh.safeLo || v > R.eh.safeHi) return 'bad';
      return 'warn';
    case 'current':
      if (v >= R.current.ideal) return 'good';
      if (v >= R.current.low) return 'warn';
      return 'bad';
    case 'ph':
      if (v >= 6.3 && v <= 7.7) return 'good';
      if (v >= R.ph.warn && v <= 8.2) return 'warn';
      return 'bad';
    case 'salinity':
      if (v <= R.salinity.ideal) return 'good';
      if (v <= R.salinity.warn) return 'warn';
      return 'bad';
    case 'cadmium':
      if (v <= R.cadmium.ideal) return 'good';
      if (v <= R.cadmium.warn) return 'warn';
      return 'bad';
    case 'aeration':
      if (v >= R.aeration.ideal) return 'good';
      if (v >= R.aeration.warn) return 'warn';
      return 'bad';
  }
}

/* ----------------------------- the scenarios ----------------------------- */

export const SOIL_CONDITIONS: SoilCondition[] = [
  {
    key: 'healthy',
    label: 'Healthy baseline',
    short: 'Healthy',
    problem: 'Community well-poised — no active stressor.',
    remediationTitle: 'Maintain Monitoring',
    remediation:
      'Redox potential sits in the ideal reducing window and the electroactive community is thriving. Keep the 15-second sensing cadence and let the closed loop follow the natural drift.',
    action: 'maintain',
    expected: 'Hold Eh within ±10 mV of −200 mV',
    tone: 'good',
    hex: '#2C5F2D',
    signature: { eh: -198, current: 30, ph: 6.8, salinity: 1.2, cadmium: 0.2, aeration: 55 },
    baseConfidence: 92,
  },
  {
    key: 'sterile',
    label: 'Biologically unhealthy (sterile)',
    short: 'Sterile',
    problem: 'No active microbes — the electroactive community is absent.',
    remediationTitle: 'Inoculate + Nutrient Pulse',
    remediation:
      'Add a Geobacter / Shewanella mix, feed a glucose / nutrient pulse, and hold a steady voltage to encourage an electroactive biofilm (EAB) to form on the working electrode.',
    action: 'inoculate',
    expected: 'Builds EAB · transfer current 3 → ~28 µA',
    tone: 'bad',
    hex: '#6D28D9',
    signature: { eh: -132, current: 3, ph: 6.9, salinity: 1.4, cadmium: 0.3, aeration: 50 },
    baseConfidence: 95,
  },
  {
    key: 'saline',
    label: 'Saline-stressed',
    short: 'Saline',
    problem:
      'All the dissolved salt denatures proteins and blocks extracellular electron transfer (EET).',
    remediationTitle: 'Freshwater Leaching → Recovery',
    remediation:
      'Flush with low-salt water to wash out the salt FIRST, then let the microbes recover. Don’t add fertilizer — more ions only deepen the osmotic stress. The sensor correctly flags this as a salt problem, not a nutrient shortage.',
    action: 'leaching',
    expected: 'EC 6.6 → ~1.6 dS/m · restores EET',
    tone: 'warn',
    hex: '#B85C00',
    signature: { eh: -150, current: 9, ph: 7.0, salinity: 6.6, cadmium: 0.4, aeration: 48 },
    baseConfidence: 91,
  },
  {
    key: 'heavy_metal',
    label: 'Heavy-metal contaminated (Cd)',
    short: 'Heavy metal',
    problem: 'Cd²⁺ toxicity suppresses the microbial community.',
    remediationTitle: 'Chelation + Electrokinetic Extraction',
    remediation:
      'Add a citric-acid chelator to loosen the bound Cd²⁺, then switch on an electric field (electrokinetic extraction) to drag the freed ions toward the extraction electrode, lowering the cadmium the microbes are exposed to.',
    action: 'chelation',
    expected: 'Cd 5.4 → ~0.8 mg/kg · lifts toxic suppression',
    tone: 'bad',
    hex: '#A4221A',
    signature: { eh: -176, current: 6, ph: 6.6, salinity: 1.8, cadmium: 5.4, aeration: 47 },
    baseConfidence: 93,
  },
  {
    key: 'acidic',
    label: 'Acidic (low pH)',
    short: 'Acidic',
    problem: 'Low pH suppresses microbial activity.',
    remediationTitle: 'Liming to pH 6.5–7.5',
    remediation:
      'Spread agricultural lime to neutralize the acid and bring pH back into the 6.5–7.5 sweet spot, easing the acid stress on the electroactive community.',
    action: 'liming',
    expected: 'pH 4.7 → ~6.8 · re-activates respiration',
    tone: 'warn',
    hex: '#B85C00',
    signature: { eh: -122, current: 11, ph: 4.7, salinity: 1.6, cadmium: 0.5, aeration: 49 },
    baseConfidence: 90,
  },
  {
    key: 'compacted',
    label: 'Compacted / waterlogged',
    short: 'Compacted',
    problem: 'No oxygen and collapsed structure — air can’t get in.',
    remediationTitle: 'Tillage + Drainage → Restoration',
    remediation:
      'Till the soil to break up the compaction and improve drainage, letting oxygen back in and raising Eh out of the over-reduced zone, then rebuild the biology in the loosened soil.',
    action: 'tillage',
    expected: 'O₂ 8 → ~50% · Eh −285 → −200 mV',
    tone: 'bad',
    hex: '#1F4068',
    signature: { eh: -285, current: 14, ph: 6.4, salinity: 1.9, cadmium: 0.6, aeration: 8 },
    baseConfidence: 92,
  },
];

const CONDITION_INDEX: Record<SoilConditionKey, SoilCondition> =
  SOIL_CONDITIONS.reduce(
    (acc, c) => {
      acc[c.key] = c;
      return acc;
    },
    {} as Record<SoilConditionKey, SoilCondition>,
  );

export function getCondition(key: SoilConditionKey): SoilCondition {
  return CONDITION_INDEX[key];
}

/** Priority derived from a condition's severity tone. */
export const TONE_PRIORITY: Record<Tone, Priority> = {
  good: 'Low',
  warn: 'Medium',
  bad: 'High',
};

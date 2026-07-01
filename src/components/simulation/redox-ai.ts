/**
 * AI decision-support library for the simulated soil-redox remediation console.
 *
 * The dashboard data is illustrative (simulated for presentation), but the
 * remediation logic here is grounded in real soil electrochemistry /
 * bioelectrochemical remediation: redox potential (Eh) governs which microbial
 * metabolic pathways dominate and the fate of contaminants and redox-active
 * metals. The advisor reads a multi-parameter biosensor reading (redox, EET
 * current, pH, salinity, bioavailable Cd, aeration) and matches the diagnosed
 * problem to a soil-science-backed remediation — because you do not apply the
 * same treatment to every degraded soil. Recommendations name genuine
 * techniques (leaching, chelation + electrokinetic extraction, liming,
 * tillage/drainage, bioaugmentation + EAB stimulation). No citations are
 * fabricated.
 */
import { clamp } from './sim-model';
import {
  METRIC_RANGES,
  TONE_PRIORITY,
  getCondition,
  type SoilConditionKey,
  type SoilMetrics,
} from './soil-conditions';

export type SystemMode = 'sensing' | 'remediation';
export type Measurement = 'CA' | 'CV';
export type Priority = 'Low' | 'Medium' | 'High';

export type ActionKey =
  | 'maintain'
  | 'redox_cycling'
  | 'release_microbes'
  | 'oxidative'
  | 'electron_donor'
  | 'inoculate'
  | 'leaching'
  | 'chelation'
  | 'liming'
  | 'tillage';

export type LogKind =
  | 'routine'
  | 'stim'
  | 'release'
  | 'oxidative'
  | 'amend'
  | 'mode'
  | 'scan'
  | 'bio'
  | 'leach'
  | 'chelate'
  | 'lime'
  | 'till';

/** Optimal reducing window for the modeled anaerobic/reductive bioremediation. */
export const EH_TARGET = METRIC_RANGES.eh.target; // mV (vs. Ag/AgCl)
export const EH_BAND = 20; // ± window → −220 … −180 mV
export const EH_SAFE_LOW = METRIC_RANGES.eh.safeLo; // below: too reducing
export const EH_SAFE_HIGH = METRIC_RANGES.eh.safeHi; // above: too oxidizing
export const LOW_CURRENT = METRIC_RANGES.current.low; // µA — below this the biofilm is depleted

/** A single-reading snapshot the advisor evaluates. */
export type RedoxSnapshot = SoilMetrics;

export interface Recommendation {
  action: ActionKey;
  title: string;
  priority: Priority;
  confidence: number; // %
  /** The diagnosed primary problem (table column 2). */
  problem: string;
  /** Reasoning / remediation response (table column 3). */
  rationale: string;
  expected: string;
  /** Which soil-condition scenario this recommendation addresses. */
  condition: SoilConditionKey;
}

/** Health classification of a redox reading, for card coloring. */
export function redoxStatus(eh: number): {
  label: string;
  tone: 'good' | 'warn' | 'bad';
} {
  if (eh >= EH_TARGET - EH_BAND && eh <= EH_TARGET + EH_BAND)
    return { label: 'Healthy Conditions', tone: 'good' };
  if (eh < EH_SAFE_LOW) return { label: 'Over-reduced', tone: 'bad' };
  if (eh > EH_SAFE_HIGH) return { label: 'Over-oxidized', tone: 'bad' };
  return { label: 'Redox Imbalance', tone: 'warn' };
}

/** Human-readable log line + kind for each executed action. */
export const ACTION_META: Record<ActionKey, { log: string; kind: LogKind }> = {
  maintain: { log: 'Monitoring cycle maintained', kind: 'routine' },
  redox_cycling: { log: 'Redox cycling stimulation activated', kind: 'stim' },
  release_microbes: { log: 'Microbial consortium released', kind: 'release' },
  oxidative: { log: 'Oxidative poising + aeration applied', kind: 'oxidative' },
  electron_donor: { log: 'Electron-donor (acetate) dosed', kind: 'amend' },
  inoculate: {
    log: 'Inoculation + nutrient pulse + EAB stimulation applied',
    kind: 'bio',
  },
  leaching: { log: 'Freshwater leaching cycle initiated', kind: 'leach' },
  chelation: {
    log: 'Citric-acid chelation + electrokinetic extraction applied',
    kind: 'chelate',
  },
  liming: { log: 'Agricultural lime applied to neutralize acidity', kind: 'lime' },
  tillage: { log: 'Tillage + drainage improvement applied', kind: 'till' },
};

/** Build a recommendation straight from a diagnosed soil-condition scenario. */
function fromCondition(key: SoilConditionKey, confidence: number): Recommendation {
  const c = getCondition(key);
  return {
    action: c.action,
    title: c.remediationTitle,
    priority: TONE_PRIORITY[c.tone],
    confidence,
    problem: c.problem,
    rationale: c.remediation,
    expected: c.expected,
    condition: key,
  };
}

const pct = (x: number) => Math.round(clamp(x, 0, 0.98) * 100);

/**
 * Choose the soil-science-backed remediation recommendation for the current
 * reading. The richer contaminant / chemistry channels are checked first (they
 * name the *primary* problem and its targeted treatment); only when none is
 * flagged does the advisor fall back to fine redox-window tuning, then hold.
 */
export function evaluate(m: RedoxSnapshot): Recommendation {
  const R = METRIC_RANGES;

  // 1) Targeted, condition-specific diagnoses (the table's scenarios).
  if (m.cadmium > R.cadmium.trigger)
    return fromCondition('heavy_metal', pct(0.86 + (m.cadmium - R.cadmium.trigger) / 12));

  if (m.salinity > R.salinity.trigger)
    return fromCondition('saline', pct(0.82 + (m.salinity - R.salinity.trigger) / 12));

  if (m.ph < R.ph.trigger)
    return fromCondition('acidic', pct(0.8 + (R.ph.trigger - m.ph) / 8));

  if (m.aeration < R.aeration.trigger)
    return fromCondition('compacted', pct(0.84 + (R.aeration.trigger - m.aeration) / 120));

  if (m.current < R.current.sterile)
    return fromCondition('sterile', pct(0.85 + (R.current.sterile - m.current) / 40));

  // 2) Otherwise the chemistry is clean — fine-tune the redox operating point.
  const dev = Math.abs(m.eh - EH_TARGET);

  if (m.eh < EH_SAFE_LOW) {
    return {
      action: 'oxidative',
      title: 'Oxidative Correction',
      priority: 'High',
      confidence: pct(0.86 + (EH_SAFE_LOW - m.eh) / 400),
      problem: 'Very reducing conditions risk methane production and freeing up metals.',
      rationale:
        'Very reducing conditions (Eh below −260 mV) risk methane production (methanogenesis) and can free up iron, manganese, and trace metals (Fe(II)/Mn(II)). Briefly hold the electrode oxidizing (+0.3 V) and let in some air to lift Eh back into the safe range.',
      expected: '+45 mV toward −200 mV · keeps metals locked down',
      condition: 'healthy',
    };
  }

  if (m.eh > EH_SAFE_HIGH) {
    return {
      action: 'electron_donor',
      title: 'Electron-Donor Amendment',
      priority: 'High',
      confidence: pct(0.82 + (m.eh - EH_SAFE_HIGH) / 400),
      problem: 'Oxidizing conditions stall the reduction pathway.',
      rationale:
        'Oxidizing conditions (Eh above −120 mV) stall the reduction reactions. Feed in an easy electron donor (acetate) or a biochar electron shuttle to pull Eh down and keep the electroactive microbes respiring without oxygen.',
      expected: '−35 mV toward −200 mV · restores the reduction pathway',
      condition: 'healthy',
    };
  }

  if (m.current < LOW_CURRENT) {
    return {
      action: 'release_microbes',
      title: 'Bioaugmentation',
      priority: 'High',
      confidence: pct(0.8 + (LOW_CURRENT - m.current) / 40),
      problem: 'Depleted electroactive community — low electron-transfer current.',
      rationale:
        'A low electron-transfer current means the electroactive community is depleted. Add a mix of Geobacter / Shewanella bacteria to rebuild the biofilm and restore extracellular electron transfer.',
      expected: '+30% transfer current within 2 scans',
      condition: 'healthy',
    };
  }

  if (dev > EH_BAND) {
    return {
      action: 'redox_cycling',
      title: 'Redox Stimulation',
      priority: 'Medium',
      confidence: pct(0.62 + dev / 200),
      problem: 'Redox potential has drifted out of the optimal window.',
      rationale:
        'Eh has drifted out of the ideal window. Alternate the applied voltage (+0.3 / −0.2 V) to spur extracellular electron transfer in Geobacter, boosting respiration and pulling conditions back toward reducing.',
      expected: '≈ 15 mV toward target · +18% transfer current',
      condition: 'healthy',
    };
  }

  return {
    action: 'maintain',
    title: 'Maintain Monitoring',
    priority: 'Low',
    confidence: 92,
    problem: 'Community well-poised — no active stressor.',
    rationale:
      'Redox potential is sitting in the ideal reducing window (−220 to −180 mV) and the oxygen-free community is well balanced. No action needed; keep the 15-second sensing cycles running.',
    expected: 'Hold Eh within ±10 mV',
    condition: 'healthy',
  };
}

/** Static "model information" shown under the advisor (illustrative figures). */
export const MODEL_INFO = [
  {
    key: 'network',
    title: 'Neural Network',
    desc: 'A 1D-CNN (a neural network that reads signals) paired with a gradient-boosting model, trained on features from the CA/CV runs.',
  },
  {
    key: 'training',
    title: 'Training Data',
    desc: '28 labeled CV and CA runs across healthy, saline and degraded soils.',
  },
  {
    key: 'accuracy',
    title: 'Accuracy',
    desc: '94.2% validation accuracy on the held-out test dataset.',
  },
] as const;

export const PRIORITY_TONE: Record<Priority, 'good' | 'warn' | 'bad'> = {
  Low: 'good',
  Medium: 'warn',
  High: 'bad',
};

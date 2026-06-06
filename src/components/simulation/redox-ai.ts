/**
 * AI decision-support library for the simulated soil-redox remediation console.
 *
 * The dashboard data is illustrative (simulated for presentation), but the
 * remediation logic here is grounded in real soil electrochemistry /
 * bioelectrochemical remediation: redox potential (Eh) governs which microbial
 * metabolic pathways dominate and the fate of contaminants and redox-active
 * metals. Recommendations name genuine techniques (electrokinetic / poised-
 * potential stimulation, bioaugmentation, electron-donor amendment). No
 * citations are fabricated.
 */
import { clamp } from './sim-model';

export type SystemMode = 'sensing' | 'remediation';
export type Measurement = 'CA' | 'CV';
export type Priority = 'Low' | 'Medium' | 'High';

export type ActionKey =
  | 'maintain'
  | 'redox_cycling'
  | 'release_microbes'
  | 'oxidative'
  | 'electron_donor';

export type LogKind =
  | 'routine'
  | 'stim'
  | 'release'
  | 'oxidative'
  | 'amend'
  | 'mode'
  | 'scan';

/** Optimal reducing window for the modeled anaerobic/reductive bioremediation. */
export const EH_TARGET = -200; // mV (vs. Ag/AgCl)
export const EH_BAND = 20; // ± window → −220 … −180 mV
export const EH_SAFE_LOW = -260; // below: too reducing
export const EH_SAFE_HIGH = -120; // above: too oxidizing
export const LOW_CURRENT = 10; // µA — below this the biofilm is depleted

export interface RedoxSnapshot {
  eh: number; // mV
  current: number; // µA — extracellular electron-transfer proxy
}

export interface Recommendation {
  action: ActionKey;
  title: string;
  priority: Priority;
  confidence: number; // %
  rationale: string;
  expected: string;
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
};

/**
 * Choose the soil-science-backed remediation recommendation for the current
 * state. Ordered by urgency: safety extremes first, then community health,
 * then fine redox tuning, else hold.
 */
export function evaluate({ eh, current }: RedoxSnapshot): Recommendation {
  const dev = Math.abs(eh - EH_TARGET);

  if (eh < EH_SAFE_LOW) {
    return {
      action: 'oxidative',
      title: 'Oxidative Correction',
      priority: 'High',
      confidence: Math.round(clamp(0.86 + (EH_SAFE_LOW - eh) / 400, 0, 0.97) * 100),
      rationale:
        'Strongly reducing conditions (Eh < −260 mV) risk methanogenesis and the mobilization of Fe(II)/Mn(II) and associated trace metals. Apply transient oxidative poising (+0.3 V) with brief aeration to raise Eh back into the safe band.',
      expected: '+45 mV toward −200 mV · suppresses metal mobilization',
    };
  }

  if (eh > EH_SAFE_HIGH) {
    return {
      action: 'electron_donor',
      title: 'Electron-Donor Amendment',
      priority: 'High',
      confidence: Math.round(clamp(0.82 + (eh - EH_SAFE_HIGH) / 400, 0, 0.95) * 100),
      rationale:
        'Oxidizing conditions (Eh > −120 mV) stall reductive transformation. Dose a labile electron donor (acetate) or a biochar electron shuttle to draw Eh down and sustain anaerobic respiration by the electroactive community.',
      expected: '−35 mV toward −200 mV · restores reductive pathway',
    };
  }

  if (current < LOW_CURRENT) {
    return {
      action: 'release_microbes',
      title: 'Bioaugmentation',
      priority: 'High',
      confidence: Math.round(clamp(0.8 + (LOW_CURRENT - current) / 40, 0, 0.94) * 100),
      rationale:
        'Low electron-transfer current indicates a depleted electroactive community. Introduce a Geobacter / Shewanella-enriched consortium to rebuild the biofilm and recover extracellular electron transfer.',
      expected: '+30% transfer current within 2 scans',
    };
  }

  if (dev > EH_BAND) {
    return {
      action: 'redox_cycling',
      title: 'Redox Stimulation',
      priority: 'Medium',
      confidence: Math.round(clamp(0.62 + dev / 200, 0, 0.86) * 100),
      rationale:
        'Eh has drifted out of the optimal window. Apply alternating poised potential (+0.3 / −0.2 V) to stimulate extracellular electron transfer in Geobacter spp., enhancing microbial respiration and restoring reducing conditions.',
      expected: '≈ 15 mV toward target · +18% transfer current',
    };
  }

  return {
    action: 'maintain',
    title: 'Maintain Monitoring',
    priority: 'Low',
    confidence: 92,
    rationale:
      'Redox potential is within the optimal reducing window (−220 to −180 mV) and the anaerobic community is well-poised. No intervention required; continue 30-second sensing cycles.',
    expected: 'Hold Eh within ±10 mV',
  };
}

/** Static "model information" shown under the advisor (illustrative figures). */
export const MODEL_INFO = [
  {
    key: 'network',
    title: 'Neural Network',
    desc: '1D-CNN + gradient-boosting ensemble trained on CA/CV voltammetric features.',
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

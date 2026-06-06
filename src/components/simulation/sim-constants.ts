/**
 * Tunable constants for the /simulation feature. Single source of truth for
 * the timeline, the per-class idealized model, the voltage protocol, the 3D
 * scene geometry, and the scoreboard signal labels.
 */
import type { ClassConfig, SignalKey, SimClass } from './simulation-types';

/** Length of the simulated trial, in days (one voltage cycle ≈ one day). */
export const TOTAL_SIM_DAYS = 6;

/** Real seconds to play the whole timeline at 1× (within the 30–60 s brief). */
export const BASE_DURATION_S = 42;

/** Playback speed multipliers offered in the control bar. */
export const SPEEDS = [1, 4, 16] as const;

/** Applied-potential protocol: ±square wave, 12 h per half-cycle. */
export const V_HIGH = 0.3; // oxidative half (+0.3 V)
export const V_LOW = -0.2; // reductive half (−0.2 V)
export const HALF_PERIOD_H = 12;

/** Timeline windows (in global progress t ∈ [0,1]). */
export const CA_REVEAL = { start: 0.05, end: 0.9 } as const;
export const CV_REVEAL = { start: 0.1, end: 0.9 } as const;
export const SCALE_BRIDGE_START = 0.85;
export const CTA_REVEAL = 0.96;

/** Electric-cyan used for every electron, regardless of class. */
export const ELECTRON_HEX = '#8FE3FF';

/** Dark "scope" backdrop (matches the Atlas navy aesthetic). */
export const SCOPE_BG = '#0A1628';

/** Friendly labels for the four contributing signals. */
export const SIGNAL_LABELS: Record<SignalKey, string> = {
  electron: 'Electron transfer',
  biofilm: 'Biofilm density',
  redox: 'Redox activity',
  metabolic: 'Metabolic rate',
};
export const SIGNAL_ORDER: SignalKey[] = [
  'electron',
  'biofilm',
  'redox',
  'metabolic',
];

/**
 * Idealized per-class parameters. Values are tuned purely for a clear,
 * intuitive story (healthy is unambiguously the best), not measured.
 */
export const CLASS_CONFIGS: ClassConfig[] = [
  {
    key: 'healthy',
    label: 'Healthy',
    blurb: 'Rich microbial life — a lush biofilm, strong electron transfer.',
    hex: '#46C76A',
    tw: 'text-bedrock-good',
    mshiTarget: 0.9,
    K: 1.0,
    r: 1.7,
    day0: 1.8,
    caPeak: 1.0,
    signals: { electron: 0.94, biofilm: 0.96, redox: 0.88, metabolic: 0.9 },
  },
  {
    key: 'saline',
    label: 'Saline-stressed',
    blurb: 'Salt suppresses the community — partial colonization, muted signal.',
    hex: '#E0982B',
    tw: 'text-bedrock-warn',
    mshiTarget: 0.55,
    K: 0.55,
    r: 1.15,
    day0: 2.6,
    caPeak: 0.5,
    signals: { electron: 0.58, biofilm: 0.52, redox: 0.55, metabolic: 0.5 },
  },
  {
    key: 'unhealthy',
    label: 'Unhealthy',
    blurb: 'Degraded soil — barely colonizes, almost no current.',
    hex: '#E0483C',
    tw: 'text-accent',
    mshiTarget: 0.2,
    K: 0.2,
    r: 0.85,
    day0: 3.2,
    caPeak: 0.16,
    signals: { electron: 0.22, biofilm: 0.18, redox: 0.24, metabolic: 0.2 },
  },
];

export function classConfig(cls: SimClass): ClassConfig {
  const c = CLASS_CONFIGS.find((x) => x.key === cls);
  if (!c) throw new Error(`unknown sim class: ${cls}`);
  return c;
}

/* ------------------------------------------------------------------ */
/* 3D scene geometry (world units; ~1 unit ≈ a few mm of a real cell) */
/* ------------------------------------------------------------------ */

export const SCENE = {
  /** Horizontal spacing between the three cells. */
  cellSpacing: 3.0,
  /** Translucent vessel. */
  vesselRadius: 0.95,
  vesselHeight: 2.0,
  /** Soil medium inside the vessel. */
  soilHeight: 1.15,
  /** Electrode bars rising out of the soil. */
  electrodeHeight: 1.7,
  electrodeRadius: 0.075,
  /** Offsets of the three electrodes from the cell center (x, z). */
  electrodes: {
    working: [0, 0] as [number, number],
    counter: [0.42, 0.18] as [number, number],
    reference: [-0.42, 0.18] as [number, number],
  },
} as const;

/** Instance-count budgets (trimmed on small / coarse-pointer devices). */
export const BUDGET = {
  microbesDesktop: 64,
  microbesMobile: 30,
  electronsDesktop: 80,
  electronsMobile: 34,
} as const;

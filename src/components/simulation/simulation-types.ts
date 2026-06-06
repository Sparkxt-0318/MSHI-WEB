/**
 * Shared types for the /simulation "fast-forward electrochemistry" feature.
 *
 * This section is an ILLUSTRATIVE, idealized simulation of how the soil
 * biosensor works — biofilm colonizes a working electrode, electrons flow,
 * and a Microbial Soil Health Index (MSHI) emerges. It is tuned for clarity,
 * not a replay of recorded data.
 */
import type * as React from 'react';

export type SimClass = 'healthy' | 'saline' | 'unhealthy';

/** The four intuitive "contributing signals" the scoreboard animates. */
export type SignalKey = 'electron' | 'biofilm' | 'redox' | 'metabolic';

export interface ClassConfig {
  key: SimClass;
  label: string;
  /** One-line plain-language descriptor. */
  blurb: string;
  /** Vivid hex for the 3D scene + scoreboard swatch. */
  hex: string;
  /** Tailwind text-color class for DOM labels/numbers (site tokens). */
  tw: string;
  /** Final MSHI score in [0,1] (idealized, tuned for a clear spread). */
  mshiTarget: number;
  /** Logistic biofilm-growth parameters. */
  K: number; // carrying capacity (max coverage, 0..1)
  r: number; // growth rate
  day0: number; // inflection day
  /** Mature CA-current envelope target (arbitrary, healthy ≈ 1). */
  caPeak: number;
  /** Final values (0..1) for the four contributing signals. */
  signals: Record<SignalKey, number>;
}

/** Per-frame simulation state for one soil class. */
export interface FrameState {
  cls: SimClass;
  /** Global timeline progress, 0..1. */
  t: number;
  /** Simulated day, 0..TOTAL_SIM_DAYS. */
  day: number;
  /** Biofilm coverage, 0..1. */
  coverage: number;
  /** Instantaneous current (arbitrary units, healthy mature ≈ caPeak). */
  current: number;
  /** Smooth current envelope without the voltage-cycle ripple. */
  currentEnvelope: number;
  /** Applied potential, +0.3 or -0.2 V. */
  appliedVoltage: number;
  /** 0 = +0.3 V oxidative half-cycle, 1 = -0.2 V reductive half-cycle. */
  voltagePhase: 0 | 1;
  /** Normalized electron emission rate, 0..1 (drives the particle stream). */
  electronRate: number;
  /** Running MSHI, climbs 0..mshiTarget. */
  mshi: number;
  /** Running contributing-signal values, 0..target. */
  signals: Record<SignalKey, number>;
  /** Fraction of the CA trace revealed so far, 0..1. */
  caRevealFrac: number;
  /** Fraction of the CV trace revealed so far, 0..1. */
  cvRevealFrac: number;
}

/** A 2D polyline plus its data ranges + axis labels, for the SVG trace panels. */
export interface TraceData {
  pts: { x: number; y: number }[];
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  xLabel: string;
  yLabel: string;
}

/** Public API of the master-clock hook. */
export interface TimelineApi {
  /** Authoritative progress (0..1); read every frame, never triggers render. */
  progressRef: React.MutableRefObject<number>;
  /** Subscribe to per-frame progress updates (for imperative renderers). */
  subscribe: (cb: (t: number) => void) => () => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  setSpeed: (s: number) => void;
  scrubTo: (t: number) => void;
  reset: () => void;
  // Throttled UI mirror (safe for React state):
  playing: boolean;
  speed: number;
  progressUi: number;
  ended: boolean;
  reducedMotion: boolean;
}

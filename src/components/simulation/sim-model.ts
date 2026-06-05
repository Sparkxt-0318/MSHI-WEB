/**
 * The deterministic, idealized simulation model. Pure TypeScript — no React,
 * no randomness at runtime (a seeded PRNG is exposed for stable scene layout).
 *
 * Given a soil class and the global progress t ∈ [0,1], `simulateFrame`
 * returns everything the renderers need for that instant. `buildCaTrace` /
 * `buildCvTrace` synthesize the full CA and CV polylines (memoized per class)
 * that the SVG panels reveal progressively.
 */
import {
  CA_REVEAL,
  CV_REVEAL,
  HALF_PERIOD_H,
  TOTAL_SIM_DAYS,
  V_HIGH,
  V_LOW,
  classConfig,
} from './sim-constants';
import type {
  ClassConfig,
  FrameState,
  SignalKey,
  SimClass,
  TraceData,
} from './simulation-types';

/* ----------------------------- math helpers ----------------------------- */

export const clamp = (x: number, lo = 0, hi = 1): number =>
  Math.min(hi, Math.max(lo, x));

export const lerp = (a: number, b: number, t: number): number =>
  a + (b - a) * t;

/** Hermite smoothstep mapping [edge0, edge1] → [0,1]. */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  if (edge0 === edge1) return x < edge0 ? 0 : 1;
  const t = clamp((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

export const easeOutCubic = (x: number): number => 1 - Math.pow(1 - x, 3);

/** Deterministic logistic growth, normalized so coverage(∞) = K. */
function logistic(day: number, cfg: ClassConfig): number {
  return cfg.K / (1 + Math.exp(-cfg.r * (day - cfg.day0)));
}

/** Seeded PRNG (mulberry32) — stable scene layouts across reloads. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Smoothed square wave. `high01` is ≈1 across the oxidative (+0.3 V) first
 * half-cycle and ≈0 across the reductive (−0.2 V) second half, with soft
 * Hermite transitions at the 0.5 and wrap edges.
 */
function voltageWave(day: number): { phase: 0 | 1; high01: number } {
  const hours = day * 24;
  const cyclePos = (hours % (2 * HALF_PERIOD_H)) / (2 * HALF_PERIOD_H); // 0..1
  const w = 0.06;
  const down = smoothstep(0.5 - w, 0.5 + w, cyclePos); // 0→1 across the midpoint
  const up = smoothstep(1 - w, 1, cyclePos); // 1→0 again as the cycle wraps
  const low = clamp(down - up); // ≈1 through the reductive half
  const phase: 0 | 1 = cyclePos < 0.5 ? 0 : 1;
  return { phase, high01: 1 - low };
}

/** Tiny deterministic ripple so traces/readouts feel alive (not random). */
function microNoise(day: number): number {
  return 0.018 * Math.sin(day * 9.1) + 0.01 * Math.sin(day * 23.7 + 1.3);
}

/* ----------------------------- the model ----------------------------- */

export function simulateFrame(cls: SimClass, t: number): FrameState {
  const cfg = classConfig(cls);
  const tt = clamp(t);
  const day = tt * TOTAL_SIM_DAYS;

  const coverage = logistic(day, cfg);
  const coverageFrac = coverage / cfg.K; // 0..1 toward maturity

  const { phase, high01 } = voltageWave(day);
  const appliedVoltage = phase === 0 ? V_HIGH : V_LOW;

  // Current is larger on the oxidative (+0.3 V) half-cycle.
  const gate = lerp(0.42, 1.0, high01);
  const currentEnvelope = cfg.caPeak * coverageFrac;
  const current = currentEnvelope * gate * (1 + microNoise(day));

  // Electron emission scales with current and the oxidative gate.
  const electronRate = clamp((Math.abs(current) / Math.max(cfg.caPeak, 1e-6)) * gate);

  // Scores ease toward their idealized targets on a slightly-earlier curve so
  // the numbers "land" before the closing zoom-out.
  const scoreProgress = easeOutCubic(clamp(day / (TOTAL_SIM_DAYS * 0.9)));
  const mshi = cfg.mshiTarget * scoreProgress;

  const signals = {} as Record<SignalKey, number>;
  (Object.keys(cfg.signals) as SignalKey[]).forEach((k) => {
    // Electron + biofilm track coverage tightly; redox/metabolic ease in.
    const shape =
      k === 'electron' || k === 'biofilm' ? coverageFrac : scoreProgress;
    signals[k] = cfg.signals[k] * shape;
  });

  return {
    cls,
    t: tt,
    day,
    coverage,
    current,
    currentEnvelope,
    appliedVoltage,
    voltagePhase: phase,
    electronRate,
    mshi,
    signals,
    caRevealFrac: smoothstep(CA_REVEAL.start, CA_REVEAL.end, tt),
    cvRevealFrac: smoothstep(CV_REVEAL.start, CV_REVEAL.end, tt),
  };
}

/* --------------------------- trace synthesis --------------------------- */

const CA_POINTS = 260;
const CV_POINTS = 220;
const caCache = new Map<SimClass, TraceData>();
const cvCache = new Map<SimClass, TraceData>();

/** Full CA polyline: current vs. day, a rising logistic with square-wave ripple. */
export function buildCaTrace(cls: SimClass): TraceData {
  const cached = caCache.get(cls);
  if (cached) return cached;
  const cfg = classConfig(cls);
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i <= CA_POINTS; i++) {
    const day = (TOTAL_SIM_DAYS * i) / CA_POINTS;
    const coverageFrac = logistic(day, cfg) / cfg.K;
    const { high01 } = voltageWave(day);
    const gate = lerp(0.42, 1.0, high01);
    const y = cfg.caPeak * coverageFrac * gate * (1 + microNoise(day));
    pts.push({ x: day, y });
  }
  const data: TraceData = {
    pts,
    xMin: 0,
    xMax: TOTAL_SIM_DAYS,
    yMin: 0,
    yMax: 1.05, // shared scale across classes so the race is comparable
    xLabel: 'Time (days)',
    yLabel: 'Current',
  };
  caCache.set(cls, data);
  return data;
}

function gaussian(x: number, mu: number, sigma: number): number {
  const z = (x - mu) / sigma;
  return Math.exp(-0.5 * z * z);
}

/**
 * Full CV polyline: the classic "duck" voltammogram (current vs. potential),
 * one closed loop from −0.8 → +0.8 → −0.8 V with oxidation/reduction peaks
 * whose amplitude scales with the mature current (healthy big, unhealthy flat).
 */
export function buildCvTrace(cls: SimClass): TraceData {
  const cached = cvCache.get(cls);
  if (cached) return cached;
  const cfg = classConfig(cls);
  const amp = cfg.caPeak;
  const half = CV_POINTS / 2;
  const pts: { x: number; y: number }[] = [];
  const vLo = -0.8;
  const vHi = 0.8;
  // Forward sweep (−0.8 → +0.8): oxidation peak near +0.12 V.
  for (let i = 0; i <= half; i++) {
    const v = lerp(vLo, vHi, i / half);
    const cap = 0.06 * v; // capacitive baseline slope
    const ox = 0.85 * amp * gaussian(v, 0.12, 0.13);
    pts.push({ x: v, y: cap + ox });
  }
  // Reverse sweep (+0.8 → −0.8): reduction trough near −0.28 V.
  for (let i = 0; i <= half; i++) {
    const v = lerp(vHi, vLo, i / half);
    const cap = 0.06 * v;
    const red = -0.7 * amp * gaussian(v, -0.28, 0.13);
    pts.push({ x: v, y: cap + red });
  }
  const data: TraceData = {
    pts,
    xMin: vLo,
    xMax: vHi,
    yMin: -0.85,
    yMax: 0.95,
    xLabel: 'Potential (V)',
    yLabel: 'Current',
  };
  cvCache.set(cls, data);
  return data;
}

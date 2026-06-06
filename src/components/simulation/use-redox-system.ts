'use client';

import * as React from 'react';
import { buildCvTrace, clamp, lerp } from './sim-model';
import {
  ACTION_META,
  EH_TARGET,
  evaluate,
  redoxStatus,
  type ActionKey,
  type LogKind,
  type Measurement,
  type Recommendation,
  type SystemMode,
} from './redox-ai';

const TICK_MS = 250;
const SCAN_INTERVAL_S = 15;
const CA_WINDOW = 60; // rolling CA samples shown
const LOG_CAP = 40;

export interface CaPoint {
  t: number;
  v: number;
}
export interface CvPoint {
  x: number;
  y: number;
}
export interface LogEntry {
  id: number;
  text: string;
  time: string;
  kind: LogKind;
}

export interface RedoxSystemState {
  eh: number;
  current: number;
  mode: SystemMode;
  measurement: Measurement;
  scanCountdown: number;
  scanInterval: number;
  ca: CaPoint[];
  cv: CvPoint[];
  recommendation: Recommendation;
  log: LogEntry[];
  status: ReturnType<typeof redoxStatus>;
}

export interface RedoxSystemApi {
  state: RedoxSystemState;
  releaseMicrobes: () => void;
  redoxCycling: () => void;
  executeRecommendation: () => void;
  toggleMode: () => void;
  exportCsv: () => void;
}

const CV_BASE = buildCvTrace('healthy').pts;

function formatTime(d: Date): string {
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  });
}

function liveCv(amp: number, jitter: number): CvPoint[] {
  return CV_BASE.map((p) => ({ x: p.x, y: p.y * amp + jitter * (p.y === 0 ? 0 : 1) }));
}

// Deterministic initial state (identical on server + first client render).
const EH0 = -168;
const CUR0 = 16;
const CA0: CaPoint[] = Array.from({ length: 24 }, (_, i) => ({
  t: i,
  v: 4 + i * 0.42,
}));

function initialState(): RedoxSystemState {
  return {
    eh: EH0,
    current: CUR0,
    mode: 'remediation',
    measurement: 'CA',
    scanCountdown: SCAN_INTERVAL_S,
    scanInterval: SCAN_INTERVAL_S,
    ca: CA0,
    cv: liveCv(clamp(CUR0 / 30, 0.1, 1.6), 0),
    recommendation: evaluate({ eh: EH0, current: CUR0 }),
    log: [],
    status: redoxStatus(EH0),
  };
}

/**
 * The simulated soil-redox remediation system: a small closed-loop state
 * machine that drifts toward imbalance and responds to operator / AI actions
 * by moving Eh back toward the optimal reducing window. Drives both the
 * monitoring console and the AI advisor from one shared state.
 */
export function useRedoxSystem(): RedoxSystemApi {
  const ehRef = React.useRef(EH0);
  const baselineRef = React.useRef(EH0);
  const curRef = React.useRef(CUR0);
  const curBaseRef = React.useRef(CUR0);
  const scanRef = React.useRef(SCAN_INTERVAL_S);
  const tRef = React.useRef(CA0.length);
  const modeRef = React.useRef<SystemMode>('remediation');
  const measRef = React.useRef<Measurement>('CA');
  const caRef = React.useRef<CaPoint[]>(CA0);
  const logRef = React.useRef<LogEntry[]>([]);
  const recRef = React.useRef<Recommendation>(initialState().recommendation);
  const logIdRef = React.useRef(0);
  const recCounterRef = React.useRef(0);

  const [state, setState] = React.useState<RedoxSystemState>(initialState);

  const pushLog = React.useCallback((text: string, kind: LogKind) => {
    const entry: LogEntry = {
      id: ++logIdRef.current,
      text,
      time: formatTime(new Date()),
      kind,
    };
    logRef.current = [entry, ...logRef.current].slice(0, LOG_CAP);
  }, []);

  const recompute = React.useCallback(() => {
    recRef.current = evaluate({ eh: ehRef.current, current: curRef.current });
  }, []);

  const tick = React.useCallback(() => {
    const dt = TICK_MS / 1000;

    // Entropy: the community/conditions drift toward oxidizing imbalance.
    baselineRef.current = clamp(baselineRef.current + 1.1 * dt, -300, -110);
    curBaseRef.current = clamp(curBaseRef.current - 0.5 * dt, 4, 55);

    // Eh and current chase their baselines with a little noise.
    ehRef.current = clamp(
      ehRef.current + (baselineRef.current - ehRef.current) * 0.12 + (Math.random() - 0.5) * 2.2,
      -320,
      -60,
    );
    curRef.current = clamp(
      curRef.current + (curBaseRef.current - curRef.current) * 0.15 + (Math.random() - 0.5) * 0.8,
      0,
      60,
    );

    // Scan cadence: complete a cycle, then alternate the measurement technique.
    scanRef.current -= dt;
    if (scanRef.current <= 0) {
      scanRef.current = SCAN_INTERVAL_S;
      pushLog('Sensing cycle completed', 'scan');
      measRef.current = measRef.current === 'CA' ? 'CV' : 'CA';
      pushLog(
        `Switched to ${measRef.current === 'CA' ? 'Chronoamperometry' : 'Cyclic Voltammetry'} measurement`,
        'scan',
      );
    }

    // Live trace for the active technique.
    tRef.current += dt;
    if (measRef.current === 'CA') {
      caRef.current = [...caRef.current, { t: tRef.current, v: curRef.current }].slice(-CA_WINDOW);
    }
    const cv = liveCv(clamp(curRef.current / 30, 0.1, 1.6), (Math.random() - 0.5) * 0.04);

    // Re-evaluate the recommendation on a calmer cadence than the numbers.
    if (++recCounterRef.current % 5 === 0) recompute();

    setState({
      eh: ehRef.current,
      current: curRef.current,
      mode: modeRef.current,
      measurement: measRef.current,
      scanCountdown: Math.ceil(scanRef.current),
      scanInterval: SCAN_INTERVAL_S,
      ca: caRef.current,
      cv,
      recommendation: recRef.current,
      log: logRef.current,
      status: redoxStatus(ehRef.current),
    });
  }, [pushLog, recompute]);

  const applyAction = React.useCallback(
    (action: ActionKey) => {
      const meta = ACTION_META[action];
      if (action !== 'maintain') {
        const strength = action === 'redox_cycling' ? 0.85 : 0.7;
        baselineRef.current = lerp(baselineRef.current, EH_TARGET, strength);
        ehRef.current = lerp(ehRef.current, EH_TARGET, strength * 0.6);
        const boost =
          action === 'release_microbes' ? 15 : action === 'redox_cycling' ? 8 : 4;
        curBaseRef.current = clamp(curBaseRef.current + boost, 4, 55);
        curRef.current = clamp(curRef.current + boost * 0.6, 0, 60);
        modeRef.current = 'remediation';
      }
      pushLog(meta.log, meta.kind);
      recompute();
    },
    [pushLog, recompute],
  );

  const releaseMicrobes = React.useCallback(() => applyAction('release_microbes'), [applyAction]);
  const redoxCycling = React.useCallback(() => applyAction('redox_cycling'), [applyAction]);
  const executeRecommendation = React.useCallback(
    () => applyAction(recRef.current.action),
    [applyAction],
  );

  const toggleMode = React.useCallback(() => {
    modeRef.current = modeRef.current === 'sensing' ? 'remediation' : 'sensing';
    pushLog(`Switched to ${modeRef.current} mode`, 'mode');
  }, [pushLog]);

  const exportCsv = React.useCallback(() => {
    if (typeof document === 'undefined') return;
    const rows = [
      ['Time', 'Event', 'Type'],
      ...logRef.current.map((e) => [e.time, e.text, e.kind]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'soil-redox-event-log.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, []);

  // Seed a little history, then run the live loop (reduced-motion → slower).
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const now = Date.now();
    const seed: { text: string; kind: LogKind; ago: number }[] = [
      { text: 'System initialized · sensing active', kind: 'routine', ago: 28 },
      { text: 'Redox cycling stimulation activated', kind: 'stim', ago: 19 },
      { text: 'Switched to Cyclic Voltammetry measurement', kind: 'scan', ago: 12 },
      { text: 'Sensing cycle completed', kind: 'scan', ago: 4 },
    ];
    logRef.current = seed
      .map((s) => ({
        id: ++logIdRef.current,
        text: s.text,
        time: formatTime(new Date(now - s.ago * 1000)),
        kind: s.kind,
      }))
      .reverse();

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const period = reduced ? 1000 : TICK_MS;
    const id = window.setInterval(() => {
      if (!document.hidden) tick();
    }, period);
    return () => window.clearInterval(id);
  }, [tick]);

  return {
    state,
    releaseMicrobes,
    redoxCycling,
    executeRecommendation,
    toggleMode,
    exportCsv,
  };
}

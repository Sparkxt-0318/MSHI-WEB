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
import {
  getCondition,
  type SoilConditionKey,
  type SoilMetrics,
} from './soil-conditions';

const TICK_MS = 250;
const SCAN_INTERVAL_S = 15;
const CA_WINDOW = 60; // rolling CA samples shown
const LOG_CAP = 40;

/** Remediation actions that fully resolve a loaded scenario back to healthy. */
const CONDITION_REMEDIES: ReadonlySet<ActionKey> = new Set<ActionKey>([
  'inoculate',
  'leaching',
  'chelation',
  'liming',
  'tillage',
]);

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

export interface RedoxSystemState extends SoilMetrics {
  condition: SoilConditionKey;
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
  running: boolean;
  started: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
  releaseMicrobes: () => void;
  redoxCycling: () => void;
  executeRecommendation: () => void;
  loadCondition: (key: SoilConditionKey) => void;
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

// Deterministic initial reading (identical on server + first client render):
// a gently-drifting healthy soil, slightly out of the redox window.
const INIT: SoilMetrics = {
  eh: -168,
  current: 16,
  ph: 6.8,
  salinity: 1.3,
  cadmium: 0.3,
  aeration: 52,
};
const CA0: CaPoint[] = Array.from({ length: 24 }, (_, i) => ({
  t: i,
  v: 4 + i * 0.42,
}));

function initialState(): RedoxSystemState {
  return {
    ...INIT,
    condition: 'healthy',
    mode: 'remediation',
    measurement: 'CA',
    scanCountdown: SCAN_INTERVAL_S,
    scanInterval: SCAN_INTERVAL_S,
    ca: CA0,
    cv: liveCv(clamp(INIT.current / 30, 0.1, 1.6), 0),
    recommendation: evaluate(INIT),
    log: [],
    status: redoxStatus(INIT.eh),
  };
}

/**
 * The simulated soil-redox remediation system: a small closed-loop state
 * machine that can be loaded with degraded-soil scenarios and that responds to
 * operator / AI actions by moving the reading back toward a healthy soil. The
 * healthy baseline slowly drifts toward imbalance (entropy); a loaded scenario
 * holds its problem signature until the matching remediation is applied. Drives
 * both the monitoring console and the AI advisor from one shared state.
 */
export function useRedoxSystem(): RedoxSystemApi {
  // Live value + slow "baseline" each value chases, per diagnostic channel.
  const ehRef = React.useRef(INIT.eh);
  const ehBaseRef = React.useRef(INIT.eh);
  const curRef = React.useRef(INIT.current);
  const curBaseRef = React.useRef(INIT.current);
  const phRef = React.useRef(INIT.ph);
  const phBaseRef = React.useRef(INIT.ph);
  const salRef = React.useRef(INIT.salinity);
  const salBaseRef = React.useRef(INIT.salinity);
  const cdRef = React.useRef(INIT.cadmium);
  const cdBaseRef = React.useRef(INIT.cadmium);
  const o2Ref = React.useRef(INIT.aeration);
  const o2BaseRef = React.useRef(INIT.aeration);

  const conditionRef = React.useRef<SoilConditionKey>('healthy');
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
  const [running, setRunning] = React.useState(false);
  const [started, setStarted] = React.useState(false);

  const metrics = React.useCallback(
    (): SoilMetrics => ({
      eh: ehRef.current,
      current: curRef.current,
      ph: phRef.current,
      salinity: salRef.current,
      cadmium: cdRef.current,
      aeration: o2Ref.current,
    }),
    [],
  );

  /** Snapshot the refs into a renderable state object. */
  const buildState = React.useCallback(
    (): RedoxSystemState => ({
      ...metrics(),
      condition: conditionRef.current,
      mode: modeRef.current,
      measurement: measRef.current,
      scanCountdown: Math.ceil(scanRef.current),
      scanInterval: SCAN_INTERVAL_S,
      ca: caRef.current,
      cv: liveCv(clamp(curRef.current / 30, 0.1, 1.6), 0),
      recommendation: recRef.current,
      log: logRef.current,
      status: redoxStatus(ehRef.current),
    }),
    [metrics],
  );

  const flush = React.useCallback(() => setState(buildState()), [buildState]);

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
    recRef.current = evaluate(metrics());
  }, [metrics]);

  const tick = React.useCallback(() => {
    const dt = TICK_MS / 1000;
    const noise = (a: number) => (Math.random() - 0.5) * a;

    if (conditionRef.current === 'healthy') {
      // Entropy: a healthy community/conditions drift toward oxidizing imbalance.
      ehBaseRef.current = clamp(ehBaseRef.current + 1.1 * dt, -300, -110);
      curBaseRef.current = clamp(curBaseRef.current - 0.5 * dt, 4, 55);
    }
    // A loaded scenario holds its problem signature (baselines fixed on load).

    // Each channel chases its baseline with a little noise.
    ehRef.current = clamp(
      ehRef.current + (ehBaseRef.current - ehRef.current) * 0.12 + noise(2.2),
      -320,
      -60,
    );
    curRef.current = clamp(
      curRef.current + (curBaseRef.current - curRef.current) * 0.15 + noise(0.8),
      0,
      60,
    );
    phRef.current = clamp(phRef.current + (phBaseRef.current - phRef.current) * 0.18 + noise(0.03), 3.5, 9);
    salRef.current = clamp(salRef.current + (salBaseRef.current - salRef.current) * 0.18 + noise(0.05), 0.2, 9);
    cdRef.current = clamp(cdRef.current + (cdBaseRef.current - cdRef.current) * 0.18 + noise(0.04), 0, 8);
    o2Ref.current = clamp(o2Ref.current + (o2BaseRef.current - o2Ref.current) * 0.18 + noise(0.6), 0, 80);

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

    // Re-evaluate the recommendation on a calmer cadence than the numbers.
    if (++recCounterRef.current % 5 === 0) recompute();

    setState(buildState());
  }, [buildState, pushLog, recompute]);

  const applyAction = React.useCallback(
    (action: ActionKey) => {
      const meta = ACTION_META[action];
      const T = EH_TARGET;

      switch (action) {
        case 'inoculate':
          curBaseRef.current = 30;
          curRef.current = clamp(curRef.current + 18, 0, 60);
          ehBaseRef.current = lerp(ehBaseRef.current, T, 0.7);
          ehRef.current = lerp(ehRef.current, T, 0.5);
          break;
        case 'leaching':
          salBaseRef.current = 1.4;
          salRef.current = lerp(salRef.current, 1.5, 0.7);
          curBaseRef.current = clamp(curBaseRef.current + 14, 4, 55);
          curRef.current = clamp(curRef.current + 8, 0, 60);
          ehBaseRef.current = lerp(ehBaseRef.current, T, 0.6);
          ehRef.current = lerp(ehRef.current, T, 0.45);
          break;
        case 'chelation':
          cdBaseRef.current = 0.8;
          cdRef.current = lerp(cdRef.current, 0.9, 0.7);
          curBaseRef.current = clamp(curBaseRef.current + 15, 4, 55);
          curRef.current = clamp(curRef.current + 9, 0, 60);
          ehBaseRef.current = lerp(ehBaseRef.current, T, 0.6);
          ehRef.current = lerp(ehRef.current, T, 0.45);
          break;
        case 'liming':
          phBaseRef.current = 6.8;
          phRef.current = lerp(phRef.current, 6.7, 0.7);
          curBaseRef.current = clamp(curBaseRef.current + 12, 4, 55);
          curRef.current = clamp(curRef.current + 7, 0, 60);
          ehBaseRef.current = lerp(ehBaseRef.current, T, 0.55);
          ehRef.current = lerp(ehRef.current, T, 0.4);
          break;
        case 'tillage':
          o2BaseRef.current = 50;
          o2Ref.current = lerp(o2Ref.current, 48, 0.7);
          ehBaseRef.current = lerp(ehBaseRef.current, T, 0.75);
          ehRef.current = lerp(ehRef.current, T, 0.6);
          curBaseRef.current = clamp(curBaseRef.current + 6, 4, 55);
          curRef.current = clamp(curRef.current + 4, 0, 60);
          break;
        case 'oxidative':
        case 'electron_donor':
        case 'redox_cycling':
        case 'release_microbes': {
          const strength = action === 'redox_cycling' ? 0.85 : 0.7;
          ehBaseRef.current = lerp(ehBaseRef.current, T, strength);
          ehRef.current = lerp(ehRef.current, T, strength * 0.6);
          const boost =
            action === 'release_microbes' ? 15 : action === 'redox_cycling' ? 8 : 4;
          curBaseRef.current = clamp(curBaseRef.current + boost, 4, 55);
          curRef.current = clamp(curRef.current + boost * 0.6, 0, 60);
          break;
        }
        case 'maintain':
          break;
      }

      if (action !== 'maintain') modeRef.current = 'remediation';
      if (CONDITION_REMEDIES.has(action) && conditionRef.current !== 'healthy') {
        conditionRef.current = 'healthy';
        pushLog('Scenario resolved → healthy baseline restored', 'routine');
      }
      pushLog(meta.log, meta.kind);
      recompute();
      flush();
    },
    [flush, pushLog, recompute],
  );

  const loadCondition = React.useCallback(
    (key: SoilConditionKey) => {
      const s = getCondition(key).signature;
      conditionRef.current = key;
      ehRef.current = ehBaseRef.current = s.eh;
      curRef.current = curBaseRef.current = s.current;
      phRef.current = phBaseRef.current = s.ph;
      salRef.current = salBaseRef.current = s.salinity;
      cdRef.current = cdBaseRef.current = s.cadmium;
      o2Ref.current = o2BaseRef.current = s.aeration;
      modeRef.current = key === 'healthy' ? 'sensing' : 'remediation';
      pushLog(
        key === 'healthy'
          ? 'Loaded soil scenario: Healthy baseline'
          : `Loaded soil scenario: ${getCondition(key).label}`,
        'mode',
      );
      recompute();
      flush();
    },
    [flush, pushLog, recompute],
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

  const seedLog = React.useCallback(() => {
    logRef.current = [
      {
        id: ++logIdRef.current,
        text: 'Experiment started · sensing active',
        time: formatTime(new Date()),
        kind: 'routine',
      },
    ];
  }, []);

  const start = React.useCallback(() => {
    setStarted((was) => {
      if (!was) seedLog();
      return true;
    });
    setRunning(true);
  }, [seedLog]);

  const pause = React.useCallback(() => setRunning(false), []);

  const reset = React.useCallback(() => {
    setRunning(false);
    setStarted(false);
    ehRef.current = ehBaseRef.current = INIT.eh;
    curRef.current = curBaseRef.current = INIT.current;
    phRef.current = phBaseRef.current = INIT.ph;
    salRef.current = salBaseRef.current = INIT.salinity;
    cdRef.current = cdBaseRef.current = INIT.cadmium;
    o2Ref.current = o2BaseRef.current = INIT.aeration;
    conditionRef.current = 'healthy';
    scanRef.current = SCAN_INTERVAL_S;
    tRef.current = CA0.length;
    modeRef.current = 'remediation';
    measRef.current = 'CA';
    caRef.current = CA0;
    logRef.current = [];
    recRef.current = evaluate(INIT);
    recCounterRef.current = 0;
    setState(initialState());
  }, []);

  // Run the live loop only while started + running (reduced-motion → slower).
  React.useEffect(() => {
    if (!running || typeof window === 'undefined') return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const period = reduced ? 1000 : TICK_MS;
    const id = window.setInterval(() => {
      if (!document.hidden) tick();
    }, period);
    return () => window.clearInterval(id);
  }, [running, tick]);

  return {
    state,
    running,
    started,
    start,
    pause,
    reset,
    releaseMicrobes,
    redoxCycling,
    executeRecommendation,
    loadCondition,
    toggleMode,
    exportCsv,
  };
}

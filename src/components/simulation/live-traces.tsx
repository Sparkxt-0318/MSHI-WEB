'use client';

import * as React from 'react';
import { CA_REVEAL, CLASS_CONFIGS, CV_REVEAL } from './sim-constants';
import { buildCaTrace, buildCvTrace, smoothstep } from './sim-model';
import type { TraceData } from './simulation-types';

const VB_W = 120;
const VB_H = 70;
const PAD_L = 12;
const PAD_R = 6;
const PAD_T = 6;
const PAD_B = 12;

function toPath(trace: TraceData): string {
  const sx = (x: number) =>
    PAD_L + ((x - trace.xMin) / (trace.xMax - trace.xMin)) * (VB_W - PAD_L - PAD_R);
  const sy = (y: number) =>
    VB_H - PAD_B - ((y - trace.yMin) / (trace.yMax - trace.yMin)) * (VB_H - PAD_T - PAD_B);
  return trace.pts
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${sx(p.x).toFixed(2)} ${sy(p.y).toFixed(2)}`)
    .join(' ');
}

interface PanelSpec {
  code: string;
  name: string;
  reveal: { start: number; end: number };
  series: { color: string; d: string }[];
  yZero?: number; // viewBox-y of the 0 line, if within range
}

function buildPanels(): { ca: PanelSpec; cv: PanelSpec } {
  const ca = CLASS_CONFIGS.map((c) => ({
    color: c.hex,
    d: toPath(buildCaTrace(c.key)),
  }));
  const cv = CLASS_CONFIGS.map((c) => ({
    color: c.hex,
    d: toPath(buildCvTrace(c.key)),
  }));
  const cvTrace = buildCvTrace('healthy');
  const cvZero =
    VB_H - PAD_B - ((0 - cvTrace.yMin) / (cvTrace.yMax - cvTrace.yMin)) * (VB_H - PAD_T - PAD_B);
  return {
    ca: { code: 'CA', name: 'Current vs. time', reveal: CA_REVEAL, series: ca },
    cv: { code: 'CV', name: 'Current vs. voltage', reveal: CV_REVEAL, series: cv, yZero: cvZero },
  };
}

function Panel({
  panel,
  pathRefs,
}: {
  panel: PanelSpec;
  pathRefs: React.MutableRefObject<(SVGPathElement | null)[]>;
}) {
  return (
    <div className="rounded-sm border border-white/10 bg-[#0a1628]/70 p-2 backdrop-blur-sm">
      <div className="mb-1 flex items-baseline justify-between">
        <span className="font-mono text-[0.6rem] uppercase tracking-[0.08em] text-cyan-300/90">
          {panel.code}
        </span>
        <span className="font-mono text-[0.55rem] text-white/45">{panel.name}</span>
      </div>
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="h-[72px] w-full sm:h-[84px]">
        {/* axes */}
        <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={VB_H - PAD_B} stroke="#39516b" strokeWidth={0.5} />
        <line x1={PAD_L} y1={VB_H - PAD_B} x2={VB_W - PAD_R} y2={VB_H - PAD_B} stroke="#39516b" strokeWidth={0.5} />
        {panel.yZero != null ? (
          <line
            x1={PAD_L}
            y1={panel.yZero}
            x2={VB_W - PAD_R}
            y2={panel.yZero}
            stroke="#39516b"
            strokeWidth={0.4}
            strokeDasharray="1.5 1.5"
          />
        ) : null}
        {panel.series.map((s, i) => (
          <path
            key={i}
            ref={(el) => {
              pathRefs.current[i] = el;
            }}
            d={s.d}
            fill="none"
            stroke={s.color}
            strokeWidth={1.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1}
          />
        ))}
      </svg>
    </div>
  );
}

/** The two self-drawing scope panels. Reveals all three classes' synthetic CA
 *  and CV curves in lock-step with the timeline (imperative, no re-render). */
function LiveTracesImpl({
  subscribe,
}: {
  subscribe: (cb: (t: number) => void) => () => void;
}) {
  const panels = React.useMemo(buildPanels, []);
  const caRefs = React.useRef<(SVGPathElement | null)[]>([]);
  const cvRefs = React.useRef<(SVGPathElement | null)[]>([]);

  React.useEffect(() => {
    const unsub = subscribe((t) => {
      const caOff = 1 - smoothstep(panels.ca.reveal.start, panels.ca.reveal.end, t);
      const cvOff = 1 - smoothstep(panels.cv.reveal.start, panels.cv.reveal.end, t);
      for (const p of caRefs.current)
        if (p) p.style.strokeDashoffset = String(caOff);
      for (const p of cvRefs.current)
        if (p) p.style.strokeDashoffset = String(cvOff);
    });
    return unsub;
  }, [panels, subscribe]);

  return (
    <div className="flex w-[178px] flex-col gap-2 sm:w-[208px]">
      <Panel panel={panels.ca} pathRefs={caRefs} />
      <Panel panel={panels.cv} pathRefs={cvRefs} />
    </div>
  );
}

export const LiveTraces = React.memo(LiveTracesImpl);

'use client';

import * as React from 'react';
import { CLASS_CONFIGS, SIGNAL_LABELS, SIGNAL_ORDER } from './sim-constants';
import { simulateFrame } from './sim-model';

/** MSHI scoreboard: the three classes' scores climbing in the race, plus the
 *  contributing-signal bars for the leading (healthy) cell. Driven by the
 *  throttled UI progress — cheap React re-renders (~12/s). */
export function Scoreboard({ progressUi }: { progressUi: number }) {
  const frames = CLASS_CONFIGS.map((c) => ({
    cfg: c,
    frame: simulateFrame(c.key, progressUi),
  }));
  const lead = frames.find((f) => f.cfg.key === 'healthy') ?? frames[0];

  return (
    <div className="w-[200px] rounded-sm border border-white/10 bg-[#0a1628]/70 p-3 backdrop-blur-sm sm:w-[224px]">
      <p className="font-mono text-[0.58rem] uppercase tracking-[0.1em] text-white/55">
        Microbial Soil Health Index
      </p>

      <div className="mt-2.5 space-y-2.5">
        {frames.map(({ cfg, frame }) => (
          <div key={cfg.key}>
            <div className="flex items-baseline justify-between">
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: cfg.hex }}
                />
                <span className="text-[0.72rem] text-white/80">{cfg.label}</span>
              </span>
              <span
                className="font-serif text-base font-bold tabular-nums"
                style={{ color: cfg.hex }}
              >
                {frame.mshi.toFixed(2)}
              </span>
            </div>
            <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full transition-[width] duration-150 ease-out"
                style={{ width: `${frame.mshi * 100}%`, background: cfg.hex }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 border-t border-white/10 pt-2.5">
        <p className="font-mono text-[0.55rem] uppercase tracking-[0.08em] text-white/45">
          Contributing signals · healthy cell
        </p>
        <div className="mt-2 space-y-1.5">
          {SIGNAL_ORDER.map((key) => (
            <div key={key} className="flex items-center gap-2">
              <span className="w-[88px] shrink-0 text-[0.6rem] text-white/60">
                {SIGNAL_LABELS[key]}
              </span>
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-cyan-300/80 transition-[width] duration-150 ease-out"
                  style={{ width: `${lead.frame.signals[key] * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

'use client';

import * as React from 'react';
import {
  Beaker,
  Biohazard,
  Layers,
  Microscope,
  Sprout,
  Target,
  Waves,
  Wrench,
} from 'lucide-react';
import {
  SOIL_CONDITIONS,
  getCondition,
  type SoilConditionKey,
} from './soil-conditions';
import type { RedoxSystemApi } from './use-redox-system';

const TONE_HEX = { good: '#2C5F2D', warn: '#B85C00', bad: '#A4221A' } as const;

const CONDITION_ICON: Record<SoilConditionKey, React.ReactNode> = {
  healthy: <Sprout className="h-4 w-4" />,
  sterile: <Microscope className="h-4 w-4" />,
  saline: <Waves className="h-4 w-4" />,
  heavy_metal: <Biohazard className="h-4 w-4" />,
  acidic: <Beaker className="h-4 w-4" />,
  compacted: <Layers className="h-4 w-4" />,
};

/**
 * The soil-condition scenario bar. Loads a degraded-soil signature into the
 * live console and lets the operator switch scenarios at any time — the AI
 * advisor re-diagnoses the primary problem and adapts its remediation. Surfaces
 * the diagnostic-feedback loop: different conditions require different
 * interventions.
 */
export function ScenarioSelector({ api }: { api: RedoxSystemApi }) {
  const active = api.state.condition;
  const cond = getCondition(active);
  const accent = cond.hex;
  const tone = TONE_HEX[cond.tone];

  return (
    <div className="rounded-md border border-rule bg-paper p-5" style={{ borderLeft: `3px solid ${accent}` }}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[0.62rem] uppercase tracking-meta text-ink-soft">
            Soil Condition Scenario
          </p>
          <h3 className="mt-1 font-serif text-lg font-bold text-ink">
            Load a soil — watch the AI adapt the remediation.
          </h3>
        </div>
        <p className="max-w-[34ch] text-[0.8rem] leading-snug text-ink-soft">
          You don&rsquo;t apply the same treatment to every degraded soil. Switch
          scenarios anytime; the advisor re-diagnoses live.
        </p>
      </div>

      {/* scenario chips */}
      <div className="mt-4 flex flex-wrap gap-2">
        {SOIL_CONDITIONS.map((c) => {
          const selected = c.key === active;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => api.loadCondition(c.key)}
              aria-pressed={selected}
              className="inline-flex items-center gap-2 rounded-md border px-3 py-2 font-mono text-[0.7rem] uppercase tracking-meta transition-colors"
              style={
                selected
                  ? { borderColor: c.hex, background: `${c.hex}14`, color: c.hex }
                  : { borderColor: '#C8CCD2', background: 'transparent', color: '#3A4048' }
              }
            >
              <span style={{ color: selected ? c.hex : '#3A4048' }}>
                {CONDITION_ICON[c.key]}
              </span>
              {c.short}
            </button>
          );
        })}
      </div>

      {/* active scenario: problem → remediation (the diagnostic-feedback loop) */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-md border border-rule bg-cream/40 p-4" style={{ borderLeft: `3px solid ${tone}` }}>
          <p className="flex items-center gap-1.5 font-mono text-[0.6rem] uppercase tracking-meta text-ink-soft">
            <Target className="h-3.5 w-3.5" /> Primary problem
          </p>
          <p className="mt-1.5 text-[0.9rem] leading-relaxed text-ink">{cond.problem}</p>
        </div>
        <div className="rounded-md border border-rule bg-cream/40 p-4" style={{ borderLeft: `3px solid ${accent}` }}>
          <p className="flex items-center gap-1.5 font-mono text-[0.6rem] uppercase tracking-meta text-ink-soft">
            <Wrench className="h-3.5 w-3.5" /> Remediation response
          </p>
          <p className="mt-1.5 text-[0.9rem] leading-relaxed text-ink">
            <span className="font-semibold">{cond.remediationTitle}.</span> {cond.remediation}
          </p>
        </div>
      </div>
    </div>
  );
}

'use client';

import * as React from 'react';
import { SCALE_BRIDGE_START, TOTAL_SIM_DAYS } from './sim-constants';
import { simulateFrame } from './sim-model';

const CAPTIONS: { until: number; text: string }[] = [
  { until: 0.12, text: 'Bacteria settle onto the electrode and the cell is wired up — the applied voltage begins its slow cycle.' },
  { until: 0.4, text: 'The biofilm spreads. Electrons start flowing to the electrode, and the current trace lifts off.' },
  { until: 0.7, text: 'Healthy soil teems with life and current; the salt-stressed and degraded soils visibly lag behind.' },
  { until: SCALE_BRIDGE_START, text: 'Each soil settles at its own health score — the gap between living and lifeless soil is unmistakable.' },
  { until: 1.01, text: 'Zooming out — the same living signal scales from this centimeter-wide cell to the whole continent.' },
];

export function SceneCaption({ progressUi }: { progressUi: number }) {
  const caption = CAPTIONS.find((c) => progressUi < c.until) ?? CAPTIONS[CAPTIONS.length - 1];
  const day = Math.min(TOTAL_SIM_DAYS, progressUi * TOTAL_SIM_DAYS);
  const { appliedVoltage } = simulateFrame('healthy', progressUi);
  const vLabel = appliedVoltage >= 0 ? `+${appliedVoltage.toFixed(2)} V` : `${appliedVoltage.toFixed(2)} V`;

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
      <p className="max-w-[60ch] text-[0.9rem] italic leading-snug text-ink-soft">
        {caption.text}
      </p>
      <p className="shrink-0 font-mono text-[0.7rem] uppercase tracking-meta text-ink-soft">
        Day {day.toFixed(1)} / {TOTAL_SIM_DAYS}
        <span className="mx-2 text-rule">·</span>
        <span className="text-accent">{vLabel}</span>
      </p>
    </div>
  );
}

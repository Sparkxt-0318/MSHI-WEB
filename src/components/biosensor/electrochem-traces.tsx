'use client';

import * as React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { cn } from '@/lib/utils';
import type { BiosensorSample, TechniqueKey } from './sample-types';

/**
 * Renders one Recharts line chart per technique the sample actually has.
 * Phase I samples have CA + CV; Phase II adds OCP. There is no DPV panel —
 * the corpus contains no DPV trace and none is fabricated. Empty slots are
 * never rendered: the grid only maps over real traces.
 */

const TECHNIQUE_META: Record<
  TechniqueKey,
  { code: string; name: string; color: string }
> = {
  ca: { code: 'CA', name: 'Chronoamperometry', color: '#A4221A' },
  cv: { code: 'CV', name: 'Cyclic Voltammetry', color: '#3F7CAB' },
  ocp: { code: 'OCP', name: 'Open-Circuit Potential', color: '#2C5F2D' },
};

function fmtNumber(v: number): string {
  if (v === 0) return '0';
  const abs = Math.abs(v);
  if (abs < 1e-3 || abs >= 1e4) return v.toExponential(1);
  return parseFloat(v.toPrecision(3)).toString();
}

interface ElectrochemTracesProps {
  sample: Pick<BiosensorSample, 'techniques' | 'traces'>;
  className?: string;
}

export function ElectrochemTraces({
  sample,
  className,
}: ElectrochemTracesProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-px border border-rule bg-rule sm:grid-cols-2',
        className,
      )}
    >
      {sample.techniques.map((key) => {
        const trace = sample.traces[key];
        if (!trace) return null;
        const meta = TECHNIQUE_META[key];
        const data = trace.x.map((xv, i) => ({ x: xv, y: trace.y[i] }));
        return (
          <div key={key} className="flex flex-col bg-paper p-4">
            <div className="flex items-baseline justify-between">
              <span
                className="font-mono text-[0.7rem] uppercase tracking-meta"
                style={{ color: meta.color }}
              >
                {meta.code}
              </span>
              <span className="font-serif text-[0.85rem] italic text-ink-soft">
                {meta.name}
              </span>
            </div>
            <div className="mt-2 h-[150px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data}
                  margin={{ top: 8, right: 10, left: 4, bottom: 0 }}
                >
                  <CartesianGrid stroke="#E5E5E5" vertical={false} />
                  <XAxis
                    dataKey="x"
                    type="number"
                    domain={['auto', 'auto']}
                    tickFormatter={fmtNumber}
                    tick={{
                      fill: '#3A4048',
                      fontSize: 9,
                      fontFamily: 'SF Mono, Menlo, monospace',
                    }}
                    tickLine={false}
                    axisLine={{ stroke: '#C8CCD2' }}
                    minTickGap={28}
                  />
                  <YAxis
                    tickFormatter={fmtNumber}
                    tick={{
                      fill: '#3A4048',
                      fontSize: 9,
                      fontFamily: 'SF Mono, Menlo, monospace',
                    }}
                    tickLine={false}
                    axisLine={false}
                    width={48}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#FAF8F5',
                      border: '1px solid #C8CCD2',
                      borderRadius: 0,
                      fontFamily: 'SF Mono, monospace',
                      fontSize: 11,
                    }}
                    labelFormatter={(label) =>
                      `${trace.xlabel}: ${fmtNumber(Number(label))}`
                    }
                    formatter={(value: number | string) => [
                      fmtNumber(Number(value)),
                      trace.ylabel,
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="y"
                    stroke={meta.color}
                    strokeWidth={1.4}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-1 flex justify-between font-mono text-[0.62rem] text-ink-soft">
              <span>{trace.xlabel}</span>
              <span>{trace.ylabel}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

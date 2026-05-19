'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { cn } from '@/lib/utils';
import type {
  BiosensorSample,
  DpvReference,
  TechniqueKey,
} from './sample-types';

/**
 * One Recharts line chart per technique the sample actually has (Phase I:
 * CA + CV; Phase II adds OCP), rendered as uniform squares. When a DPV
 * reference is supplied it is appended as a fourth uniform square, clearly
 * tagged as a digitized published reference — it is NOT a per-sample
 * measurement (the corpus has no per-sample dpv.txt and none is
 * fabricated). All panels are the same size; none is stretched.
 */

const TECHNIQUE_META: Record<
  TechniqueKey,
  { code: string; name: string; color: string }
> = {
  ca: { code: 'CA', name: 'Chronoamperometry', color: '#A4221A' },
  cv: { code: 'CV', name: 'Cyclic Voltammetry', color: '#3F7CAB' },
  ocp: { code: 'OCP', name: 'Open-Circuit Potential', color: '#2C5F2D' },
};

const DPV_COLOR = '#B85C00';

function fmtNumber(v: number): string {
  if (v === 0) return '0';
  const abs = Math.abs(v);
  if (abs < 1e-3 || abs >= 1e4) return v.toExponential(1);
  return parseFloat(v.toPrecision(3)).toString();
}

interface Panel {
  code: string;
  name: string;
  color: string;
  data: { x: number; y: number }[];
  xlabel: string;
  ylabel: string;
  reference?: boolean;
  omczV?: number;
}

function ChartPanel({ panel }: { panel: Panel }) {
  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden border border-rule bg-paper p-5">
      <div className="min-h-[3.25rem]">
        <span
          className="font-mono text-[0.7rem] uppercase tracking-meta"
          style={{ color: panel.color }}
        >
          {panel.code}
          {panel.reference ? (
            <span className="ml-2 text-[0.55rem] text-ink-soft">
              · digitized ref
            </span>
          ) : null}
        </span>
        <span className="mt-1 block break-words font-serif text-[0.85rem] italic leading-tight text-ink-soft">
          {panel.name}
        </span>
      </div>
      <div className="mt-3 h-[170px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={panel.data}
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
            {panel.omczV != null ? (
              <ReferenceLine
                x={panel.omczV}
                stroke={panel.color}
                strokeDasharray="3 3"
                label={{
                  value: `OmcZ ~ ${panel.omczV} V`,
                  position: 'insideTopRight',
                  fill: panel.color,
                  fontSize: 9,
                  fontFamily: 'SF Mono, Menlo, monospace',
                }}
              />
            ) : null}
            <Tooltip
              contentStyle={{
                background: '#FAF8F5',
                border: '1px solid #C8CCD2',
                borderRadius: 0,
                fontFamily: 'SF Mono, monospace',
                fontSize: 11,
              }}
              labelFormatter={(label) =>
                `${panel.xlabel}: ${fmtNumber(Number(label))}`
              }
              formatter={(value: number | string) => [
                fmtNumber(Number(value)),
                panel.ylabel,
              ]}
            />
            <Line
              type="monotone"
              dataKey="y"
              stroke={panel.color}
              strokeWidth={1.4}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex justify-between font-mono text-[0.62rem] text-ink-soft">
        <span>{panel.xlabel}</span>
        <span>{panel.ylabel}</span>
      </div>
    </div>
  );
}

interface ElectrochemTracesProps {
  sample: Pick<BiosensorSample, 'techniques' | 'traces'>;
  /** Optional digitized DPV reference, appended as a fourth uniform square. */
  dpv?: DpvReference;
  className?: string;
}

export function ElectrochemTraces({
  sample,
  dpv,
  className,
}: ElectrochemTracesProps) {
  const panels: Panel[] = [];
  for (const key of sample.techniques) {
    const trace = sample.traces[key];
    if (!trace) continue;
    const meta = TECHNIQUE_META[key];
    panels.push({
      code: meta.code,
      name: meta.name,
      color: meta.color,
      data: trace.x.map((xv, i) => ({ x: xv, y: trace.y[i] })),
      xlabel: trace.xlabel,
      ylabel: trace.ylabel,
    });
  }
  if (dpv) {
    panels.push({
      code: 'DPV',
      name: 'Differential Pulse Voltammetry',
      color: DPV_COLOR,
      data: dpv.x.map((xv, i) => ({ x: xv, y: dpv.y[i] })),
      xlabel: dpv.xlabel,
      ylabel: dpv.ylabel,
      reference: true,
      omczV: dpv.omcz_peak_v,
    });
  }

  return (
    <div
      className={cn(
        'grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2',
        className,
      )}
    >
      {panels.map((panel) => (
        <ChartPanel key={panel.code} panel={panel} />
      ))}
    </div>
  );
}

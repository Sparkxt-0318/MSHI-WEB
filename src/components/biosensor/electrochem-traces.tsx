'use client';

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

/**
 * Realistic-shaped placeholder traces for the four electrochemistry
 * techniques used in the MSHI biosensor.
 *
 * IMPORTANT: these are ILLUSTRATIVE shapes only. Curves are generated
 * deterministically from physics-motivated functions (Cottrell-like
 * decay for CA, sinusoidal sweep for CV, log drift for OCP, gaussian
 * peak for DPV) so the panel reads as electrochemistry without
 * fabricating any specific sample's data.
 *
 * User will replace this component with real measurement data once
 * sample CSVs are provided. See README for the schema.
 */

const PALETTE = {
  CA: '#A4221A',
  CV: '#3F7CAB',
  OCP: '#2C5F2D',
  DPV: '#B85C00',
};

function generateCA(): { t: number; i: number }[] {
  // Cottrell-like current decay i ∝ 1/√t with noise
  return Array.from({ length: 80 }, (_, k) => {
    const t = k * 0.5; // seconds
    const base = 12 / Math.sqrt(t + 0.5) + 1.2;
    const noise = Math.sin(k * 0.7) * 0.15 + Math.cos(k * 0.41) * 0.08;
    return { t: +t.toFixed(2), i: +(base + noise).toFixed(3) };
  });
}

function generateCV(): { e: number; i: number }[] {
  // Two redox peaks superimposed on a linear sweep
  const points: { e: number; i: number }[] = [];
  for (let k = 0; k <= 200; k++) {
    const phase = (k / 200) * 2 * Math.PI;
    const e = -0.4 + 0.4 * Math.sin(phase); // sweep from -0.8 to 0.0
    // Reduction peak near -0.25 V, oxidation peak near -0.15 V
    const red = -2.4 * Math.exp(-Math.pow((e + 0.25) / 0.06, 2));
    const ox = 2.1 * Math.exp(-Math.pow((e + 0.15) / 0.06, 2));
    const sign = phase < Math.PI ? 1 : -1;
    const i = sign * 0.3 + (sign > 0 ? ox : red) + Math.sin(k * 0.31) * 0.04;
    points.push({ e: +e.toFixed(3), i: +i.toFixed(3) });
  }
  return points;
}

function generateOCP(): { t: number; e: number }[] {
  // Slow logarithmic drift to a steady state
  return Array.from({ length: 80 }, (_, k) => {
    const t = k * 1.5;
    const e = -0.18 + 0.06 * Math.log(t + 1) / Math.log(120) + Math.sin(k * 0.4) * 0.003;
    return { t: +t.toFixed(2), e: +e.toFixed(4) };
  });
}

function generateDPV(): { e: number; i: number }[] {
  // Single dominant peak around -0.22 V
  return Array.from({ length: 80 }, (_, k) => {
    const e = -0.6 + (k / 80) * 0.6; // -0.6 V to 0 V
    const peak = 4.5 * Math.exp(-Math.pow((e + 0.22) / 0.05, 2));
    const baseline = 0.4 + 0.3 * (e + 0.6);
    const noise = Math.sin(k * 0.7) * 0.08;
    return { e: +e.toFixed(3), i: +(peak + baseline + noise).toFixed(3) };
  });
}

const PANELS = [
  {
    key: 'CA',
    name: 'Chronoamperometry',
    xLabel: 'Time (s)',
    yLabel: 'i (μA)',
    xKey: 't',
    yKey: 'i',
    data: generateCA(),
    color: PALETTE.CA,
  },
  {
    key: 'CV',
    name: 'Cyclic Voltammetry',
    xLabel: 'E (V)',
    yLabel: 'i (μA)',
    xKey: 'e',
    yKey: 'i',
    data: generateCV(),
    color: PALETTE.CV,
  },
  {
    key: 'OCP',
    name: 'Open-Circuit Potential',
    xLabel: 'Time (s)',
    yLabel: 'E (V)',
    xKey: 't',
    yKey: 'e',
    data: generateOCP(),
    color: PALETTE.OCP,
  },
  {
    key: 'DPV',
    name: 'Differential Pulse Voltammetry',
    xLabel: 'E (V)',
    yLabel: 'i (μA)',
    xKey: 'e',
    yKey: 'i',
    data: generateDPV(),
    color: PALETTE.DPV,
  },
] as const;

interface ElectrochemTracesProps {
  /** When true, overlays a "PLACEHOLDER" badge prominently. */
  placeholder?: boolean;
  className?: string;
}

export function ElectrochemTraces({
  placeholder = false,
  className,
}: ElectrochemTracesProps) {
  return (
    <div className={cn('relative w-full', className)}>
      {placeholder ? (
        <div className="pointer-events-none absolute right-3 top-3 z-10 border border-accent bg-paper px-2 py-1 font-mono text-[0.62rem] uppercase tracking-meta text-accent">
          Placeholder · example data
        </div>
      ) : null}
      <div className="grid grid-cols-1 gap-px border border-rule bg-rule sm:grid-cols-2">
        {PANELS.map((panel) => (
          <div key={panel.key} className="flex flex-col bg-paper p-4">
            <div className="flex items-baseline justify-between">
              <span
                className="font-mono text-[0.7rem] uppercase tracking-meta"
                style={{ color: panel.color }}
              >
                {panel.key}
              </span>
              <span className="font-serif text-[0.85rem] italic text-ink-soft">
                {panel.name}
              </span>
            </div>
            <div className="mt-2 h-[140px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={panel.data}
                  margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
                >
                  <CartesianGrid stroke="#E5E5E5" vertical={false} />
                  <XAxis
                    dataKey={panel.xKey}
                    tick={{
                      fill: '#3A4048',
                      fontSize: 9,
                      fontFamily: 'SF Mono, Menlo, monospace',
                    }}
                    tickLine={false}
                    axisLine={{ stroke: '#C8CCD2' }}
                    type="number"
                    domain={['auto', 'auto']}
                  />
                  <YAxis
                    tick={{
                      fill: '#3A4048',
                      fontSize: 9,
                      fontFamily: 'SF Mono, Menlo, monospace',
                    }}
                    tickLine={false}
                    axisLine={false}
                    width={30}
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
                  />
                  <Line
                    type="monotone"
                    dataKey={panel.yKey}
                    stroke={panel.color}
                    strokeWidth={1.4}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-1 flex justify-between font-mono text-[0.62rem] text-ink-soft">
              <span>{panel.xLabel}</span>
              <span>{panel.yLabel}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

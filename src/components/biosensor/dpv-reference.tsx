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
import type { DpvReference } from './sample-types';

const DPV_COLOR = '#B85C00';

function fmt(v: number): string {
  if (v === 0) return '0';
  const a = Math.abs(v);
  if (a < 1e-3 || a >= 1e4) return v.toExponential(1);
  return parseFloat(v.toPrecision(3)).toString();
}

export function DpvReferenceFigure({ dpv }: { dpv: DpvReference }) {
  const data = dpv.x.map((xv, i) => ({ x: xv, y: dpv.y[i] }));
  return (
    <div className="flex flex-col border border-rule bg-paper p-4">
      <div className="flex items-baseline justify-between">
        <span
          className="font-mono text-[0.7rem] uppercase tracking-meta"
          style={{ color: DPV_COLOR }}
        >
          DPV
        </span>
        <span className="font-serif text-[0.85rem] italic text-ink-soft">
          Differential Pulse Voltammetry
        </span>
      </div>
      <div className="mt-2 h-[170px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 8, right: 12, left: 4, bottom: 0 }}
          >
            <CartesianGrid stroke="#E5E5E5" vertical={false} />
            <XAxis
              dataKey="x"
              type="number"
              domain={['auto', 'auto']}
              tickFormatter={fmt}
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
              tickFormatter={fmt}
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
            <ReferenceLine
              x={dpv.omcz_peak_v}
              stroke={DPV_COLOR}
              strokeDasharray="3 3"
              label={{
                value: `OmcZ ~ ${dpv.omcz_peak_v} V`,
                position: 'insideTopRight',
                fill: DPV_COLOR,
                fontSize: 9,
                fontFamily: 'SF Mono, Menlo, monospace',
              }}
            />
            <Tooltip
              contentStyle={{
                background: '#FAF8F5',
                border: '1px solid #C8CCD2',
                borderRadius: 0,
                fontFamily: 'SF Mono, monospace',
                fontSize: 11,
              }}
              labelFormatter={(l) => `${dpv.xlabel}: ${fmt(Number(l))}`}
              formatter={(value: number | string) => [
                fmt(Number(value)),
                dpv.ylabel,
              ]}
            />
            <Line
              type="monotone"
              dataKey="y"
              stroke={DPV_COLOR}
              strokeWidth={1.4}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-1 flex justify-between font-mono text-[0.62rem] text-ink-soft">
        <span>{dpv.xlabel}</span>
        <span>{dpv.ylabel}</span>
      </div>
    </div>
  );
}

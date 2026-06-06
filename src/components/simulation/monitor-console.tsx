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
import {
  Activity,
  AlertTriangle,
  Atom,
  CheckCircle2,
  Download,
  Droplets,
  Eye,
  FlaskConical,
  Monitor,
  Timer,
  Waves,
  Wind,
  Zap,
} from 'lucide-react';
import type { LogKind } from './redox-ai';
import {
  METRIC_META,
  metricTone,
  type MetricKey,
  type Tone,
} from './soil-conditions';
import type { CaPoint, CvPoint, LogEntry, RedoxSystemApi } from './use-redox-system';

const TONE_HEX: Record<Tone, string> = { good: '#2C5F2D', warn: '#B85C00', bad: '#A4221A' };
const CA_HEX = '#A4221A';
const CV_HEX = '#3F7CAB';

const TONE_WORD: Record<Tone, string> = { good: 'Optimal', warn: 'Elevated', bad: 'Critical' };

const CHEM_ICON: Record<'ph' | 'salinity' | 'cadmium' | 'aeration', React.ReactNode> = {
  ph: <Droplets className="h-5 w-5" />,
  salinity: <Waves className="h-5 w-5" />,
  cadmium: <Atom className="h-5 w-5" />,
  aeration: <Wind className="h-5 w-5" />,
};

const LOG_HEX: Record<LogKind, string> = {
  stim: '#3F7CAB',
  release: '#B85C00',
  oxidative: '#A4221A',
  amend: '#2C5F2D',
  mode: '#1F4068',
  scan: '#3A4048',
  routine: '#C8CCD2',
  bio: '#6D28D9',
  leach: '#3F7CAB',
  chelate: '#A4221A',
  lime: '#B85C00',
  till: '#1F4068',
};

function StatCard({
  label,
  value,
  sub,
  subNode,
  accentHex,
  icon,
  valueHex,
}: {
  label: string;
  value: string;
  sub?: string;
  subNode?: React.ReactNode;
  accentHex: string;
  icon: React.ReactNode;
  valueHex?: string;
}) {
  return (
    <div
      className="rounded-md border border-rule bg-paper p-4"
      style={{ borderLeft: `3px solid ${accentHex}` }}
    >
      <div className="flex items-start justify-between">
        <p className="font-mono text-[0.62rem] uppercase tracking-meta text-ink-soft">
          {label}
        </p>
        <span style={{ color: accentHex }}>{icon}</span>
      </div>
      <p
        className="mt-1 font-serif text-2xl font-bold leading-tight"
        style={{ color: valueHex ?? '#0E1116' }}
      >
        {value}
      </p>
      {subNode ?? (sub ? <p className="mt-0.5 text-[0.78rem] text-ink-soft">{sub}</p> : null)}
    </div>
  );
}

function ChartPanel({
  active,
  title,
  technique,
  color,
  points,
  render,
  inactiveNote,
}: {
  active: boolean;
  title: string;
  technique: string;
  color: string;
  points: number;
  render: () => React.ReactElement;
  inactiveNote: string;
}) {
  return (
    <div className="rounded-md border border-rule bg-paper p-4">
      <div className="flex items-baseline justify-between border-b border-rule pb-3">
        <p className="font-serif text-base font-bold text-ink">
          {title}
          {!active ? (
            <span className="ml-2 font-mono text-[0.65rem] font-normal uppercase tracking-meta text-ink-soft">
              (inactive)
            </span>
          ) : null}
        </p>
        <span className="flex items-center gap-1.5 font-mono text-[0.65rem] uppercase tracking-meta text-ink-soft">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: active ? color : '#C8CCD2' }}
          />
          {active ? `${points} pts` : technique}
        </span>
      </div>
      <div className="mt-3 h-[210px] w-full">
        {active ? (
          render()
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center text-ink-soft">
            <Monitor className="mb-2 h-7 w-7 opacity-50" />
            <p className="text-[0.85rem]">{inactiveNote}</p>
          </div>
        )}
      </div>
    </div>
  );
}

const tooltipStyle = {
  background: '#FAF8F5',
  border: '1px solid #C8CCD2',
  borderRadius: 0,
  fontFamily: 'SF Mono, Menlo, monospace',
  fontSize: 11,
} as const;
const axisTick = {
  fill: '#3A4048',
  fontSize: 9,
  fontFamily: 'SF Mono, Menlo, monospace',
} as const;

function CaChart({ data }: { data: CaPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
        <CartesianGrid stroke="#ECEAE6" vertical={false} />
        <XAxis
          dataKey="t"
          type="number"
          domain={['dataMin', 'dataMax']}
          tickFormatter={(v: number) => `${Math.round(v)}`}
          tick={axisTick}
          tickLine={false}
          axisLine={{ stroke: '#C8CCD2' }}
          minTickGap={28}
          label={{ value: 'Time (s)', position: 'insideBottom', offset: -2, fill: '#3A4048', fontSize: 9 }}
        />
        <YAxis
          tick={axisTick}
          tickLine={false}
          axisLine={false}
          width={34}
          domain={[0, 'auto']}
          label={{ value: 'µA', angle: -90, position: 'insideLeft', fill: '#3A4048', fontSize: 9 }}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          labelFormatter={(l) => `t = ${Math.round(Number(l))} s`}
          formatter={(v: number | string) => [`${Number(v).toFixed(1)} µA`, 'Current']}
        />
        <Line type="monotone" dataKey="v" stroke={CA_HEX} strokeWidth={1.6} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function CvChart({ data }: { data: CvPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
        <CartesianGrid stroke="#ECEAE6" vertical={false} />
        <XAxis
          dataKey="x"
          type="number"
          domain={[-0.8, 0.8]}
          tickFormatter={(v: number) => v.toFixed(1)}
          tick={axisTick}
          tickLine={false}
          axisLine={{ stroke: '#C8CCD2' }}
          minTickGap={24}
          label={{ value: 'Potential (V)', position: 'insideBottom', offset: -2, fill: '#3A4048', fontSize: 9 }}
        />
        <YAxis tick={axisTick} tickLine={false} axisLine={false} width={34} domain={['auto', 'auto']} />
        <Tooltip
          contentStyle={tooltipStyle}
          labelFormatter={(l) => `E = ${Number(l).toFixed(2)} V`}
          formatter={(v: number | string) => [Number(v).toFixed(2), 'Current']}
        />
        <Line type="monotone" dataKey="y" stroke={CV_HEX} strokeWidth={1.6} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function LogItem({ entry }: { entry: LogEntry }) {
  return (
    <div
      className="rounded-sm border border-rule bg-cream/40 px-3 py-2"
      style={{ borderLeft: `3px solid ${LOG_HEX[entry.kind]}` }}
    >
      <p className="text-[0.82rem] leading-snug text-ink">{entry.text}</p>
      <p className="mt-0.5 font-mono text-[0.62rem] text-ink-soft">{entry.time}</p>
    </div>
  );
}

export function MonitorConsole({ api }: { api: RedoxSystemApi }) {
  const { state, releaseMicrobes, redoxCycling, toggleMode, exportCsv } = api;
  const tone = state.status.tone;
  const accent = TONE_HEX[tone];
  const otherMeas = state.measurement === 'CA' ? 'CV' : 'CA';

  return (
    <div className="space-y-5">
      {/* status cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Soil Redox Potential"
          value={`${state.eh.toFixed(1)} mV`}
          accentHex={accent}
          valueHex={accent}
          icon={tone === 'good' ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
          subNode={
            <p className="mt-0.5 text-[0.78rem] font-semibold" style={{ color: accent }}>
              {state.status.label}
            </p>
          }
        />
        <StatCard
          label="Current Mode"
          value={state.mode === 'remediation' ? 'Remediation' : 'Sensing'}
          accentHex="#3F7CAB"
          icon={state.mode === 'remediation' ? <Monitor className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          subNode={
            <button
              type="button"
              onClick={toggleMode}
              className="mt-0.5 font-mono text-[0.72rem] text-bedrock-blue underline-offset-2 hover:underline"
            >
              Switch to {state.mode === 'remediation' ? 'Sensing' : 'Remediation'}
            </button>
          }
        />
        <StatCard
          label="Active Measurement"
          value={state.measurement}
          accentHex="#2C5F2D"
          icon={<Activity className="h-5 w-5" />}
          sub={`Switching to ${otherMeas} in ${state.scanCountdown}s`}
        />
        <StatCard
          label="Next Scan In"
          value={`${state.scanCountdown}s`}
          accentHex="#6D28D9"
          icon={<Timer className="h-5 w-5" />}
          sub={`Scanning every ${state.scanInterval}s`}
        />
      </div>

      {/* soil-chemistry channels — the multi-parameter signature the sensor reads */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {(['ph', 'salinity', 'cadmium', 'aeration'] as const).map((key) => {
          const value = state[key];
          const tone = metricTone(key as MetricKey, value);
          const hex = TONE_HEX[tone];
          const meta = METRIC_META[key];
          return (
            <StatCard
              key={key}
              label={meta.label}
              value={`${meta.format(value)}${meta.unit ? ` ${meta.unit}` : ''}`}
              accentHex={hex}
              valueHex={hex}
              icon={CHEM_ICON[key]}
              subNode={
                <p className="mt-0.5 text-[0.78rem] font-semibold" style={{ color: hex }}>
                  {TONE_WORD[tone]}
                </p>
              }
            />
          );
        })}
      </div>

      {/* system actions */}
      <div className="rounded-md border border-rule bg-paper p-4" style={{ borderLeft: '3px solid #B85C00' }}>
        <p className="font-mono text-[0.62rem] uppercase tracking-meta text-ink-soft">System Actions</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={releaseMicrobes}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-bedrock-warn px-4 py-2.5 font-mono text-xs uppercase tracking-meta text-paper transition-colors hover:bg-ink"
          >
            <FlaskConical className="h-4 w-4" /> Release Microbes
          </button>
          <button
            type="button"
            onClick={redoxCycling}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-bedrock-blue px-4 py-2.5 font-mono text-xs uppercase tracking-meta text-paper transition-colors hover:bg-ink"
          >
            <Zap className="h-4 w-4" /> Redox Cycling
          </button>
        </div>
      </div>

      {/* live charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <ChartPanel
          active={state.measurement === 'CV'}
          title="Cyclic Voltammetry"
          technique="CV"
          color={CV_HEX}
          points={state.cv.length}
          render={() => <CvChart data={state.cv} />}
          inactiveNote="CV inactive — chronoamperometry running"
        />
        <ChartPanel
          active={state.measurement === 'CA'}
          title="Chronoamperometry"
          technique="CA"
          color={CA_HEX}
          points={state.ca.length}
          render={() => <CaChart data={state.ca} />}
          inactiveNote="CA inactive — cyclic voltammetry running"
        />
      </div>

      {/* event log */}
      <div className="rounded-md border border-rule bg-paper p-4">
        <div className="flex items-center justify-between border-b border-rule pb-3">
          <p className="font-serif text-base font-bold text-ink">System Event Log</p>
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 rounded-md border border-rule px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-meta text-ink-soft transition-colors hover:border-ink hover:text-ink"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
        </div>
        <div className="mt-3 grid max-h-[230px] gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-4">
          {state.log.length === 0 ? (
            <p className="text-[0.82rem] text-ink-soft">Awaiting events…</p>
          ) : (
            state.log.map((e) => <LogItem key={e.id} entry={e} />)
          )}
        </div>
      </div>
    </div>
  );
}

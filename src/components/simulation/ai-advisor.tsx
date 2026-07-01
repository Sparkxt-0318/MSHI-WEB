'use client';

import * as React from 'react';
import {
  Activity,
  Atom,
  Beaker,
  Biohazard,
  Brain,
  CheckCircle2,
  Cpu,
  Database,
  Eye,
  FlaskConical,
  Layers,
  Monitor,
  Target,
  TrendingUp,
  Waves,
  Zap,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { MODEL_INFO, PRIORITY_TONE, type ActionKey } from './redox-ai';
import { getCondition } from './soil-conditions';
import { mulberry32 } from './sim-model';
import type { RedoxSystemApi } from './use-redox-system';

const TONE_HEX = { good: '#2C5F2D', warn: '#B85C00', bad: '#A4221A' } as const;
const VIOLET = '#6D28D9';

const ACTION_ICON: Record<ActionKey, React.ReactNode> = {
  maintain: <CheckCircle2 className="h-5 w-5" />,
  redox_cycling: <Zap className="h-5 w-5" />,
  release_microbes: <FlaskConical className="h-5 w-5" />,
  oxidative: <Activity className="h-5 w-5" />,
  electron_donor: <FlaskConical className="h-5 w-5" />,
  inoculate: <Atom className="h-5 w-5" />,
  leaching: <Waves className="h-5 w-5" />,
  chelation: <Biohazard className="h-5 w-5" />,
  liming: <Beaker className="h-5 w-5" />,
  tillage: <Layers className="h-5 w-5" />,
};

const MODEL_ICON: Record<string, React.ReactNode> = {
  network: <Brain className="h-6 w-6" />,
  training: <Database className="h-6 w-6" />,
  accuracy: <TrendingUp className="h-6 w-6" />,
};

const TRAINING_ROWS = (() => {
  const rand = mulberry32(28);
  const soils = [
    'Healthy',
    'Saline-stressed',
    'Heavy-metal',
    'Acidic',
    'Compacted',
    'Sterile',
  ];
  const tech = ['CV', 'CA'];
  return Array.from({ length: 28 }, (_, i) => ({
    id: `run_${String(i + 1).padStart(2, '0')}`,
    soil: soils[Math.floor(rand() * soils.length)],
    technique: tech[Math.floor(rand() * 2)],
    mshi: (0.15 + rand() * 0.8).toFixed(2),
  }));
})();

function MiniStat({
  label,
  value,
  accentHex,
  icon,
}: {
  label: string;
  value: string;
  accentHex: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-rule bg-paper p-4" style={{ borderLeft: `3px solid ${accentHex}` }}>
      <div className="flex items-center justify-between">
        <p className="font-mono text-[0.62rem] uppercase tracking-meta text-ink-soft">{label}</p>
        <span style={{ color: accentHex }}>{icon}</span>
      </div>
      <p className="mt-1 font-serif text-xl font-bold text-ink">{value}</p>
    </div>
  );
}

function TrainingDataDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md px-4 py-2 font-mono text-xs uppercase tracking-meta text-paper transition-colors hover:opacity-90"
          style={{ background: VIOLET }}
        >
          <Database className="h-4 w-4" /> View Training Data
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogTitle>Training corpus · 28 labeled runs</DialogTitle>
        <p className="text-[0.85rem] text-ink-soft">
          CV / CA runs across different soil types, each with its reference MSHI
          label. Illustrative figures for this simulation.
        </p>
        <div className="mt-2 max-h-[55vh] overflow-y-auto border border-rule">
          <table className="w-full border-collapse text-[0.82rem]">
            <thead className="sticky top-0 bg-cream">
              <tr className="text-left font-mono text-[0.6rem] uppercase tracking-meta text-ink-soft">
                <th className="border-b border-rule px-3 py-2">Run</th>
                <th className="border-b border-rule px-3 py-2">Soil class</th>
                <th className="border-b border-rule px-3 py-2">Technique</th>
                <th className="border-b border-rule px-3 py-2">MSHI</th>
              </tr>
            </thead>
            <tbody>
              {TRAINING_ROWS.map((r) => (
                <tr key={r.id} className="odd:bg-cream/40">
                  <td className="border-b border-rule px-3 py-1.5 font-mono text-[0.75rem]">{r.id}</td>
                  <td className="border-b border-rule px-3 py-1.5">{r.soil}</td>
                  <td className="border-b border-rule px-3 py-1.5 font-mono text-[0.75rem]">{r.technique}</td>
                  <td className="border-b border-rule px-3 py-1.5 font-mono text-[0.75rem]">{r.mshi}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AiAdvisor({ api }: { api: RedoxSystemApi }) {
  const { state, executeRecommendation } = api;
  const rec = state.recommendation;
  const toneHex = TONE_HEX[PRIORITY_TONE[rec.priority]];
  const detected = getCondition(rec.condition);

  return (
    <div className="space-y-5">
      {/* header */}
      <div className="rounded-md border border-rule bg-paper p-5" style={{ borderLeft: `3px solid ${VIOLET}` }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span style={{ color: VIOLET }}>
              <Brain className="h-7 w-7" />
            </span>
            <div>
              <h3 className="font-serif text-xl font-bold text-ink">AI Decision Support System</h3>
              <p className="text-[0.85rem] text-ink-soft">
                Machine-learning recommendations for fixing degraded soil
              </p>
            </div>
          </div>
          <TrainingDataDialog />
        </div>
      </div>

      {/* stat cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MiniStat label="Current Redox" value={`${state.eh.toFixed(1)} mV`} accentHex={VIOLET} icon={<Activity className="h-5 w-5" />} />
        <MiniStat
          label="System Mode"
          value={state.mode === 'remediation' ? 'Remediation' : 'Sensing'}
          accentHex="#2C5F2D"
          icon={state.mode === 'remediation' ? <Monitor className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        />
        <MiniStat
          label="Detected Soil"
          value={detected.short}
          accentHex={detected.hex}
          icon={<Cpu className="h-5 w-5" />}
        />
      </div>

      {/* recommendation */}
      <div className="rounded-md border border-rule bg-paper p-5">
        <p className="font-mono text-[0.62rem] uppercase tracking-meta text-ink-soft">AI Recommendations</p>

        <div
          className="mt-3 rounded-md border p-5"
          style={{ borderColor: toneHex, background: `${toneHex}10` }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span style={{ color: toneHex }}>{ACTION_ICON[rec.action]}</span>
              <div>
                <p className="font-serif text-lg font-bold text-ink">{rec.title}</p>
                <p className="font-mono text-[0.7rem] text-ink-soft">Confidence: {rec.confidence}%</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <span
                className="inline-flex items-center gap-1.5 rounded-sm border px-2 py-1 font-mono text-[0.58rem] font-semibold uppercase tracking-meta"
                style={{ borderColor: detected.hex, color: detected.hex, background: `${detected.hex}12` }}
              >
                {detected.short}
              </span>
              <span
                className="rounded-sm px-2 py-1 font-mono text-[0.6rem] font-semibold uppercase tracking-meta text-paper"
                style={{ background: toneHex }}
              >
                {rec.priority}
              </span>
            </div>
          </div>

          {/* confidence bar */}
          <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-ink/10">
            <div className="h-full rounded-full" style={{ width: `${rec.confidence}%`, background: toneHex }} />
          </div>

          {/* diagnosed primary problem */}
          <div className="mt-4 flex items-start gap-2 rounded-md border border-rule bg-cream/40 px-3 py-2">
            <span className="mt-0.5 shrink-0 text-ink-soft">
              <Target className="h-3.5 w-3.5" />
            </span>
            <p className="text-[0.85rem] leading-snug text-ink">
              <span className="font-mono text-[0.6rem] uppercase tracking-meta text-ink-soft">
                Primary problem ·{' '}
              </span>
              {rec.problem}
            </p>
          </div>

          <p className="mt-3 max-w-prose text-[0.92rem] leading-relaxed text-ink">{rec.rationale}</p>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-[0.72rem] text-ink-soft">
              Expected: <span className="text-ink">{rec.expected}</span>
            </p>
            <button
              type="button"
              onClick={executeRecommendation}
              disabled={rec.action === 'maintain'}
              className="inline-flex items-center gap-2 rounded-md px-5 py-2 font-mono text-xs uppercase tracking-meta text-paper transition-colors hover:bg-ink disabled:cursor-not-allowed disabled:opacity-40"
              style={{ background: rec.action === 'maintain' ? '#3A4048' : VIOLET }}
            >
              <Zap className="h-4 w-4" /> {rec.action === 'maintain' ? 'Acknowledge' : 'Execute'}
            </button>
          </div>
        </div>
      </div>

      {/* model information */}
      <div className="rounded-md border border-rule bg-paper p-5">
        <p className="font-mono text-[0.62rem] uppercase tracking-meta text-ink-soft">Model Information</p>
        <div className="mt-4 grid grid-cols-1 gap-6 text-center sm:grid-cols-3">
          {MODEL_INFO.map((m) => (
            <div key={m.key} className="flex flex-col items-center">
              <span
                className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{ background: `${VIOLET}14`, color: VIOLET }}
              >
                {MODEL_ICON[m.key]}
              </span>
              <p className="mt-2 font-serif text-base font-bold text-ink">{m.title}</p>
              <p className="mt-1 max-w-[28ch] text-[0.8rem] leading-snug text-ink-soft">{m.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

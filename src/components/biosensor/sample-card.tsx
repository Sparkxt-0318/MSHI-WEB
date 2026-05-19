'use client';

import Link from 'next/link';
import { Download } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ElectrochemTraces } from './electrochem-traces';
import type {
  BiosensorSample,
  Classification,
  TechniqueKey,
} from './sample-types';
import { cn } from '@/lib/utils';

const CLASS_META: Record<
  Classification,
  { label: string; color: string }
> = {
  healthy: { label: 'Healthy', color: 'text-bedrock-good' },
  unhealthy: { label: 'Unhealthy', color: 'text-accent' },
  saline: { label: 'Saline-stressed', color: 'text-bedrock-warn' },
};

const TECH_LABEL: Record<TechniqueKey, string> = {
  ca: 'Chronoamperometry (CA)',
  cv: 'Cyclic Voltammetry (CV)',
  ocp: 'Open-Circuit Potential (OCP)',
};

function interpretScore(s: BiosensorSample): string {
  const score = s.mshi_score;
  if (s.classification === 'healthy') {
    return `An MSHI score of ${score.toFixed(2)} reflects a sustained electron-transfer current — the electrochemically active biofilm is metabolising strongly, the signature of a healthy microbial community.`;
  }
  if (s.classification === 'unhealthy') {
    return `An MSHI score of ${score.toFixed(2)} indicates suppressed faradaic current: extracellular electron transfer is impaired, consistent with a stressed or metabolically arrested microbial community.`;
  }
  return `An MSHI score of ${score.toFixed(2)} captures the saline paradox — high ionic conductivity coexists with collapsed biological current, so the soil reads electrically "active" but is biologically arrested.`;
}

interface SampleCardProps {
  sample: BiosensorSample;
}

export function SampleCard({ sample }: SampleCardProps) {
  const cls = CLASS_META[sample.classification];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          className="group flex h-full w-full flex-col border border-rule bg-paper p-6 text-left transition-colors hover:border-ink"
          aria-label={`Open detail for ${sample.name}`}
        >
          <div className="flex items-center justify-between">
            <span
              className={cn(
                'border px-1.5 py-0.5 font-mono text-[0.6rem] uppercase tracking-meta',
                cls.color,
              )}
              style={{ borderColor: 'currentColor' }}
            >
              {cls.label}
            </span>
            <span className="font-mono text-[0.62rem] uppercase tracking-meta text-ink-soft">
              {sample.phase}
            </span>
          </div>

          <h3 className="mt-4 font-serif text-lg font-bold leading-snug text-ink">
            {sample.name}
          </h3>

          <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 font-mono text-[0.7rem]">
            <div>
              <dt className="uppercase tracking-meta text-ink-soft">MSHI</dt>
              <dd className="mt-0.5 font-serif text-3xl font-bold text-ink">
                {sample.mshi_score.toFixed(2)}
              </dd>
            </div>
            <div>
              <dt className="uppercase tracking-meta text-ink-soft">
                Techniques
              </dt>
              <dd className="mt-0.5 font-serif text-base font-bold text-ink">
                {sample.techniques.map((t) => t.toUpperCase()).join(' · ')}
              </dd>
            </div>
          </dl>

          <div className="mt-6 self-start border-b border-ink-soft font-mono text-[0.7rem] uppercase tracking-meta text-ink-soft transition-colors group-hover:border-accent group-hover:text-accent">
            View traces
          </div>
        </button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogTitle>
          {sample.name}
          <span
            className={cn(
              'ml-3 inline-block border px-1.5 py-0.5 align-middle font-mono text-[0.6rem] uppercase tracking-meta',
              cls.color,
            )}
            style={{ borderColor: 'currentColor' }}
          >
            {cls.label}
          </span>
        </DialogTitle>
        <DialogDescription>
          {sample.techniques.length} validated electrochemistry{' '}
          {sample.techniques.length === 1 ? 'trace' : 'traces'} from the
          published MSHI dataset · {sample.phase}, Trial {sample.trial_id}.
        </DialogDescription>

        <div className="mt-6 grid gap-6 md:grid-cols-12">
          <div className="md:col-span-8">
            <p className="meta-label">Electrochemistry traces</p>
            <div className="mt-3">
              <ElectrochemTraces sample={sample} />
            </div>
            <p className="mt-3 font-mono text-[0.65rem] leading-relaxed text-ink-soft">
              Raw CHI660E exports, downsampled by even stride for fast load;
              trace shape preserved. CA omits the initial charging transient
              (instrument noise). Raw files below are verbatim and complete.
            </p>
          </div>

          <div className="md:col-span-4">
            <p className="meta-label">MSHI score</p>
            <p className="mt-1 font-serif text-4xl font-bold text-ink">
              {sample.mshi_score.toFixed(2)}
            </p>
            <p
              className={cn('mt-2 font-serif text-lg font-bold', cls.color)}
            >
              {cls.label}
            </p>
            <p className="mt-3 text-[0.85rem] leading-relaxed text-ink">
              {interpretScore(sample)}
            </p>

            <hr className="my-5 border-rule" />

            <p className="meta-label">Sample metadata</p>
            <dl className="mt-3 space-y-2 font-mono text-[0.72rem]">
              <div className="flex gap-2">
                <dt className="w-20 text-ink-soft">ID</dt>
                <dd className="text-ink">{sample.id}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-20 text-ink-soft">Phase</dt>
                <dd className="text-ink">{sample.phase}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-20 text-ink-soft">Trial</dt>
                <dd className="text-ink">{sample.trial_id}</dd>
              </div>
            </dl>

            <hr className="my-5 border-rule" />

            <p className="meta-label">Raw trace files</p>
            <ul className="mt-3 space-y-2">
              {sample.techniques.map((t) => {
                const href = sample.raw_files[t];
                if (!href) return null;
                return (
                  <li key={t}>
                    <Link
                      href={href}
                      download
                      className="inline-flex items-center gap-2 font-mono text-[0.72rem] text-accent transition-colors hover:text-ink"
                    >
                      <Download className="h-3.5 w-3.5" />
                      {TECH_LABEL[t]}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <p className="mt-5 border-t border-rule pt-4 font-mono text-[0.65rem] leading-relaxed text-ink-soft">
              Validated result from the published dataset.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ElectrochemTraces } from './electrochem-traces';
import type { BiosensorSample } from './sample-types';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

const CLASS_COLORS: Record<BiosensorSample['classification'], string> = {
  Healthy: 'text-bedrock-good',
  Unhealthy: 'text-accent',
  'Saline-stressed': 'text-bedrock-warn',
};

interface SampleCardProps {
  sample: BiosensorSample;
}

export function SampleCard({ sample }: SampleCardProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          className="group flex h-full w-full flex-col border border-rule bg-paper p-6 text-left transition-colors hover:border-ink"
          aria-label={`Open detail for ${sample.name}`}
        >
          {sample.is_placeholder ? (
            <span className="self-start border border-accent px-1.5 py-0.5 font-mono text-[0.6rem] uppercase tracking-meta text-accent">
              Placeholder
            </span>
          ) : null}
          <h3 className="mt-3 font-serif text-lg font-bold leading-snug text-ink">
            {sample.name}
          </h3>
          <p className="mt-2 line-clamp-3 text-[0.92rem] text-ink-soft">
            {sample.blurb}
          </p>

          <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 font-mono text-[0.7rem]">
            <div>
              <dt className="uppercase tracking-meta text-ink-soft">MSHI</dt>
              <dd className="mt-0.5 font-serif text-2xl font-bold text-ink">
                {sample.mshi_score.toFixed(2)}
              </dd>
            </div>
            <div>
              <dt className="uppercase tracking-meta text-ink-soft">Class</dt>
              <dd
                className={cn(
                  'mt-0.5 font-serif text-base font-bold',
                  CLASS_COLORS[sample.classification],
                )}
              >
                {sample.classification}
              </dd>
            </div>
          </dl>

          <div className="mt-5 flex items-center gap-2 font-mono text-[0.7rem] text-ink-soft">
            <MapPin className="h-3 w-3" />
            <span>
              {sample.location.lat.toFixed(2)}°,{' '}
              {sample.location.lon.toFixed(2)}°
            </span>
          </div>

          <div className="mt-6 self-start border-b border-ink-soft font-mono text-[0.7rem] uppercase tracking-meta text-ink-soft transition-colors group-hover:border-accent group-hover:text-accent">
            View detail
          </div>
        </button>
      </DialogTrigger>

      <DialogContent>
        <DialogTitle>
          {sample.name}
          {sample.is_placeholder ? (
            <span className="ml-3 inline-block border border-accent px-1.5 py-0.5 font-mono text-[0.6rem] uppercase tracking-meta text-accent align-middle">
              Placeholder
            </span>
          ) : null}
        </DialogTitle>
        <DialogDescription>{sample.blurb}</DialogDescription>

        <div className="mt-6 grid gap-6 md:grid-cols-12">
          <div className="md:col-span-8">
            <p className="meta-label">Electrochemistry traces</p>
            <div className="mt-3 border border-rule bg-paper p-2">
              <ElectrochemTraces placeholder={sample.is_placeholder} />
            </div>
          </div>

          <div className="md:col-span-4">
            <p className="meta-label">MSHI score</p>
            <p className="mt-1 font-serif text-4xl font-bold text-ink">
              {sample.mshi_score.toFixed(2)}
            </p>
            <p
              className={cn(
                'mt-3 font-serif text-lg font-bold',
                CLASS_COLORS[sample.classification],
              )}
            >
              {sample.classification}
            </p>
            <p className="mt-1 font-mono text-[0.7rem] text-ink-soft">
              Confidence {(sample.classification_confidence * 100).toFixed(0)}%
            </p>

            <hr className="my-5 border-rule" />

            <p className="meta-label">Sample metadata</p>
            <dl className="mt-3 space-y-2 font-mono text-[0.72rem]">
              <div className="flex gap-2">
                <dt className="w-24 text-ink-soft">ID</dt>
                <dd className="text-ink">{sample.metadata.sample_id}</dd>
              </div>
              {sample.metadata.collection_date ? (
                <div className="flex gap-2">
                  <dt className="w-24 text-ink-soft">Date</dt>
                  <dd className="text-ink">{sample.metadata.collection_date}</dd>
                </div>
              ) : null}
              {sample.metadata.depth_cm ? (
                <div className="flex gap-2">
                  <dt className="w-24 text-ink-soft">Depth (cm)</dt>
                  <dd className="text-ink">{sample.metadata.depth_cm}</dd>
                </div>
              ) : null}
              <div className="flex gap-2">
                <dt className="w-24 text-ink-soft">Lat / Lon</dt>
                <dd className="text-ink">
                  {sample.location.lat.toFixed(3)}°,{' '}
                  {sample.location.lon.toFixed(3)}°
                </dd>
              </div>
              {sample.metadata.notes ? (
                <p className="pt-2 italic text-ink-soft">
                  {sample.metadata.notes}
                </p>
              ) : null}
            </dl>

            <hr className="my-5 border-rule" />

            <p className="meta-label">On the atlas</p>
            <div className="mt-2 border border-rule bg-cream/60 p-4">
              {/* Tiny inline minimap: a simple SVG world rectangle with a pin */}
              <SiteMinimap
                lat={sample.location.lat}
                lon={sample.location.lon}
              />
              <p className="mt-2 font-mono text-[0.65rem] text-ink-soft">
                Approximate location. Click in /atlas for the full
                interactive map.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface SiteMinimapProps {
  lat: number;
  lon: number;
}

function SiteMinimap({ lat, lon }: SiteMinimapProps) {
  // SVG mini-map: equirectangular projection of the entire globe at low res.
  // Pin position computed from lat/lon. Background is a flat shape; we don't
  // try to render real coastlines — that would be misleading at this size.
  const W = 240;
  const H = 120;
  const x = ((lon + 180) / 360) * W;
  const y = ((90 - lat) / 180) * H;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <rect x={0} y={0} width={W} height={H} fill="#F0EBE3" />
      {/* Equator + prime meridian */}
      <line x1={0} y1={H / 2} x2={W} y2={H / 2} stroke="#C8CCD2" strokeDasharray="2 4" />
      <line x1={W / 2} y1={0} x2={W / 2} y2={H} stroke="#C8CCD2" strokeDasharray="2 4" />
      {/* Pin */}
      <circle cx={x} cy={y} r={6} fill="#A4221A" opacity={0.25} />
      <circle cx={x} cy={y} r={3} fill="#A4221A" />
    </svg>
  );
}

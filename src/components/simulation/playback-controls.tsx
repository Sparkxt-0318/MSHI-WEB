'use client';

import * as React from 'react';
import { Play, Pause, RotateCcw, FastForward } from 'lucide-react';
import { SPEEDS } from './sim-constants';
import type { TimelineApi } from './simulation-types';

export function PlaybackControls({ timeline }: { timeline: TimelineApi }) {
  const { playing, speed, progressUi, toggle, setSpeed, scrubTo, reset } = timeline;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? 'Pause' : 'Play'}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-ink text-paper transition-colors hover:bg-accent"
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={reset}
          aria-label="Restart"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rule text-ink-soft transition-colors hover:border-ink hover:text-ink"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      <input
        type="range"
        min={0}
        max={1}
        step={0.001}
        value={progressUi}
        onChange={(e) => scrubTo(Number(e.target.value))}
        aria-label="Scrub timeline"
        className="h-1 min-w-[140px] flex-1 cursor-pointer accent-accent"
      />

      <div className="flex items-center gap-1.5">
        <FastForward className="h-3.5 w-3.5 text-ink-soft" aria-hidden="true" />
        {SPEEDS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSpeed(s)}
            aria-pressed={speed === s}
            className={`rounded-sm border px-2 py-1 font-mono text-[0.65rem] uppercase tracking-meta transition-colors ${
              speed === s
                ? 'border-ink bg-ink text-paper'
                : 'border-rule text-ink-soft hover:border-ink hover:text-ink'
            }`}
          >
            {s}×
          </button>
        ))}
      </div>
    </div>
  );
}

'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { CTA_REVEAL, SCALE_BRIDGE_START } from './sim-constants';
import { clamp, smoothstep } from './sim-model';

function CellGlyph() {
  return (
    <svg viewBox="0 0 48 48" className="h-10 w-10">
      <rect x="12" y="8" width="24" height="32" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
      <line x1="24" y1="14" x2="24" y2="34" stroke="currentColor" strokeWidth="2" />
      <circle cx="19" cy="20" r="1.6" fill="#8FE3FF" />
      <circle cx="29" cy="26" r="1.6" fill="#8FE3FF" />
      <circle cx="22" cy="30" r="1.6" fill="#8FE3FF" />
    </svg>
  );
}
function ChamberGlyph() {
  return (
    <svg viewBox="0 0 48 48" className="h-10 w-10">
      <path d="M8 30 h32 v8 h-32 z" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M24 30 v-12" stroke="currentColor" strokeWidth="2" />
      <path d="M24 18 l4 4 M24 18 l-4 4" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M16 14 q2 -4 4 0 M28 12 q2 -4 4 0" stroke="currentColor" strokeWidth="1.4" fill="none" opacity="0.7" />
    </svg>
  );
}
function GlobeGlyph() {
  return (
    <svg viewBox="0 0 48 48" className="h-10 w-10">
      <circle cx="24" cy="24" r="16" fill="none" stroke="currentColor" strokeWidth="2" />
      <ellipse cx="24" cy="24" rx="7" ry="16" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <line x1="8" y1="24" x2="40" y2="24" stroke="currentColor" strokeWidth="1.4" />
      <path d="M11 16 H37 M11 32 H37" stroke="currentColor" strokeWidth="1.1" opacity="0.6" />
    </svg>
  );
}

const STEPS = [
  { Glyph: CellGlyph, label: 'Cell', scale: 'centimeter' },
  { Glyph: ChamberGlyph, label: 'Chamber', scale: 'meter' },
  { Glyph: GlobeGlyph, label: 'Atlas', scale: 'kilometer' },
];

/** Closing overlay: zooms the story out cm → m → km and links onward. */
export function ScaleBridge({ progressUi }: { progressUi: number }) {
  const appear = smoothstep(SCALE_BRIDGE_START, 0.95, progressUi);
  const ctaShown = progressUi >= CTA_REVEAL;
  if (appear <= 0.001) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center px-6 text-center"
      style={{ background: `rgba(10,22,40,${(0.86 * appear).toFixed(3)})` }}
    >
      <div
        style={{
          opacity: appear,
          transform: `translateY(${(1 - appear) * 14}px)`,
        }}
      >
        <p className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-cyan-300/80">
          One signal · three scales
        </p>
        <div className="mt-4 flex items-center justify-center gap-3 text-paper sm:gap-5">
          {STEPS.map((step, i) => {
            const emph = clamp(appear * 1.4 - i * 0.28);
            return (
              <React.Fragment key={step.label}>
                {i > 0 ? (
                  <ArrowRight className="h-4 w-4 shrink-0 text-white/40" aria-hidden="true" />
                ) : null}
                <div
                  className="flex flex-col items-center"
                  style={{ opacity: 0.4 + 0.6 * emph, transform: `scale(${0.9 + 0.1 * emph})` }}
                >
                  <step.Glyph />
                  <span className="mt-1 font-serif text-sm font-bold">{step.label}</span>
                  <span className="font-mono text-[0.55rem] uppercase tracking-[0.08em] text-white/55">
                    {step.scale}
                  </span>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        <div
          className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 transition-opacity duration-500"
          style={{ opacity: ctaShown ? 1 : 0, pointerEvents: ctaShown ? 'auto' : 'none' }}
        >
          <Link href="/atlas" className="link-arrow inline-flex items-center gap-2 !text-cyan-300 !border-cyan-300/60">
            See it at continental scale <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link href="/biosensor" className="link-arrow inline-flex items-center gap-2 !text-cyan-300 !border-cyan-300/60">
            Inspect the electrochemistry <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

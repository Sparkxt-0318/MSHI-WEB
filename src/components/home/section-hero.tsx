import { siteConfig } from '@/lib/site-config';
import { ChevronDown } from 'lucide-react';

export function SectionHero() {
  return (
    <section
      id="hero"
      className="relative flex min-h-screen flex-col justify-between bg-paper"
    >
      <div className="container-research flex flex-1 flex-col justify-center pt-24">
        {/* Top meta line */}
        <p className="meta-label">A research portfolio · {siteConfig.year}</p>

        {/* Display title */}
        <h1 className="display-title mt-10 max-w-[18ch] text-ink">
          Soil Microbial<br />
          <span className="text-accent">Respiration.</span>
        </h1>

        {/* Italic subtitle */}
        <p className="subtitle mt-8 max-w-[55ch]">
          A three-tier monitoring stack for the second-largest carbon flux on
          Earth.
        </p>

        {/* Quiet author / institution line */}
        <p className="meta-text mt-16 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span>{siteConfig.authorName}</span>
          <span aria-hidden="true" className="text-rule">
            ·
          </span>
          <span>{siteConfig.institution}</span>
          <span aria-hidden="true" className="text-rule">
            ·
          </span>
          <span>{siteConfig.year}</span>
        </p>
      </div>

      {/* Scroll cue at bottom */}
      <div
        aria-hidden="true"
        className="container-research pb-12 animate-fade-in-slow"
      >
        <div className="flex items-center gap-2 font-mono text-[0.7rem] uppercase tracking-meta text-ink-soft">
          <ChevronDown className="h-3.5 w-3.5" />
          <span>Scroll to explore</span>
        </div>
      </div>
    </section>
  );
}

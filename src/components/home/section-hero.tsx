import { siteConfig } from '@/lib/site-config';
import { ChevronDown } from 'lucide-react';

export function SectionHero() {
  return (
    <section
      id="hero"
      // 4rem accounts for the sticky SiteNav above the hero so that the
      // entire hero — including the scroll cue at the bottom — fits within
      // the visible viewport on 1080p+ displays.
      className="relative flex min-h-[calc(100vh-4rem)] flex-col bg-paper"
    >
      <div className="container-research flex flex-1 flex-col justify-center pb-24 pt-12 sm:pt-16">
        {/* Top meta line */}
        <p className="meta-label">A research portfolio · {siteConfig.year}</p>

        {/* Display title — sits at ~35–45% of the viewport */}
        <h1 className="display-title mt-8 max-w-[18ch] text-ink sm:mt-10">
          Soil Microbial<br />
          <span className="text-accent">Respiration.</span>
        </h1>

        {/* Italic subtitle */}
        <p className="subtitle mt-6 max-w-[55ch] sm:mt-8">
          Everywhere underfoot, soil microbes breathe out carbon dioxide as
          they feed — a flow of carbon second only to the oceans&rsquo;, and
          one we still can&apos;t measure well. This project builds three ways
          to track it, from a bench-top biosensor to a continent-wide map.
        </p>

        {/* Quiet author / institution line */}
        <p className="meta-text mt-10 flex flex-wrap items-center gap-x-3 gap-y-1 sm:mt-16">
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

      {/* Scroll cue pinned at the bottom of the viewport-sized hero so it is
          always visible without scrolling, regardless of content height. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-8 left-0 right-0 animate-fade-in-slow"
      >
        <div className="container-research">
          <div className="flex items-center gap-2 font-mono text-[0.7rem] uppercase tracking-meta text-ink-soft">
            <ChevronDown className="h-3.5 w-3.5" />
            <span>Scroll to explore</span>
          </div>
        </div>
      </div>
    </section>
  );
}

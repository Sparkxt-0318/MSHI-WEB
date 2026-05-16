import Link from 'next/link';
import { Reveal } from '@/components/site/reveal';
import { SectionLabel } from '@/components/site/section-label';
import { siteConfig } from '@/lib/site-config';
import { ArrowRight } from 'lucide-react';

const HERO_IMAGE = '/images/hero_f_npp_asia.png';

export function SectionAtlasTeaser() {
  return (
    <section
      id="atlas-teaser"
      className="relative border-t border-rule bg-cream"
    >
      <div className="container-research pt-20 pb-12">
        <Reveal>
          <SectionLabel number="03" label="The Atlas" />
          <h2 className="section-title mt-6 max-w-[24ch]">
            Cross-continental ML, validated on a held-out continent.
          </h2>
        </Reveal>
      </div>

      {/* Full-bleed image band */}
      <div className="relative w-full">
        <div className="relative h-[72vh] w-full overflow-hidden border-y border-rule">
          {/*
            User to drop the published anomaly composite at this path:
            /public/images/hero_f_npp_asia.png
            Until the file exists, the placeholder tile renders below as a
            <div> background. Once the user supplies the file, replace with
            <Image src={HERO_IMAGE} ... />
          */}
          <div
            aria-hidden="true"
            className="placeholder-tile absolute inset-0 h-full w-full"
            style={{ aspectRatio: 'auto' }}
          >
            <div className="space-y-2">
              <p className="text-[0.7rem] font-bold tracking-[0.18em] text-accent">
                PLACEHOLDER · USER TO SUPPLY
              </p>
              <p className="text-[0.7rem] text-ink-soft normal-case tracking-normal">
                {HERO_IMAGE}
              </p>
              <p className="max-w-md text-[0.7rem] text-ink-soft normal-case tracking-normal">
                Asia anomaly composite (F+NPP). Copy from sister repo into
                <span className="ml-1 font-mono">/public/images/</span>.
              </p>
            </div>
          </div>

          {/* Overlay card on the right */}
          <div className="pointer-events-none absolute inset-0 flex items-center">
            <div className="container-research w-full">
              <Reveal delayMs={120}>
                <div className="pointer-events-auto ml-auto max-w-md border border-ink/20 bg-ink p-8 text-paper shadow-xl">
                  <p className="font-mono text-[0.7rem] uppercase tracking-meta text-accent-pale">
                    Asia → US transfer · best configuration
                  </p>

                  <p className="mt-5 font-serif text-6xl font-bold leading-none">
                    R²&nbsp;=&nbsp;
                    <span className="text-accent-pale">
                      +{siteConfig.headline.transferR2.toFixed(3)}
                    </span>
                  </p>

                  <p className="mt-4 font-serif text-base italic text-paper/80">
                    Climate + MODIS NPP, n_train ={' '}
                    {siteConfig.headline.nTrainAsia} Asian sites,
                    held-out test on {siteConfig.headline.nTestUS} US sites.
                  </p>

                  <p className="mt-5 max-w-sm text-[0.92rem] leading-relaxed text-paper/85">
                    95% bootstrap CI{' '}
                    <span className="whitespace-nowrap">
                      [+{siteConfig.headline.ciLow.toFixed(3)},
                      &nbsp;+{siteConfig.headline.ciHigh.toFixed(3)}]
                    </span>{' '}
                    excludes zero. NPP is rank-1 SHAP driver. Best of any
                    tested configuration.
                  </p>

                  <Link
                    href="/atlas"
                    className="mt-7 inline-flex items-center gap-2 border-b border-accent-pale pb-1 font-mono text-[0.78rem] uppercase tracking-meta text-accent-pale hover:border-paper hover:text-paper"
                  >
                    Explore the interactive atlas <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </div>

      <div className="container-research py-8">
        <p className="meta-text">
          Anomaly = predicted Rs ÷ predicted Rs at climatological mean. Values
          &gt; 1 indicate above-average flux; values &lt; 1 indicate below.
        </p>
      </div>
    </section>
  );
}

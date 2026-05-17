import Image from 'next/image';
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
      <div className="container-research section-band">
        <Reveal>
          <SectionLabel number="03" label="The Atlas" />
          <h2 className="section-title mt-6 max-w-[24ch]">
            Cross-continental ML, validated on a held-out continent.
          </h2>
        </Reveal>

        <div className="mt-14 grid items-center gap-10 lg:grid-cols-12">
          <Reveal className="lg:col-span-8">
            <figure className="overflow-hidden border border-rule bg-paper shadow-sm">
              <Image
                src={HERO_IMAGE}
                alt="Asia soil respiration anomaly composite — F+NPP configuration, ~5 km resolution"
                width={4906}
                height={2850}
                className="h-auto w-full"
                priority
              />
            </figure>
          </Reveal>

          <Reveal className="lg:col-span-4" delayMs={120}>
            <div className="border border-ink/20 bg-ink p-8 text-paper shadow-xl">
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
                {siteConfig.headline.nTrainAsia} Asian sites, held-out test on{' '}
                {siteConfig.headline.nTestUS} US sites.
              </p>

              <p className="mt-5 text-[0.92rem] leading-relaxed text-paper/85">
                95% bootstrap CI{' '}
                <span className="whitespace-nowrap">
                  [+{siteConfig.headline.ciLow.toFixed(3)},
                  &nbsp;+{siteConfig.headline.ciHigh.toFixed(3)}]
                </span>{' '}
                excludes zero. NPP is rank-1 SHAP driver. Best of any tested
                configuration.
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

        <p className="meta-text mt-8">
          Anomaly = predicted Rs ÷ predicted Rs at climatological mean. Values
          &gt; 1 indicate above-average flux; values &lt; 1 indicate below.
        </p>
      </div>
    </section>
  );
}

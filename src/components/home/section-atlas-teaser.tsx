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
            A soil-carbon map, put to the test on a continent it never saw.
          </h2>
        </Reveal>

        <div className="mt-14 grid items-center gap-10 lg:grid-cols-12">
          <Reveal className="lg:col-span-8">
            <figure className="overflow-hidden border border-rule bg-paper shadow-sm">
              <Image
                src={HERO_IMAGE}
                alt="Map of Asia shading where soil respiration runs above or below its climate-expected baseline — the F+NPP model at ~5 km resolution"
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

              <p className="mt-5 font-serif font-bold leading-none">
                <span className="block text-xl text-paper/80">R²&nbsp;=</span>
                <span className="mt-2 block whitespace-nowrap text-5xl text-accent-pale">
                  +{siteConfig.headline.transferR2.toFixed(3)}
                </span>
              </p>

              <p className="mt-4 font-serif text-base italic text-paper/80">
                Trained on {siteConfig.headline.nTrainAsia} Asian sites using
                climate plus MODIS NPP, then tested on{' '}
                {siteConfig.headline.nTestUS} US sites it never saw.
              </p>

              <p className="mt-5 text-[0.92rem] leading-relaxed text-paper/85">
                Its 95% bootstrap confidence interval{' '}
                <span className="whitespace-nowrap">
                  [+{siteConfig.headline.ciLow.toFixed(3)},
                  &nbsp;+{siteConfig.headline.ciHigh.toFixed(3)}]
                </span>{' '}
                stays above zero, and satellite plant growth (MODIS NPP) is the
                input the model leans on most — its top-ranked SHAP driver (the
                measure of which inputs move a prediction). Best of any
                configuration tested.
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
          The MSHI Atlas is this project&apos;s continent-scale prediction of
          soil respiration. On the map, the anomaly is the predicted Rs divided
          by what you&apos;d expect at the average climate (predicted Rs ÷
          predicted Rs at climatological mean): values above 1 mean more soil
          breathing than climate alone predicts; below 1, less.
        </p>
      </div>
    </section>
  );
}

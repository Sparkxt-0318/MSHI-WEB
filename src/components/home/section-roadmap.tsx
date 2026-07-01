import Link from 'next/link';
import { Reveal } from '@/components/site/reveal';
import { SectionLabel } from '@/components/site/section-label';
import { siteConfig } from '@/lib/site-config';
import { ArrowUpRight } from 'lucide-react';

const CARDS = [
  {
    n: '01',
    title: 'Cross-continental MODIS expansion',
    body: 'The satellite plant-growth data (MODIS NPP) is already wired in. Next up are multi-year MODIS time-series and biome-by-biome MODIS interactions — both should tighten the F+NPP confidence interval and quiet the noise in the biome-by-biome results.',
  },
  {
    n: '02',
    title: 'First side-by-side sensor and chamber test',
    body: 'The first time the biosensor runs right next to a working flux chamber. We would place it at SRDB study sites that already measure chamber Rs (soil respiration), so the sensor’s signal can be checked against the real CO₂ flux. First pairing: a cold, continental Köppen-D forest where the atlas is most uncertain, alongside a temperate Köppen-C forest where the model already transfers well.',
  },
  {
    n: '03',
    title: 'Open data and reproducibility',
    body: 'All the code, trained models, predictions, and held-out scoring scripts, made public. The paper, the atlas, and the biosensor pipeline will live in one shared repository.',
  },
];

export function SectionRoadmap() {
  return (
    <section id="roadmap" className="section-band border-t border-rule bg-paper">
      <div className="container-research">
        <Reveal>
          <SectionLabel number="08" label="What's Next" />
          <h2 className="section-title mt-6 max-w-[24ch]">
            From benchmark to deployment.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-px border border-rule bg-rule md:grid-cols-3">
          {CARDS.map((card, idx) => (
            <Reveal key={card.n} delayMs={idx * 100}>
              <article className="flex h-full flex-col bg-paper p-7">
                <p className="font-mono text-[0.7rem] uppercase tracking-meta text-accent">
                  {card.n}
                </p>
                <h3 className="mt-4 font-serif text-xl font-bold leading-snug text-ink">
                  {card.title}
                </h3>
                <p className="mt-4 text-[0.95rem] leading-relaxed text-ink-soft">
                  {card.body}
                </p>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delayMs={400}>
          <div className="mt-14 flex flex-wrap items-center gap-x-10 gap-y-4">
            <Link
              href="/paper"
              className="link-arrow inline-flex items-center gap-2"
            >
              Read the paper <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href={`mailto:${siteConfig.email}`}
              className="link-arrow inline-flex items-center gap-2"
            >
              {siteConfig.email}
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

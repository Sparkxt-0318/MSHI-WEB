import Link from 'next/link';
import { Reveal } from '@/components/site/reveal';
import { SectionLabel } from '@/components/site/section-label';
import { siteConfig } from '@/lib/site-config';
import { ArrowUpRight } from 'lucide-react';

const CARDS = [
  {
    n: '01',
    title: 'Cross-continental MODIS expansion',
    body: 'MODIS NPP integration is complete. Multi-year MODIS time-series and biome-specific MODIS interactions are queued for paper revision — both should tighten the F+NPP confidence interval and lower the noise floor on biome-stratified transfer.',
  },
  {
    n: '02',
    title: 'First co-located EAB-Rs deployment',
    body: 'Pilot deployment of the biosensor at SRDB study sites with active chamber Rs, enabling direct sensor-to-flux validation. First pass: a Köppen-D continental forest with high atlas uncertainty, paired with a temperate-C forest where transfer is strong.',
  },
  {
    n: '03',
    title: 'Open data and reproducibility',
    body: 'All code, model artifacts, predictions, and held-out scoring scripts publicly available. The paper, the atlas, and the biosensor pipeline will share one canonical repository.',
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

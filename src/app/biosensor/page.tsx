import type { Metadata } from 'next';
import { SectionLabel } from '@/components/site/section-label';
import { SampleCard } from '@/components/biosensor/sample-card';
import { PLACEHOLDER_SAMPLES } from '@/components/biosensor/sample-fixtures';
import { SiteFooter } from '@/components/site/site-footer';

export const metadata: Metadata = {
  title: 'Biosensor',
  description:
    'Curated MSHI biosensor examples. Four-technique electrochemistry traces and the MSHI score they collapse into.',
};

export default function BiosensorPage() {
  return (
    <>
      <section className="section-band border-b border-rule bg-paper">
        <div className="container-research">
          <SectionLabel number="05" label="The Biosensor" />
          <h1 className="display-title mt-6 max-w-[20ch]">
            Browse curated biosensor examples.
          </h1>
          <p className="mt-8 max-w-prose text-lg leading-relaxed text-ink-soft">
            These are curated demonstrations from our published dataset. Live
            ingestion of new electrochemistry runs is queued for the next
            phase. Each card opens a detail view with the four
            electrochemistry traces, the resulting MSHI score, sample
            metadata, and the site location on the atlas.
          </p>

          <div className="mt-6 inline-block border border-accent bg-cream px-3 py-2">
            <p className="font-mono text-[0.7rem] uppercase tracking-meta text-accent">
              All examples on this page are placeholders
            </p>
            <p className="mt-1 max-w-prose font-mono text-[0.7rem] leading-relaxed text-ink-soft normal-case tracking-normal">
              User will provide 3–6 real samples — see{' '}
              <span className="text-accent">README §Schemas</span> for the
              data shape.
            </p>
          </div>
        </div>
      </section>

      <section className="section-band bg-cream/40">
        <div className="container-research">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {PLACEHOLDER_SAMPLES.map((sample) => (
              <SampleCard key={sample.id} sample={sample} />
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}

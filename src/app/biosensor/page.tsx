import type { Metadata } from 'next';
import Link from 'next/link';
import { SectionLabel } from '@/components/site/section-label';
import { SampleCard } from '@/components/biosensor/sample-card';
import { DpvReferenceFigure } from '@/components/biosensor/dpv-reference';
import { SiteFooter } from '@/components/site/site-footer';
import {
  loadBiosensorDataset,
  loadDpvReference,
} from '@/lib/biosensor-data';
import type { Classification } from '@/components/biosensor/sample-types';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Biosensor',
  description:
    'Curated electrochemistry gallery from the published MSHI dataset: real CA, CV, and OCP traces and the MSHI score they collapse into.',
};

const CLASS_ORDER: Classification[] = ['healthy', 'unhealthy', 'saline'];
const CLASS_LABEL: Record<Classification, string> = {
  healthy: 'Healthy',
  unhealthy: 'Unhealthy',
  saline: 'Saline-stressed',
};

export default function BiosensorPage() {
  const data = loadBiosensorDataset();
  const samples = data.samples;
  const dpv = loadDpvReference();

  const groups = CLASS_ORDER.map((cls) => ({
    cls,
    items: samples.filter((s) => s.classification === cls),
  })).filter((g) => g.items.length > 0);

  return (
    <>
      <section className="section-band border-b border-rule bg-paper">
        <div className="container-research">
          <SectionLabel number="05" label="The Biosensor" />
          <h1 className="display-title mt-6 max-w-[20ch]">
            The centimeter-scale measurement.
          </h1>
          <p className="mt-8 max-w-prose text-lg leading-relaxed text-ink-soft">
            This is the finest tier of the three-tier soil-carbon framework —
            below the chamber and the continental atlas. A three-electrode
            bioelectrochemical cell measures soil microbial activity directly
            through the current that electrochemically active biofilms
            (<em>Geobacter</em>-dominated) generate via extracellular electron
            transfer. Every sample below is a validated run from the published
            study,{' '}
            <Link href="/paper" className="link-arrow">
              {siteConfig.paperTitle}
            </Link>
            .
          </p>

          <div className="mt-8 max-w-prose space-y-2 border-l-2 border-rule pl-5 text-[0.95rem] leading-relaxed text-ink">
            <p>
              <span className="font-mono text-[0.72rem] uppercase tracking-meta text-accent">
                CA
              </span>{' '}
              — chronoamperometry: current over time at a fixed potential,
              tracking electroactive-biofilm growth and bulk electron-transfer
              rate.
            </p>
            <p>
              <span className="font-mono text-[0.72rem] uppercase tracking-meta text-bedrock-blue">
                CV
              </span>{' '}
              — cyclic voltammetry: the redox fingerprint of the biofilm,
              separating faradaic biological signal from ohmic abiotic noise.
            </p>
            <p>
              <span className="font-mono text-[0.72rem] uppercase tracking-meta text-bedrock-good">
                OCP
              </span>{' '}
              — open-circuit potential: the soil&rsquo;s resting
              electrochemical state with no applied bias (Phase II samples
              only).
            </p>
          </div>

          <p className="mt-6 max-w-prose text-[0.95rem] leading-relaxed text-ink-soft">
            Differential pulse voltammetry was also used in the study, but it
            is a peak-measurement technique and no per-sample DPV trace
            exists in this corpus, so instead of per-sample charts the single
            reference below is digitized from the author&rsquo;s published
            DPV trace — marking the OmcZ cytochrome redox peak near
            &minus;0.13&nbsp;V — with the full analysis in the{' '}
            <Link href="/paper" className="link-arrow">
              paper
            </Link>
            .
          </p>

          <div className="mt-6 max-w-prose">
            <DpvReferenceFigure dpv={dpv} />
            <p className="mt-2 font-mono text-[0.62rem] leading-relaxed text-ink-soft">
              {dpv.source} Not a gallery-sample measurement. See the{' '}
              <Link href="/paper" className="link-arrow">
                paper
              </Link>{' '}
              for the full DPV analysis.
            </p>
          </div>
        </div>
      </section>

      <section className="section-band bg-cream/40">
        <div className="container-research">
          <div className="flex items-baseline justify-between border-b border-rule pb-4">
            <p className="meta-label">
              {data.sample_count}{' '}
              {data.sample_count === 1 ? 'sample' : 'samples'} · grouped by
              classification
            </p>
            <p className="font-mono text-[0.65rem] uppercase tracking-meta text-ink-soft">
              Phase I: CA · CV &nbsp;|&nbsp; Phase II: CA · CV · OCP
            </p>
          </div>

          {groups.map((group) => (
            <div key={group.cls} className="mt-12 first:mt-10">
              <h2 className="font-serif text-2xl font-bold text-ink">
                {CLASS_LABEL[group.cls]}
                <span className="ml-3 font-mono text-[0.7rem] uppercase tracking-meta text-ink-soft">
                  {group.items.length}{' '}
                  {group.items.length === 1 ? 'sample' : 'samples'}
                </span>
              </h2>
              <div className="mt-5 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {group.items.map((sample) => (
                  <SampleCard key={sample.id} sample={sample} dpv={dpv} />
                ))}
              </div>
            </div>
          ))}

          <div className="mt-16 border border-rule bg-paper p-6">
            <p className="meta-label">Running the model on new data</p>
            <p className="mt-3 max-w-prose text-[0.95rem] leading-relaxed text-ink">
              The traces above are validated results from the published
              dataset. A clean, reproducible notebook for scoring your own
              electrochemistry files end-to-end is pending the public release
              of the MSHI model artifacts (XGBoost + 1D-CNN ensemble and
              scalers); they are not yet published to the open repository.
              Until then, the methods and the trained pipeline are described in
              the{' '}
              <Link href="/paper" className="link-arrow">
                paper
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Reveal } from '@/components/site/reveal';
import { SectionLabel } from '@/components/site/section-label';
import { ElectrochemTraces } from '@/components/biosensor/electrochem-traces';
import { loadBiosensorDataset } from '@/lib/biosensor-data';

const CLASS_COLOR: Record<string, string> = {
  healthy: 'text-bedrock-good',
  unhealthy: 'text-accent',
  saline: 'text-bedrock-warn',
};
const CLASS_LABEL: Record<string, string> = {
  healthy: 'Healthy',
  unhealthy: 'Unhealthy',
  saline: 'Saline-stressed',
};

export function SectionBiosensor() {
  const { samples } = loadBiosensorDataset();
  // Feature the richest validated run: a healthy Phase II sample carries
  // all three techniques (CA + CV + OCP).
  const featured =
    samples.find(
      (s) => s.classification === 'healthy' && s.techniques.length === 3,
    ) ?? samples[0];

  return (
    <section
      id="biosensor"
      className="section-band-tall border-t border-rule bg-cream/40"
    >
      <div className="container-research">
        <Reveal>
          <SectionLabel number="05" label="The Biosensor" />
          <h2 className="section-title mt-6 max-w-[28ch]">
            What a centimeter-scale measurement looks like.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-10 md:grid-cols-12">
          {/* Left: prose */}
          <Reveal className="md:col-span-4" delayMs={80}>
            <div className="text-[1rem] leading-relaxed text-ink">
              <p>
                The MSHI biosensor is an electroactive-bacteria sensor reported
                in{' '}
                <Link href="/paper" className="link-arrow">
                  the published study
                </Link>
                . A three-electrode cell, an inoculated soil sample, and a
                short electrochemistry protocol per run.
              </p>
              <p className="mt-4">
                Chronoamperometry tracks bulk electron-transfer current.
                Cyclic voltammetry resolves redox couples on the biofilm.
                Open-circuit potential drift quantifies microbial poise.
              </p>
              <p className="mt-4 text-ink-soft">
                The Microbial Soil Health Index collapses these traces into a
                single score in [0,&nbsp;1] with a calibrated healthy /
                unhealthy / saline-stressed classifier.
              </p>
            </div>
          </Reveal>

          {/* Center: real trace panel */}
          <Reveal className="md:col-span-5" delayMs={140}>
            <div className="border border-rule bg-paper p-2">
              <ElectrochemTraces sample={featured} />
            </div>
            <p className="mt-3 text-[0.78rem] italic text-ink-soft">
              {featured.name} — a validated run from the published dataset.
            </p>
          </Reveal>

          {/* Right: real MSHI score card */}
          <Reveal className="md:col-span-3" delayMs={200}>
            <div className="border border-rule bg-paper p-6">
              <p className="font-mono text-[0.65rem] uppercase tracking-meta text-ink-soft">
                {featured.phase} · Trial {featured.trial_id}
              </p>
              <p className="mt-4 font-mono text-[0.7rem] uppercase tracking-meta text-ink-soft">
                MSHI score
              </p>
              <p className="mt-1 font-serif text-5xl font-bold leading-none text-ink">
                {featured.mshi_score.toFixed(2)}
              </p>
              <p className="mt-5 font-mono text-[0.7rem] uppercase tracking-meta text-ink-soft">
                Classification
              </p>
              <p
                className={`mt-1 font-serif text-lg font-bold ${
                  CLASS_COLOR[featured.classification] ?? 'text-ink'
                }`}
              >
                {CLASS_LABEL[featured.classification] ??
                  featured.classification}
              </p>

              <hr className="my-6 border-rule" />

              <p className="font-mono text-[0.65rem] leading-relaxed text-ink-soft">
                Validated result from the published MSHI dataset. Browse the
                full curated gallery for the real CA / CV / OCP traces behind
                each score.
              </p>
            </div>
          </Reveal>
        </div>

        <Reveal delayMs={320}>
          <div className="mt-14 flex items-center gap-4">
            <Link
              href="/biosensor"
              className="link-arrow inline-flex items-center gap-2"
            >
              Browse the curated gallery <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

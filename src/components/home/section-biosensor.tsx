import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Reveal } from '@/components/site/reveal';
import { SectionLabel } from '@/components/site/section-label';
import { ElectrochemTraces } from '@/components/biosensor/electrochem-traces';

export function SectionBiosensor() {
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
                in our prior published work
                <span className="text-ink-soft"> [paper citation pending]</span>.
                A simple two-electrode cell, an inoculated soil sample, and four
                electrochemistry measurements per sample.
              </p>
              <p className="mt-4">
                Chronoamperometry tracks bulk electron-transfer current.
                Cyclic voltammetry resolves redox couples on the biofilm.
                Open-circuit potential drift quantifies microbial poise.
                Differential pulse voltammetry locates trace electroactive
                metabolites.
              </p>
              <p className="mt-4 text-ink-soft">
                The Microbial Soil Health Index collapses the four traces
                into a single score in [0, 1] with a calibrated healthy /
                unhealthy / saline-stressed classifier.
              </p>
            </div>
          </Reveal>

          {/* Center: trace panel */}
          <Reveal className="md:col-span-5" delayMs={140}>
            <div className="border border-rule bg-paper p-2">
              <ElectrochemTraces placeholder />
            </div>
            <p className="mt-3 text-[0.78rem] italic text-ink-soft">
              Illustrative shapes. Real sample traces will replace these once
              user provides the per-sample CSVs.
            </p>
          </Reveal>

          {/* Right: MSHI score card (mock) */}
          <Reveal className="md:col-span-3" delayMs={200}>
            <div className="border border-rule bg-paper p-6">
              <p className="font-mono text-[0.65rem] uppercase tracking-meta text-accent">
                Placeholder · mock result
              </p>
              <p className="mt-4 font-mono text-[0.7rem] uppercase tracking-meta text-ink-soft">
                MSHI score
              </p>
              <p className="mt-1 font-serif text-5xl font-bold leading-none text-ink">
                0.78
              </p>
              <p className="mt-5 font-mono text-[0.7rem] uppercase tracking-meta text-ink-soft">
                Classification
              </p>
              <p className="mt-1 font-serif text-lg font-bold text-bedrock-good">
                Healthy
              </p>
              <p className="mt-5 font-mono text-[0.7rem] uppercase tracking-meta text-ink-soft">
                Confidence
              </p>
              <p className="mt-1 font-serif text-lg text-ink">92%</p>

              <hr className="my-6 border-rule" />

              <p className="font-mono text-[0.65rem] leading-relaxed text-ink-soft">
                These values are illustrative only. The real MSHI scoring
                pipeline will be wired in when the user supplies sample
                CSVs and the calibrated classifier weights.
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
              Browse curated examples <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

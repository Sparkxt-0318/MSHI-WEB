import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Reveal } from '@/components/site/reveal';
import { SectionLabel } from '@/components/site/section-label';
import { ElectrochemTraces } from '@/components/biosensor/electrochem-traces';
import { loadBiosensorDataset, loadDpvReference } from '@/lib/biosensor-data';

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
  const dpv = loadDpvReference();
  // Feature the richest validated run: a healthy Phase II sample carries
  // all three techniques (CA + CV + OCP); DPV adds the fourth square.
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
            Reading soil health as an electric current.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-10 md:grid-cols-12">
          {/* Left: prose + compact score */}
          <Reveal className="md:col-span-4" delayMs={80}>
            <div className="text-[1rem] leading-relaxed text-ink">
              <p>
                Living soil teems with microbes; dead or salt-poisoned soil
                doesn&apos;t. The MSHI biosensor measures that difference
                head-on — MSHI is short for Microbial Soil Health Index, the
                score it produces. The trick is electroactive bacteria:
                microbes that release electrons as they breathe, which the
                sensor picks up as a faint electric current. Every run happens
                on the bench — a three-electrode cell (the standard lab rig for
                driving and measuring such currents), an inoculated soil
                sample, and a short electrochemistry protocol, exactly as
                reported in{' '}
                <Link href="/paper" className="link-arrow">
                  the published study
                </Link>
                .
              </p>
              <p className="mt-4">
                Each run looks at the same soil three ways. Chronoamperometry
                (CA) holds the voltage fixed and watches the current climb as
                the bacteria build a living film — a biofilm — on the
                electrode. Cyclic voltammetry (CV) sweeps the voltage up and
                down to fingerprint the molecules actually shuttling the
                electrons (the biofilm&apos;s redox couples). Open-circuit
                potential (OCP) cuts the power and reads the soil&apos;s natural
                electrical &ldquo;idle,&rdquo; a gauge of how energized the
                microbial community is.
              </p>
              <p className="mt-4 text-ink-soft">
                A trained model then folds these traces into the Microbial Soil
                Health Index itself: a single score in [0,&nbsp;1], paired with
                a calibrated classifier that labels each soil healthy,
                unhealthy, or saline-stressed (salt-damaged).
              </p>
            </div>

            <div className="mt-8 border border-rule bg-paper p-6">
              <p className="font-mono text-[0.65rem] uppercase tracking-meta text-ink-soft">
                {featured.name} · {featured.phase} · Trial{' '}
                {featured.trial_id}
              </p>
              <div className="mt-4 flex items-end gap-6">
                <div>
                  <p className="font-mono text-[0.7rem] uppercase tracking-meta text-ink-soft">
                    MSHI score
                  </p>
                  <p className="mt-1 font-serif text-5xl font-bold leading-none text-ink">
                    {featured.mshi_score.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[0.7rem] uppercase tracking-meta text-ink-soft">
                    Class
                  </p>
                  <p
                    className={`mt-1 font-serif text-lg font-bold ${
                      CLASS_COLOR[featured.classification] ?? 'text-ink'
                    }`}
                  >
                    {CLASS_LABEL[featured.classification] ??
                      featured.classification}
                  </p>
                </div>
              </div>
              <p className="mt-5 border-t border-rule pt-4 font-mono text-[0.65rem] leading-relaxed text-ink-soft">
                Validated result from the published MSHI dataset.
              </p>
            </div>
          </Reveal>

          {/* Right: real trace panel — full width for the 2×2 grid */}
          <Reveal className="md:col-span-8" delayMs={140}>
            <div className="border border-rule bg-paper p-3">
              <ElectrochemTraces sample={featured} dpv={dpv} />
            </div>
            <p className="mt-3 text-[0.78rem] italic text-ink-soft">
              {featured.name} — a validated run from the published dataset. The
              fourth panel, differential pulse voltammetry (DPV), is a shared
              reference curve digitized from the paper, not this sample&apos;s
              own reading.
            </p>
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

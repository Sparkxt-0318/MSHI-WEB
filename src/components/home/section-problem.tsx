import { CarbonFluxChart } from './carbon-flux-chart';
import { Reveal } from '@/components/site/reveal';
import { SectionLabel } from '@/components/site/section-label';

export function SectionProblem() {
  return (
    <section id="problem" className="section-band-tall border-t border-rule">
      <div className="container-research">
        <Reveal>
          <SectionLabel number="01" label="The Problem" />
          <h2 className="section-title mt-6 max-w-[22ch]">
            We can&apos;t measure what we manage.
          </h2>
        </Reveal>

        <div className="mt-16 grid gap-16 md:grid-cols-12">
          <Reveal className="md:col-span-7" delayMs={80}>
            <div className="body-prose">
              <p>
                Each year the world&apos;s soils breathe roughly{' '}
                <strong className="font-semibold">91 Pg C yr⁻¹</strong> back
                into the air — 91 petagrams of carbon, and a single petagram is
                a billion tonnes. It is the second-largest flux in the
                terrestrial carbon cycle, exceeded only by photosynthesis —
                within an order of magnitude of all the carbon the
                world&apos;s plants capture through it (their gross primary
                production). Yet the continental models that try to map it{' '}
                <span className="whitespace-nowrap">
                  (Hashimoto&nbsp;2015, Warner&nbsp;2019, Stell&nbsp;2021)
                </span>{' '}
                only ever quote their uncertainty as a blur on the global
                total — never as a real test on the individual sites a model
                has never seen.
              </p>
              <p>
                That leaves the question that actually matters for anyone
                leaning on these maps: train a model on one continent — does it
                still work on the next? The published literature hasn&apos;t
                answered it. Our atlas is built around exactly that test. We
                train and tune it inside Asia using spatial-block
                cross-validation — checking it on whole geographic blocks it
                never saw in training, so a neighboring site can&apos;t quietly
                leak the answer — then give it a fully held-out final exam: 274
                SRDB+COSORE sites across the United States (SRDB and COSORE are
                the large open databases of real-world soil-respiration
                measurements).
              </p>
              <p className="text-ink-soft">
                Skip that test, and every continental respiration map is really
                just a hypothesis. Run it, and you can say exactly where the
                satellite-scale map can be trusted — and where you need to put
                a hands-on sensor in the ground.
              </p>
            </div>
          </Reveal>

          <Reveal className="md:col-span-5" delayMs={140}>
            <div className="border border-rule bg-cream/60 p-6">
              <p className="meta-label text-ink-soft">Annual carbon flow</p>
              <h3 className="mt-2 font-serif text-lg font-bold text-ink">
                Soil respiration sits between photosynthesis and fossil-fuel
                emissions.
              </h3>
              <div className="mt-6">
                <CarbonFluxChart />
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

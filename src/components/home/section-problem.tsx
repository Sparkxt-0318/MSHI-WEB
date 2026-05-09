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
                Soils release roughly{' '}
                <strong className="font-semibold">91 Pg C yr⁻¹</strong> to the
                atmosphere — second only to ocean carbon exchange and within an
                order of magnitude of global gross primary production.
                Continental upscaling models{' '}
                <span className="whitespace-nowrap">
                  (Hashimoto&nbsp;2015, Warner&nbsp;2019, Stell&nbsp;2021)
                </span>{' '}
                report uncertainty in petagrams per year on the global sum, but
                never as held-out site-level transfer.
              </p>
              <p>
                The decision-relevant question — does a model trained on one
                continent predict the next? — has not been answered in the
                published literature. Our atlas is built around that question:
                spatial-block cross-validation within Asia, then a fully
                held-out test on 274 SRDB+COSORE sites in the United States.
              </p>
              <p className="text-ink-soft">
                Without that test, every continental Rs map is a hypothesis.
                With it, we can quantify exactly where the upscaling tier is
                trustworthy and where ground-truth sensors are required.
              </p>
            </div>
          </Reveal>

          <Reveal className="md:col-span-5" delayMs={140}>
            <div className="border border-rule bg-cream/60 p-6">
              <p className="meta-label text-ink-soft">Annual carbon flux</p>
              <h3 className="mt-2 font-serif text-lg font-bold text-ink">
                Soil Rs sits between GPP and fossil emissions.
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

import Link from 'next/link';
import { ArrowRight, Play } from 'lucide-react';
import { Reveal } from '@/components/site/reveal';
import { SectionLabel } from '@/components/site/section-label';
import { SimulationPoster } from '@/components/simulation/simulation-poster';
import { CLASS_CONFIGS } from '@/components/simulation/sim-constants';

export function SectionSimulation() {
  return (
    <section
      id="simulation"
      className="section-band-tall border-t border-rule bg-paper"
    >
      <div className="container-research">
        <Reveal>
          <SectionLabel number="06" label="The Simulation" />
          <h2 className="section-title mt-6 max-w-[26ch]">
            See the whole measurement in motion.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-10 md:grid-cols-12">
          <Reveal className="md:col-span-5" delayMs={80}>
            <div className="text-[1rem] leading-relaxed text-ink">
              <p>
                Press play and a multi-day experiment unfolds in about 30
                seconds. A film of microbes — a biofilm — spreads over the
                electrode, the electrons they shed stream into the circuit, and
                a{' '}
                <span className="font-semibold">Microbial Soil Health Index</span>{' '}
                takes shape in real time.
              </p>
              <p className="mt-4 text-ink-soft">
                Three soils run the race side by side in 3D — spin the scene,
                jump ahead, and watch the healthy soil pull away from the
                stressed and degraded ones.
              </p>
            </div>

            <div className="mt-8 border border-rule bg-cream/50 p-6">
              <p className="font-mono text-[0.65rem] uppercase tracking-meta text-ink-soft">
                Final health score
              </p>
              <div className="mt-4 flex items-end gap-6">
                {CLASS_CONFIGS.map((c) => (
                  <div key={c.key}>
                    <p className={`font-serif text-3xl font-bold leading-none ${c.tw}`}>
                      {c.mshiTarget.toFixed(2)}
                    </p>
                    <p className="mt-1.5 flex items-center gap-1.5 font-mono text-[0.6rem] uppercase tracking-meta text-ink-soft">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ background: c.hex }}
                      />
                      {c.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <Link
              href="/simulation"
              className="link-arrow mt-8 inline-flex items-center gap-2"
            >
              Open the simulation <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Reveal>

          <Reveal className="md:col-span-7" delayMs={140}>
            <Link
              href="/simulation"
              aria-label="Open the interactive simulation"
              className="group relative block overflow-hidden rounded-lg border border-white/10 shadow-[0_18px_60px_-28px_rgba(14,17,22,0.5)]"
            >
              <SimulationPoster className="block w-full" />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-paper/90 text-ink shadow-lg transition-transform group-hover:scale-110">
                  <Play className="ml-1 h-6 w-6" />
                </span>
              </span>
            </Link>
            <p className="mt-3 text-[0.78rem] italic text-ink-soft">
              A simplified, sped-up illustration of the centimeter-scale
              measurement — the full version is interactive on its own page.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

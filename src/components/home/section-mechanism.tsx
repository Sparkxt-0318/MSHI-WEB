import Image from 'next/image';
import Link from 'next/link';
import { Reveal } from '@/components/site/reveal';
import { SectionLabel } from '@/components/site/section-label';

export function SectionMechanism() {
  return (
    <section
      id="mechanism"
      className="section-band-tall border-t border-rule bg-paper"
    >
      <div className="container-research">
        <Reveal>
          <SectionLabel number="04" label="Mechanism" />
          <h2 className="section-title mt-6 max-w-[28ch]">
            Why more data made the map worse — a finding, not a failure.
          </h2>
        </Reveal>

        <Reveal delayMs={120}>
          <div className="mx-auto mt-14 max-w-3xl">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src="/images/shap_comparison.png"
                alt="Chart comparing which inputs the model relied on (their SHAP importance) across the F, F+NPP, and Full+MODIS setups — clay, NPP, and climate variables change rank between Asia (training) and the US (held-out test)"
                fill
                className="object-contain"
              />
            </div>
            <figcaption className="mt-3 text-center text-[0.78rem] italic text-ink-soft">
              Which inputs matter most (their SHAP rank) shifts sharply from
              Asia to the US: what the model leaned on during training is not
              what actually drives respiration on the other continent.
            </figcaption>
          </div>
        </Reveal>

        <Reveal delayMs={160}>
          <div className="mx-auto mt-14 max-w-3xl">
            <p className="meta-label text-ink-soft">
              Three setups, tested for how well they carry across continents
            </p>
            <table className="mt-3 w-full border border-rule font-sans text-[0.92rem] text-ink">
              <thead className="border-b border-rule bg-cream/60">
                <tr>
                  <th className="px-3 py-2 text-left font-mono text-[0.7rem] uppercase tracking-meta text-ink-soft">
                    Configuration
                  </th>
                  <th className="px-3 py-2 text-right font-mono text-[0.7rem] uppercase tracking-meta text-ink-soft">
                    Transfer R²
                  </th>
                  <th className="px-3 py-2 text-right font-mono text-[0.7rem] uppercase tracking-meta text-ink-soft">
                    95% CI
                  </th>
                  <th className="px-3 py-2 text-left font-mono text-[0.7rem] uppercase tracking-meta text-ink-soft">
                    Takeaway
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-rule">
                  <td className="px-3 py-2 font-mono text-[0.85rem]">F (climate only)</td>
                  <td className="px-3 py-2 text-right font-mono text-[0.85rem]">+0.127</td>
                  <td className="px-3 py-2 text-right font-mono text-[0.78rem] text-ink-soft">
                    [+0.020, +0.212]
                  </td>
                  <td className="px-3 py-2">
                    Climate alone already carries to the other continent.
                  </td>
                </tr>
                <tr className="border-b border-rule bg-cream/40">
                  <td className="px-3 py-2 font-mono text-[0.85rem] font-bold">F+NPP</td>
                  <td className="px-3 py-2 text-right font-mono text-[0.85rem] font-bold">
                    +0.145
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-[0.78rem] text-ink-soft">
                    [+0.026, +0.241]
                  </td>
                  <td className="px-3 py-2">
                    <span className="font-bold">Best</span> — satellite NPP
                    captures the biology that travels.
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-mono text-[0.85rem]">Full+MODIS</td>
                  <td className="px-3 py-2 text-right font-mono text-[0.85rem]">+0.072</td>
                  <td className="px-3 py-2 text-right font-mono text-[0.78rem] text-ink-soft">
                    [−0.084, +0.189]
                  </td>
                  <td className="px-3 py-2">
                    Adding soil features backfires; the interval straddles zero.
                  </td>
                </tr>
              </tbody>
            </table>
            <p className="mt-3 text-center font-mono text-[0.7rem] text-ink-soft">
              The full five-setup analysis (including the Köppen climate-zone
              splits) is on the{' '}
              <Link
                href="/methods#configurations"
                className="border-b border-accent text-accent hover:text-ink hover:border-ink"
              >
                methods page
              </Link>
              .
            </p>
          </div>
        </Reveal>

        <Reveal delayMs={200}>
          <div className="mx-auto mt-14">
            <div className="body-prose mx-auto">
              <p>
                Here is the counter-intuitive part: feeding the model more soil
                and climate features actually hurt it. Going from{' '}
                <span className="font-mono text-[0.85em]">F</span> (16 climate
                + soil features) to{' '}
                <span className="font-mono text-[0.85em]">Full</span> (24
                features including engineered ratios) pushed US transfer R²
                back below zero — even as the score improved inside Asia (its
                within-Asia spatial-block CV). The extra features let the model
                memorize the regional fingerprint of Asian soils, and that
                fingerprint is exactly what doesn&apos;t carry to another
                continent. In machine-learning terms, it overfit.
              </p>
              <p>
                Clay shows the trap cleanly. In Asia, more clay goes with more
                respiration — a correlation of ρ = +0.302 — because clay-rich,
                humid Asian soils hold on to more of the food microbes live on.
                In the held-out US soils that relationship vanishes and even
                reverses (ρ = −0.048, essentially zero, sign-inverted). So a
                model that learned &ldquo;more clay means more respiration&rdquo;
                from Asia will systematically over-predict America&apos;s
                clay-rich sites.
              </p>
              <p>
                Satellite plant growth (MODIS NPP) rescues the model — not
                because it is some universal driver of respiration, but because
                it captures something that does travel: how vigorously the land
                is growing right now. A forest thriving this year respires like
                a thriving forest, whether it sits on Mongolian loess or Iowan
                mollisol — two utterly different soils. Add NPP and it becomes
                the model&apos;s single most important input (its rank-1 SHAP
                feature) in both regions, while the engineered soil ratios lose
                their regional-fingerprint grip.
              </p>
              <p>
                The takeaway for monitoring is concrete — and it is the whole
                reason for the hands-on sensor. The satellite map tells you
                where to look, not what is actually happening in the soil. Where
                the kilometer-scale map is most likely to be wrong — high-clay
                continental soils, the edges between biomes, water-starved
                grasslands — is exactly where the centimeter-scale biosensor is
                worth the most. The biosensor doesn&apos;t replace the atlas; it
                checks the atlas on the ground, where the atlas can&apos;t see.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

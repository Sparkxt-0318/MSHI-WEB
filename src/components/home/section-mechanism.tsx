import Link from 'next/link';
import { Reveal } from '@/components/site/reveal';
import { SectionLabel } from '@/components/site/section-label';
import { PlaceholderFigure } from '@/components/site/placeholder-figure';

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
            Adding more features doesn&apos;t help — soil drivers don&apos;t
            transfer.
          </h2>
        </Reveal>

        <Reveal delayMs={120}>
          <div className="mx-auto mt-14 max-w-3xl">
            <PlaceholderFigure
              expectedPath="/public/images/shap_comparison.png"
              note="SHAP feature-importance comparison across F, F+NPP, and Full+MODIS configurations. Shows clay, NPP, and bioclim ranks shifting between training (Asia) and held-out (US) regimes."
              aspect="aspect-[4/3]"
            />
            <figcaption className="mt-3 text-center text-[0.78rem] italic text-ink-soft">
              SHAP rank order shifts substantially between Asia and US — the
              feature set the model leans on at training time is not the
              feature set that drives Rs in the held-out continent.
            </figcaption>
          </div>
        </Reveal>

        <Reveal delayMs={160}>
          <div className="mx-auto mt-14 max-w-3xl">
            <p className="meta-label text-ink-soft">
              Three configurations tested for cross-continental transfer
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
                    Climate alone produces positive transfer.
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
                    captures the biology signal that transfers.
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-mono text-[0.85rem]">Full+MODIS</td>
                  <td className="px-3 py-2 text-right font-mono text-[0.85rem]">+0.072</td>
                  <td className="px-3 py-2 text-right font-mono text-[0.78rem] text-ink-soft">
                    [−0.084, +0.189]
                  </td>
                  <td className="px-3 py-2">
                    Adding soil features hurts; CI spans zero.
                  </td>
                </tr>
              </tbody>
            </table>
            <p className="mt-3 text-center font-mono text-[0.7rem] text-ink-soft">
              Full 5-configuration analysis (incl. Köppen-zone
              stratification) is on the{' '}
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
                The most counter-intuitive result: adding more soil and climate
                features hurts transfer. Going from{' '}
                <span className="font-mono text-[0.85em]">F</span> (16 climate
                + soil features) to{' '}
                <span className="font-mono text-[0.85em]">Full</span> (24
                features including engineered ratios) drops US transfer R²
                back below zero, even though within-Asia spatial-block CV
                improves. The mechanism is that engineered features amplify
                the regional fingerprint of Asian soils — exactly the signal
                that does not generalize.
              </p>
              <p>
                Clay illustrates the problem cleanly. In Asia, clay correlates
                with annual Rs at ρ = +0.302 (more clay, more respiration —
                consistent with higher microbial substrate retention in
                temperate-humid Asian soils). In the US held-out set, that
                correlation flips to ρ = −0.048 (effectively zero, sign-
                inverted). A model that has learned a strong clay → Rs prior
                from Asia will systematically over-predict US clay-rich sites.
              </p>
              <p>
                MODIS NPP fixes this not because NPP is some kind of universal
                Rs driver, but because it captures the contemporaneous
                productivity signal that does transfer: a forest growing
                vigorously this year respires accordingly, regardless of
                whether it sits on Mongolian loess or Iowan mollisol. Once NPP
                is in the feature set, it absorbs rank-1 SHAP importance in
                both regions and the soil-ratio features lose their
                regional-fingerprint pull.
              </p>
              <p>
                The implication for monitoring is concrete. Where the
                kilometer tier is most likely to fail — high-clay continental
                soils, biome boundaries, water-limited grasslands — is exactly
                where the centimeter tier would have the highest scientific
                value. The biosensor doesn&apos;t replace the atlas; it
                ground-truths the atlas where the atlas can&apos;t see.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

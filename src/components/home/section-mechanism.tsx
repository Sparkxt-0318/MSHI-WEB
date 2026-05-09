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

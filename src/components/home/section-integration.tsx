import { Reveal } from '@/components/site/reveal';
import { SectionLabel } from '@/components/site/section-label';
import { PlaceholderFigure } from '@/components/site/placeholder-figure';

export function SectionIntegration() {
  return (
    <section
      id="integration"
      className="section-band-tall border-t border-rule bg-paper"
    >
      <div className="container-research">
        <Reveal>
          <SectionLabel number="06" label="Integration" />
          <h2 className="section-title mt-6 max-w-[28ch]">
            Where the centimeter meets the kilometer.
          </h2>
        </Reveal>

        <Reveal delayMs={120}>
          <div className="mt-14">
            <PlaceholderFigure
              expectedPath="/public/images/methodology_evolution_panel.png"
              note="Methodology evolution panel from the published manuscript: F → F+NPP → Full+MODIS, with the corresponding transfer R² and CI shifts annotated."
              aspect="aspect-[16/9]"
            />
            <figcaption className="mt-3 text-center text-[0.78rem] italic text-ink-soft">
              The deployable monitoring stack: continental atlas where models
              transfer, biosensors where they don&apos;t, chamber data as
              shared ground-truth.
            </figcaption>
          </div>
        </Reveal>

        <div className="mt-16 grid gap-12 md:grid-cols-12">
          <Reveal className="md:col-span-7" delayMs={200}>
            <div className="body-prose">
              <p>
                The atlas is not a finished product; it is a uncertainty map.
                Köppen-Geiger stratification of the prediction error reveals a
                consistent pattern: transfer R² is highest in temperate
                Köppen&nbsp;C climates that dominate both the Asian training
                set and the US test set, and collapses toward zero in
                continental Köppen&nbsp;D zones — large parts of the northern
                US and Canada — where Asian training data thins out.
              </p>
              <p>
                IGBP biome stratification tells a complementary story.
                Forest biomes (temperate broadleaf, mixed, evergreen needle)
                transfer reasonably; cropland and grassland biomes transfer
                worse, with prediction error scaling roughly with the
                cross-continental shift in management intensity.
              </p>
              <p>
                Both Köppen and IGBP stratifications fail to recover transfer
                when used as additional model features — the regional
                fingerprint is locked at scales the model cannot disentangle
                from the climate signal. This is precisely the regime where
                the centimeter-scale biosensor adds independent information.
              </p>
            </div>
          </Reveal>

          <Reveal className="md:col-span-5" delayMs={260}>
            <aside className="border-l-2 border-accent bg-cream p-7">
              <p className="font-mono text-[0.7rem] uppercase tracking-meta text-accent">
                Where to deploy first
              </p>
              <h3 className="mt-3 font-serif text-2xl font-bold leading-tight text-ink">
                Highest scientific value
              </h3>
              <ul className="mt-5 space-y-4 text-[0.95rem] leading-relaxed text-ink">
                <li className="flex gap-3">
                  <span className="font-mono text-[0.7rem] text-accent">01</span>
                  <span>
                    <strong className="font-semibold">Köppen D continental</strong> —
                    largest model uncertainty; under-represented in Asian
                    training set.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[0.7rem] text-accent">02</span>
                  <span>
                    <strong className="font-semibold">Forest biome boundaries</strong> —
                    where IGBP class probability is mixed and the model has
                    to choose.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[0.7rem] text-accent">03</span>
                  <span>
                    <strong className="font-semibold">Managed cropland</strong> —
                    where the regional management fingerprint dominates and
                    SoilGrids alone cannot resolve.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[0.7rem] text-accent">04</span>
                  <span>
                    <strong className="font-semibold">High-clay soils</strong> —
                    the sign-flip failure mode quantified in section 04.
                  </span>
                </li>
              </ul>
            </aside>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

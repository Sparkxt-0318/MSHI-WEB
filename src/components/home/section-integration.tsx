import Image from 'next/image';
import { Reveal } from '@/components/site/reveal';
import { SectionLabel } from '@/components/site/section-label';

export function SectionIntegration() {
  return (
    <section
      id="integration"
      className="section-band-tall border-t border-rule bg-paper"
    >
      <div className="container-research">
        <Reveal>
          <SectionLabel number="07" label="Integration" />
          <h2 className="section-title mt-6 max-w-[28ch]">
            Where the centimeter meets the kilometer.
          </h2>
        </Reveal>

        <Reveal delayMs={120}>
          <div className="mt-14">
            <div className="relative aspect-[16/9] w-full">
              <Image
                src="/images/methodology_evolution_panel.png"
                alt="Panel tracing the model's evolution — F → F+NPP → Full+MODIS — with the shifts in transfer R² and confidence interval annotated at each step"
                fill
                className="object-contain"
              />
            </div>
            <figcaption className="mt-3 text-center text-[0.78rem] italic text-ink-soft">
              The monitoring stack in practice: the continental atlas where the
              model travels well, hands-on biosensors where it doesn&apos;t, and
              chamber data as the shared ground truth both rely on.
            </figcaption>
          </div>
        </Reveal>

        <div className="mt-16 grid gap-12 md:grid-cols-12">
          <Reveal className="md:col-span-7" delayMs={200}>
            <div className="body-prose">
              <p>
                The atlas is not a finished product so much as a map of its own
                uncertainty. Break the errors down by climate zone — using the
                standard Köppen-Geiger system, which sorts the world into
                climate types — and a clear pattern appears: transfer R² is
                highest in the temperate Köppen&nbsp;C climates that dominate
                both the Asian training set and the US test set, and it
                collapses toward zero in the colder, continental
                Köppen&nbsp;D zones — much of the northern US and Canada — where
                Asian training data runs thin.
              </p>
              <p>
                Sort the same errors by vegetation type — the IGBP land-cover
                classes — and the story rhymes. Forest biomes (temperate
                broadleaf, mixed, evergreen needle) transfer reasonably well;
                croplands and grasslands do worse, with the error growing
                roughly in step with how differently the land is farmed on each
                continent.
              </p>
              <p>
                Crucially, feeding those same Köppen and IGBP labels back to the
                model as extra inputs doesn&apos;t rescue the transfer: the
                regional fingerprint is baked in at a level the model
                can&apos;t separate from the climate signal. That is precisely
                the gap the centimeter-scale biosensor fills — it brings
                independent, on-the-ground information the satellites simply do
                not carry.
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
                    where the map is least certain and Asian training data is
                    thinnest.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[0.7rem] text-accent">02</span>
                  <span>
                    <strong className="font-semibold">Forest biome boundaries</strong> —
                    where the vegetation type (IGBP class) is ambiguous and the
                    model is forced to guess.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[0.7rem] text-accent">03</span>
                  <span>
                    <strong className="font-semibold">Managed cropland</strong> —
                    where local farming practices dominate and soil maps
                    (SoilGrids) alone can&apos;t resolve them.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[0.7rem] text-accent">04</span>
                  <span>
                    <strong className="font-semibold">High-clay soils</strong> —
                    the clay sign-flip failure mode measured in section 04.
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

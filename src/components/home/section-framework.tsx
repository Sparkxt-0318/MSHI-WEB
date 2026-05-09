import { Reveal } from '@/components/site/reveal';
import { SectionLabel } from '@/components/site/section-label';
import { BiosensorIcon, ChamberIcon, GlobeIcon } from './scale-icons';

const TIERS = [
  {
    scale: 'cm',
    title: 'Electrochemical biosensor',
    Icon: BiosensorIcon,
    body: 'Centimeter footprint, continuous deployment, low cost. Electron transfer current as proxy for substrate oxidation rate. Four electrochemical techniques — chronoamperometry, cyclic voltammetry, OCP, and DPV — collapsed into a single Microbial Soil Health Index.',
    color: 'text-accent',
  },
  {
    scale: 'm',
    title: 'Chamber + eddy covariance',
    Icon: ChamberIcon,
    body: 'Direct CO₂ flux, metre-scale footprint, sparse network, high instrument cost. Where most chamber data lives — SRDB and COSORE compile decades of these measurements, but they are concentrated in temperate research forests.',
    color: 'text-bedrock-blue',
  },
  {
    scale: 'km',
    title: 'Satellite + ML upscaling',
    Icon: GlobeIcon,
    body: '~5km grid, climate + soil + MODIS NPP features, held-out cross-continental validation. The continental tier this work delivers — Asia-trained, US-tested, with bootstrap CI that excludes zero only when MODIS NPP is included.',
    color: 'text-bedrock-blue-dark',
  },
] as const;

export function SectionFramework() {
  return (
    <section id="framework" className="section-band-tall border-t border-rule">
      <div className="container-research">
        <Reveal>
          <SectionLabel number="02" label="Framework" />
          <h2 className="section-title mt-6 max-w-[20ch]">
            One biology, three scales.
          </h2>
        </Reveal>

        <div className="mt-16 grid gap-12 md:grid-cols-3">
          {TIERS.map((tier, idx) => (
            <Reveal key={tier.scale} delayMs={idx * 100}>
              <article className="flex h-full flex-col border-t border-rule pt-6">
                <div className="flex items-baseline justify-between">
                  <span
                    className={`font-serif text-5xl font-bold leading-none ${tier.color}`}
                  >
                    {tier.scale}
                  </span>
                  <tier.Icon className={`h-14 w-14 ${tier.color}`} />
                </div>
                <h3 className="mt-6 font-serif text-xl font-bold leading-snug text-ink">
                  {tier.title}
                </h3>
                <p className="mt-4 max-w-prose text-[0.95rem] leading-relaxed text-ink-soft">
                  {tier.body}
                </p>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delayMs={400}>
          <p className="mx-auto mt-16 max-w-prose text-center font-serif text-lg italic text-ink-soft">
            Same biological flux. Three resolutions. The middle tier is where
            most chamber data lives; the satellite tier struggles to generalize
            across continents; the centimeter tier is what&apos;s missing.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

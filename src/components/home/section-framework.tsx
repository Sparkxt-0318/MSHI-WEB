import { Reveal } from '@/components/site/reveal';
import { SectionLabel } from '@/components/site/section-label';
import { ScaleZoom } from './scale-zoom';

const TIERS = [
  {
    scale: 'cm',
    title: 'Electrochemical biosensor',
    body: 'Centimeter footprint, continuous deployment, low cost. Electron transfer current as proxy for substrate oxidation rate. Four electrochemical techniques — chronoamperometry, cyclic voltammetry, OCP, and DPV — collapsed into a single Microbial Soil Health Index.',
    color: 'text-accent',
  },
  {
    scale: 'm',
    title: 'Chamber + eddy covariance',
    body: 'Direct CO₂ flux, metre-scale footprint, sparse network, high instrument cost. Where most chamber data lives — SRDB and COSORE compile decades of these measurements, but they are concentrated in temperate research forests.',
    color: 'text-bedrock-blue',
  },
  {
    scale: 'km',
    title: 'Satellite + ML upscaling',
    body: '~5km grid, climate + soil + MODIS NPP features, held-out cross-continental validation. The continental tier this work delivers — Asia-trained, US-tested, with bootstrap CI that excludes zero only when MODIS NPP is included.',
    color: 'text-bedrock-blue-dark',
  },
] as const;

export function SectionFramework() {
  return (
    <section id="framework" className="border-t border-rule">
      <div className="container-research pb-10 pt-[clamp(4rem,9vh,7rem)]">
        <Reveal>
          <SectionLabel number="02" label="Framework" />
          <h2 className="section-title mt-6 max-w-[20ch]">One biology, three scales.</h2>
          <p className="mt-6 max-w-prose text-[1rem] leading-relaxed text-ink-soft">
            The same biological signal, measured at three resolutions. Scroll through the
            zoom below — from the centimeter electrode, out to the metre-scale chamber, out
            to the kilometer-scale satellite atlas.
          </p>
        </Reveal>
      </div>

      <ScaleZoom tiers={TIERS} />

      <div className="container-research pb-[clamp(4rem,9vh,7rem)] pt-12">
        <Reveal>
          <p className="mx-auto max-w-prose text-center font-serif text-lg italic text-ink-soft">
            Same biological flux. Three resolutions. The middle tier is where most chamber
            data lives; the satellite tier struggles to generalize across continents; the
            centimeter tier is what&apos;s missing.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

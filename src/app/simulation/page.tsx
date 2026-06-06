import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { SectionLabel } from '@/components/site/section-label';
import { SiteFooter } from '@/components/site/site-footer';

// React Three Fiber / three touch `window` at construction; load on the client only.
const SimulationStage = dynamic(
  () =>
    import('@/components/simulation/simulation-stage').then(
      (m) => m.SimulationStage,
    ),
  { ssr: false },
);

export const metadata: Metadata = {
  title: 'Simulation',
  description:
    'An interactive 3D time-lapse of the soil biosensor: watch a microbial biofilm colonize the electrode, electrons flow, and the Microbial Soil Health Index emerge across healthy, salt-stressed and degraded soils.',
};

export default function SimulationPage() {
  return (
    <>
      <section className="section-band border-b border-rule bg-paper">
        <div className="container-research">
          <SectionLabel number="06" label="The Simulation" />
          <h1 className="display-title mt-6 max-w-[18ch]">
            Watch the measurement come alive.
          </h1>
          <p className="mt-8 max-w-prose text-lg leading-relaxed text-ink-soft">
            The soil biosensor, brought to life. A real trial runs for days —
            here it is a simplified, sped-up illustration compressed into a few
            seconds. Watch electrochemically active bacteria colonize the
            working electrode, stream electrons into the circuit, and drive the
            current that becomes a{' '}
            <span className="text-ink">Microbial Soil Health Index</span>. Three
            soils run side by side: a healthy soil teeming with life, a
            salt-stressed soil, and a degraded one.
          </p>
          <p className="mt-4 max-w-prose font-mono text-[0.78rem] leading-relaxed text-ink-soft">
            Drag the scene to look around the electrodes · play, pause and
            fast-forward · scrub to any moment.
          </p>

          <div className="mt-12">
            <SimulationStage />
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}

import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { SectionLabel } from '@/components/site/section-label';
import { SiteFooter } from '@/components/site/site-footer';
import { LiveSystem } from '@/components/simulation/live-system';

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
    'An interactive 3D time-lapse of the soil biosensor: watch a film of microbes (a biofilm) spread over the electrode, electrons flow, and a Microbial Soil Health Index emerge for healthy, salt-stressed, and degraded soils.',
};

export default function SimulationPage() {
  return (
    <>
      {/* Hero — leads with the live console, then the 3D time-lapse below */}
      <section className="section-band border-b border-rule bg-paper">
        <div className="container-research">
          <SectionLabel number="06" label="The Simulation" />
          <h1 className="display-title mt-6 max-w-[18ch]">
            Watch the measurement come alive.
          </h1>
          <p className="mt-8 max-w-prose text-lg leading-relaxed text-ink-soft">
            The soil biosensor, brought to life — and put to work. Up top, a
            live operator console reads the soil&rsquo;s redox state (its
            electrical push-and-pull) in real time, while an AI advisor suggests
            fixes grounded in soil science. At the foot of the page, a
            fast-forward 3D time-lapse shows the biology behind those readings:
            electroactive bacteria — microbes that give off electrons as they
            breathe — colonizing the electrode across three soils.
          </p>
        </div>
      </section>

      {/* Live System — operator console + AI advisor (cards + graphs) */}
      <section className="section-band border-b border-rule bg-cream/30">
        <div className="container-research">
          <LiveSystem />
        </div>
      </section>

      {/* The 3D three-electrode time-lapse, at the bottom */}
      <section className="section-band border-t border-rule bg-paper">
        <div className="container-research">
          <p className="meta-label">The measurement · 3D time-lapse</p>
          <h2 className="section-title mt-4 max-w-[24ch]">
            The science behind the readings.
          </h2>
          <p className="mt-6 max-w-prose text-[1rem] leading-relaxed text-ink-soft">
            A simplified, sped-up look at the three-electrode cell:
            electroactive bacteria settle on the working electrode, pour
            electrons into the circuit, and drive the current that becomes a{' '}
            <span className="text-ink">Microbial Soil Health Index</span> — three
            soils, side by side.
          </p>
          <p className="mt-4 max-w-prose font-mono text-[0.78rem] leading-relaxed text-ink-soft">
            Drag the scene to look around the electrodes · play, pause and
            fast-forward · scrub to any moment.
          </p>
          <div className="mt-10">
            <SimulationStage />
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}

import { Reveal } from '@/components/site/reveal';
import { SectionLabel } from '@/components/site/section-label';
import { BiosensorIcon, ChamberIcon, GlobeIcon } from './scale-icons';

const TIERS = [
  {
    scale: 'cm',
    title: 'Electrochemical biosensor',
    Icon: BiosensorIcon,
    body: 'The hands-on tier: a centimeter-scale probe, small as a coin and cheap enough to leave running. It turns soil life into electricity — bacteria give off a current as they break down carbon, and that current stands in for how fast the soil is respiring. Four electrochemical techniques — chronoamperometry, cyclic voltammetry, open-circuit potential, and differential pulse voltammetry — fold into a single Microbial Soil Health Index.',
    color: 'text-accent',
  },
  {
    scale: 'm',
    title: 'Chamber + eddy covariance',
    Icon: ChamberIcon,
    body: 'The direct tier: sealed chambers and flux towers (eddy covariance) that measure the CO₂ coming off the soil directly, patch by patch. It is accurate, but the instruments are costly and the coverage is thin. Decades of these readings sit in SRDB and COSORE, the field’s two big databases — yet they cluster in temperate research forests.',
    color: 'text-bedrock-blue',
  },
  {
    scale: 'km',
    title: 'Satellite + ML upscaling',
    Icon: GlobeIcon,
    body: 'The reach tier: there are never enough chambers to cover a continent, so machine learning fills the gaps. A model learns how climate, soil, and satellite greenness track respiration, then paints a prediction onto a ~5km grid. This is the tier this project delivers — trained on Asia, tested on the US — and it only clears the bar (a bootstrap confidence interval that excludes zero) once MODIS NPP, a satellite measure of plant growth, is in the mix.',
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
            One and the same underground breathing, caught at three
            resolutions. The middle tier holds most of the data; the satellite
            tier struggles to travel across continents; and the hands-on
            centimeter tier — the piece that has been missing — is where this
            project begins.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

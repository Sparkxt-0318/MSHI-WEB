import type { Metadata } from 'next';
import Link from 'next/link';
import { SectionLabel } from '@/components/site/section-label';
import { SiteFooter } from '@/components/site/site-footer';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Author bio, institutional affiliation, and acknowledgments for the MSHI research portfolio.',
};

export default function AboutPage() {
  return (
    <>
      <section className="section-band border-b border-rule bg-paper">
        <div className="container-narrow">
          <SectionLabel number="·" label="About" />
          <h1 className="display-title mt-6">{siteConfig.authorName}</h1>

          <dl className="mt-8 grid gap-3 font-mono text-[0.85rem]">
            <div className="flex gap-4">
              <dt className="w-32 text-ink-soft">Institution</dt>
              <dd>{siteConfig.institution}</dd>
            </div>
            <div className="flex gap-4">
              <dt className="w-32 text-ink-soft">ORCID</dt>
              <dd>
                {(siteConfig.orcid as string) !== '[ORCID]' ? (
                  <Link
                    href={`https://orcid.org/${siteConfig.orcid}`}
                    className="link-arrow"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    {siteConfig.orcid}
                  </Link>
                ) : (
                  siteConfig.orcid
                )}
              </dd>
            </div>
            <div className="flex gap-4">
              <dt className="w-32 text-ink-soft">Email</dt>
              <dd>
                <Link
                  href={`mailto:${siteConfig.email}`}
                  className="link-arrow"
                >
                  {siteConfig.email}
                </Link>
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="section-band bg-paper">
        <div className="container-narrow">
          <h2 className="font-serif text-2xl font-bold text-ink">Bio</h2>
          <div className="body-prose mt-4">
            <p>
              Siyeong Park is a high school researcher at Shanghai American
              School Puxi, working at the intersection of electrochemical
              biosensing and continental-scale machine learning for terrestrial
              carbon cycling.
            </p>
            <p>
              His primary research addresses a diagnostic blind spot in soil
              monitoring: conventional electrical-conductivity sensors cannot
              distinguish nutrient-rich soil from toxic, saline-stressed soil,
              leading farmers to misread degraded land as healthy. To resolve
              this &ldquo;salinity paradox,&rdquo; he engineered a
              three-electrode bioelectrochemical system that measures microbial
              vitality directly — using the electrochemically active biofilms
              formed by <em>Geobacter sulfurreducens</em> to separate the
              faradaic biological signal from ohmic abiotic noise.
              Chronoamperometry, cyclic voltammetry, differential pulse
              voltammetry, and open-circuit potential together resolve a
              soil&rsquo;s metabolic state, and an ensemble machine-learning
              model condenses this into a single Microbial Soil Health Index
              (MSHI) from one hour of measurement.
            </p>
            <p>
              The MSHI-Geo atlas extends this question to continental scale.
              Trained on 615 Asian soil respiration sites and validated against
              held-out US data, it tests whether soil microbial activity can be
              predicted from satellite data alone — and finds that it largely
              cannot, because the biological drivers of respiration do not
              transfer across regions. Together the two efforts argue for a
              three-tier monitoring framework: centimeter-scale biosensors,
              meter-scale flux chambers, and kilometer-scale satellite models,
              each covering the others&rsquo; blind spots.
            </p>
          </div>

          <h2 className="mt-16 font-serif text-2xl font-bold text-ink">
            Acknowledgments
          </h2>
          <div className="body-prose mt-4 text-ink-soft">
            <p>
              This work builds on open scientific datasets. Soil respiration
              observations come from the Soil Respiration Database (SRDB;
              Bond-Lamberty &amp; Thomson) and the Continuous Soil Respiration
              Database (COSORE; Bond-Lamberty et&nbsp;al.). Soil property
              estimates are drawn from SoilGrids 2.0 (ISRIC). Climate variables
              are from WorldClim. Satellite-derived net primary productivity and
              land surface temperature come from NASA MODIS products, distributed
              through the NASA Land Processes Distributed Active Archive Center
              (LP&nbsp;DAAC).
            </p>
          </div>

          <h2 className="mt-16 font-serif text-2xl font-bold text-ink">
            Get in touch
          </h2>
          <p className="body-prose mt-4">
            For research correspondence, or code and data inquiries:{' '}
            <Link href={`mailto:${siteConfig.email}`} className="link-arrow">
              {siteConfig.email}
            </Link>
            .
          </p>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}

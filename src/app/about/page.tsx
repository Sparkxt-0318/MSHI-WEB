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
              Siyeong Park is a high-school researcher at Shanghai American
              School Puxi, working where electrochemical biosensing meets
              continental-scale machine learning for the carbon cycle on land.
            </p>
            <p>
              His main project tackles a blind spot in soil monitoring: an
              ordinary electrical-conductivity sensor can&rsquo;t tell
              nutrient-rich soil from toxic, salt-stressed soil, so farmers can
              mistake dying land for healthy land. To break that
              &ldquo;salinity paradox&rdquo; — the reason a conductivity meter
              can&rsquo;t tell dead salty soil from healthy soil — he built a
              three-electrode bioelectrochemical system that measures microbial
              life directly. It reads the current from the electrochemically
              active biofilms that <em>Geobacter sulfurreducens</em> builds,
              separating the true biological signal (faradaic) from the
              soil&rsquo;s plain resistance (ohmic, abiotic). Four techniques
              together — chronoamperometry, cyclic voltammetry, differential
              pulse voltammetry, and open-circuit potential — pin down a
              soil&rsquo;s metabolic state, and an ensemble machine-learning
              model folds it all into a single Microbial Soil Health Index
              (MSHI) from one hour of measurement.
            </p>
            <p>
              The MSHI-Geo atlas takes the same question to continental scale —
              MSHI-Geo is the project&rsquo;s continent-wide map of soil
              respiration. Trained on 615 Asian soil-respiration sites and
              checked against held-out US data, it asks whether soil microbial
              activity can be predicted from satellite data alone — and finds
              that, mostly, it can&rsquo;t, because the biological drivers of
              respiration don&rsquo;t carry from one region to the next.
              Together the two efforts make the case for monitoring at three
              tiers: centimeter-scale biosensors, meter-scale flux chambers, and
              kilometer-scale satellite models, each covering the others&rsquo;
              blind spots.
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

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
            <div className="flex gap-4">
              <dt className="w-32 text-ink-soft">Code</dt>
              <dd>
                <Link
                  href={siteConfig.scienceRepo}
                  className="link-arrow"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  github.com/Sparkxt-0318/MSHI
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
              <span className="border border-accent bg-cream px-1.5 py-0.5 font-mono text-[0.65rem] uppercase tracking-meta text-accent">
                Placeholder bio
              </span>
              <span className="ml-2 text-ink-soft">
                Update in <span className="font-mono text-accent">src/lib/site-config.ts</span>
                {' '}or directly on this page. The voice should match the
                discussion-section tone of a research paper: confident,
                specific, and brief.
              </span>
            </p>
            <p>
              {siteConfig.authorName} is a researcher at{' '}
              {siteConfig.institution}, working at the intersection of
              electrochemical biosensing and continental-scale machine
              learning for terrestrial carbon cycling. The MSHI project
              integrates a centimeter-footprint biosensor with a
              kilometer-grid ML atlas, both validated on held-out data.
            </p>
          </div>

          <h2 className="mt-16 font-serif text-2xl font-bold text-ink">
            Acknowledgments
          </h2>
          <div className="body-prose mt-4 text-ink-soft">
            <p>
              <span className="border border-accent bg-cream px-1.5 py-0.5 font-mono text-[0.65rem] uppercase tracking-meta text-accent">
                Placeholder
              </span>
              <span className="ml-2">
                The user will list collaborators, advisors, and funding
                sources here. Bond-Lamberty &amp; Thomson (SRDB),
                Bond-Lamberty et&nbsp;al. (COSORE), ISRIC (SoilGrids 2.0),
                WorldClim, and the NASA LP DAAC (MODIS) deserve explicit
                mention as upstream data providers regardless of personal
                acknowledgments.
              </span>
            </p>
          </div>

          <h2 className="mt-16 font-serif text-2xl font-bold text-ink">
            Get in touch
          </h2>
          <p className="body-prose mt-4">
            For research correspondence:{' '}
            <Link href={`mailto:${siteConfig.email}`} className="link-arrow">
              {siteConfig.email}
            </Link>
            . For code or data issues, prefer GitHub issues at the{' '}
            <Link
              href={siteConfig.scienceRepo}
              className="link-arrow"
              target="_blank"
              rel="noreferrer noopener"
            >
              MSHI repo
            </Link>
            .
          </p>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}

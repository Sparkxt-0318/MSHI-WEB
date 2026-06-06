import Link from 'next/link';
import { siteConfig } from '@/lib/site-config';

export function SiteFooter() {
  return (
    <footer className="bg-ink text-paper">
      <div className="container-research py-20">
        <div className="grid gap-12 md:grid-cols-12">
          {/* Author block */}
          <div className="md:col-span-5">
            <p className="font-mono text-[0.7rem] uppercase tracking-meta text-accent-pale">
              Research portfolio · {siteConfig.year}
            </p>
            <h2 className="mt-3 font-serif text-3xl font-bold leading-tight text-paper">
              Soil Microbial<br />Respiration Stack
            </h2>
            <dl className="mt-8 space-y-3 font-mono text-xs text-paper/80">
              <div className="flex gap-4">
                <dt className="w-24 text-paper/50">Author</dt>
                <dd>{siteConfig.authorName}</dd>
              </div>
              <div className="flex gap-4">
                <dt className="w-24 text-paper/50">Institution</dt>
                <dd>{siteConfig.institution}</dd>
              </div>
              <div className="flex gap-4">
                <dt className="w-24 text-paper/50">ORCID</dt>
                <dd>
                  <Link
                    href={`https://orcid.org/${siteConfig.orcid}`}
                    className="border-b border-accent-pale text-accent-pale hover:border-paper hover:text-paper"
                  >
                    {siteConfig.orcid}
                  </Link>
                </dd>
              </div>
              <div className="flex gap-4">
                <dt className="w-24 text-paper/50">Email</dt>
                <dd>{siteConfig.email}</dd>
              </div>
            </dl>
          </div>

        </div>

        {/* Bottom rule */}
        <div className="mt-16 flex flex-col gap-3 border-t border-paper/15 pt-6 text-[0.7rem] uppercase tracking-meta text-paper/40 md:flex-row md:items-center md:justify-between">
          <p>
            Built with Next.js. Deployed on Vercel.
          </p>
          <p>
            © {siteConfig.year} {siteConfig.authorName} ·{' '}
            {siteConfig.institutionFull}
          </p>
        </div>
      </div>
    </footer>
  );
}

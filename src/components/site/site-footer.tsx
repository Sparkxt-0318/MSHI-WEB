import Link from 'next/link';
import { siteConfig } from '@/lib/site-config';

const BIBTEX = `@misc{mshi${siteConfig.year},
  title         = {${siteConfig.paperTitle}},
  author        = {${siteConfig.authorName}},
  year          = {${siteConfig.year}},
  howpublished  = {${siteConfig.paperVenue}},
  url           = {${siteConfig.scienceRepo}}
}`;

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
                <dd>{siteConfig.orcid}</dd>
              </div>
              <div className="flex gap-4">
                <dt className="w-24 text-paper/50">Email</dt>
                <dd>{siteConfig.email}</dd>
              </div>
              <div className="flex gap-4">
                <dt className="w-24 text-paper/50">Code</dt>
                <dd>
                  <Link
                    href={siteConfig.scienceRepo}
                    className="border-b border-accent-pale text-accent-pale hover:border-paper hover:text-paper"
                  >
                    github.com/Sparkxt-0318/MSHI
                  </Link>
                </dd>
              </div>
            </dl>
          </div>

          {/* Citation block */}
          <div className="md:col-span-7">
            <p className="font-mono text-[0.7rem] uppercase tracking-meta text-accent-pale">
              How to cite this work
            </p>
            <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words border border-paper/15 bg-paper/[0.03] p-5 font-mono text-[0.72rem] leading-relaxed text-paper/90">
              {BIBTEX}
            </pre>
            <p className="mt-4 font-mono text-[0.7rem] text-paper/40">
              [Author Name] / [Institution] / [ORCID] are placeholders. Update in
              <span className="mx-1 text-accent-pale">src/lib/site-config.ts</span>
              to populate citation, author block, and metadata across the site.
            </p>
          </div>
        </div>

        {/* Bottom rule */}
        <div className="mt-16 flex flex-col gap-3 border-t border-paper/15 pt-6 text-[0.7rem] uppercase tracking-meta text-paper/40 md:flex-row md:items-center md:justify-between">
          <p>
            Built with Next.js. Deployed on Vercel. Code at{' '}
            <Link
              href={siteConfig.webRepo}
              className="text-paper/60 hover:text-paper"
            >
              github.com/Sparkxt-0318/MSHI-WEB
            </Link>
            .
          </p>
          <p>© {siteConfig.year} {siteConfig.authorName}</p>
        </div>
      </div>
    </footer>
  );
}

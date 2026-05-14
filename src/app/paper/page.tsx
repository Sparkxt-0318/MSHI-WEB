import type { Metadata } from 'next';
import Link from 'next/link';
import { Download, ExternalLink } from 'lucide-react';
import { SectionLabel } from '@/components/site/section-label';
import { SiteFooter } from '@/components/site/site-footer';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Paper',
  description:
    'Embedded PDF, abstract, and citation block for the MSHI / MSHI-Geo manuscript.',
};

const PDF_PATH = '/paper.pdf';

const BIBTEX = `@article{mshi${siteConfig.year},
  title         = {${siteConfig.paperTitle}},
  author        = {${siteConfig.authorName}},
  year          = {${siteConfig.year}},
  url           = {${siteConfig.scienceRepo}}
}`;

export default function PaperPage() {
  return (
    <>
      <section className="section-band border-b border-rule bg-paper">
        <div className="container-narrow">
          <SectionLabel number="·" label="Paper" />
          <h1 className="display-title mt-6 max-w-[20ch]">
            {siteConfig.paperTitle}
          </h1>
          <p className="mt-6 font-mono text-[0.8rem] uppercase tracking-meta text-ink-soft">
            {siteConfig.authorName} · {siteConfig.year}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={PDF_PATH}
              className="inline-flex items-center gap-2 border border-ink bg-ink px-4 py-2 font-mono text-[0.7rem] uppercase tracking-meta text-paper transition-colors hover:bg-ink-soft"
              target="_blank"
              rel="noreferrer noopener"
              download
            >
              <Download className="h-3.5 w-3.5" />
              Download PDF
            </Link>
            <Link
              href={siteConfig.scienceRepo}
              className="inline-flex items-center gap-2 border border-ink bg-paper px-4 py-2 font-mono text-[0.7rem] uppercase tracking-meta text-ink transition-colors hover:bg-ink hover:text-paper"
              target="_blank"
              rel="noreferrer noopener"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Code &amp; data
            </Link>
          </div>

          <h2 className="mt-12 font-serif text-2xl font-bold text-ink">Abstract</h2>
          <p className="mt-4 max-w-prose text-[1rem] leading-relaxed text-ink">
            <span className="border border-accent bg-cream px-1.5 py-0.5 font-mono text-[0.65rem] uppercase tracking-meta text-accent">
              Placeholder
            </span>
            <span className="ml-2 text-ink-soft">
              The user will paste the manuscript abstract here. Until then,
              this paragraph is intentionally blank.
            </span>
          </p>
        </div>
      </section>

      {/* Embedded PDF */}
      <section className="section-band border-b border-rule bg-cream/50">
        <div className="container-research">
          <div className="border border-rule bg-paper">
            <object
              data={PDF_PATH}
              type="application/pdf"
              className="h-[80vh] w-full"
              aria-label="Paper PDF"
            >
              <div className="placeholder-tile aspect-[8/11]">
                <div className="space-y-2 px-6 py-4">
                  <p className="text-[0.7rem] font-bold tracking-[0.18em] text-accent">
                    PLACEHOLDER · USER TO SUPPLY
                  </p>
                  <p className="text-[0.7rem] text-ink-soft normal-case tracking-normal">
                    /public/paper.pdf
                  </p>
                  <p className="max-w-md text-[0.7rem] text-ink-soft normal-case tracking-normal">
                    The PDF embed will render once you drop the manuscript
                    PDF into the public directory at this path.
                  </p>
                </div>
              </div>
            </object>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}

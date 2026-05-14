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
          <h1 className="display-title mt-6 max-w-[20ch]" style={{ fontSize: 'clamp(2.2rem, 5.4vw, 4.375rem)' }}>
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
            Soil degradation, specifically salinization, currently threatens over 10% of global land and cripples the ecosystem&apos;s second-largest carbon sink. Conventional soil health indicators rely heavily on physicochemical properties, creating a critical diagnostic blind spot. Standard Electrical Conductivity (EC) meters cannot distinguish between nutrient-dense soil and toxic, saline-stressed soil, often triggering agricultural false positives. Consequently, farmers unknowingly exacerbate land degradation through improper fertilizer application. This research engineered a novel bioelectrochemical system (BES) to resolve this &ldquo;Salinity Paradox&rdquo; by decoupling physical conductivity from microbial vitality. The primary objective was to replace superficial EC measurements with real-time quantification of electrochemically active biofilm (EAB) metabolism. A three-electrode BES utilizing a high-surface-area carbon felt working electrode was deployed across healthy, unhealthy, and saline-stressed soil samples. Geobacter sulfurreducens naturally present in the soil acted as the biocatalyst, performing extracellular electron transfer (EET). Electrochemical techniques, including chronoamperometry (CA), cyclic voltammetry (CV), and differential pulse voltammetry (DPV), were utilized to isolate faradaic biological signals from ohmic abiotic noise. The CA trials revealed a critical inverse correlation: while saline soils exhibited high conductivity, their biological current crashed due to metabolic arrest and protein denaturation. Furthermore, CV trials distinguished the faradaic capacitance of healthy biofilms from the highly linear, ohmic resistance of saline soils (R² = 0.92). DPV conclusively identified the biological origin of the signal via a distinct OmcZ cytochrome redox peak at −0.13 V in healthy soil, which disappeared under saline stress. To automate this analysis, an ensemble machine learning and deep learning model (MSHI) was developed, achieving an 87.5% accuracy, 0.909 F1 score, and 1.0 ROC-AUC using just one hour of initial CA data. This BES successfully establishes the first real-time, label-free indicator of microbial recovery capable of penetrating the saline false positive. By shifting from physical to metabolic analysis, this affordable technology enables precision agriculture and targeted remediation efforts. Ultimately, deploying this sensor empowers farmers to intervene before ecosystem collapse, securing global food supplies and preserving vital carbon sinks.
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

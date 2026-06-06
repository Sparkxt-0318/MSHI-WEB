import type { Metadata } from 'next';
import Link from 'next/link';
import { Download } from 'lucide-react';
import { SectionLabel } from '@/components/site/section-label';
import { SiteFooter } from '@/components/site/site-footer';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Paper',
  description:
    'Embedded PDF and abstract for the MSHI / MSHI-Geo manuscript.',
};

const PDF_PATH = '/paper.pdf';

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
          </div>

          <h2 className="mt-12 font-serif text-2xl font-bold text-ink">Abstract</h2>
          <div className="body-prose mt-4 max-w-prose">
            <p>
              Soil degradation, specifically salinization, currently threatens
              over 10% of global land and cripples the ecosystem&rsquo;s
              second-largest carbon sink. Conventional soil health indicators
              rely heavily on physicochemical properties, creating a critical
              diagnostic blind spot. Standard Electrical Conductivity (EC)
              meters cannot distinguish between nutrient-dense soil and toxic,
              saline-stressed soil, often triggering agricultural false
              positives. Consequently, farmers unknowingly exacerbate land
              degradation through improper fertilizer application.
            </p>
            <p>
              This research engineered a novel bioelectrochemical system (BES)
              to resolve this &ldquo;Salinity Paradox&rdquo; by decoupling
              physical conductivity from microbial vitality. The primary
              objective was to replace superficial EC measurements with
              real-time quantification of electrochemically active biofilm
              (EAB) metabolism. A three-electrode BES utilizing a
              high-surface-area carbon felt working electrode was deployed
              across healthy, unhealthy, and saline-stressed soil samples.{' '}
              <em>Geobacter sulfurreducens</em> naturally present in the soil
              acted as the biocatalyst, performing extracellular electron
              transfer (EET). Electrochemical techniques, including
              chronoamperometry (CA), cyclic voltammetry (CV), and differential
              pulse voltammetry (DPV), were utilized to isolate faradaic
              biological signals from ohmic abiotic noise.
            </p>
            <p>
              The CA trials revealed a critical inverse correlation: while
              saline soils exhibited high conductivity, their biological
              current crashed due to metabolic arrest and protein denaturation.
              Furthermore, CV trials distinguished the faradaic capacitance of
              healthy biofilms from the highly linear, ohmic resistance of
              saline soils (R² = 0.92). DPV conclusively identified the
              biological origin of the signal via a distinct OmcZ cytochrome
              redox peak at &minus;0.13 V in healthy soil, which disappeared
              under saline stress. To automate this analysis, an ensemble
              machine learning and deep learning model (MSHI) was developed,
              achieving an 87.5% accuracy, 0.909 F1 score, and 1.0 ROC-AUC
              using just one hour of initial CA data.
            </p>
            <p>
              This BES successfully establishes the first real-time,
              label-free indicator of microbial recovery capable of
              penetrating the saline false positive. By shifting from physical
              to metabolic analysis, this affordable technology enables
              precision agriculture and targeted remediation efforts.
              Ultimately, deploying this sensor empowers farmers to intervene
              before ecosystem collapse, securing global food supplies and
              preserving vital carbon sinks.
            </p>
          </div>
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
              <div className="flex aspect-[8/11] flex-col items-center justify-center gap-4 px-6 py-10 text-center">
                <p className="max-w-md text-[0.85rem] leading-relaxed text-ink-soft">
                  Your browser can&rsquo;t display the embedded PDF.
                </p>
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
              </div>
            </object>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}

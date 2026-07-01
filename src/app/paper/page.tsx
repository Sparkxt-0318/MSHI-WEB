import type { Metadata } from 'next';
import Link from 'next/link';
import { Download } from 'lucide-react';
import { SectionLabel } from '@/components/site/section-label';
import { SiteFooter } from '@/components/site/site-footer';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Paper',
  description:
    'The full manuscript (embedded PDF) and a plain-language abstract for the MSHI / MSHI-Geo project.',
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
              Soil degradation — and salinization (salt buildup) in
              particular — now threatens over 10% of global land and is choking
              the ecosystem&rsquo;s second-largest carbon sink. The usual ways
              of gauging soil health lean on physical and chemical readings, and
              that leaves a dangerous blind spot. A standard electrical
              conductivity (EC) meter can&rsquo;t tell rich, fertile soil apart
              from toxic, salt-stressed soil — both read as high conductivity —
              so it throws false positives. Acting on them, farmers can add
              fertilizer that quietly makes the degradation worse.
            </p>
            <p>
              This work built a bioelectrochemical system (BES) — a cell that
              lets living microbes trade electrons with an electrode — to
              resolve that &ldquo;Salinity Paradox&rdquo;: the fact that a plain
              conductivity meter can&rsquo;t separate salty-but-dead soil from
              healthy soil. The idea is to swap that surface-level EC reading for
              a real-time measure of how active the soil&rsquo;s living microbes
              are, tracked through their electrochemically active biofilm (EAB).
              The BES uses three electrodes and a high-surface-area carbon-felt
              working electrode, and was run across healthy, unhealthy, and
              saline-stressed soil samples. The soil&rsquo;s own{' '}
              <em>Geobacter sulfurreducens</em> bacteria act as the biocatalyst,
              shuttling electrons to the electrode in a process called
              extracellular electron transfer (EET). Three electrochemical
              techniques — chronoamperometry (CA), cyclic voltammetry (CV), and
              differential pulse voltammetry (DPV) — separate the true
              biological signal (faradaic) from the soil&rsquo;s plain
              electrical resistance (ohmic, abiotic).
            </p>
            <p>
              The CA trials revealed a telling reversal: salty soils conducted
              electricity well, yet their biological current crashed as the
              microbes shut down and their proteins broke apart. The CV trials
              then separated the faradaic capacitance of healthy biofilms from
              the highly linear, ohmic resistance of saline soils (R² = 0.92).
              DPV pinned the signal to biology: a distinct OmcZ cytochrome redox
              peak (from a <em>Geobacter</em> electron-transfer protein) at
              &minus;0.13 V in healthy soil, which disappeared under saline
              stress. To automate the analysis, an ensemble machine-learning and
              deep-learning model (MSHI) was developed, achieving an 87.5%
              accuracy, 0.909 F1 score, and 1.0 ROC-AUC using just one hour of
              initial CA data.
            </p>
            <p>
              This BES establishes the first real-time, label-free indicator of
              microbial recovery — &ldquo;label-free&rdquo; meaning it needs no
              added dyes or reagents — that can see through the saline false
              positive. By measuring metabolism instead of bulk physics, this
              affordable technology opens the door to precision agriculture and
              better-targeted remediation. Ultimately, a sensor like this could
              let farmers step in before an ecosystem collapses, helping secure
              global food supplies and preserve the vital carbon sinks that
              healthy soil holds.
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

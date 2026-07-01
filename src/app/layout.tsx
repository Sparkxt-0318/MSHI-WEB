import type { Metadata, Viewport } from 'next';
import './globals.css';
import { SiteNav } from '@/components/site/site-nav';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'MSHI — Soil Microbial Respiration Research Portfolio',
    template: '%s · MSHI',
  },
  description:
    'Soil microbes breathe out carbon dioxide as they feed — the second-largest carbon flux on Earth, and one we can barely measure. This project tracks it three ways: a coin-sized bench-top biosensor, meter-scale flux chambers, and a continent-wide machine-learning map.',
  authors: [{ name: 'MSHI Research' }],
  keywords: [
    'soil respiration',
    'microbial soil health index',
    'biosensor',
    'electrochemistry',
    'XGBoost',
    'SRDB',
    'COSORE',
    'MODIS NPP',
    'continental upscaling',
    'spatial cross-validation',
  ],
  openGraph: {
    type: 'website',
    title: 'MSHI — Soil Microbial Respiration Research Portfolio',
    description:
      'A coin-sized soil biosensor and a continent-wide carbon map. A model trained on Asian soils still predicts soil respiration in the US it never saw — transfer R² = +0.145, with a 95% confidence interval that clears zero.',
    siteName: 'MSHI',
    locale: 'en_US',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#FAF8F5',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-paper text-ink">
      <body className="bg-paper text-ink antialiased">
        <SiteNav />
        <main className="relative">{children}</main>
      </body>
    </html>
  );
}

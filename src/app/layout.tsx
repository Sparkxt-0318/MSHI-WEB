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
    'A three-tier monitoring stack for soil microbial respiration, the second-largest carbon flux on Earth. Centimeter-scale electrochemical biosensor and continental ML atlas.',
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
      'Centimeter biosensor and kilometer atlas for soil carbon. Asia-trained ML transfers to the US at R² = +0.145, 95% CI excludes zero.',
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

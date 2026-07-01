import dynamic from 'next/dynamic';
import type { Metadata } from 'next';

// Mapbox GL touches `window` at construction; load on the client only.
const AtlasMap = dynamic(
  () => import('@/components/atlas/atlas-map').then((m) => m.AtlasMap),
  { ssr: false },
);

export const metadata: Metadata = {
  title: 'Atlas',
  description:
    'An interactive map of predicted soil respiration across continents. Click any cell to see its predicted anomaly, the top three inputs driving that prediction (its SHAP drivers), the local vegetation type, and how far it sits from the nearest training and validation sites.',
};

export default function AtlasPage() {
  return (
    <div className="bg-paper">
      <AtlasMap />
    </div>
  );
}

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
    'Interactive cross-continental Rs anomaly atlas. Click any cell in Asia to inspect predicted anomaly, top-3 SHAP drivers, biome class, and distance to nearest training/validation site.',
};

export default function AtlasPage() {
  return (
    <div className="bg-paper">
      <AtlasMap />
    </div>
  );
}

'use client';

import { X } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import type { AtlasResponse } from './atlas-mock-types';

interface AtlasDetailPanelProps {
  response: AtlasResponse | null;
  onClose: () => void;
}

export function AtlasDetailPanel({ response, onClose }: AtlasDetailPanelProps) {
  if (!response) return null;

  const { coord, name, outOfDomain, noPrediction, prediction, shap_top3, biome, koppen, distance_km } = response;

  const shapChartData = shap_top3.map((s) => ({
    name: s.feature,
    value: s.value,
  }));

  return (
    <aside
      role="dialog"
      aria-label="Atlas grid-cell detail"
      className="absolute right-0 top-0 z-30 flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-rule bg-paper shadow-2xl animate-fade-in"
    >
      <div className="flex items-center justify-between border-b border-rule px-6 py-4">
        <p className="meta-label">Atlas · {name ? 'location' : 'grid cell'}</p>
        <button
          onClick={onClose}
          className="text-ink-soft transition-colors hover:text-accent"
          aria-label="Close detail panel"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 px-6 py-6">
        {name ? (
          <>
            <p className="font-mono text-[0.72rem] uppercase tracking-meta text-ink-soft">
              Location
            </p>
            <p className="mt-1 font-serif text-xl font-bold text-ink">{name}</p>
            <p className="mt-2 font-mono text-[0.65rem] text-ink-soft">
              {coord.lat.toFixed(3)}°N, {coord.lon.toFixed(3)}°E
            </p>
          </>
        ) : (
          <>
            <p className="font-mono text-[0.72rem] uppercase tracking-meta text-ink-soft">
              Coordinate
            </p>
            <p className="mt-1 font-serif text-xl font-bold text-ink">
              {coord.lat.toFixed(3)}°N, {coord.lon.toFixed(3)}°E
            </p>
          </>
        )}

        <hr className="my-6 border-rule" />

        {outOfDomain ? (
          <>
            <p className="font-mono text-[0.72rem] uppercase tracking-meta text-accent">
              Outside model training domain
            </p>
            <p className="mt-3 text-[0.95rem] leading-relaxed text-ink">
              The F+NPP model was trained on 615 Asia sites
              (SRDB + COSORE) covering longitude{' '}
              <span className="font-mono">25–180°E</span> and latitude{' '}
              <span className="font-mono">−10–80°N</span>.
            </p>
            <p className="mt-3 text-[0.95rem] leading-relaxed text-ink">
              Predictions for{' '}
              <span className="font-serif font-bold">{name ?? 'this location'}</span>{' '}
              are not scientifically supported.
            </p>
            <p className="mt-6 border-t border-rule pt-4 font-mono text-[0.65rem] leading-relaxed text-ink-soft">
              Search returned a valid location — the globe flew there for
              visual feedback — but no Rs-anomaly estimate is shown
              because the geocoded point falls outside the
              Asia training rectangle.
            </p>
          </>
        ) : noPrediction ? (
          <>
            <p className="font-mono text-[0.72rem] uppercase tracking-meta text-accent">
              No prediction available
            </p>
            <p className="mt-3 text-[0.95rem] leading-relaxed text-ink">
              The clicked coordinate doesn&apos;t fall on a land cell in the
              0.5° lookup grid. Most likely this is open ocean, a large
              inland lake, an IGBP-water pixel, or extreme high-latitude
              tundra outside the MODIS composite.
            </p>
            <p className="mt-6 border-t border-rule pt-4 font-mono text-[0.65rem] leading-relaxed text-ink-soft">
              Try clicking on a land area inside Asia, or search for a
              city. The lookup covers 20,678 Asia land cells from
              `atlas_lookup.json` (built by the MSHI repo&apos;s
              `build_atlas_lookup.py`).
            </p>
          </>
        ) : (
          <PredictionBody
            prediction={prediction}
            shapChartData={shapChartData}
            biome={biome}
            koppen={koppen}
            distance_km={distance_km}
          />
        )}
      </div>
    </aside>
  );
}

function PredictionBody({
  prediction,
  shapChartData,
  biome,
  koppen,
  distance_km,
}: {
  prediction: AtlasResponse['prediction'];
  shapChartData: { name: string; value: number }[];
  biome: AtlasResponse['biome'];
  koppen: AtlasResponse['koppen'];
  distance_km: AtlasResponse['distance_km'];
}) {
  return (
    <>
      <p className="font-mono text-[0.72rem] uppercase tracking-meta text-ink-soft">
        Predicted Rs anomaly · {prediction.configuration}
      </p>
        <p className="mt-1 font-serif text-4xl font-bold leading-none text-ink">
          {prediction.rs_anomaly >= 1 ? '+' : ''}
          {((prediction.rs_anomaly - 1) * 100).toFixed(1)}%
        </p>
        <p className="mt-2 text-[0.85rem] italic text-ink-soft">
          ratio = {prediction.rs_anomaly.toFixed(3)} · 95% CI
          [{prediction.rs_anomaly_ci_low.toFixed(2)},{' '}
          {prediction.rs_anomaly_ci_high.toFixed(2)}]
        </p>

        <hr className="my-6 border-rule" />

        <p className="font-mono text-[0.72rem] uppercase tracking-meta text-ink-soft">
          Top-3 SHAP drivers
        </p>
        <div className="mt-3 h-[120px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={shapChartData}
              layout="vertical"
              margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
            >
              <XAxis type="number" hide domain={[0, 'auto']} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{
                  fill: '#0E1116',
                  fontSize: 10,
                  fontFamily: 'SF Mono, monospace',
                }}
                tickLine={false}
                axisLine={false}
                width={150}
              />
              <Bar dataKey="value" maxBarSize={16}>
                {shapChartData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={i === 0 ? '#A4221A' : i === 1 ? '#3F7CAB' : '#3A4048'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <hr className="my-6 border-rule" />

        <dl className="grid grid-cols-2 gap-x-4 gap-y-4 font-mono text-[0.72rem]">
          <div>
            <dt className="uppercase tracking-meta text-ink-soft">IGBP biome</dt>
            <dd className="mt-1 font-serif text-base font-bold text-ink">
              {biome.igbp_class}
            </dd>
          </div>
          <div>
            <dt className="uppercase tracking-meta text-ink-soft">Köppen zone</dt>
            <dd className="mt-1 font-serif text-base font-bold text-ink">
              {koppen.zone}
              <span className="ml-2 text-[0.7rem] font-normal italic text-ink-soft">
                {koppen.label}
              </span>
            </dd>
          </div>
          <div>
            <dt className="uppercase tracking-meta text-ink-soft">
              To nearest training site
            </dt>
            <dd className="mt-1 font-serif text-base font-bold text-ink">
              {distance_km.to_nearest_train_site.toLocaleString()} km
            </dd>
          </div>
          <div>
            <dt className="uppercase tracking-meta text-ink-soft">
              To nearest US validation site
            </dt>
            <dd className="mt-1 font-serif text-base font-bold text-ink">
              {distance_km.to_nearest_us_validation_site.toLocaleString()} km
            </dd>
          </div>
        </dl>

        <p className="mt-8 border-t border-rule pt-4 font-mono text-[0.65rem] leading-relaxed text-ink-soft">
          F+NPP XGBoost · n=615 Asia training sites (SRDB + COSORE) ·
          Asia → US transfer R² = +0.145 (95% CI 0.026–0.241).
          Per-cell SHAP via TreeExplainer; biome from MODIS IGBP;
          Köppen derived from WorldClim bio01/bio12/bio14/bio17.
        </p>
    </>
  );
}

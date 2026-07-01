'use client';

import { X } from 'lucide-react';
import type { AtlasResponse } from './atlas-mock-types';
import {
  getFeatureDescription,
  resolveDisplayValue,
} from '../../lib/feature-descriptions';

interface AtlasDetailPanelProps {
  response: AtlasResponse | null;
  onClose: () => void;
}

/** Format a coordinate with N/S + E/W hemisphere suffixes. Now that the atlas
 *  is global, western/southern cells would otherwise read as negative °E/°N. */
function fmtLatLon(lat: number, lon: number): string {
  const ns = lat >= 0 ? 'N' : 'S';
  const ew = lon >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(3)}°${ns}, ${Math.abs(lon).toFixed(3)}°${ew}`;
}

export function AtlasDetailPanel({ response, onClose }: AtlasDetailPanelProps) {
  if (!response) return null;

  const {
    coord,
    name,
    outOfDomain,
    noPrediction,
    domain,
    prediction,
    shap_top3,
    features,
    biome,
    koppen,
    distance_km,
  } = response;

  const isTransfer = domain === 'transfer';

  return (
    <aside
      role="dialog"
      aria-label="Atlas grid-cell detail"
      className="absolute right-0 top-0 z-30 flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-rule bg-paper shadow-2xl animate-fade-in"
    >
      <div className="flex items-center justify-between border-b border-rule px-6 py-4">
        <p className="meta-label flex items-center gap-2">
          Atlas · {name ? 'location' : 'grid cell'}
          {isTransfer ? (
            <span className="rounded-sm bg-bedrock-warn px-1.5 py-0.5 font-mono text-[0.6rem] font-semibold uppercase tracking-meta text-paper">
              Transfer
            </span>
          ) : null}
        </p>
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
              {fmtLatLon(coord.lat, coord.lon)}
            </p>
          </>
        ) : (
          <>
            <p className="font-mono text-[0.72rem] uppercase tracking-meta text-ink-soft">
              Coordinate
            </p>
            <p className="mt-1 font-serif text-xl font-bold text-ink">
              {fmtLatLon(coord.lat, coord.lon)}
            </p>
          </>
        )}

        <hr className="my-6 border-rule" />

        {outOfDomain ? (
          <>
            <p className="font-mono text-[0.72rem] uppercase tracking-meta text-accent">
              Outside the model&apos;s training area
            </p>
            <p className="mt-3 text-[0.95rem] leading-relaxed text-ink">
              The F+NPP model learned from 615 Asian sites
              (SRDB + COSORE), spanning longitude{' '}
              <span className="font-mono">25–180°E</span> and latitude{' '}
              <span className="font-mono">−10–80°N</span>.
            </p>
            <p className="mt-3 text-[0.95rem] leading-relaxed text-ink">
              A prediction for{' '}
              <span className="font-serif font-bold">{name ?? 'this location'}</span>{' '}
              wouldn&apos;t be scientifically supported.
            </p>
            <p className="mt-6 border-t border-rule pt-4 font-mono text-[0.65rem] leading-relaxed text-ink-soft">
              Your search found a real place — the globe flew there — but no
              respiration-anomaly estimate is shown, because the point falls
              outside the Asia training area.
            </p>
          </>
        ) : noPrediction ? (
          <>
            <p className="font-mono text-[0.72rem] uppercase tracking-meta text-accent">
              No prediction available
            </p>
            <p className="mt-3 text-[0.95rem] leading-relaxed text-ink">
              This spot isn&apos;t one of the covered land cells in the 0.5°
              grid. It&apos;s open ocean or inland water — or it sits in a region
              with no MODIS coverage. Both models need MODIS NPP/LST data, which
              here covers only ~31% of land, so South America and most of Africa
              and Europe have no cells (nothing is predicted, and nothing is
              made up).
            </p>
            <p className="mt-6 border-t border-rule pt-4 font-mono text-[0.65rem] leading-relaxed text-ink-soft">
              The lookup covers 27,393 land cells — 20,678 in the Asia training
              region, plus 6,715 transfer cells where real MODIS data exists
              (North America, Australia, parts of Africa). Try a land area there.
            </p>
          </>
        ) : (
          <>
            {isTransfer ? <TransferBanner /> : null}
            <PredictionBody
              prediction={prediction}
              shapTop3={shap_top3}
              features={features}
              biome={biome}
              koppen={koppen}
              distance_km={distance_km}
              isTransfer={isTransfer}
            />
          </>
        )}
      </div>
    </aside>
  );
}

/**
 * Mandatory transfer-prediction framing for non-Asia cells. Distinct amber
 * (bedrock-warn) badge + caveat so a transfer extrapolation can never be
 * mistaken for a validated Asia prediction.
 */
function TransferBanner() {
  return (
    <div
      data-mshi-transfer-banner
      className="mb-6 border-l-4 border-bedrock-warn bg-bedrock-warn/10 px-4 py-3"
    >
      <p className="flex items-center gap-2 font-mono text-[0.72rem] font-semibold uppercase tracking-meta text-bedrock-warn">
        <span aria-hidden="true">▲</span>
        Transfer prediction · Asia-trained model
      </p>
      <p className="mt-2 text-[0.82rem] leading-relaxed text-ink">
        This model was trained on Asian data and carries to other continents
        only weakly (R² = +0.145). Anything outside Asia is an illustrative
        extrapolation, not a validated result.{' '}
        <a
          href="/methods"
          className="font-semibold text-bedrock-warn underline decoration-bedrock-warn/40 underline-offset-2 hover:decoration-bedrock-warn"
        >
          See Methods.
        </a>
      </p>
    </div>
  );
}

function PredictionBody({
  prediction,
  shapTop3,
  features,
  biome,
  koppen,
  distance_km,
  isTransfer,
}: {
  prediction: AtlasResponse['prediction'];
  shapTop3: AtlasResponse['shap_top3'];
  features: AtlasResponse['features'];
  biome: AtlasResponse['biome'];
  koppen: AtlasResponse['koppen'];
  distance_km: AtlasResponse['distance_km'];
  isTransfer: boolean;
}) {
  return (
    <>
      <p className="font-mono text-[0.72rem] uppercase tracking-meta text-ink-soft">
        Predicted respiration anomaly · {prediction.configuration}
      </p>
      <p className="mt-1 font-serif text-4xl font-bold leading-none text-ink">
        {prediction.rs_anomaly >= 1 ? '+' : ''}
        {((prediction.rs_anomaly - 1) * 100).toFixed(1)}%
      </p>
      <p className="mt-2 text-[0.85rem] italic text-ink-soft">
        ratio = {prediction.rs_anomaly.toFixed(3)} · 95% CI [
        {prediction.rs_anomaly_ci_low.toFixed(2)},{' '}
        {prediction.rs_anomaly_ci_high.toFixed(2)}]
      </p>
      {isTransfer ? (
        <p className="mt-1 font-mono text-[0.62rem] uppercase tracking-meta text-bedrock-warn">
          Extrapolated beyond the Asia training region
        </p>
      ) : null}

      <hr className="my-6 border-rule" />

      <p className="font-mono text-[0.72rem] uppercase tracking-meta text-ink-soft">
        Top 3 drivers (SHAP)
      </p>
      <div className="mt-3 flex flex-col gap-4">
        {shapTop3.map((entry, i) => (
          <ShapEntry
            key={`${entry.key ?? entry.feature}-${i}`}
            entry={entry}
            featuresAtCell={features}
          />
        ))}
      </div>

      <hr className="my-6 border-rule" />

      <dl className="grid grid-cols-2 gap-x-4 gap-y-4 font-mono text-[0.72rem]">
        <div>
          <dt className="uppercase tracking-meta text-ink-soft">Vegetation (IGBP)</dt>
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
        F+NPP XGBoost · n=615 Asian training sites (SRDB + COSORE) ·
        Asia → US transfer R² = +0.145 (95% CI 0.026–0.241).
        Per-cell SHAP via TreeExplainer; vegetation from MODIS IGBP;
        Köppen zone derived from WorldClim bio01/bio12/bio14/bio17.
      </p>
    </>
  );
}

function ShapEntry({
  entry,
  featuresAtCell,
}: {
  entry: AtlasResponse['shap_top3'][number];
  featuresAtCell?: Record<string, number>;
}) {
  const key = entry.key ?? '';
  const desc = getFeatureDescription(key);
  const direction = entry.value >= 0 ? 'elevated' : 'suppressed';
  const directionClass =
    entry.value >= 0 ? 'text-[#3F7CAB]' : 'text-accent';
  const signed = entry.value >= 0
    ? `+${entry.value.toFixed(2)}`
    : entry.value.toFixed(2);

  const rawFeatureValue =
    key && featuresAtCell ? featuresAtCell[key] : undefined;
  const localBullet =
    rawFeatureValue != null
      ? desc.local(resolveDisplayValue(key, rawFeatureValue))
      : null;

  return (
    <div className="border-l-2 border-rule pl-3" data-mshi-shap-entry>
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-serif text-[1rem] font-bold text-ink">
          {entry.feature}
        </p>
        <p className="font-mono text-[0.78rem] text-ink">{signed}</p>
      </div>
      <p
        className={`mt-0.5 font-mono text-[0.62rem] uppercase tracking-meta ${directionClass}`}
      >
        drives toward {direction}
      </p>
      <ul className="mt-2 space-y-1 text-[0.82rem] leading-snug text-ink">
        <li
          data-mshi-shap-bullet="description"
          className="before:mr-1.5 before:text-ink-soft before:content-['•']"
        >
          {desc.description}
        </li>
        <li
          data-mshi-shap-bullet="mechanism"
          className="before:mr-1.5 before:text-ink-soft before:content-['•']"
        >
          {desc.mechanism}
        </li>
        {localBullet ? (
          <li
            data-mshi-shap-bullet="local"
            className="before:mr-1.5 before:text-ink-soft before:content-['•']"
          >
            {localBullet}
          </li>
        ) : null}
      </ul>
    </div>
  );
}

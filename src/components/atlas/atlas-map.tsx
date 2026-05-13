'use client';

import * as React from 'react';
import maplibregl from 'maplibre-gl';
import { Protocol as PMTilesProtocol } from 'pmtiles';
import 'maplibre-gl/dist/maplibre-gl.css';
import { AtlasDetailPanel } from './atlas-detail-panel';
import type { AtlasOverlayLayer, AtlasResponse } from './atlas-mock-types';
import {
  loadLookup,
  lookupCellSync,
  cellToResponse,
  noPredictionResponse,
} from './atlas-lookup';
import { Camera, Search } from 'lucide-react';

// Asia training-domain bounding box for the F+NPP model. Any geocoded
// search result that falls outside this rectangle is flagged
// `outOfDomain` so the detail panel shows the "not scientifically
// supported" message instead of fake prediction numbers.
const ASIA_BBOX = { minLng: 25, maxLng: 180, minLat: -10, maxLat: 80 };

function isInAsia(lng: number, lat: number): boolean {
  return (
    lng >= ASIA_BBOX.minLng &&
    lng <= ASIA_BBOX.maxLng &&
    lat >= ASIA_BBOX.minLat &&
    lat <= ASIA_BBOX.maxLat
  );
}

// PMTiles file served as a Vercel static asset out of public/tiles/.
// MapLibre talks to it through the `pmtiles://` protocol registered below.
const FNPP_PMTILES_URL = 'pmtiles:///tiles/mshi_f_npp_anomaly.pmtiles';

// Minimal inline basemap style. The F+NPP raster *is* the visualization;
// the basemap stays self-contained to avoid CORS/cert failure modes on
// Vercel cold start. The background layer paints navy to create the "space"
// effect around the 3D sphere, giving visual context to the globe without
// needing a CSS background on the page or map container.
const BASEMAP_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {},
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': '#0a1628' },
    },
  ],
};

// Register the PMTiles protocol exactly once at module load. MapLibre's
// addProtocol is a global registry, so re-registering on every mount would
// leak handlers.
let pmtilesRegistered = false;
function ensurePMTilesProtocol() {
  if (pmtilesRegistered) return;
  const protocol = new PMTilesProtocol();
  maplibregl.addProtocol('pmtiles', protocol.tile);
  pmtilesRegistered = true;
}

const OVERLAY_LAYERS: ReadonlyArray<{
  id: AtlasOverlayLayer;
  label: string;
  live: boolean;
}> = [
  { id: 'F', label: 'F', live: false },
  { id: 'F+NPP', label: 'F+NPP', live: true },
  { id: 'Full+MODIS', label: 'Full+MODIS', live: false },
  { id: 'Koppen-C', label: 'Köppen C', live: false },
  { id: 'Koppen-D', label: 'Köppen D', live: false },
];

const FNPP_SOURCE_ID = 'fnpp-pmtiles';
const FNPP_LAYER_ID = 'fnpp-pmtiles-layer';
const TRAINING_SITES_URL = '/data/training_sites.json';
const TRAINING_SOURCE_ID = 'training-sites-source';
const TRAINING_LAYER_ID = 'training-sites';

// Eight reference cities within the Asian training domain. We deliberately
// avoid pinning anywhere outside Asia: the F+NPP model is Asia-trained, so
// pins elsewhere would imply scientifically unsupported predictions.
// `code` is the short label drawn next to each dot.
const ASIA_CITY_PINS: ReadonlyArray<{
  name: string;
  code: string;
  lat: number;
  lon: number;
}> = [
  { name: 'Beijing', code: 'BJ', lat: 39.9, lon: 116.4 },
  { name: 'Tokyo', code: 'TY', lat: 35.7, lon: 139.7 },
  { name: 'Seoul', code: 'SE', lat: 37.6, lon: 126.9 },
  { name: 'Shanghai', code: 'SH', lat: 31.2, lon: 121.5 },
  { name: 'Mumbai', code: 'MUM', lat: 19.1, lon: 72.9 },
  { name: 'Singapore', code: 'SG', lat: 1.3, lon: 103.8 },
  { name: 'Bangkok', code: 'BK', lat: 13.8, lon: 100.5 },
  { name: 'Jakarta', code: 'JK', lat: -6.2, lon: 106.8 },
];

function createCityPinElement(name: string): HTMLDivElement {
  const wrap = document.createElement('div');
  wrap.setAttribute('data-mshi-city-pin', name);
  wrap.style.cssText = [
    'display:flex',
    'align-items:center',
    'gap:4px',
    'cursor:pointer',
    'transform:translateY(-1px)',
    'pointer-events:auto',
  ].join(';');

  const dot = document.createElement('span');
  dot.style.cssText = [
    'width:10px',
    'height:10px',
    'border-radius:9999px',
    'background:#ffffff',
    'border:1.5px solid rgba(14,17,22,0.85)',
    'box-shadow:0 0 0 1px rgba(255,255,255,0.25), 0 1px 3px rgba(0,0,0,0.55)',
    'display:block',
    'flex:0 0 auto',
  ].join(';');

  const label = document.createElement('span');
  label.textContent = name;
  label.style.cssText = [
    'font-family:"SF Mono", Menlo, Consolas, monospace',
    'font-size:10px',
    'font-weight:600',
    'letter-spacing:0.04em',
    'color:#ffffff',
    'text-shadow:0 1px 2px rgba(0,0,0,0.85), 0 0 4px rgba(0,0,0,0.6)',
    'white-space:nowrap',
    'user-select:none',
  ].join(';');

  wrap.appendChild(dot);
  wrap.appendChild(label);
  return wrap;
}

export function AtlasMap() {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<maplibregl.Map | null>(null);
  const [activeOverlay, setActiveOverlay] =
    React.useState<AtlasOverlayLayer>('F+NPP');
  const [response, setResponse] = React.useState<AtlasResponse | null>(null);
  const [mapError, setMapError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchError, setSearchError] = React.useState<string | null>(null);
  const [searching, setSearching] = React.useState(false);
  const [lookupReady, setLookupReady] = React.useState(false);
  const [lookupError, setLookupError] = React.useState<string | null>(null);
  const [showSites, setShowSites] = React.useState(false);
  const [siteCount, setSiteCount] = React.useState<number | null>(null);

  // Click handler shared by globe clicks, city-pin clicks, and search
  // results. Snaps to the nearest 0.5° cell in /data/atlas_lookup.json
  // (built by build_atlas_lookup.py in the MSHI repo) and renders the
  // real F+NPP XGBoost prediction + SHAP + biome + Köppen + distances.
  // If the snapped cell isn't in the lookup (oceans, lakes, IGBP-water,
  // or outside Asia), shows a "no prediction" panel.
  const showDetailAt = React.useCallback(
    async (
      lat: number,
      lon: number,
      cityName?: string,
      outOfDomain?: boolean,
    ) => {
      try {
        const cache = await loadLookup();
        if (outOfDomain) {
          // Geocoder returned a non-Asia location: keep the existing
          // "outside training domain" panel.
          setResponse({
            coord: { lat, lon },
            prediction: {
              rs_anomaly: 1.0,
              rs_anomaly_ci_low: 1.0,
              rs_anomaly_ci_high: 1.0,
              configuration: cache.model.name,
            },
            shap_top3: [],
            biome: { igbp_class: '—', igbp_code: -1 },
            koppen: { zone: '—', label: '—' },
            distance_km: {
              to_nearest_train_site: -1,
              to_nearest_us_validation_site: -1,
            },
            ...(cityName && { name: cityName }),
            outOfDomain: true,
          });
          return;
        }
        const cell = lookupCellSync(cache, lat, lon);
        if (!cell) {
          setResponse(noPredictionResponse(lat, lon, cityName));
          return;
        }
        setResponse(cellToResponse(cache, cell, cityName));
      } catch (err) {
        console.error('[atlas] lookup failed', err);
        setLookupError(
          err instanceof Error ? err.message : 'Lookup failed',
        );
      }
    },
    [],
  );

  // Pre-warm the lookup once on mount so the first click is instant.
  React.useEffect(() => {
    loadLookup()
      .then(() => setLookupReady(true))
      .catch((err) => {
        console.error('[atlas] lookup load failed', err);
        setLookupError(err instanceof Error ? err.message : 'Lookup failed');
      });
  }, []);

  const handleSearchSubmit = React.useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      const q = searchQuery.trim();
      if (!q) return;
      const map = mapRef.current;
      if (!map) return;

      setSearchError(null);
      setSearching(true);
      try {
        const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=1`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Photon API ${res.status}`);
        const json = (await res.json()) as {
          features?: Array<{
            geometry?: { coordinates?: [number, number] };
            properties?: { name?: string; city?: string; country?: string };
          }>;
        };
        const feat = json.features?.[0];
        const coords = feat?.geometry?.coordinates;
        if (!feat || !coords || coords.length < 2) {
          setSearchError('No location found — try a different query');
          setSearching(false);
          return;
        }
        const [lng, lat] = coords;
        // Photon often returns the localized name (e.g. "서울특별시" for
        // Seoul). Prefer the user's query unless it lacks letters; that
        // keeps the panel's "Location" header readable in the user's
        // expected language without forcing extra geocoder calls.
        const rawName =
          feat.properties?.name ??
          feat.properties?.city ??
          feat.properties?.country ??
          q;
        const isLatinAscii = /^[\x20-\x7F]+$/.test(rawName);
        const titleCased = q
          .split(/\s+/)
          .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
          .join(' ');
        const displayName = isLatinAscii ? rawName : titleCased;

        const inAsia = isInAsia(lng, lat);

        map.flyTo({ center: [lng, lat], zoom: 4, duration: 2000 });
        map.once('moveend', () => {
          void showDetailAt(lat, lng, displayName, !inAsia);
        });
      } catch (err) {
        console.error('[atlas search] failed', err);
        setSearchError('No location found — try a different query');
      } finally {
        setSearching(false);
      }
    },
    [searchQuery, showDetailAt],
  );

  React.useEffect(() => {
    if (!containerRef.current) return;

    ensurePMTilesProtocol();

    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style: BASEMAP_STYLE,
        center: [90, 35], // Asia
        zoom: 2.0,
        minZoom: 0.5,
        maxZoom: 8,
        attributionControl: false,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[maplibre] init failed', err);
      setMapError(msg);
      return;
    }

    mapRef.current = map;
    if (typeof window !== 'undefined') {
      (window as unknown as { __atlas_map?: maplibregl.Map }).__atlas_map = map;
    }

    // Enable the 3D globe projection only after the style finishes loading.
    // The previous code called setProjection() synchronously after construction;
    // on the Vercel build this raced the style-load lifecycle and threw
    // "Style is not done loading", which silently broke the entire map render.
    // `style.load` fires once the StyleSpecification is parsed and committed —
    // setProjection is safe from that point on.
    map.on('style.load', () => {
      try {
        map.setProjection({ type: 'globe' });
      } catch (err) {
        console.warn('[maplibre] globe projection unavailable', err);
      }
      // Paint the "space" surrounding the sphere via MapLibre's sky API
      // rather than a CSS rectangle on the container — the latter looked
      // like a filled rectangle instead of a planet floating in a dark
      // void. With globe projection + sky, the dark halo is only visible
      // where the sphere isn't, and the page's cream background shows in
      // the rest of the container.
      try {
        map.setSky({
          'sky-color': '#0a1628',
          'horizon-color': '#1e3a5f',
          'fog-color': '#0a1628',
          'sky-horizon-blend': 1.0,
          'horizon-fog-blend': 1.0,
          'fog-ground-blend': 0.0,
          'atmosphere-blend': 1.0,
        });
      } catch (err) {
        console.warn('[maplibre] sky unavailable', err);
      }
    });

    map.on('error', (e) => {
      const msg =
        (e?.error && (e.error as Error).message) ||
        (e as unknown as { message?: string }).message ||
        'Unknown MapLibre error';
      console.error('[maplibre]', msg, e);
      // Tile-fetch errors from the PMTiles protocol surface here too; don't
      // wipe out the whole UI for transient fetch failures.
      if (msg && msg.toLowerCase().includes('pmtiles')) return;
      setMapError(msg);
    });

    map.addControl(
      new maplibregl.NavigationControl({
        showCompass: true,
        visualizePitch: false,
      }),
      'bottom-right',
    );

    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      'bottom-right',
    );

    // The container can mount at 0 height (vh-based parent not yet measured),
    // which leaves MapLibre with a 1440x300 default canvas. A ResizeObserver
    // catches the post-mount layout and keeps the globe filling the page.
    const resizeObs = new ResizeObserver(() => {
      map.resize();
    });
    resizeObs.observe(containerRef.current);

    const markers: maplibregl.Marker[] = [];

    map.on('load', () => {
      map.addSource(FNPP_SOURCE_ID, {
        type: 'raster',
        url: FNPP_PMTILES_URL,
        tileSize: 256,
      });
      map.addLayer({
        id: FNPP_LAYER_ID,
        type: 'raster',
        source: FNPP_SOURCE_ID,
        paint: {
          'raster-opacity': 0.85,
          'raster-resampling': 'linear',
        },
      });

      // Training-site density overlay. Loaded once and added with
      // visibility:'none' so it costs nothing until the user toggles it.
      map.addSource(TRAINING_SOURCE_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addLayer({
        id: TRAINING_LAYER_ID,
        type: 'circle',
        source: TRAINING_SOURCE_ID,
        layout: { visibility: 'none' },
        paint: {
          // Slightly larger + higher contrast than the original draft so
          // dots are legible against both the red and blue ends of the
          // F+NPP colormap. White core, dark outline, partial opacity.
          'circle-radius': 4,
          'circle-color': '#FFFFFF',
          'circle-stroke-color': '#0E1116',
          'circle-stroke-width': 1.2,
          'circle-opacity': 0.95,
        },
      });
      // Fetch the 615 training-site coordinates lazily.
      fetch(TRAINING_SITES_URL)
        .then((r) => r.json())
        .then((j: { n_sites?: number; sites?: Array<{ lon: number; lat: number; source: string }> }) => {
          const sites = j.sites ?? [];
          const fc = {
            type: 'FeatureCollection' as const,
            features: sites.map((s) => ({
              type: 'Feature' as const,
              geometry: {
                type: 'Point' as const,
                coordinates: [s.lon, s.lat] as [number, number],
              },
              properties: { source: s.source },
            })),
          };
          const src = map.getSource(TRAINING_SOURCE_ID) as
            | maplibregl.GeoJSONSource
            | undefined;
          if (src) {
            src.setData(fc);
            console.info('[atlas] training-sites loaded', sites.length);
          } else {
            console.warn('[atlas] training-sites source not found');
          }
          setSiteCount(j.n_sites ?? sites.length);
        })
        .catch((err) => {
          console.error('[atlas] training-sites fetch failed', err);
        });

      // Drop the 8 Asian reference-city pins. Markers (DOM-based) avoid the
      // glyphs/font dependency a symbol+text-layer would require, and they
      // get free occlusion behind the globe in MapLibre 5's globe projection.
      for (const city of ASIA_CITY_PINS) {
        const el = createCityPinElement(city.name);
        el.title = `${city.name} (${city.lat.toFixed(1)}°, ${city.lon.toFixed(1)}°)`;
        el.addEventListener('click', (ev) => {
          ev.stopPropagation();
          void showDetailAt(city.lat, city.lon, city.name);
        });
        const marker = new maplibregl.Marker({ element: el, anchor: 'left' })
          .setLngLat([city.lon, city.lat])
          .addTo(map);
        markers.push(marker);
      }
    });

    map.on('click', (e) => {
      void showDetailAt(e.lngLat.lat, e.lngLat.lng);
    });

    return () => {
      for (const m of markers) m.remove();
      resizeObs.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Toggle the live F+NPP raster visibility when the user flips between
  // overlay buttons. Placeholders don't have layers to toggle.
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      if (!map.getLayer(FNPP_LAYER_ID)) return;
      const visible = activeOverlay === 'F+NPP';
      map.setLayoutProperty(
        FNPP_LAYER_ID,
        'visibility',
        visible ? 'visible' : 'none',
      );
    };
    if (map.isStyleLoaded()) {
      apply();
    } else {
      map.once('load', apply);
    }
  }, [activeOverlay]);

  // Training-site density toggle.
  //
  // Notes on the apply pattern: the layer is added inside `map.on('load')`,
  // which fires after this effect first runs. The naive
  // `if (isStyleLoaded()) apply() else map.once('load', apply)` pattern we
  // use elsewhere doesn't work here: `once('load')` captures the closure
  // with the initial state and never re-fires on subsequent clicks. By
  // calling `apply()` unconditionally (it no-ops if the layer isn't
  // present yet) and also attaching to `map.on('load')`, the effect re-
  // applies the current `showSites` value both at mount-time-after-load
  // and on every subsequent toggle.
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      if (!map.getLayer(TRAINING_LAYER_ID)) return;
      map.setLayoutProperty(
        TRAINING_LAYER_ID,
        'visibility',
        showSites ? 'visible' : 'none',
      );
    };
    apply();
    map.on('load', apply);
    return () => {
      map.off('load', apply);
    };
  }, [showSites]);

  return (
    <div className="relative h-[calc(100vh-5rem)] w-full bg-cream">
      {mapError ? (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-cream p-12 text-center">
          <p className="meta-label">Atlas · map failed to load</p>
          <h2 className="mt-4 max-w-2xl font-serif text-3xl font-bold text-ink">
            The MapLibre globe couldn&apos;t initialize.
          </h2>
          <pre className="mt-3 max-w-xl whitespace-pre-wrap break-words border border-rule bg-paper px-4 py-3 text-left font-mono text-[0.78rem] text-accent">
            {mapError}
          </pre>
          <p className="mt-6 max-w-xl font-mono text-[0.7rem] text-ink-soft">
            Open the browser DevTools console for the full error object.
          </p>
        </div>
      ) : (
        <>
          <div
            ref={containerRef}
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              background: 'transparent',
            }}
          />

          {/* Top-right search */}
          <div
            data-mshi-atlas-search
            className="pointer-events-auto absolute right-4 top-4 z-20 flex flex-col gap-1 border border-rule bg-paper/95 p-2 backdrop-blur-sm"
            style={{ width: 280 }}
          >
            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center gap-1"
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search city or country..."
                disabled={searching}
                className="flex-1 border border-rule bg-paper px-2 py-1 font-mono text-[0.75rem] text-ink placeholder:text-ink-soft focus:border-ink focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={searching || !searchQuery.trim()}
                aria-label="Search location"
                className="border border-rule bg-paper px-2 py-1 text-ink-soft hover:border-ink hover:text-ink disabled:opacity-50 disabled:hover:border-rule disabled:hover:text-ink-soft"
              >
                <Search className="h-3.5 w-3.5" />
              </button>
            </form>
            {searchError ? (
              <p
                data-mshi-atlas-search-error
                className="font-mono text-[0.65rem] leading-snug text-accent"
              >
                {searchError}
              </p>
            ) : (
              <p className="font-mono text-[0.6rem] leading-snug text-ink-soft">
                Powered by Photon · OSM. Outside Asia → no prediction.
              </p>
            )}
          </div>

          {/* Top-left overlay toggle */}
          <div className="pointer-events-auto absolute left-4 top-4 z-20 flex flex-col gap-2 border border-rule bg-paper/95 p-3 backdrop-blur-sm">
            <p className="meta-label text-ink-soft">Overlay</p>
            <div className="flex flex-wrap gap-1">
              {OVERLAY_LAYERS.map((l) => {
                const isActive = activeOverlay === l.id;
                return (
                  <button
                    key={l.id}
                    onClick={() => setActiveOverlay(l.id)}
                    className={`border px-2 py-1 font-mono text-[0.7rem] uppercase tracking-meta transition-colors ${
                      isActive
                        ? 'border-ink bg-ink text-paper'
                        : 'border-rule bg-paper text-ink-soft hover:border-ink hover:text-ink'
                    }`}
                  >
                    {l.label}
                    {!l.live ? (
                      <span className="ml-1 text-[0.55rem] text-accent">·PH</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
            <p className="mt-1 font-mono text-[0.6rem] leading-snug text-ink-soft">
              F+NPP live (MapLibre globe + PMTiles). Others awaiting precomputed
              rasters.
            </p>
          </div>

          {/* Bottom strip: legend + actions */}
          <div className="pointer-events-auto absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-6 border border-rule bg-paper/95 px-5 py-3 backdrop-blur-sm">
            <div>
              <p className="meta-label text-ink-soft">
                Rs anomaly · F+NPP · n=615
              </p>
              <div className="mt-1 flex items-center gap-2">
                <div
                  aria-hidden="true"
                  className="h-2 w-44"
                  style={{
                    // Hero-aligned inverted colormap: red = suppressed (low),
                    // blue = elevated (high). Left-to-right = 0.5 -> 1.5.
                    background:
                      'linear-gradient(to right, #A4221A 0%, #F4C2A8 25%, #FAF8F5 50%, #3F7CAB 75%, #1F4068 100%)',
                  }}
                />
              </div>
              <div className="mt-1 flex justify-between font-mono text-[0.6rem] text-ink-soft">
                <span>0.5 · suppressed</span>
                <span>1.0</span>
                <span>1.5 · elevated</span>
              </div>
            </div>
            <div className="border-l border-rule pl-6">
              <p className="meta-label text-ink-soft">
                Sites{siteCount ? ` · n=${siteCount}` : ''}
              </p>
              <button
                data-mshi-toggle-density
                aria-pressed={showSites}
                onClick={() => setShowSites((v) => !v)}
                className={`mt-1 border px-2 py-1 font-mono text-[0.65rem] uppercase tracking-meta transition-colors ${
                  showSites
                    ? 'border-ink bg-ink text-paper'
                    : 'border-rule bg-paper text-ink-soft hover:border-ink hover:text-ink'
                }`}
                title={
                  showSites
                    ? 'Hide SRDB + COSORE training-site dots'
                    : 'Show all 615 SRDB + COSORE training-site locations'
                }
              >
                Toggle density
              </button>
            </div>
            <button
              className="ml-2 inline-flex items-center gap-1.5 border border-rule px-2.5 py-1.5 font-mono text-[0.65rem] uppercase tracking-meta text-ink-soft hover:border-ink hover:text-ink"
              disabled
              title="Screenshot — not yet wired"
            >
              <Camera className="h-3 w-3" />
              Screenshot
            </button>
          </div>

          <AtlasDetailPanel
            response={response}
            onClose={() => setResponse(null)}
          />
        </>
      )}
    </div>
  );
}

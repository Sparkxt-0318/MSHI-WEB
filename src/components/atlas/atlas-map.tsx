'use client';

import * as React from 'react';
import maplibregl from 'maplibre-gl';
import { Protocol as PMTilesProtocol } from 'pmtiles';
import 'maplibre-gl/dist/maplibre-gl.css';
import { AtlasDetailPanel } from './atlas-detail-panel';
import type { AtlasOverlayLayer, AtlasResponse } from './atlas-mock-types';
import { Camera } from 'lucide-react';

// PMTiles file served as a Vercel static asset out of public/tiles/.
// MapLibre talks to it through the `pmtiles://` protocol registered below.
const FNPP_PMTILES_URL = 'pmtiles:///tiles/mshi_f_npp_anomaly.pmtiles';

// Minimal inline basemap style. We don't depend on any external style/tile
// CDN: the F+NPP raster *is* the visualization. Country outlines can be
// layered on later via a vector source if desired. Keeping the basemap
// self-contained also means no CORS / cert-chain failure modes during
// the Vercel cold start.
const BASEMAP_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {},
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': '#0E1116' },
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

export function AtlasMap() {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<maplibregl.Map | null>(null);
  const [activeOverlay, setActiveOverlay] =
    React.useState<AtlasOverlayLayer>('F+NPP');
  const [response, setResponse] = React.useState<AtlasResponse | null>(null);
  const [mapError, setMapError] = React.useState<string | null>(null);

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
      'top-right',
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
    });

    map.on('click', async (e) => {
      // PLACEHOLDER click handler: every click returns the same mock record.
      // Night 3+: look up by 0.5° grid cell containing e.lngLat in a real
      // precomputed table.
      try {
        const r = await fetch('/data/atlas_mock_response.json');
        const json = (await r.json()) as AtlasResponse;
        const enriched: AtlasResponse = {
          ...json,
          coord: {
            ...json.coord,
            lat: +e.lngLat.lat.toFixed(3),
            lon: +e.lngLat.lng.toFixed(3),
          },
        };
        setResponse(enriched);
      } catch (err) {
        console.error('Failed to load atlas mock response', err);
      }
    });

    return () => {
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
            }}
          />

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
              <p className="meta-label text-ink-soft">Sites</p>
              <button
                className="mt-1 border border-rule px-2 py-1 font-mono text-[0.65rem] uppercase tracking-meta text-ink-soft hover:border-ink hover:text-ink"
                disabled
                title="Visual toggle, not yet wired"
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

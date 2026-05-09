'use client';

import * as React from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { AtlasDetailPanel } from './atlas-detail-panel';
import type { AtlasOverlayLayer, AtlasResponse } from './atlas-mock-types';
import { Camera } from 'lucide-react';

const STYLE_URL =
  process.env.NEXT_PUBLIC_MAPBOX_STYLE ?? 'mapbox://styles/mapbox/light-v11';
const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';

const OVERLAY_PNG = '/images/atlas_overlay_fnpp.png';

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

export function AtlasMap() {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<mapboxgl.Map | null>(null);
  const [activeOverlay, setActiveOverlay] =
    React.useState<AtlasOverlayLayer>('F+NPP');
  const [response, setResponse] = React.useState<AtlasResponse | null>(null);
  const [tokenMissing, setTokenMissing] = React.useState(false);

  React.useEffect(() => {
    if (!containerRef.current) return;
    if (!TOKEN) {
      setTokenMissing(true);
      return;
    }

    mapboxgl.accessToken = TOKEN;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      center: [100, 38], // Asia centroid
      zoom: 2.6,
      minZoom: 1.5,
      attributionControl: true,
    });

    mapRef.current = map;

    map.addControl(
      new mapboxgl.NavigationControl({ showCompass: false, visualizePitch: false }),
      'top-right',
    );

    map.on('load', () => {
      // Try to add the F+NPP overlay if the user has supplied the PNG.
      // Bounds chosen to roughly cover the SRDB+COSORE Asian study domain.
      try {
        map.addSource('fnpp-overlay', {
          type: 'image',
          url: OVERLAY_PNG,
          coordinates: [
            [60, 60], // top-left
            [150, 60], // top-right
            [150, 0], // bottom-right
            [60, 0], // bottom-left
          ],
        });
        map.addLayer({
          id: 'fnpp-overlay-layer',
          type: 'raster',
          source: 'fnpp-overlay',
          paint: { 'raster-opacity': 0.65 },
        });
      } catch {
        // Image not yet supplied — silently skip; placeholder messaging
        // appears in the legend strip.
      }
    });

    map.on('click', async (e) => {
      // PLACEHOLDER click handler: every click returns the same mock record.
      // When the user supplies a precomputed lookup, look up by 0.5° grid
      // cell containing e.lngLat.
      try {
        const r = await fetch('/data/atlas_mock_response.json');
        const json = (await r.json()) as AtlasResponse;
        // Override coord with the actual click location so the panel feels
        // responsive — the rest of the record stays as the mock template.
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
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div className="relative h-[calc(100vh-5rem)] w-full bg-cream">
      {tokenMissing ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-cream p-12 text-center">
          <p className="meta-label">Atlas · setup required</p>
          <h2 className="mt-4 max-w-2xl font-serif text-3xl font-bold text-ink">
            Mapbox access token missing.
          </h2>
          <p className="mt-4 max-w-xl font-mono text-sm leading-relaxed text-ink-soft">
            Set <span className="text-accent">NEXT_PUBLIC_MAPBOX_TOKEN</span> in
            your environment (or in Vercel project settings) and reload. See
            <span className="ml-1">.env.example</span> for setup details.
          </p>
        </div>
      ) : (
        <div ref={containerRef} className="absolute inset-0" />
      )}

      {/* Top-right overlay toggle */}
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
          Only F+NPP is live. Others are placeholders awaiting precomputed
          rasters.
        </p>
      </div>

      {/* Bottom strip: legend + actions */}
      <div className="pointer-events-auto absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-6 border border-rule bg-paper/95 px-5 py-3 backdrop-blur-sm">
        <div>
          <p className="meta-label text-ink-soft">Anomaly</p>
          <div className="mt-1 flex items-center gap-2">
            <div
              aria-hidden="true"
              className="h-2 w-40"
              style={{
                background:
                  'linear-gradient(to right, #1F4068 0%, #3F7CAB 25%, #FAF8F5 50%, #F4C2A8 75%, #A4221A 100%)',
              }}
            />
          </div>
          <div className="mt-1 flex justify-between font-mono text-[0.6rem] text-ink-soft">
            <span>0.5</span>
            <span>1.0</span>
            <span>1.5</span>
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

      <AtlasDetailPanel response={response} onClose={() => setResponse(null)} />
    </div>
  );
}

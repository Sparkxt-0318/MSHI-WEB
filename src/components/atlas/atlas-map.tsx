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
import { Camera, Eye, EyeOff, Info, Search, X } from 'lucide-react';

// Non-Asia "transfer" cells (the rest of the globe where real MODIS exists)
// are rendered as points coloured by the active model's anomaly, using the
// same diverging colormap as the legend (0.5 red → 1.0 cream → 1.5 blue).
// The Asia training region keeps its PMTiles raster; the transfer region is
// the point layer. Both are clickable; the detail panel flags transfer cells.
const TRANSFER_SOURCE_ID = 'transfer-cells-source';
const TRANSFER_LAYER_ID = 'transfer-cells';

function anomalyColorExpr(prop: string): maplibregl.ExpressionSpecification {
  return [
    'interpolate',
    ['linear'],
    ['get', prop],
    0.5,
    '#A4221A',
    0.75,
    '#F4C2A8',
    1.0,
    '#FAF8F5',
    1.25,
    '#3F7CAB',
    1.5,
    '#1F4068',
  ] as maplibregl.ExpressionSpecification;
}

// Photon's GeoJSON response shape, narrowed to the fields we read.
interface PhotonFeature {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    name?: string;
    city?: string;
    country?: string;
    state?: string;
    osm_value?: string;
  };
}

/** Pick the readable display name from a Photon feature, with a Latin-ASCII
 *  fallback to the user's typed query so we don't surface localized
 *  scripts ("서울특별시") for a Latin query ("Seoul"). */
function photonDisplayName(feat: PhotonFeature, fallback: string): string {
  const rawName =
    feat.properties?.name ??
    feat.properties?.city ??
    feat.properties?.country ??
    fallback;
  const isLatinAscii = /^[\x20-\x7F]+$/.test(rawName);
  if (isLatinAscii) return rawName;
  return fallback
    .split(/\s+/)
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

/** Secondary label for a suggestion row ("Shanghai, China"). */
function photonSecondaryLabel(feat: PhotonFeature): string {
  const country = feat.properties?.country;
  const state = feat.properties?.state;
  return [state, country].filter(Boolean).join(', ');
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
}> = [
  { id: 'F+NPP', label: 'F+NPP' },
  { id: 'Full+MODIS', label: 'Full+MODIS' },
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
  const [suggestions, setSuggestions] = React.useState<PhotonFeature[]>([]);
  const [highlightIdx, setHighlightIdx] = React.useState<number>(-1);
  const [suggestionsOpen, setSuggestionsOpen] = React.useState(false);
  const suggestAbortRef = React.useRef<AbortController | null>(null);
  const searchBoxRef = React.useRef<HTMLDivElement | null>(null);
  const [screenshotSaved, setScreenshotSaved] = React.useState(false);
  const [infoOpen, setInfoOpen] = React.useState(false);
  // n_train + n_us strings for the legend, sourced from the lookup file
  // metadata so the numbers stay in sync with whichever model is active.
  const [modelMeta, setModelMeta] = React.useState<{
    fnpp: { n: number };
    fullmodis: { n: number };
  } | null>(null);
  const [lookupReady, setLookupReady] = React.useState(false);
  const [lookupError, setLookupError] = React.useState<string | null>(null);
  const [showSites, setShowSites] = React.useState(false);
  const [siteCount, setSiteCount] = React.useState<number | null>(null);
  // Collapses the bottom legend/controls bar so the globe can be explored
  // — and screenshotted — without UI chrome; a bottom-left pill restores it.
  const [barVisible, setBarVisible] = React.useState(true);

  // Click handler shared by globe clicks, city-pin clicks, and search
  // results. Snaps to the nearest 0.5° cell in /data/atlas_lookup.json
  // (built by build_atlas_lookup.py in the MSHI repo) and renders the
  // real F+NPP XGBoost prediction + SHAP + biome + Köppen + distances.
  // If the snapped cell isn't in the lookup (oceans, lakes, IGBP-water,
  // or outside Asia), shows a "no prediction" panel.
  // Mirror activeOverlay in a ref so showDetailAt can read the *current*
  // layer without forcing a useCallback recreation (and a cascade through
  // map.on('click') / pin handlers / search handler).
  const activeOverlayRef = React.useRef(activeOverlay);
  React.useEffect(() => {
    activeOverlayRef.current = activeOverlay;
  }, [activeOverlay]);

  // When the user toggles between F+NPP and Full+MODIS while the detail
  // panel is open, re-resolve the panel so it shows the new model's
  // prediction at the same cell (rather than a stale snapshot from the
  // previous layer).
  React.useEffect(() => {
    if (!response || response.noPrediction) return;
    void showDetailAt(response.coord.lat, response.coord.lon, response.name);
    // showDetailAt is stable; only fire when activeOverlay actually flips.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOverlay]);

  const showDetailAt = React.useCallback(
    async (lat: number, lon: number, cityName?: string) => {
      try {
        const cache = await loadLookup();
        const layer = activeOverlayRef.current;
        // Snap to the nearest 0.5° lookup cell anywhere on the globe. A hit
        // is rendered as a real prediction — flagged "transfer" by the detail
        // panel when the cell is outside Asia. A miss (ocean, or a region with
        // no MODIS such as South America) shows the "no prediction" panel.
        const cell = lookupCellSync(cache, lat, lon);
        if (!cell) {
          setResponse(noPredictionResponse(lat, lon, layer, cityName));
          return;
        }
        setResponse(cellToResponse(cache, cell, layer, cityName));
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
      .then((cache) => {
        setLookupReady(true);
        setModelMeta({
          fnpp: { n: cache.models.fnpp.training_n_asia },
          fullmodis: { n: cache.models.fullmodis.training_n_asia },
        });
      })
      .catch((err) => {
        console.error('[atlas] lookup load failed', err);
        setLookupError(err instanceof Error ? err.message : 'Lookup failed');
      });
  }, []);

  // Shared "fly the globe to this feature and open the detail panel"
  // logic used by both the submit (Enter key / search button) and
  // autocomplete-suggestion click paths.
  const applyFeature = React.useCallback(
    (feat: PhotonFeature, fallbackName: string) => {
      const map = mapRef.current;
      const coords = feat.geometry?.coordinates;
      if (!map || !coords || coords.length < 2) {
        setSearchError('No location found — try a different query');
        return;
      }
      const [lng, lat] = coords;
      const displayName = photonDisplayName(feat, fallbackName);

      // Close the suggestions dropdown the moment we commit to a selection.
      setSuggestionsOpen(false);
      setSuggestions([]);
      setHighlightIdx(-1);
      setSearchQuery(displayName);
      setSearchError(null);

      map.flyTo({ center: [lng, lat], zoom: 4, duration: 2000 });
      map.once('moveend', () => {
        // Resolve wherever the search landed. Non-Asia hits come back as
        // transfer cells (flagged in the panel); MODIS-absent points fall
        // through to the "no prediction" panel.
        void showDetailAt(lat, lng, displayName);
      });
    },
    [showDetailAt],
  );

  const handleSearchSubmit = React.useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      const q = searchQuery.trim();
      if (!q) return;

      // If the user pressed Enter while a suggestion was highlighted, prefer
      // that — it matches their visible selection.
      if (suggestionsOpen && highlightIdx >= 0 && highlightIdx < suggestions.length) {
        applyFeature(suggestions[highlightIdx], q);
        return;
      }

      setSearchError(null);
      setSearching(true);
      try {
        const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=1&lang=en`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Photon API ${res.status}`);
        const json = (await res.json()) as { features?: PhotonFeature[] };
        const feat = json.features?.[0];
        if (!feat) {
          setSearchError('No location found — try a different query');
          return;
        }
        applyFeature(feat, q);
      } catch (err) {
        console.error('[atlas search] failed', err);
        setSearchError('No location found — try a different query');
      } finally {
        setSearching(false);
      }
    },
    [searchQuery, suggestionsOpen, highlightIdx, suggestions, applyFeature],
  );

  // Debounced Photon suggestion fetch — runs 280 ms after the user stops
  // typing. Earlier in-flight requests are aborted so we don't render
  // stale suggestions.
  React.useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setSuggestionsOpen(false);
      setHighlightIdx(-1);
      return;
    }
    const t = window.setTimeout(() => {
      suggestAbortRef.current?.abort();
      const ctrl = new AbortController();
      suggestAbortRef.current = ctrl;
      const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=5&lang=en`;
      fetch(url, { signal: ctrl.signal })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`Photon ${r.status}`))))
        .then((j: { features?: PhotonFeature[] }) => {
          const feats = (j.features ?? []).filter(
            (f) =>
              f.geometry?.coordinates &&
              f.geometry.coordinates.length >= 2,
          );
          setSuggestions(feats);
          setSuggestionsOpen(feats.length > 0);
          setHighlightIdx(feats.length > 0 ? 0 : -1);
        })
        .catch((err) => {
          if ((err as Error).name === 'AbortError') return;
          // Suggestions are best-effort — silent failure keeps the manual
          // submit path working.
          console.warn('[atlas suggest] failed', err);
        });
    }, 280);
    return () => window.clearTimeout(t);
  }, [searchQuery]);

  // Close the dropdown when the user clicks outside the search control.
  React.useEffect(() => {
    if (!suggestionsOpen) return;
    const onDocPointerDown = (ev: PointerEvent) => {
      const root = searchBoxRef.current;
      if (root && ev.target instanceof Node && !root.contains(ev.target)) {
        setSuggestionsOpen(false);
      }
    };
    document.addEventListener('pointerdown', onDocPointerDown);
    return () => document.removeEventListener('pointerdown', onDocPointerDown);
  }, [suggestionsOpen]);

  const handleSearchKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!suggestionsOpen || suggestions.length === 0) {
        if (e.key === 'Escape') setSuggestionsOpen(false);
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightIdx((i) => (i + 1) % suggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightIdx((i) =>
          i <= 0 ? suggestions.length - 1 : i - 1,
        );
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setSuggestionsOpen(false);
        setHighlightIdx(-1);
      }
      // Enter handled by form onSubmit, which uses the highlighted item.
    },
    [suggestionsOpen, suggestions.length],
  );

  // Wire the SCREENSHOT button: capture the map canvas as a PNG.
  // Requires `preserveDrawingBuffer: true` on the MapLibre constructor
  // (added below) — without it, toDataURL on a transient WebGL canvas
  // returns blank pixels.
  const handleScreenshot = React.useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    try {
      const canvas = map.getCanvas();
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      a.href = url;
      a.download = `mshi-atlas-${ts}.png`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setScreenshotSaved(true);
      window.setTimeout(() => setScreenshotSaved(false), 1500);
    } catch (err) {
      console.error('[atlas screenshot] failed', err);
    }
  }, []);

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
        // Required so the SCREENSHOT button can read pixels back via
        // canvas.toDataURL — without it, WebGL clears the framebuffer
        // after each present and the screenshot comes out blank. The
        // MapLibre default has preserveDrawingBuffer:false for perf;
        // we explicitly opt in.
        canvasContextAttributes: { preserveDrawingBuffer: true },
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

    // Zoom + compass buttons live in the bottom-right — exactly where the
    // legend bar spans full-width on a phone. Touch devices pinch-zoom and
    // rotate natively, so the NavigationControl is desktop-only. A media-query
    // listener keeps it in sync if the viewport later crosses the breakpoint
    // (orientation change, desktop window resize, responsive dev tools).
    const mobileMQL = window.matchMedia('(max-width: 639px)');
    let navControl: maplibregl.NavigationControl | null = null;
    const syncNavControl = () => {
      if (mobileMQL.matches) {
        if (navControl) {
          map.removeControl(navControl);
          navControl = null;
        }
      } else if (!navControl) {
        navControl = new maplibregl.NavigationControl({
          showCompass: true,
          visualizePitch: false,
        });
        map.addControl(navControl, 'bottom-right');
      }
    };
    syncNavControl();
    mobileMQL.addEventListener('change', syncNavControl);

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

      // Render the non-Asia transfer cells as anomaly-coloured points so the
      // global extension is visible on the globe (the PMTiles raster covers
      // only Asia). Built once from the cached lookup; each point is clickable
      // via the same map click handler and flagged "transfer" in the panel.
      void loadLookup()
        .then((cache) => {
          if (map.getSource(TRANSFER_SOURCE_ID)) return;
          const features: Array<{
            type: 'Feature';
            geometry: { type: 'Point'; coordinates: [number, number] };
            properties: { anom_fnpp: number; anom_full: number };
          }> = [];
          for (const c of cache.byKey.values()) {
            if (c.domain !== 'transfer') continue;
            features.push({
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [c.lon, c.lat] },
              properties: {
                anom_fnpp: c.fnpp.anomaly,
                anom_full: c.fullmodis.anomaly,
              },
            });
          }
          map.addSource(TRANSFER_SOURCE_ID, {
            type: 'geojson',
            data: { type: 'FeatureCollection' as const, features },
          });
          const prop =
            activeOverlayRef.current === 'Full+MODIS'
              ? 'anom_full'
              : 'anom_fnpp';
          map.addLayer({
            id: TRANSFER_LAYER_ID,
            type: 'circle',
            source: TRANSFER_SOURCE_ID,
            paint: {
              'circle-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                0.5,
                1.4,
                2,
                2.6,
                4,
                6,
                6,
                14,
              ],
              'circle-color': anomalyColorExpr(prop),
              'circle-opacity': 0.85,
              'circle-stroke-width': 0,
            },
          });
          console.info('[atlas] transfer cells rendered', features.length);
        })
        .catch((err) => console.error('[atlas] transfer layer failed', err));

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
      mobileMQL.removeEventListener('change', syncNavControl);
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

  // Recolour the non-Asia transfer points when the active model flips, so
  // they track the same anomaly the legend describes. The layer is added
  // asynchronously inside map.on('load'); apply() no-ops until it exists.
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      if (!map.getLayer(TRANSFER_LAYER_ID)) return;
      const prop = activeOverlay === 'Full+MODIS' ? 'anom_full' : 'anom_fnpp';
      map.setPaintProperty(
        TRANSFER_LAYER_ID,
        'circle-color',
        anomalyColorExpr(prop),
      );
    };
    apply();
    map.on('load', apply);
    return () => {
      map.off('load', apply);
    };
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
    // dvh (not vh) so the bottom legend bar isn't swallowed by the mobile
    // browser URL bar; the -4rem-1px matches the sticky nav's 64px + hairline.
    <div className="relative h-[calc(100dvh-4rem-1px)] w-full bg-cream">
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

          {/* Search. Full-width across the top on a phone (so the 280px box
              doesn't collide with the top-left overlay panel); a fixed 280px
              box pinned top-right from sm up. z-30 keeps the suggestions
              dropdown above the overlay panel it now sits over on mobile. */}
          <div
            ref={searchBoxRef}
            data-mshi-atlas-search
            className="pointer-events-auto absolute left-3 right-3 top-3 z-30 flex flex-col gap-1 border border-rule bg-paper/95 p-2 backdrop-blur-sm sm:left-auto sm:top-4 sm:right-4 sm:w-[280px]"
          >
            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center gap-1"
              role="combobox"
              aria-expanded={suggestionsOpen}
              aria-haspopup="listbox"
              aria-owns="atlas-search-suggestions"
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                onFocus={() => {
                  if (suggestions.length > 0) setSuggestionsOpen(true);
                }}
                placeholder="Search city or country..."
                disabled={searching}
                autoComplete="off"
                spellCheck={false}
                aria-autocomplete="list"
                aria-controls="atlas-search-suggestions"
                aria-activedescendant={
                  highlightIdx >= 0
                    ? `atlas-suggestion-${highlightIdx}`
                    : undefined
                }
                // 16px on mobile prevents iOS Safari from auto-zooming the
                // page when the field gains focus; 12px (compact) from sm up.
                className="flex-1 border border-rule bg-paper px-2 py-1 font-mono text-[16px] text-ink placeholder:text-ink-soft focus:border-ink focus:outline-none disabled:opacity-50 sm:text-[0.75rem]"
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

            {/* Autocomplete dropdown */}
            {suggestionsOpen && suggestions.length > 0 ? (
              <ul
                id="atlas-search-suggestions"
                role="listbox"
                data-mshi-atlas-suggestions
                className="mt-1 max-h-60 overflow-y-auto border border-rule bg-paper"
              >
                {suggestions.map((feat, i) => {
                  const primary = photonDisplayName(feat, searchQuery);
                  const secondary = photonSecondaryLabel(feat);
                  const active = i === highlightIdx;
                  return (
                    <li
                      key={`${primary}-${i}`}
                      id={`atlas-suggestion-${i}`}
                      role="option"
                      aria-selected={active}
                      data-mshi-atlas-suggestion
                      onPointerDown={(ev) => {
                        // Prevent the input from losing focus before we
                        // process the selection.
                        ev.preventDefault();
                        applyFeature(feat, searchQuery);
                      }}
                      onMouseEnter={() => setHighlightIdx(i)}
                      className={`flex cursor-pointer items-baseline justify-between gap-2 px-2 py-1.5 font-mono text-[0.7rem] ${
                        active
                          ? 'bg-ink text-paper'
                          : 'text-ink hover:bg-ink/5'
                      }`}
                    >
                      <span className="truncate">{primary}</span>
                      {secondary ? (
                        <span
                          className={`shrink-0 text-[0.62rem] ${
                            active ? 'text-paper/70' : 'text-ink-soft'
                          }`}
                        >
                          {secondary}
                        </span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            ) : null}

            {searchError ? (
              <p
                data-mshi-atlas-search-error
                className="font-mono text-[0.65rem] leading-snug text-accent"
              >
                {searchError}
              </p>
            ) : (
              <p className="hidden font-mono text-[0.6rem] leading-snug text-ink-soft sm:block">
                Powered by Photon · OSM. Non-Asia results are transfer
                predictions (flagged in the panel).
              </p>
            )}
          </div>

          {/* Overlay toggle. On a phone it tucks under the full-width search
              bar (top-16) instead of fighting it for the top-left corner, and
              the explanatory paragraphs collapse so it stays a compact chip. */}
          <div className="pointer-events-auto absolute left-3 top-16 z-20 flex flex-col gap-2 border border-rule bg-paper/95 p-2 backdrop-blur-sm sm:left-4 sm:top-4 sm:p-3">
            <p className="meta-label text-ink-soft">Overlay</p>
            <div className="flex flex-wrap gap-1">
              {OVERLAY_LAYERS.map((l) => {
                const isActive = activeOverlay === l.id;
                return (
                  <button
                    key={l.id}
                    data-mshi-overlay-button={l.id}
                    onClick={() => setActiveOverlay(l.id)}
                    className={`border px-2 py-1 font-mono text-[0.7rem] uppercase tracking-meta transition-colors ${
                      isActive
                        ? 'border-ink bg-ink text-paper'
                        : 'border-rule bg-paper text-ink-soft hover:border-ink hover:text-ink'
                    }`}
                  >
                    {l.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-1 hidden max-w-[20rem] font-mono text-[0.6rem] leading-snug text-ink-soft sm:block">
              Toggle between F+NPP (best transfer) and Full+MODIS (more
              features, worse transfer). Click any cell for real per-cell
              predictions.
            </p>
            <p className="mt-2 hidden max-w-[20rem] border-t border-rule pt-2 font-mono text-[0.6rem] leading-snug text-ink-soft sm:block">
              <span className="font-semibold text-ink">Asia</span> = training
              region (raster).{' '}
              <span className="font-semibold text-bedrock-warn">
                Coloured points
              </span>{' '}
              elsewhere are transfer cells — extrapolations, flagged in each
              panel. Regions with no MODIS data (e.g. South America) are absent.
            </p>
          </div>

          {/* Bottom strip: legend + actions. Collapsible — hiding it gives a
              clean, chrome-free globe for exploration and screenshots; a
              bottom-left pill brings it back. */}
          {barVisible ? (
            // Phone: full-width strip that wraps its sections onto multiple
            // rows. sm+: the original centered single-row bar.
            <div className="pointer-events-auto absolute bottom-3 left-3 right-3 z-20 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border border-rule bg-paper/95 px-4 py-3 backdrop-blur-sm sm:bottom-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:flex-nowrap sm:gap-6 sm:px-5">
              <div>
                <p className="meta-label flex items-center gap-1 text-ink-soft">
                  Rs anomaly · {activeOverlay} ·{' '}
                  {modelMeta
                    ? `n=${activeOverlay === 'Full+MODIS' ? modelMeta.fullmodis.n : modelMeta.fnpp.n}`
                    : '—'}
                  <button
                    data-mshi-anomaly-info
                    type="button"
                    onClick={() => setInfoOpen(true)}
                    aria-label="What does this anomaly mean?"
                    className="ml-1 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-rule text-ink-soft hover:border-ink hover:text-ink"
                  >
                    <Info className="h-2.5 w-2.5" />
                  </button>
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
              <div className="sm:border-l sm:border-rule sm:pl-6">
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
                data-mshi-screenshot
                onClick={handleScreenshot}
                title="Download a PNG of the current map view"
                className={`inline-flex items-center gap-1.5 border px-2.5 py-1.5 font-mono text-[0.65rem] uppercase tracking-meta transition-colors sm:ml-2 ${
                  screenshotSaved
                    ? 'border-bedrock-good bg-bedrock-good/10 text-bedrock-good'
                    : 'border-rule text-ink-soft hover:border-ink hover:text-ink'
                }`}
              >
                <Camera className="h-3 w-3" />
                {screenshotSaved ? 'Saved' : 'Screenshot'}
              </button>
              <button
                data-mshi-hide-bar
                type="button"
                onClick={() => setBarVisible(false)}
                aria-label="Hide legend bar"
                title="Hide this bar for a clean, distraction-free view"
                className="flex items-center text-ink-soft transition-colors hover:text-ink sm:ml-1 sm:self-stretch sm:border-l sm:border-rule sm:pl-3"
              >
                <EyeOff className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              data-mshi-show-bar
              type="button"
              onClick={() => setBarVisible(true)}
              aria-label="Show legend bar"
              title="Show the Rs-anomaly legend & controls"
              className="pointer-events-auto absolute bottom-4 left-4 z-20 inline-flex animate-fade-in items-center gap-1.5 border border-rule bg-paper/95 px-3 py-2 font-mono text-[0.65rem] uppercase tracking-meta text-ink-soft backdrop-blur-sm transition-colors hover:border-ink hover:text-ink"
            >
              <Eye className="h-3.5 w-3.5" />
              Show legend
            </button>
          )}

          <AtlasDetailPanel
            response={response}
            onClose={() => setResponse(null)}
          />

          {infoOpen ? (
            <AnomalyInfoModal onClose={() => setInfoOpen(false)} />
          ) : null}
        </>
      )}
    </div>
  );
}

function AnomalyInfoModal({ onClose }: { onClose: () => void }) {
  // Close on Escape.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      data-mshi-info-modal
      role="dialog"
      aria-modal="true"
      aria-label="About the Rs anomaly metric"
      className="absolute inset-0 z-40 flex items-center justify-center bg-ink/40 p-4 sm:p-6"
      onPointerDown={(ev) => {
        // Click on the backdrop closes; clicks inside the card stop here.
        if (ev.target === ev.currentTarget) onClose();
      }}
    >
      <div className="relative max-w-md border border-rule bg-paper shadow-xl">
        <div className="flex items-center justify-between border-b border-rule px-5 py-3">
          <p className="meta-label">About · anomaly</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-ink-soft hover:text-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3 px-5 py-4 text-[0.92rem] leading-relaxed text-ink">
          <p>
            <span className="font-serif font-bold">What this map shows:</span>{' '}
            an anomaly ratio between the model&apos;s prediction and a
            climate baseline. Values near 1.0 mean the model agrees with what
            climate alone would predict — biology isn&apos;t adding extra
            information. Values below 1.0 mean the biology signal (from
            MODIS NPP) suggests less microbial activity than climate alone
            would expect. Values above 1.0 mean the biology signal suggests
            more.
          </p>
          <p>
            <span className="font-serif font-bold">Example:</span> Mongolia
            at anomaly = 0.78 means the model predicts ~22 % less microbial
            activity than climate would predict alone, because vegetation
            productivity (NPP) is low. The Indo-Gangetic Plain at
            anomaly = 1.18 means ~18 % more activity than climate would
            predict, because intensive agriculture creates elevated
            productivity.
          </p>
        </div>
      </div>
    </div>
  );
}

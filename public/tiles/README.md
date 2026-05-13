# public/tiles/

Static tile assets hot-loaded by the atlas page.

## mshi_f_npp_anomaly.pmtiles

- **Source**: Sparkxt-0318/MSHI, branch `claude/vector-tile-pipeline-LXc5t`, path `tiles/mshi_f_npp_anomaly.pmtiles`.
- **Pulled via**: `curl https://raw.githubusercontent.com/Sparkxt-0318/MSHI/claude/vector-tile-pipeline-LXc5t/tiles/mshi_f_npp_anomaly.pmtiles`.
- **Size**: ~52.7 MiB (55,249,248 bytes).
- **Format**: PMTiles v3, PNG raster tiles, gzip internal compression.
- **Zoom**: 0–6.
- **Bounds**: lon [25.0, 180.0], lat [-10.0, 80.0] — covers the SRDB+COSORE Asian study domain.
- **Center**: lon 102.5, lat 35.0.
- **Colormap**: hero-aligned inverted Rs-anomaly — red = suppressed, blue = elevated; n = 615 training sites.
- **Loaded by**: `src/components/atlas/atlas-map.tsx` via the `pmtiles://` protocol registered against MapLibre at module load.

Do not rename or move this file without updating the atlas component.

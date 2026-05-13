#!/usr/bin/env node
// Atlas color verification (Phase 6 / Gate 6).
//
// Navigates a headless Chromium to the given atlas URL, waits for MapLibre
// to render the F+NPP raster, and counts saturated-red and saturated-blue
// pixels in the screenshot. Exits non-zero on failure.
//
// Usage:
//   node scripts/verify-atlas-colors.mjs <url> [out_png]

import { chromium } from 'playwright';
import { promises as fs } from 'node:fs';
import { PNG } from 'pngjs';

const URL = process.argv[2] ?? 'http://localhost:3000/atlas';
const OUT = process.argv[3] ?? 'test_screenshots/atlas_deploy.png';

const SETTLE_MS = 7000;

const RED_MIN_PIXELS = 500;
const BLUE_MIN_PIXELS = 500;

function isRed(r, g, b) {
  return r > 150 && g < 100 && b < 100;
}
function isBlue(r, g, b) {
  return b > 150 && r < 100 && g < 150;
}

function analyze(png) {
  const { width, height, data } = png;
  let red = 0,
    blue = 0;
  let redCx = 0,
    redCy = 0,
    blueCx = 0,
    blueCy = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = data[i],
        g = data[i + 1],
        b = data[i + 2],
        a = data[i + 3];
      if (a < 16) continue;
      if (isRed(r, g, b)) {
        red++;
        redCx += x;
        redCy += y;
      } else if (isBlue(r, g, b)) {
        blue++;
        blueCx += x;
        blueCy += y;
      }
    }
  }
  return {
    width,
    height,
    red,
    blue,
    redCentroid: red > 0 ? [redCx / red, redCy / red] : null,
    blueCentroid: blue > 0 ? [blueCx / blue, blueCy / blue] : null,
  };
}

(async () => {
  const browser = await chromium.launch({
    args: [
      '--no-sandbox',
      '--ignore-gpu-blocklist',
      '--enable-gpu-rasterization',
      '--enable-webgl',
      '--use-gl=angle',
      '--use-angle=swiftshader',
    ],
  });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();

  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (e) => pageErrors.push(String(e)));

  const tileRequests = [];
  page.on('response', (resp) => {
    const u = resp.url();
    if (u.includes('.pmtiles')) {
      tileRequests.push({ url: u, status: resp.status() });
    }
  });

  let httpStatus = null;
  try {
    const resp = await page.goto(URL, {
      waitUntil: 'networkidle',
      timeout: 60_000,
    });
    httpStatus = resp ? resp.status() : null;
  } catch (e) {
    console.error('Navigation failed:', e.message);
  }

  let canvasFound = false;
  try {
    await page.waitForSelector('canvas.maplibregl-canvas, canvas', {
      timeout: 30_000,
    });
    canvasFound = true;
  } catch {}

  const webglInfo = await page.evaluate(() => {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    if (!gl) return { ok: false };
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    return {
      ok: true,
      version: gl.getParameter(gl.VERSION),
      renderer: dbg
        ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)
        : gl.getParameter(gl.RENDERER),
      shading: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
    };
  });
  console.error('[webgl]', JSON.stringify(webglInfo));

  const mapCanvasSize = await page.evaluate(() => {
    const c = document.querySelector('canvas.maplibregl-canvas');
    const cont = c && c.parentElement && c.parentElement.parentElement;
    const wrap = cont && cont.parentElement;
    const main = document.querySelector('main');
    return {
      vh: window.innerHeight,
      vw: window.innerWidth,
      mainRect: main?.getBoundingClientRect(),
      wrapRect: wrap?.getBoundingClientRect(),
      contRect: cont?.getBoundingClientRect(),
      canvas: c ? { w: c.width, h: c.height, clientW: c.clientWidth, clientH: c.clientHeight } : null,
    };
  });
  console.error('[layout]', JSON.stringify(mapCanvasSize));

  // Give MapLibre and the PMTiles fetches a few seconds to settle.
  await page.waitForTimeout(SETTLE_MS);

  await fs.mkdir('test_screenshots', { recursive: true });
  await page.screenshot({ path: OUT, fullPage: false });

  const pngBuf = await fs.readFile(OUT);
  const png = PNG.sync.read(pngBuf);
  const result = analyze(png);

  const dx = result.redCentroid && result.blueCentroid
    ? Math.hypot(
        result.redCentroid[0] - result.blueCentroid[0],
        result.redCentroid[1] - result.blueCentroid[1],
      )
    : 0;

  const report = {
    url: URL,
    httpStatus,
    canvasFound,
    screenshot: OUT,
    consoleErrors,
    pageErrors,
    pmtilesRequests: tileRequests,
    pixels: {
      width: result.width,
      height: result.height,
      red: result.red,
      blue: result.blue,
      redCentroid: result.redCentroid,
      blueCentroid: result.blueCentroid,
      centroidDistancePx: Math.round(dx),
    },
  };
  console.log(JSON.stringify(report, null, 2));

  await browser.close();

  const pass =
    httpStatus === 200 &&
    canvasFound &&
    result.red >= RED_MIN_PIXELS &&
    result.blue >= BLUE_MIN_PIXELS &&
    dx > 30 &&
    tileRequests.some((r) => r.status === 200 || r.status === 206);

  if (!pass) {
    console.error('\n=== GATE 6 FAILED ===');
    if (httpStatus !== 200) console.error(`- HTTP status: ${httpStatus}`);
    if (!canvasFound) console.error('- No canvas element found');
    if (result.red < RED_MIN_PIXELS)
      console.error(
        `- Red pixels: ${result.red} < ${RED_MIN_PIXELS}`,
      );
    if (result.blue < BLUE_MIN_PIXELS)
      console.error(
        `- Blue pixels: ${result.blue} < ${BLUE_MIN_PIXELS}`,
      );
    if (dx <= 30)
      console.error(
        `- Red/blue centroids too close (${Math.round(dx)} px) — may be single color`,
      );
    if (!tileRequests.some((r) => r.status === 200 || r.status === 206))
      console.error(
        `- No PMTiles request returned 200/206 (saw ${tileRequests.length} requests)`,
      );
    if (consoleErrors.length)
      console.error('- Console errors:\n  ' + consoleErrors.join('\n  '));
    process.exit(1);
  }

  console.error('\n=== GATE 6 PASSED ===');
})().catch((e) => {
  console.error('Verifier crashed:', e);
  process.exit(2);
});

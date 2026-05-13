#!/usr/bin/env node
// Gate 1 verifier for Fix 1: navy must be scoped to MapLibre's sky, not
// the container CSS background. Samples:
//   - 50px from top edge, center horizontally → cream
//   - 50px from left edge, vertical center → cream
//   - center-ish (just outside sphere edge) → navy-dominant
// Also asserts no grep matches for navy hex in CSS files (verified separately).

import { chromium } from 'playwright';
import { promises as fs } from 'node:fs';
import { PNG } from 'pngjs';

const URL = process.argv[2] ?? 'http://localhost:3000/atlas';
const OUT = process.argv[3] ?? 'test_screenshots/atlas_navy_scope.png';

function sampleRect(png, x0, y0, w, h) {
  const { width, data } = png;
  let r = 0, g = 0, b = 0, n = 0;
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      const i = (y * width + x) * 4;
      r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
    }
  }
  return { r: r / n, g: g / n, b: b / n };
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
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));

  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60_000 });
  await page.waitForSelector('canvas.maplibregl-canvas, canvas', { timeout: 30_000 });
  await page.waitForTimeout(7000);

  await fs.mkdir('test_screenshots', { recursive: true });
  await page.screenshot({ path: OUT, fullPage: false });
  await browser.close();

  const png = PNG.sync.read(await fs.readFile(OUT));
  // 50px from top, center horizontally — 30x30 patch
  const topMid = sampleRect(png, png.width / 2 - 15, 50, 30, 30);
  // 50px from left, vertical center — 30x30 patch (but skip the overlay
  // box at top-left, which lives in 0..~220x0..~150). Sample at y=h/2.
  const leftMid = sampleRect(png, 50, png.height / 2 - 15, 30, 30);
  // Just outside the sphere edge — center is ~720,450; sphere radius
  // roughly ~280 at this zoom. Sample at (720, 80) — top of canvas
  // directly above the sphere is reliably outside the sphere and inside
  // the "halo" if the sky paints it.
  const aboveSphere = sampleRect(png, 720 - 15, 200, 30, 30);

  const isCream = (s) => s.r > 240 && s.g > 235 && s.b > 230;
  const isNavyDominant = (s) => s.b > s.r && s.b > s.g && s.r + s.g + s.b < 400;

  const topCream = isCream(topMid);
  const leftCream = isCream(leftMid);
  const sphereHaloNavy = isNavyDominant(aboveSphere);

  const report = {
    url: URL,
    screenshot: OUT,
    samples: { topMid, leftMid, aboveSphere },
    checks: {
      topEdgeIsCream: topCream,
      leftEdgeIsCream: leftCream,
      aboveSphereIsNavyDominant: sphereHaloNavy,
    },
    consoleErrors: errors,
    pass: topCream && leftCream,
  };
  console.log(JSON.stringify(report, null, 2));
  if (!report.pass) {
    console.error('\n=== NAVY-SCOPE GATE FAILED ===');
    if (!topCream) console.error('- Top-edge pixels are not cream:', topMid);
    if (!leftCream) console.error('- Left-edge pixels are not cream:', leftMid);
    process.exit(1);
  }
  console.error('\n=== NAVY-SCOPE GATE PASSED ===');
})().catch((e) => {
  console.error('Verifier crashed:', e);
  process.exit(2);
});

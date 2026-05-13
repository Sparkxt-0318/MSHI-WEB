#!/usr/bin/env node
// Polish-specific verification (Fix 1 + Fix 2).
//
// 1. Sample background pixels in the top-left and bottom-right corners
//    (away from the globe at center) and assert the mean B > R (proves
//    we're seeing the navy gradient, not solid black).
// 2. Count saturated-white pixels (R>240, G>240, B>240, A>200) and verify
//    at least 6 distinct white "blobs" exist — proxy for the 8 city pins.
// 3. Simulate clicking on a pin element and assert the detail panel opens.

import { chromium } from 'playwright';
import { promises as fs } from 'node:fs';
import { PNG } from 'pngjs';

const URL = process.argv[2] ?? 'http://localhost:3000/atlas';
const OUT = process.argv[3] ?? 'test_screenshots/atlas_polish.png';

function sampleRect(png, x0, y0, w, h) {
  const { width, data } = png;
  let r = 0, g = 0, b = 0, n = 0;
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      const i = (y * width + x) * 4;
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      n++;
    }
  }
  return { r: r / n, g: g / n, b: b / n, n };
}

function findWhiteBlobs(png) {
  // Flood-fill connected components of "very white" pixels (R,G,B > 235).
  const { width, height, data } = png;
  const seen = new Uint8Array(width * height);
  const isWhite = (idx) => {
    const i = idx * 4;
    return (
      data[i] > 235 && data[i + 1] > 235 && data[i + 2] > 235 && data[i + 3] > 200
    );
  };
  const blobs = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (seen[idx] || !isWhite(idx)) continue;
      let cx = 0, cy = 0, size = 0;
      const stack = [idx];
      while (stack.length) {
        const k = stack.pop();
        if (seen[k]) continue;
        seen[k] = 1;
        if (!isWhite(k)) continue;
        const kx = k % width, ky = (k / width) | 0;
        cx += kx; cy += ky; size++;
        if (kx > 0) stack.push(k - 1);
        if (kx < width - 1) stack.push(k + 1);
        if (ky > 0) stack.push(k - width);
        if (ky < height - 1) stack.push(k + width);
      }
      if (size >= 6 && size <= 400) {
        blobs.push({ x: cx / size, y: cy / size, size });
      }
    }
  }
  return blobs;
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
  page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));
  page.on('pageerror', (e) => errors.push(String(e)));

  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60_000 });
  await page.waitForSelector('canvas.maplibregl-canvas, canvas', { timeout: 30_000 });
  await page.waitForTimeout(7000);

  await fs.mkdir('test_screenshots', { recursive: true });
  await page.screenshot({ path: OUT, fullPage: false });

  // Count city-pin DOM markers regardless of whether they show as white blobs.
  const pinDomCount = await page.evaluate(() => {
    return document.querySelectorAll('[data-mshi-city-pin]').length;
  });

  // Click one of the pin DOM elements and verify the detail panel mounts.
  let pinClickWorks = false;
  let panelText = null;
  try {
    const handle = await page.$('[data-mshi-city-pin]');
    if (handle) {
      await handle.click({ force: true });
      await page.waitForSelector('aside[role="dialog"]', { timeout: 5000 });
      pinClickWorks = true;
      panelText = await page.locator('aside[role="dialog"]').first().innerText();
    }
  } catch {
    pinClickWorks = false;
  }

  await browser.close();

  const pngBuf = await fs.readFile(OUT);
  const png = PNG.sync.read(pngBuf);

  // Corner samples: 100x100 patches near top-right and bottom-left, well
  // outside both the UI panels and the globe at center.
  const cornerTR = sampleRect(png, png.width - 110, 100, 100, 100);
  const cornerBL = sampleRect(png, 10, png.height - 250, 100, 100);

  const blobs = findWhiteBlobs(png);

  const bgNonBlack =
    cornerTR.b > cornerTR.r &&
    cornerBL.b > cornerBL.r &&
    cornerTR.r + cornerTR.g + cornerTR.b > 6 &&
    cornerBL.r + cornerBL.g + cornerBL.b > 6;
  const pinsVisible = blobs.length >= 6;

  const report = {
    url: URL,
    screenshot: OUT,
    consoleErrors: errors,
    background: {
      topRight: cornerTR,
      bottomLeft: cornerBL,
      nonBlackAndBlueDominant: bgNonBlack,
    },
    pins: {
      domMarkerCount: pinDomCount,
      whiteBlobsDetected: blobs.length,
      blobs: blobs.slice(0, 15),
      pinClickOpensPanel: pinClickWorks,
      panelTextSnippet: panelText ? panelText.slice(0, 200) : null,
    },
    pass: bgNonBlack && pinsVisible && pinClickWorks,
  };
  console.log(JSON.stringify(report, null, 2));
  if (!report.pass) {
    console.error('\n=== POLISH GATE FAILED ===');
    if (!bgNonBlack) console.error('- Background still reads as black/equal-channel');
    if (!pinsVisible) console.error(`- Only ${blobs.length} white blobs detected (< 6)`);
    if (!pinClickWorks) console.error('- Clicking a pin did not open the detail panel');
    process.exit(1);
  }
  console.error('\n=== POLISH GATE PASSED ===');
})().catch((e) => {
  console.error('Verifier crashed:', e);
  process.exit(2);
});

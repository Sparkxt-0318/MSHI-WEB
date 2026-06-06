#!/usr/bin/env node
// Cinematic three-scale zoom verification.
//
// Drives headless Chromium (software WebGL) through the homepage #framework-zoom
// track: asserts the cm 3D cell mounts and renders glowing electrons, the km
// atlas image loads with a working /atlas CTA at the end, and that a
// reduced-motion context falls back to the static three-tier layout (no canvas,
// all three titles present). Screenshots cm / m / km / reduced.
//
// Usage: node scripts/verify-scale-zoom.mjs [baseUrl]

import { chromium } from 'playwright';
import { promises as fs } from 'node:fs';
import { PNG } from 'pngjs';

const BASE = process.argv[2] ?? 'http://localhost:3210';
const OUT = 'test_screenshots';

let failed = false;
const fail = (m) => {
  console.error(`FAIL: ${m}`);
  failed = true;
};
const ok = (m) => console.log(`OK: ${m}`);

function analyze(buf) {
  const png = PNG.sync.read(buf);
  const { data, width, height } = png;
  let lit = 0;
  let cyan = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r + g + b > 180) lit++;
    if (b > 150 && g > 120 && r < 150) cyan++;
  }
  return { litFrac: lit / (width * height), cyan };
}

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
await fs.mkdir(OUT, { recursive: true });

// ---------- motion run ----------
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
page.on('pageerror', (e) => fail(`pageerror: ${e.message}`));
await page.goto(`${BASE}/`, { waitUntil: 'load' });
await page.waitForTimeout(1000);

const track = await page.evaluate(() => {
  const el = document.getElementById('framework-zoom');
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top + window.scrollY, h: el.offsetHeight, vh: window.innerHeight };
});
if (track) ok('scale-zoom track (#framework-zoom) present');
else {
  fail('#framework-zoom not found');
  await browser.close();
  process.exit(1);
}
const scrollTo = (f) => page.evaluate((y) => window.scrollTo(0, y), track.top + f * (track.h - track.vh));

// cm phase
await scrollTo(0);
await page.waitForTimeout(3000);
if ((await page.locator('#framework-zoom canvas').count()) >= 1) ok('cm 3D canvas mounted lazily in the zoom');
else fail('no canvas in #framework-zoom at the cm phase');
await page.locator('#framework-zoom').screenshot({ path: `${OUT}/scale_zoom_cm.png` });
const cm = analyze(await fs.readFile(`${OUT}/scale_zoom_cm.png`));
if (cm.cyan > 20) ok(`cm cell renders glowing electrons (${cm.cyan} cyan px)`);
else fail(`cm shows no cyan electrons (${cm.cyan})`);

// m phase
await scrollTo(0.5);
await page.waitForTimeout(1400);
await page.locator('#framework-zoom').screenshot({ path: `${OUT}/scale_zoom_m.png` });
ok('captured m (chamber) phase');

// km phase
await scrollTo(1);
await page.waitForTimeout(2000);
const img = await page.evaluate(() => {
  const i = document.querySelector('#framework-zoom img');
  return i ? { w: i.naturalWidth, complete: i.complete } : null;
});
if (img && img.complete && img.w > 0) ok(`km atlas image loaded (${img.w}px)`);
else fail(`km atlas image not loaded: ${JSON.stringify(img)}`);
const cta = page.getByRole('link', { name: /continental scale/i });
if ((await cta.count()) >= 1 && (await cta.first().isVisible()) && (await cta.first().getAttribute('href')) === '/atlas')
  ok('km CTA → /atlas is visible');
else fail('km CTA to /atlas missing or hidden');
await page.locator('#framework-zoom').screenshot({ path: `${OUT}/scale_zoom_km.png` });
await page.close();

// ---------- reduced-motion run ----------
const rmCtx = await browser.newContext({ viewport: { width: 1400, height: 900 }, reducedMotion: 'reduce' });
const rp = await rmCtx.newPage();
await rp.goto(`${BASE}/`, { waitUntil: 'load' });
await rp.waitForTimeout(900);
await rp.evaluate(() => document.getElementById('framework')?.scrollIntoView());
await rp.waitForTimeout(900);
if ((await rp.locator('#framework canvas').count()) === 0) ok('reduced-motion: no canvas (static three-tier fallback)');
else fail('reduced-motion: a canvas is present (should be static)');
const fwText = (await rp.locator('#framework').innerText()).toLowerCase();
const titles = ['electrochemical biosensor', 'chamber + eddy covariance', 'satellite + ml upscaling'];
if (titles.every((t) => fwText.includes(t))) ok('reduced-motion: all three tier titles present');
else fail('reduced-motion: missing one or more tier titles');
await rp.locator('#framework').screenshot({ path: `${OUT}/scale_zoom_reduced.png` });
await rmCtx.close();

await browser.close();
console.log(failed ? '\n=== SCALE-ZOOM VERIFY: FAIL ===' : '\n=== SCALE-ZOOM VERIFY: PASS ===');
process.exit(failed ? 1 : 0);

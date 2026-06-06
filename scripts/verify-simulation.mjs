#!/usr/bin/env node
// Simulation page verification.
//
// Drives headless Chromium (software WebGL via SwiftShader) against
// /simulation: asserts the interactive 3D canvas renders real pixels, the
// MSHI scoreboard shows the three soils, scrubbing to the end reveals the
// cm→m→km scale-bridge CTAs, and the homepage teaser is a static poster that
// links through (no WebGL on the homepage). Screenshots for the record.
//
// Usage: node scripts/verify-simulation.mjs [baseUrl]

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

// Count the fraction of "lit" pixels (brighter than the dark navy scope) and
// whether any are clearly cyan (electrons) or green (healthy biofilm).
function analyze(buf) {
  const png = PNG.sync.read(buf);
  const { data, width, height } = png;
  let lit = 0;
  let cyan = 0;
  let green = 0;
  const total = width * height;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r + g + b > 180) lit++;
    if (b > 150 && g > 120 && r < 150) cyan++;
    if (g > 120 && r < 120 && b < 120) green++;
  }
  return { litFrac: lit / total, cyan, green };
}

const browser = await chromium.launch({
  args: [
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
  ],
});
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
page.on('pageerror', (e) => fail(`pageerror: ${e.message}`));
page.on('console', (m) => {
  if (m.type() === 'error') console.log(`  [console.error] ${m.text()}`);
});

await fs.mkdir(OUT, { recursive: true });

// ---- /simulation ----
await page.goto(`${BASE}/simulation`, { waitUntil: 'load' });
await page.waitForTimeout(2500); // let it autoplay a little

const canvas = page.locator('canvas').first();
await canvas.waitFor({ state: 'visible', timeout: 15000 });
const box = await canvas.boundingBox();
if (box && box.width > 200 && box.height > 200)
  ok(`3D canvas renders ${Math.round(box.width)}×${Math.round(box.height)}`);
else fail(`canvas missing/too small: ${JSON.stringify(box)}`);

await canvas.screenshot({ path: `${OUT}/simulation_canvas_mid.png` });
const mid = analyze(await fs.readFile(`${OUT}/simulation_canvas_mid.png`));
if (mid.litFrac > 0.01) ok(`canvas not blank (lit fraction ${(mid.litFrac * 100).toFixed(2)}%)`);
else fail(`canvas appears blank (lit fraction ${(mid.litFrac * 100).toFixed(3)}%)`);
if (mid.cyan > 20) ok(`electron glow present (${mid.cyan} cyan px)`);
else fail(`no cyan electron pixels detected (${mid.cyan})`);
if (mid.green > 20) ok(`healthy biofilm present (${mid.green} green px)`);
else fail(`no green biofilm pixels detected (${mid.green})`);

// Scoreboard names the three soils.
const bodyText = (await page.locator('body').innerText()).toLowerCase();
for (const term of ['microbial soil health index', 'healthy', 'saline', 'unhealthy']) {
  if (bodyText.includes(term)) ok(`scoreboard text "${term}" present`);
  else fail(`missing "${term}" on /simulation`);
}

// Controls exist.
if ((await page.locator('input[type="range"]').count()) === 1) ok('scrubber present');
else fail('scrubber input missing');
for (const s of ['1×', '4×', '16×']) {
  if ((await page.getByRole('button', { name: s }).count()) >= 1) ok(`speed ${s} button present`);
  else fail(`speed ${s} button missing`);
}

// Scrub to the end → scale-bridge CTAs appear.
await page.locator('input[type="range"]').fill('1');
await page.waitForTimeout(900);
const atlasCta = page.getByRole('link', { name: /continental scale/i });
const bioCta = page.getByRole('link', { name: /inspect the electrochemistry/i });
if ((await atlasCta.count()) >= 1 && (await atlasCta.first().getAttribute('href')) === '/atlas')
  ok('scale-bridge CTA links to /atlas');
else fail('scale-bridge /atlas CTA missing');
if ((await bioCta.count()) >= 1 && (await bioCta.first().getAttribute('href')) === '/biosensor')
  ok('scale-bridge CTA links to /biosensor');
else fail('scale-bridge /biosensor CTA missing');
await page.screenshot({ path: `${OUT}/simulation_end.png`, fullPage: false });

// Reset + play via the controls.
await page.getByRole('button', { name: 'Restart' }).click();
await page.getByRole('button', { name: 'Play' }).click();
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT}/simulation_playing.png`, fullPage: false });
ok('restart + play controls operable');

// ---- nav ----
if ((await page.getByRole('link', { name: 'Simulation' }).count()) >= 1)
  ok('nav shows Simulation');
else fail('nav missing Simulation entry');

// ---- homepage teaser ----
await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
const section = page.locator('#simulation');
await section.scrollIntoViewIfNeeded();
await page.waitForTimeout(800);
const homeCanvas = await page.locator('canvas').count();
if (homeCanvas === 0) ok('homepage has no WebGL canvas (teaser is a static poster)');
else fail(`homepage unexpectedly has ${homeCanvas} canvas element(s)`);
const teaserLink = await section.locator('a[href="/simulation"]').count();
if (teaserLink >= 1) ok('teaser links to /simulation');
else fail('teaser /simulation link missing');
const poster = await section.locator('svg[role="img"]').count();
if (poster >= 1) ok('teaser renders the static poster');
else fail('teaser poster missing');
await section.screenshot({ path: `${OUT}/simulation_home_teaser.png` });

await browser.close();
console.log(failed ? '\n=== SIMULATION VERIFY: FAIL ===' : '\n=== SIMULATION VERIFY: PASS ===');
process.exit(failed ? 1 : 0);

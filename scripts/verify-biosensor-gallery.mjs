#!/usr/bin/env node
// Biosensor gallery verification (Phase 2 / Gate 2).
//
// Drives headless Chromium against /biosensor: asserts the card count
// matches the dataset, opens a Phase II card (expect 3 charts) and a
// Phase I card (expect 2 charts, no empty slot), and confirms each chart
// renders a real, varied Recharts line path. Screenshots for the record.
//
// Usage: node scripts/verify-biosensor-gallery.mjs [baseUrl]

import { chromium } from 'playwright';
import { promises as fs } from 'node:fs';

const BASE = process.argv[2] ?? 'http://localhost:3210';
const OUT = 'test_screenshots';

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  process.exitCode = 1;
}
function ok(msg) {
  console.log(`OK: ${msg}`);
}

// A Recharts line path is "varied" if it has many points and the y
// coordinates are not all (near) identical. SVG path data (M/L/C/S/Q)
// is a flat sequence of x,y coordinate pairs regardless of command, so
// every odd-indexed number is a y. (Recharts type="monotone" emits C.)
function pathIsVaried(d) {
  if (!d) return false;
  const nums = (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
  if (nums.length < 40) return false;
  const ys = nums.filter((_, i) => i % 2 === 1);
  if (ys.length < 20) return false;
  return Math.max(...ys) - Math.min(...ys) > 2; // px of vertical spread
}

const dataset = JSON.parse(
  await fs.readFile('public/data/biosensor_samples.json', 'utf8'),
);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });

await page.goto(`${BASE}/biosensor`, { waitUntil: 'networkidle' });
await fs.mkdir(OUT, { recursive: true });
await page.screenshot({ path: `${OUT}/biosensor_gallery.png`, fullPage: true });

// 1. Card count matches dataset.
const cards = await page.locator('button[aria-label^="Open detail for"]').count();
if (cards === dataset.sample_count && cards === dataset.samples.length) {
  ok(`card count ${cards} matches dataset.sample_count`);
} else {
  fail(`card count ${cards} != dataset ${dataset.sample_count}`);
}

// 2. No "placeholder" text anywhere in the rendered page.
const bodyText = (await page.locator('body').innerText()).toLowerCase();
if (!bodyText.includes('placeholder')) ok('no "placeholder" in page text');
else fail('"placeholder" appears in rendered page');

// 3. Required DPV sentence + paper link.
if (
  bodyText.includes('differential pulse voltammetry was also used') &&
  bodyText.includes('omcz cytochrome redox peak')
) {
  ok('DPV explanation sentence present');
} else {
  fail('DPV explanation sentence missing');
}
const dpvParaPaperLink = await page
  .locator('p', { hasText: 'Differential pulse voltammetry was also used' })
  .locator('a[href="/paper"]')
  .count();
if (dpvParaPaperLink >= 1) ok('DPV sentence links the word "paper" to /paper');
else fail('DPV sentence does not link to /paper');

// Helper: open a card by sample name, count chart panels, validate paths.
async function inspectCard(sample) {
  const expected = sample.techniques.length;
  await page.locator(`button[aria-label="Open detail for ${sample.name}"]`).click();
  const dialog = page.locator('[role="dialog"]');
  await dialog.waitFor({ state: 'visible' });
  // Recharts needs a tick to lay out the responsive container.
  await page.waitForTimeout(700);

  // Real technique charts + one appended digitized DPV reference square.
  const expectedTotal = expected + 1;
  const curves = dialog.locator('path.recharts-line-curve');
  const nCurves = await curves.count();
  if (nCurves === expectedTotal) {
    ok(`${sample.id}: ${nCurves} uniform squares ([${sample.techniques.join(',')}] + DPV ref)`);
  } else {
    fail(`${sample.id}: ${nCurves} charts, expected ${expectedTotal} (${expected} techniques + DPV)`);
  }

  // Technique code labels present (CA/CV/OCP) AND the DPV reference square.
  const dialogText = (await dialog.innerText()).toUpperCase();
  for (const t of sample.techniques) {
    if (dialogText.includes(t.toUpperCase())) ok(`${sample.id}: ${t.toUpperCase()} label shown`);
    else fail(`${sample.id}: ${t.toUpperCase()} label missing`);
  }
  if (dialogText.includes('DPV')) ok(`${sample.id}: DPV reference square present`);
  else fail(`${sample.id}: DPV reference square missing`);
  // The DPV square must be tagged a reference, not implied a measurement.
  if ((await dialog.innerText()).includes('shared digitized published reference'))
    ok(`${sample.id}: DPV labelled as shared digitized reference`);
  else fail(`${sample.id}: DPV not clearly marked as reference`);

  // Every curve is real & varied.
  for (let i = 0; i < nCurves; i++) {
    const d = await curves.nth(i).getAttribute('d');
    if (pathIsVaried(d)) ok(`${sample.id}: chart ${i + 1} renders varied real data`);
    else fail(`${sample.id}: chart ${i + 1} path not varied (d="${(d ?? '').slice(0, 60)}…")`);
  }

  await page.screenshot({ path: `${OUT}/biosensor_${sample.id}.png` });
  await page.keyboard.press('Escape');
  await dialog.waitFor({ state: 'hidden' });
}

const phase2 = dataset.samples.find((s) => s.techniques.length === 3);
const phase1 = dataset.samples.find((s) => s.techniques.length === 2);
if (!phase2 || !phase1) fail('dataset lacks a Phase II (3) or Phase I (2) sample to test');
if (phase2) await inspectCard(phase2);
if (phase1) await inspectCard(phase1);

// 4. Home page biosensor section renders a real featured trace.
await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
await page.locator('#biosensor').scrollIntoViewIfNeeded();
await page.waitForTimeout(1200);
const homeCurves = await page.locator('#biosensor path.recharts-line-curve').count();
if (homeCurves >= 2) ok(`home section renders ${homeCurves} real trace charts`);
else fail(`home section has ${homeCurves} charts, expected >= 2`);
const homeText = (await page.locator('#biosensor').innerText()).toLowerCase();
if (!homeText.includes('placeholder') && !homeText.includes('mock'))
  ok('home section free of placeholder/mock');
else fail('home section still has placeholder/mock language');
await page.locator('#biosensor').screenshot({ path: `${OUT}/biosensor_home_section.png` });

// 5. DPV reference figure: digitized, sourced, OmcZ marker, NOT a sample.
await page.goto(`${BASE}/biosensor`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(900);
const dpvPanel = page
  .locator('div')
  .filter({ hasText: /^DPVDifferential Pulse Voltammetry/ })
  .first();
const dpvCurves = await dpvPanel.locator('path.recharts-line-curve').count();
if (dpvCurves === 1) ok('DPV reference figure renders one digitized curve');
else fail(`DPV reference has ${dpvCurves} curves, expected 1`);
const pageText = await page.locator('body').innerText();
if (/Hand-digitized from the author/.test(pageText))
  ok('DPV figure carries digitized-from-source provenance');
else fail('DPV provenance caption missing');
if (await page.locator('text=/OmcZ ~ /').count())
  ok('DPV figure marks the OmcZ peak');
else fail('DPV OmcZ marker missing');

// 6. Grey box gone: the old empty-cell used .bg-rule; must be absent.
const greyBoxes = await page.locator('.bg-rule').count();
if (greyBoxes === 0) ok('no .bg-rule grey box anywhere on /biosensor');
else fail(`${greyBoxes} .bg-rule element(s) still present (grey box)`);

// 7. CA initial transient trimmed in the dataset (spiky Phase II sample).
const p2 = dataset.samples.find((s) => s.id === 'healthy_p2_trial7');
if (p2 && p2.traces.ca.trimmed_head > 0 && p2.traces.ca.x[0] > 1)
  ok(`CA transient trimmed (healthy_p2_trial7: dropped ${p2.traces.ca.trimmed_head} head pts, starts t=${p2.traces.ca.x[0]}s)`);
else fail('CA initial transient not trimmed for healthy_p2_trial7');

await browser.close();
console.log(process.exitCode ? '\n=== GATE 2 VERIFY: FAIL ===' : '\n=== GATE 2 VERIFY: PASS ===');

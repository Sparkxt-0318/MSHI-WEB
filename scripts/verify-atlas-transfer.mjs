#!/usr/bin/env node
// Phase-4 gate verifier for the global transfer extension.
//
// 1. Beijing pin (Asia)   -> prediction, NO transfer banner (training cell)
// 2. Search "Denver"      -> prediction WITH transfer banner + caveat (US transfer)
// 3. Search "Brisbane"    -> prediction WITH transfer banner (AU transfer)
// 4. Search "Tokyo"       -> prediction, NO transfer banner (training)
// 5. Search "Sao Paulo"   -> no prediction (no MODIS, honestly absent)
// Saves screenshots of a training panel and a transfer panel.

import { chromium } from 'playwright';

const URL = process.argv[2] ?? 'http://localhost:3000/atlas';
const CAVEAT = /trained on Asian data and transfers across continents only weakly/i;
const BADGE = /Transfer prediction · Asia-trained model/i;

async function closePanel(page) {
  const b = await page.$('aside[role="dialog"] button[aria-label="Close detail panel"]');
  if (b) { await b.click(); await page.waitForTimeout(250); }
}
async function search(page, q) {
  await closePanel(page);
  const input = await page.$('[data-mshi-atlas-search] input');
  await input.click({ clickCount: 3 });
  await input.fill('');
  await input.type(q, { delay: 20 });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(3500);
}
async function clickPin(page, name) {
  await closePanel(page);
  const sel = `[data-mshi-city-pin="${name}"]`;
  await page.waitForSelector(sel, { timeout: 10_000 });
  await page.$eval(sel, (el) => el.click());
  await page.waitForTimeout(800);
}
async function panelText(page) {
  await page.waitForSelector('aside[role="dialog"]', { timeout: 12_000 });
  return page.locator('aside[role="dialog"]').first().innerText();
}

(async () => {
  const browser = await chromium.launch({
    args: ['--no-sandbox', '--ignore-gpu-blocklist', '--enable-webgl',
      '--use-gl=angle', '--use-angle=swiftshader', '--ignore-certificate-errors'],
  });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true });
  const page = await ctx.newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));

  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60_000 });
  await page.waitForSelector('canvas', { timeout: 30_000 });
  await page.waitForSelector('[data-mshi-atlas-search] input', { timeout: 10_000 });
  await page.waitForTimeout(3000);

  const r = { cases: {}, pageErrors };

  // 1. Beijing (training)
  try {
    await clickPin(page, 'Beijing');
    const t = await panelText(page);
    r.cases.beijing = { hasPrediction: /ratio =/i.test(t), hasBadge: BADGE.test(t), hasTransferTag: /\bTransfer\b/.test(t) };
    await page.screenshot({ path: 'test_screenshots/transfer-verify-training-beijing.png' });
  } catch (e) { r.cases.beijing = { error: String(e) }; }

  // 2. Denver (US transfer)
  try {
    await search(page, 'Denver');
    const t = await panelText(page);
    r.cases.denver = { hasPrediction: /ratio =/i.test(t), hasBadge: BADGE.test(t), hasCaveat: CAVEAT.test(t) };
    await page.screenshot({ path: 'test_screenshots/transfer-verify-transfer-denver.png' });
  } catch (e) { r.cases.denver = { error: String(e) }; }

  // 3. Brisbane (AU transfer)
  try {
    await search(page, 'Brisbane Australia');
    const t = await panelText(page);
    r.cases.brisbane = { hasPrediction: /ratio =/i.test(t), hasBadge: BADGE.test(t), hasCaveat: CAVEAT.test(t) };
  } catch (e) { r.cases.brisbane = { error: String(e) }; }

  // 4. Tokyo (training)
  try {
    await search(page, 'Tokyo');
    const t = await panelText(page);
    r.cases.tokyo = { hasPrediction: /ratio =/i.test(t), hasBadge: BADGE.test(t) };
  } catch (e) { r.cases.tokyo = { error: String(e) }; }

  // 5. Sao Paulo (no MODIS -> no prediction)
  try {
    await search(page, 'Sao Paulo Brazil');
    const t = await panelText(page);
    r.cases.saopaulo = { hasNoPrediction: /no prediction available/i.test(t), hasBadge: BADGE.test(t) };
  } catch (e) { r.cases.saopaulo = { error: String(e) }; }

  await browser.close();

  const pass =
    r.cases.beijing?.hasPrediction && !r.cases.beijing?.hasBadge &&
    r.cases.denver?.hasPrediction && r.cases.denver?.hasBadge && r.cases.denver?.hasCaveat &&
    r.cases.brisbane?.hasPrediction && r.cases.brisbane?.hasBadge &&
    r.cases.tokyo?.hasPrediction && !r.cases.tokyo?.hasBadge &&
    r.cases.saopaulo?.hasNoPrediction && !r.cases.saopaulo?.hasBadge &&
    pageErrors.length === 0;
  r.pass = !!pass;
  console.log(JSON.stringify(r, null, 2));
  if (!pass) { console.error('=== TRANSFER GATE FAILED ==='); process.exit(1); }
  console.error('=== TRANSFER GATE PASSED ===');
})().catch((e) => { console.error('crashed:', e); process.exit(2); });

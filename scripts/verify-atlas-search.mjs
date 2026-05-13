#!/usr/bin/env node
// Gate 2 verifier: Photon-powered atlas search.
// 1. Type "Seoul" → submit → wait → assert panel contains "Seoul" and has
//    real prediction data (SHAP / Rs anomaly).
// 2. Type "Paris" → submit → wait → assert panel shows the "Outside model
//    training domain" warning.
// 3. Type "asdfghjkl" → submit → assert search error appears and the
//    page does not crash.

import { chromium } from 'playwright';

const URL = process.argv[2] ?? 'http://localhost:3000/atlas';

async function clearAndSearch(page, query) {
  // Close any open detail panel
  const closeBtn = await page.$('aside[role="dialog"] button[aria-label="Close detail panel"]');
  if (closeBtn) {
    await closeBtn.click();
    await page.waitForTimeout(300);
  }
  const input = await page.$('[data-mshi-atlas-search] input');
  if (!input) throw new Error('search input not found');
  await input.click({ clickCount: 3 });
  await input.fill('');
  await input.type(query, { delay: 20 });
  await page.keyboard.press('Enter');
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
      '--ignore-certificate-errors',
    ],
  });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    ignoreHTTPSErrors: true,
  });
  const page = await ctx.newPage();

  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
  page.on('pageerror', (e) => pageErrors.push(String(e)));

  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60_000 });
  await page.waitForSelector('canvas.maplibregl-canvas, canvas', { timeout: 30_000 });
  await page.waitForSelector('[data-mshi-atlas-search] input', { timeout: 10_000 });
  await page.waitForTimeout(3000); // let map settle

  const result = {
    searchInputVisible: true,
    cases: {},
    consoleErrors,
    pageErrors,
  };

  // Case 1: Seoul (inside Asia)
  try {
    await clearAndSearch(page, 'Seoul');
    await page.waitForSelector('aside[role="dialog"]', { timeout: 15_000 });
    await page.waitForTimeout(2500); // give moveend time
    const text = await page.locator('aside[role="dialog"]').first().innerText();
    result.cases.seoul = {
      panelOpened: true,
      containsSeoul: /seoul/i.test(text),
      hasPrediction: /predicted rs anomaly|shap/i.test(text),
      hasOutOfDomain: /outside model training domain/i.test(text),
      snippet: text.slice(0, 400),
    };
  } catch (e) {
    result.cases.seoul = { error: String(e) };
  }

  // Case 2: Paris (outside Asia)
  try {
    await clearAndSearch(page, 'Paris');
    await page.waitForSelector('aside[role="dialog"]', { timeout: 15_000 });
    await page.waitForTimeout(2500);
    const text = await page.locator('aside[role="dialog"]').first().innerText();
    result.cases.paris = {
      panelOpened: true,
      containsParis: /paris/i.test(text),
      hasOutOfDomain: /outside model training domain/i.test(text),
      hasPrediction: /predicted rs anomaly/i.test(text),
      snippet: text.slice(0, 400),
    };
  } catch (e) {
    result.cases.paris = { error: String(e) };
  }

  // Case 3: gibberish
  try {
    await clearAndSearch(page, 'asdfghjklqwerty');
    await page.waitForTimeout(4000);
    const errEl = await page.$('[data-mshi-atlas-search-error]');
    let errText = null;
    if (errEl) errText = await errEl.innerText();
    const stillAlive = await page.evaluate(
      () => !!document.querySelector('[data-mshi-atlas-search] input'),
    );
    result.cases.gibberish = {
      errorShown: !!errEl,
      errorText: errText,
      pageStillAlive: stillAlive,
    };
  } catch (e) {
    result.cases.gibberish = { error: String(e) };
  }

  await browser.close();

  const seoulOK =
    result.cases.seoul &&
    result.cases.seoul.containsSeoul &&
    result.cases.seoul.hasPrediction &&
    !result.cases.seoul.hasOutOfDomain;
  const parisOK =
    result.cases.paris &&
    result.cases.paris.hasOutOfDomain &&
    !result.cases.paris.hasPrediction;
  const gibOK =
    result.cases.gibberish &&
    result.cases.gibberish.errorShown &&
    result.cases.gibberish.pageStillAlive;

  result.pass = seoulOK && parisOK && gibOK;
  console.log(JSON.stringify(result, null, 2));
  if (!result.pass) {
    console.error('\n=== SEARCH GATE FAILED ===');
    if (!seoulOK) console.error('- Seoul case failed');
    if (!parisOK) console.error('- Paris case failed');
    if (!gibOK) console.error('- Gibberish case failed');
    process.exit(1);
  }
  console.error('\n=== SEARCH GATE PASSED ===');
})().catch((e) => {
  console.error('Verifier crashed:', e);
  process.exit(2);
});

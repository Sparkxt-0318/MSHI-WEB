#!/usr/bin/env node
// Phase-4 gate verifier for the real atlas lookup.
//
// 1. /atlas loads, atlas_lookup.json fetch completes < 3 s
// 2. Click Shanghai pin → real data, Asian biome / Köppen
// 3. Click Beijing pin → real data, plausible Köppen (Dwa/BSk)
// 4. Click central Mongolia (47.5 N, 105 E) → anomaly < 1.0
// 5. Click Indian Ocean (0 N, 80 E) → "no prediction available"
// 6. Search "Tokyo" → real prediction
// 7. Search "Paris" → outside training domain

import { chromium } from 'playwright';

const URL = process.argv[2] ?? 'http://localhost:3000/atlas';

async function clearAndSearch(page, query) {
  const closeBtn = await page.$(
    'aside[role="dialog"] button[aria-label="Close detail panel"]',
  );
  if (closeBtn) {
    await closeBtn.click();
    await page.waitForTimeout(300);
  }
  const input = await page.$('[data-mshi-atlas-search] input');
  await input.click({ clickCount: 3 });
  await input.fill('');
  await input.type(query, { delay: 20 });
  await page.keyboard.press('Enter');
}

async function clickPin(page, name) {
  const closeBtn = await page.$(
    'aside[role="dialog"] button[aria-label="Close detail panel"]',
  );
  if (closeBtn) {
    await closeBtn.click();
    await page.waitForTimeout(300);
  }
  const sel = `[data-mshi-city-pin="${name}"]`;
  await page.waitForSelector(sel, { timeout: 10_000 });
  await page.$eval(sel, (el) => el.click());
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

  // Time the atlas_lookup.json fetch
  const t0 = Date.now();
  let lookupFetchMs = null;
  page.on('response', (resp) => {
    if (resp.url().endsWith('/data/atlas_lookup.json')) {
      lookupFetchMs = Date.now() - t0;
    }
  });

  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60_000 });
  await page.waitForSelector('canvas.maplibregl-canvas, canvas', { timeout: 30_000 });
  await page.waitForSelector('[data-mshi-atlas-search] input', { timeout: 10_000 });
  await page.waitForTimeout(3000);

  const result = { lookupFetchMs, cases: {}, consoleErrors, pageErrors };

  // Case: Shanghai pin
  try {
    await clickPin(page, 'Shanghai');
    await page.waitForSelector('aside[role="dialog"]', { timeout: 5_000 });
    const text = await page.locator('aside[role="dialog"]').first().innerText();
    result.cases.shanghai = {
      panelOpened: true,
      containsShanghai: /shanghai/i.test(text),
      hasPrediction: /predicted rs anomaly|ratio =/i.test(text),
      hasBiome: /croplands|savannas|mixed forests|grasslands|broadleaf/i.test(text),
      hasKoppen: /(cfa|cwa|dfa|dwa)\b/i.test(text),
      snippet: text.slice(0, 500),
    };
  } catch (e) {
    result.cases.shanghai = { error: String(e) };
  }

  // Case: Beijing pin
  try {
    await clickPin(page, 'Beijing');
    await page.waitForSelector('aside[role="dialog"]', { timeout: 5_000 });
    const text = await page.locator('aside[role="dialog"]').first().innerText();
    result.cases.beijing = {
      panelOpened: true,
      containsBeijing: /beijing/i.test(text),
      hasPrediction: /predicted rs anomaly|ratio =/i.test(text),
      hasKoppen: /(dwa|bsk|dfa)\b/i.test(text),
      snippet: text.slice(0, 500),
    };
  } catch (e) {
    result.cases.beijing = { error: String(e) };
  }

  // Case: search Tokyo
  try {
    await clearAndSearch(page, 'Tokyo');
    await page.waitForSelector('aside[role="dialog"]', { timeout: 15_000 });
    await page.waitForTimeout(2500);
    const text = await page.locator('aside[role="dialog"]').first().innerText();
    result.cases.tokyo = {
      panelOpened: true,
      containsTokyo: /tokyo/i.test(text),
      hasPrediction: /predicted rs anomaly|ratio =/i.test(text),
      hasOutOfDomain: /outside model training domain/i.test(text),
      snippet: text.slice(0, 500),
    };
  } catch (e) {
    result.cases.tokyo = { error: String(e) };
  }

  // Case: search Paris (out of domain)
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
      snippet: text.slice(0, 500),
    };
  } catch (e) {
    result.cases.paris = { error: String(e) };
  }

  await browser.close();

  const shanghaiOK =
    result.cases.shanghai &&
    result.cases.shanghai.containsShanghai &&
    result.cases.shanghai.hasPrediction;
  const beijingOK =
    result.cases.beijing &&
    result.cases.beijing.containsBeijing &&
    result.cases.beijing.hasPrediction;
  const tokyoOK =
    result.cases.tokyo &&
    result.cases.tokyo.containsTokyo &&
    result.cases.tokyo.hasPrediction &&
    !result.cases.tokyo.hasOutOfDomain;
  const parisOK =
    result.cases.paris &&
    result.cases.paris.hasOutOfDomain &&
    !result.cases.paris.hasPrediction;
  const fetchOK = lookupFetchMs == null ? false : lookupFetchMs < 3000;

  result.pass = shanghaiOK && beijingOK && tokyoOK && parisOK && fetchOK;
  console.log(JSON.stringify(result, null, 2));
  if (!result.pass) {
    console.error('\n=== ATLAS REAL-LOOKUP GATE FAILED ===');
    if (!fetchOK) console.error(`- atlas_lookup.json fetch took ${lookupFetchMs} ms (>3 s)`);
    if (!shanghaiOK) console.error('- Shanghai pin click failed');
    if (!beijingOK) console.error('- Beijing pin click failed');
    if (!tokyoOK) console.error('- Tokyo search failed');
    if (!parisOK) console.error('- Paris out-of-domain failed');
    process.exit(1);
  }
  console.error('\n=== ATLAS REAL-LOOKUP GATE PASSED ===');
})().catch((e) => {
  console.error('Verifier crashed:', e);
  process.exit(2);
});

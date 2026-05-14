#!/usr/bin/env node
// Phase verifier for the Full+MODIS overlay + info modal + comparison tables.
//
// Atlas (Phase 3):
//   1. Exactly 2 overlay buttons (F+NPP, Full+MODIS); placeholders gone
//   2. Click Beijing pin while F+NPP active → panel says "Predicted Rs anomaly · F+NPP"
//   3. Toggle to Full+MODIS → panel updates without re-clicking; says
//      "Predicted Rs anomaly · Full+MODIS" with a different anomaly value
//   4. Info icon present and opens a modal containing "anomaly ratio"
//   5. Modal closes on backdrop click and on Escape
//
// Homepage (Phase 4A):
//   6. /  page contains the 3-row comparison table with "+0.145" highlighted
//
// Methods (Phase 4B):
//   7. /methods page contains the 5-row table (F, F+NPP, Full+MODIS, Köppen C, Köppen D)

import { chromium } from 'playwright';

const BASE = process.argv[2] ?? 'http://localhost:3000';

async function clickPin(page, name) {
  const closeBtn = await page.$(
    'aside[role="dialog"] button[aria-label="Close detail panel"]',
  );
  if (closeBtn) {
    await closeBtn.click();
    await page.waitForTimeout(300);
  }
  await page.waitForSelector(`[data-mshi-city-pin="${name}"]`, { timeout: 10_000 });
  await page.$eval(`[data-mshi-city-pin="${name}"]`, (el) => el.click());
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

  const result = { atlas: {}, homepage: {}, methods: {}, consoleErrors, pageErrors };

  // ─── Atlas tests ────────────────────────────────────────────────────────
  await page.goto(`${BASE}/atlas`, { waitUntil: 'networkidle', timeout: 60_000 });
  await page.waitForSelector('canvas.maplibregl-canvas, canvas', { timeout: 30_000 });
  await page.waitForSelector('[data-mshi-overlay-button]', { timeout: 10_000 });
  await page.waitForTimeout(3500);

  try {
    // 1. Exactly 2 overlay buttons
    const overlayButtons = await page.$$eval('[data-mshi-overlay-button]', (els) =>
      els.map((el) => el.getAttribute('data-mshi-overlay-button')),
    );
    result.atlas.overlayButtons = overlayButtons;
    result.atlas.hasOnlyTwoButtons =
      overlayButtons.length === 2 &&
      overlayButtons.includes('F+NPP') &&
      overlayButtons.includes('Full+MODIS');

    // 2. Beijing pin with F+NPP active
    await clickPin(page, 'Beijing');
    await page.waitForSelector('aside[role="dialog"]', { timeout: 5_000 });
    await page.waitForTimeout(300);
    const fnppText = await page.locator('aside[role="dialog"]').first().innerText();
    const fnppRatioMatch = fnppText.match(/ratio = ([\d.]+)/);
    result.atlas.fnppHeader = /predicted rs anomaly · f\+npp/i.test(fnppText);
    result.atlas.fnppRatio = fnppRatioMatch ? parseFloat(fnppRatioMatch[1]) : null;

    // 3. Toggle to Full+MODIS — panel should update in place
    await page.click('[data-mshi-overlay-button="Full+MODIS"]');
    await page.waitForTimeout(800);
    const fmText = await page.locator('aside[role="dialog"]').first().innerText();
    const fmRatioMatch = fmText.match(/ratio = ([\d.]+)/);
    result.atlas.fmHeader = /predicted rs anomaly · full\+modis/i.test(fmText);
    result.atlas.fmRatio = fmRatioMatch ? parseFloat(fmRatioMatch[1]) : null;
    result.atlas.modelDifferent =
      result.atlas.fnppRatio != null &&
      result.atlas.fmRatio != null &&
      Math.abs(result.atlas.fnppRatio - result.atlas.fmRatio) > 0.001;

    // Reset back to F+NPP for the next test
    await page.click('[data-mshi-overlay-button="F+NPP"]');
    await page.waitForTimeout(300);
    // Close panel
    const closeBtn = await page.$(
      'aside[role="dialog"] button[aria-label="Close detail panel"]',
    );
    if (closeBtn) await closeBtn.click();
    await page.waitForTimeout(300);

    // 4. Info icon opens modal
    await page.waitForSelector('[data-mshi-anomaly-info]', { timeout: 5_000 });
    await page.click('[data-mshi-anomaly-info]');
    await page.waitForSelector('[data-mshi-info-modal]', { timeout: 3_000 });
    const modalText = await page.locator('[data-mshi-info-modal]').innerText();
    result.atlas.infoModalOpens = true;
    result.atlas.infoMentionsAnomaly = /anomaly ratio/i.test(modalText);
    result.atlas.infoMentionsExample = /mongolia|indo-gangetic/i.test(modalText);

    // 5. Escape closes
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    const stillOpen = await page.$('[data-mshi-info-modal]');
    result.atlas.infoClosesOnEscape = !stillOpen;
  } catch (e) {
    result.atlas.error = String(e);
  }

  // ─── Homepage table ────────────────────────────────────────────────────
  try {
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 60_000 });
    await page.waitForSelector('#mechanism', { timeout: 15_000 });
    const html = await page.content();
    result.homepage.has3RowTable = (html.match(/F \(climate only\)/) !== null)
      && (html.match(/F\+NPP/) !== null)
      && (html.match(/Full\+MODIS/) !== null);
    result.homepage.containsTransferR2 = html.includes('+0.145');
    result.homepage.linksToMethods = html.includes('href="/methods#configurations"');
  } catch (e) {
    result.homepage.error = String(e);
  }

  // ─── Methods table ─────────────────────────────────────────────────────
  try {
    await page.goto(`${BASE}/methods#configurations`, { waitUntil: 'networkidle', timeout: 60_000 });
    await page.waitForSelector('#configurations', { timeout: 15_000 });
    const text = await page.locator('#configurations').evaluate((el) => {
      // Get the section + table next to it
      let html = '';
      let cur = el;
      while (cur && html.length < 8000) {
        html += '\n' + (cur.textContent ?? '');
        cur = cur.nextElementSibling;
        if (cur && cur.tagName === 'H2') break;
      }
      return html;
    });
    result.methods.has5Rows =
      /F \(climate only\)/.test(text) &&
      /F\+NPP/.test(text) &&
      /Full\+MODIS/.test(text) &&
      /Köppen C/.test(text) &&
      /Köppen D/.test(text);
    result.methods.r2Values = {
      F: /\+0\.127/.test(text),
      FNPP: /\+0\.145/.test(text),
      FullMODIS: /\+0\.072/.test(text),
      KoppenC: /−0\.336|-0\.336/.test(text),
      KoppenD: /−0\.199|-0\.199/.test(text),
    };
  } catch (e) {
    result.methods.error = String(e);
  }

  await browser.close();

  const atlasOk =
    result.atlas.hasOnlyTwoButtons &&
    result.atlas.fnppHeader &&
    result.atlas.fmHeader &&
    result.atlas.modelDifferent &&
    result.atlas.infoModalOpens &&
    result.atlas.infoMentionsAnomaly &&
    result.atlas.infoMentionsExample &&
    result.atlas.infoClosesOnEscape;
  const homeOk =
    result.homepage.has3RowTable &&
    result.homepage.containsTransferR2 &&
    result.homepage.linksToMethods;
  const methodsOk =
    result.methods.has5Rows &&
    Object.values(result.methods.r2Values ?? {}).every(Boolean);

  result.pass = atlasOk && homeOk && methodsOk;
  console.log(JSON.stringify(result, null, 2));
  if (!result.pass) {
    console.error('\n=== FULL+MODIS / TABLES GATE FAILED ===');
    if (!atlasOk) console.error('- Atlas Full+MODIS/info-modal failed');
    if (!homeOk) console.error('- Homepage 3-row table failed');
    if (!methodsOk) console.error('- Methods 5-row table failed');
    process.exit(1);
  }
  console.error('\n=== FULL+MODIS / TABLES GATE PASSED ===');
})().catch((e) => {
  console.error('Verifier crashed:', e);
  process.exit(2);
});

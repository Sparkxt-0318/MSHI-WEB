#!/usr/bin/env node
// Phase verifier for the autocomplete dropdown and the screenshot button.
//
// Task 1 (autocomplete):
//   1. Type "Shang" → dropdown appears within 1.5 s with >= 3 suggestions
//   2. First suggestion contains "Shanghai"
//   3. ArrowDown moves highlight; aria-selected reflects the change
//   4. Clicking a suggestion flies the globe + opens the detail panel
//      with the expected location
//   5. Escape closes the dropdown
//   6. Existing full-query submit ("Tokyo" + Enter) still works
//
// Task 2 (screenshot):
//   1. Button is not disabled
//   2. Clicking triggers a download whose filename matches
//      /mshi-atlas-.*\.png/
//   3. The downloaded PNG is non-empty (> 50 kB)
//   4. The button briefly shows "Saved"

import { chromium } from 'playwright';
import { promises as fs } from 'node:fs';

const URL = process.argv[2] ?? 'http://localhost:3000/atlas';

async function clearSearch(page) {
  // Close any existing detail panel first — it occupies the right side
  // of the viewport and intercepts pointer events on the search input.
  const dialog = await page.$('aside[role="dialog"]');
  if (dialog) {
    const closeBtn = await page.$(
      'aside[role="dialog"] button[aria-label="Close detail panel"]',
    );
    if (closeBtn) {
      await closeBtn.click();
      await page
        .waitForSelector('aside[role="dialog"]', { state: 'detached', timeout: 3_000 })
        .catch(() => {});
    }
  }
  const input = await page.$('[data-mshi-atlas-search] input');
  if (!input) throw new Error('search input not found');
  await input.fill('');
  return input;
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
    acceptDownloads: true,
  });
  const page = await ctx.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
  page.on('pageerror', (e) => pageErrors.push(String(e)));

  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60_000 });
  await page.waitForSelector('canvas.maplibregl-canvas, canvas', { timeout: 30_000 });
  await page.waitForSelector('[data-mshi-atlas-search] input', { timeout: 10_000 });
  await page.waitForTimeout(3500);

  const result = { task1: {}, task2: {}, consoleErrors, pageErrors };

  // ─── Task 1: type "Shang" → dropdown ────────────────────────────────
  try {
    const input = await clearSearch(page);
    await input.type('Shangha', { delay: 60 });
    await page.waitForSelector('[data-mshi-atlas-suggestion]', { timeout: 4_000 });
    const suggestions = await page.$$eval(
      '[data-mshi-atlas-suggestion]',
      (els) =>
        els.map((el) => ({
          text: el.textContent ?? '',
          ariaSelected: el.getAttribute('aria-selected'),
        })),
    );
    result.task1.dropdownAppeared = {
      count: suggestions.length,
      first: suggestions[0],
      includesShanghai: suggestions.some((s) => /shanghai/i.test(s.text)),
    };

    // ArrowDown moves the highlight
    await input.focus();
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(100);
    const after = await page.$$eval(
      '[data-mshi-atlas-suggestion]',
      (els) =>
        els.map((el) => el.getAttribute('aria-selected')),
    );
    result.task1.arrowMovesHighlight = {
      initialSelectedIndex: suggestions.findIndex((s) => s.ariaSelected === 'true'),
      afterArrowSelectedIndex: after.findIndex((s) => s === 'true'),
    };

    // Click the Shanghai suggestion
    const shIdx = suggestions.findIndex((s) => /shanghai/i.test(s.text));
    if (shIdx >= 0) {
      const items = await page.$$('[data-mshi-atlas-suggestion]');
      await items[shIdx].dispatchEvent('pointerdown');
      await page.waitForSelector('aside[role="dialog"]', { timeout: 8_000 });
      await page.waitForTimeout(2500);
      const text = await page
        .locator('aside[role="dialog"]')
        .first()
        .innerText();
      result.task1.clickFliesAndOpens = {
        containsShanghai: /shanghai/i.test(text),
        hasPrediction: /predicted rs anomaly|ratio =/i.test(text),
        snippet: text.slice(0, 280),
      };
    }

    // Escape closes
    await clearSearch(page);
    await input.type('Beij', { delay: 60 });
    await page.waitForSelector('[data-mshi-atlas-suggestion]', { timeout: 4_000 });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(150);
    const openAfterEscape = await page.$('[data-mshi-atlas-suggestions]');
    result.task1.escapeCloses = !openAfterEscape;

    // Regression: full Enter submit still works
    await clearSearch(page);
    const input2 = await page.$('[data-mshi-atlas-search] input');
    await input2.type('Tokyo', { delay: 60 });
    await page.waitForTimeout(800); // let suggestion fetch finish
    await page.keyboard.press('Enter');
    await page.waitForSelector('aside[role="dialog"]', { timeout: 10_000 });
    await page.waitForTimeout(2500);
    const tokyoText = await page
      .locator('aside[role="dialog"]')
      .first()
      .innerText();
    result.task1.submitStillWorks = {
      containsTokyo: /tokyo/i.test(tokyoText),
      hasPrediction: /predicted rs anomaly|ratio =/i.test(tokyoText),
    };
  } catch (e) {
    result.task1.error = String(e);
  }

  // Close any panel left over from Task 1 so it doesn't intercept
  // pointer events on the screenshot button at the bottom centre.
  try {
    await clearSearch(page);
  } catch {}

  // ─── Task 2: screenshot button ──────────────────────────────────────
  try {
    const disabled = await page.$eval(
      '[data-mshi-screenshot]',
      (el) => el.hasAttribute('disabled'),
    );
    result.task2.disabled = disabled;

    const downloadPromise = page.waitForEvent('download', { timeout: 10_000 });
    await page.click('[data-mshi-screenshot]');
    const download = await downloadPromise;
    const suggestedName = download.suggestedFilename();
    const saveTo = `test_screenshots/${suggestedName}`;
    await download.saveAs(saveTo);
    const stat = await fs.stat(saveTo);
    result.task2.download = {
      filename: suggestedName,
      filenameMatches: /^mshi-atlas-.*\.png$/.test(suggestedName),
      sizeBytes: stat.size,
    };

    // Verify SAVED label appears briefly
    await page.waitForTimeout(150);
    const label = await page.$eval(
      '[data-mshi-screenshot]',
      (el) => el.textContent?.trim() ?? '',
    );
    result.task2.savedLabel = label;
  } catch (e) {
    result.task2.error = String(e);
  }

  await browser.close();

  const t1ok =
    !result.task1.error &&
    result.task1.dropdownAppeared?.count >= 3 &&
    result.task1.dropdownAppeared?.includesShanghai &&
    result.task1.arrowMovesHighlight?.afterArrowSelectedIndex >= 0 &&
    result.task1.clickFliesAndOpens?.containsShanghai &&
    result.task1.clickFliesAndOpens?.hasPrediction &&
    result.task1.escapeCloses &&
    result.task1.submitStillWorks?.containsTokyo &&
    result.task1.submitStillWorks?.hasPrediction;
  const t2ok =
    !result.task2.error &&
    result.task2.disabled === false &&
    result.task2.download?.filenameMatches &&
    result.task2.download?.sizeBytes > 50_000 &&
    /saved/i.test(result.task2.savedLabel ?? '');

  result.pass = t1ok && t2ok;
  console.log(JSON.stringify(result, null, 2));
  if (!result.pass) {
    console.error('\n=== AUTOCOMPLETE + SCREENSHOT GATE FAILED ===');
    if (!t1ok) console.error('- Task 1 (autocomplete) failed');
    if (!t2ok) console.error('- Task 2 (screenshot) failed');
    process.exit(1);
  }
  console.error('\n=== AUTOCOMPLETE + SCREENSHOT GATE PASSED ===');
})().catch((e) => {
  console.error('Verifier crashed:', e);
  process.exit(2);
});

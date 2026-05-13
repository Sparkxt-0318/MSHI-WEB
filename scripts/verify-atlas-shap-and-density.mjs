#!/usr/bin/env node
// Gate verifier for the SHAP 3-bullet detail and the training-site
// density toggle.
//
// Task 1: click Shanghai → 3 SHAP entries, each with description /
//         mechanism / local bullets and a colored direction tag.
// Task 2: click "Toggle density" → aria-pressed flips, a screenshot
//         taken with sites visible has more saturated white pixels in
//         the Asia interior than the baseline (proxy for "dots appeared").

import { chromium } from 'playwright';
import { promises as fs } from 'node:fs';
import { PNG } from 'pngjs';

const URL = process.argv[2] ?? 'http://localhost:3000/atlas';

function countWhiteish(png, x0, y0, x1, y1) {
  const { width, data } = png;
  let n = 0;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * width + x) * 4;
      if (data[i] > 230 && data[i + 1] > 220 && data[i + 2] > 210) n++;
    }
  }
  return n;
}

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

  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60_000 });
  await page.waitForSelector('canvas.maplibregl-canvas, canvas', { timeout: 30_000 });
  await page.waitForSelector('[data-mshi-atlas-search] input', { timeout: 10_000 });
  await page.waitForTimeout(3500);

  const result = { task1: {}, task2: {}, consoleErrors, pageErrors };

  // ─── Task 1: Shanghai SHAP bullets ────────────────────────────────────
  try {
    await clickPin(page, 'Shanghai');
    await page.waitForSelector('aside[role="dialog"] [data-mshi-shap-entry]', {
      timeout: 5_000,
    });
    const entries = await page.$$eval(
      'aside[role="dialog"] [data-mshi-shap-entry]',
      (els) =>
        els.map((el) => {
          const description = el.querySelector(
            '[data-mshi-shap-bullet="description"]',
          )?.textContent ?? null;
          const mechanism = el.querySelector(
            '[data-mshi-shap-bullet="mechanism"]',
          )?.textContent ?? null;
          const local = el.querySelector(
            '[data-mshi-shap-bullet="local"]',
          )?.textContent ?? null;
          // Detect colored direction tag via class membership.
          const directionTag = el.querySelector('[class*="tracking-meta"]');
          const directionText = directionTag?.textContent?.trim() ?? null;
          const directionClasses = directionTag?.className ?? '';
          const isColored =
            directionClasses.includes('text-[#3F7CAB]') ||
            directionClasses.includes('text-accent');
          return { description, mechanism, local, directionText, isColored };
        }),
    );
    result.task1.shanghai = {
      entryCount: entries.length,
      entries,
      // Each entry must have a description bullet, a mechanism bullet
      // (text different from description), a local bullet starting with
      // "At this cell:", and a colored direction tag.
      allHaveThreeBullets: entries.every(
        (e) => e.description && e.mechanism && e.local,
      ),
      mechanismsDifferFromDescriptions: entries.every(
        (e) => e.description && e.mechanism && e.description !== e.mechanism,
      ),
      localsReferenceCellValue: entries.every((e) =>
        /at this cell/i.test(e.local ?? ''),
      ),
      directionsColored: entries.every((e) => e.isColored),
    };
  } catch (e) {
    result.task1.shanghai = { error: String(e) };
  }

  // Close panel after Task 1
  try {
    const closeBtn = await page.$(
      'aside[role="dialog"] button[aria-label="Close detail panel"]',
    );
    if (closeBtn) await closeBtn.click();
    await page.waitForTimeout(400);
  } catch {}

  // ─── Task 2: density toggle ──────────────────────────────────────────
  try {
    await page.waitForSelector('[data-mshi-toggle-density]', { timeout: 5_000 });
    const beforeAria = await page.getAttribute(
      '[data-mshi-toggle-density]',
      'aria-pressed',
    );
    await page.screenshot({ path: 'test_screenshots/atlas_density_off.png' });

    await page.click('[data-mshi-toggle-density]');
    await page.waitForTimeout(700);
    const afterOnAria = await page.getAttribute(
      '[data-mshi-toggle-density]',
      'aria-pressed',
    );
    await page.screenshot({ path: 'test_screenshots/atlas_density_on.png' });

    await page.click('[data-mshi-toggle-density]');
    await page.waitForTimeout(700);
    const afterOffAria = await page.getAttribute(
      '[data-mshi-toggle-density]',
      'aria-pressed',
    );
    await page.screenshot({ path: 'test_screenshots/atlas_density_off2.png' });

    const off1 = PNG.sync.read(await fs.readFile('test_screenshots/atlas_density_off.png'));
    const on = PNG.sync.read(await fs.readFile('test_screenshots/atlas_density_on.png'));
    const off2 = PNG.sync.read(await fs.readFile('test_screenshots/atlas_density_off2.png'));

    // Asia interior bbox (rough): exclude the search/overlay/panel chrome.
    const off1White = countWhiteish(off1, 350, 200, 1100, 650);
    const onWhite = countWhiteish(on, 350, 200, 1100, 650);
    const off2White = countWhiteish(off2, 350, 200, 1100, 650);

    result.task2 = {
      beforeAria,
      afterOnAria,
      afterOffAria,
      whitePixels: { off1: off1White, on: onWhite, off2: off2White },
      // toggling on adds dots; expect on > off1 and off2 ≈ off1.
      pressedOn: afterOnAria === 'true',
      pressedOffAgain: afterOffAria === 'false',
      dotsAppeared: onWhite > off1White + 100,
      dotsHidden: Math.abs(off2White - off1White) < Math.max(50, off1White * 0.05),
    };
  } catch (e) {
    result.task2 = { error: String(e) };
  }

  await browser.close();

  const t1ok =
    result.task1.shanghai &&
    !result.task1.shanghai.error &&
    result.task1.shanghai.entryCount >= 3 &&
    result.task1.shanghai.allHaveThreeBullets &&
    result.task1.shanghai.mechanismsDifferFromDescriptions &&
    result.task1.shanghai.localsReferenceCellValue &&
    result.task1.shanghai.directionsColored;
  const t2ok =
    result.task2 &&
    !result.task2.error &&
    result.task2.pressedOn &&
    result.task2.pressedOffAgain &&
    result.task2.dotsAppeared;

  result.pass = t1ok && t2ok;
  console.log(JSON.stringify(result, null, 2));
  if (!result.pass) {
    console.error('\n=== SHAP + DENSITY GATE FAILED ===');
    if (!t1ok) console.error('- Task 1 (SHAP bullets) failed');
    if (!t2ok) console.error('- Task 2 (density toggle) failed');
    process.exit(1);
  }
  console.error('\n=== SHAP + DENSITY GATE PASSED ===');
})().catch((e) => {
  console.error('Verifier crashed:', e);
  process.exit(2);
});

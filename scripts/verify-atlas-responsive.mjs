#!/usr/bin/env node
// Responsive verifier for /atlas (mobile + desktop).
//
// Mobile (390x844) regressions this guards against:
//   1. Search box (was a fixed 280px top-right) overlapping the top-left
//      overlay panel.
//   2. The bottom legend bar (was a non-wrapping centered row) overflowing
//      the viewport width.
//   3. Any control panel spilling outside the viewport, or the page
//      developing a horizontal/vertical scrollbar.
//   4. The six-item nav overflowing — it must collapse behind a hamburger
//      that opens a 6-link menu.
//   5. A map click still opening the detail panel (full-width on a phone).
//
// Desktop (1440x900): the same panels must stay inside the viewport and the
// inline nav links must be visible (hamburger hidden) — i.e. nothing regressed
// for laptop users.

import { chromium } from 'playwright';
import { promises as fs } from 'node:fs';

const URL = process.argv[2] ?? 'http://localhost:3000/atlas';

const LAUNCH_ARGS = [
  '--no-sandbox',
  '--ignore-gpu-blocklist',
  '--enable-gpu-rasterization',
  '--enable-webgl',
  '--use-gl=angle',
  '--use-angle=swiftshader',
  '--ignore-certificate-errors',
];

function rectsOverlap(a, b) {
  if (!a || !b) return false;
  return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
}

function withinViewport(r, vw, vh, eps = 1.5) {
  if (!r) return false;
  return (
    r.left >= -eps && r.top >= -eps && r.right <= vw + eps && r.bottom <= vh + eps
  );
}

async function rectOf(page, selector) {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    // offsetParent === null ⇒ display:none (hidden). Report it so callers can
    // distinguish "absent" from "present but hidden".
    const hidden = el.offsetParent === null && getComputedStyle(el).position !== 'fixed';
    return {
      left: r.left, top: r.top, right: r.right, bottom: r.bottom,
      width: r.width, height: r.height, hidden,
    };
  }, selector);
}

async function pageMetrics(page) {
  return page.evaluate(() => ({
    innerW: window.innerWidth,
    innerH: window.innerHeight,
    scrollW: document.documentElement.scrollWidth,
    scrollH: document.documentElement.scrollHeight,
  }));
}

async function runViewport(browser, label, viewport) {
  const ctx = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    ignoreHTTPSErrors: true,
    isMobile: viewport.width < 640,
    hasTouch: viewport.width < 640,
  });
  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
  page.on('pageerror', (e) => consoleErrors.push(String(e)));

  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60_000 });
  await page.waitForSelector('canvas.maplibregl-canvas, canvas', { timeout: 30_000 });
  await page.waitForSelector('[data-mshi-atlas-search]', { timeout: 10_000 });
  await page.waitForTimeout(4000); // let the globe + layers settle

  await fs.mkdir('test_screenshots', { recursive: true });
  const shot = `test_screenshots/atlas_responsive_${label}.png`;
  await page.screenshot({ path: shot, fullPage: false });

  const metrics = await pageMetrics(page);
  const search = await rectOf(page, '[data-mshi-atlas-search]');
  const overlayBtn = await rectOf(page, '[data-mshi-overlay-button="F+NPP"]');
  const density = await rectOf(page, '[data-mshi-toggle-density]');
  const screenshotBtn = await rectOf(page, '[data-mshi-screenshot]');
  const hideBar = await rectOf(page, '[data-mshi-hide-bar]');
  const hamburger = await rectOf(page, 'button[aria-controls="site-mobile-menu"]');

  const { innerW, innerH } = metrics;
  const noHScroll = metrics.scrollW <= innerW + 2;
  const noVScroll = metrics.scrollH <= innerH + 2;

  const panelsInViewport = {
    search: withinViewport(search, innerW, innerH),
    overlayBtn: withinViewport(overlayBtn, innerW, innerH),
    density: withinViewport(density, innerW, innerH),
    screenshotBtn: withinViewport(screenshotBtn, innerW, innerH),
    hideBar: withinViewport(hideBar, innerW, innerH),
  };
  const allPanelsInViewport = Object.values(panelsInViewport).every(Boolean);
  const searchOverlayClear = !rectsOverlap(search, overlayBtn);

  // --- Nav behaviour --------------------------------------------------------
  const isMobile = viewport.width < 640;
  let navOK = false;
  let navDetail = {};
  if (isMobile) {
    // Hamburger must be visible; menu hidden until tapped, then 6 links.
    const hamburgerVisible = hamburger && !hamburger.hidden && hamburger.width > 0;
    const menuBefore = await page.$('#site-mobile-menu');
    await page.click('button[aria-controls="site-mobile-menu"]');
    await page.waitForSelector('#site-mobile-menu', { timeout: 3000 });
    const linkCount = await page.evaluate(
      () => document.querySelectorAll('#site-mobile-menu a').length,
    );
    // Close it again so it doesn't sit over the map for the pin-click test.
    await page.click('button[aria-controls="site-mobile-menu"]');
    await page.waitForTimeout(200);
    navDetail = { hamburgerVisible, menuClosedInitially: !menuBefore, linkCount };
    navOK = hamburgerVisible && !menuBefore && linkCount === 6;
  } else {
    // Inline links visible, hamburger hidden.
    const inlineLinks = await page.evaluate(() => {
      const ul = document.querySelector('header nav ul');
      if (!ul) return 0;
      // Count only visible anchors.
      return [...ul.querySelectorAll('a')].filter(
        (a) => a.getBoundingClientRect().width > 0,
      ).length;
    });
    const hamburgerHidden = !hamburger || hamburger.hidden || hamburger.width === 0;
    navDetail = { inlineLinks, hamburgerHidden };
    navOK = inlineLinks >= 6 && hamburgerHidden;
  }

  // --- Detail panel still opens, and is full-width on a phone --------------
  let panelOpens = false;
  let panelFullWidthOnMobile = true;
  try {
    const pin = await page.$('[data-mshi-city-pin]');
    if (pin) {
      await pin.click({ force: true });
    } else {
      // Fall back to a click near the globe centre.
      await page.mouse.click(innerW / 2, innerH / 2);
    }
    await page.waitForSelector('aside[role="dialog"]', { timeout: 8000 });
    panelOpens = true;
    const panel = await rectOf(page, 'aside[role="dialog"]');
    if (isMobile && panel) {
      // w-full beats max-w-md (448px) on a 390px phone ⇒ should span the width.
      panelFullWidthOnMobile = Math.abs(panel.width - innerW) <= 2;
    }
  } catch {
    panelOpens = false;
  }

  await ctx.close();

  // Benign noise: PMTiles tile fetches, the external Photon geocoder, favicon,
  // and generic network errors are not layout regressions. Anything else
  // (e.g. a React render throw from the nav refactor) should fail the gate.
  const seriousErrors = consoleErrors.filter(
    (e) => !/pmtiles|photon|favicon|failed to fetch|net::|err_|abort/i.test(e),
  );

  const pass =
    noHScroll &&
    noVScroll &&
    allPanelsInViewport &&
    searchOverlayClear &&
    navOK &&
    panelOpens &&
    panelFullWidthOnMobile &&
    seriousErrors.length === 0;

  return {
    label,
    viewport,
    screenshot: shot,
    metrics,
    noHScroll,
    noVScroll,
    panelsInViewport,
    allPanelsInViewport,
    searchOverlayClear,
    nav: { ok: navOK, ...navDetail },
    panelOpens,
    panelFullWidthOnMobile,
    consoleErrors,
    seriousErrors,
    pass,
  };
}

(async () => {
  const browser = await chromium.launch({ args: LAUNCH_ARGS });
  const results = [];
  results.push(await runViewport(browser, 'mobile', { width: 390, height: 844 }));
  results.push(await runViewport(browser, 'desktop', { width: 1440, height: 900 }));
  await browser.close();

  const pass = results.every((r) => r.pass);
  console.log(JSON.stringify({ url: URL, pass, results }, null, 2));

  if (!pass) {
    console.error('\n=== RESPONSIVE GATE FAILED ===');
    for (const r of results) {
      if (r.pass) continue;
      console.error(`\n[${r.label}]`);
      if (!r.noHScroll) console.error('  - horizontal scrollbar present');
      if (!r.noVScroll) console.error('  - vertical scrollbar present');
      if (!r.allPanelsInViewport)
        console.error('  - panel(s) outside viewport:', JSON.stringify(r.panelsInViewport));
      if (!r.searchOverlayClear) console.error('  - search box overlaps overlay panel');
      if (!r.nav.ok) console.error('  - nav failed:', JSON.stringify(r.nav));
      if (!r.panelOpens) console.error('  - detail panel did not open on click');
      if (!r.panelFullWidthOnMobile) console.error('  - detail panel not full-width on mobile');
      if (r.seriousErrors.length) console.error('  - console errors:', r.seriousErrors);
    }
    process.exit(1);
  }
  console.error('\n=== RESPONSIVE GATE PASSED ===');
})().catch((e) => {
  console.error('Verifier crashed:', e);
  process.exit(2);
});

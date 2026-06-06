#!/usr/bin/env node
// Soil-condition scenario verification.
//
// Drives headless Chromium against /simulation's Live System and proves the
// new scenario selector: starting the experiment reveals a "Soil Condition
// Scenario" bar with a chip per soil; clicking each chip loads that soil's
// signature, logs the load, moves the matching chemistry channel out of range,
// and makes the AI advisor diagnose the right primary problem and recommend the
// matching remediation. Screenshots a couple of scenarios for the record.
//
// Usage: node scripts/verify-scenarios.mjs [baseUrl]

import { chromium } from 'playwright';
import { promises as fs } from 'node:fs';

const BASE = process.argv[2] ?? 'http://localhost:3210';
const OUT = 'test_screenshots';

let failed = false;
const fail = (m) => {
  console.error(`FAIL: ${m}`);
  failed = true;
};
const ok = (m) => console.log(`OK: ${m}`);

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1400, height: 1200 } });
page.on('pageerror', (e) => fail(`pageerror: ${e.message}`));
await fs.mkdir(OUT, { recursive: true });

const has = async (t) => (await page.getByText(t, { exact: false }).count()) >= 1;
const count = async (t) => (await page.locator('body').innerText()).split(t).length - 1;

await page.goto(`${BASE}/simulation`, { waitUntil: 'load' });
await page.waitForTimeout(1200);

// Start the experiment to reveal the gated scenario bar + dashboards.
await page.getByRole('button', { name: /Start Experiment/i }).first().click();
await page.waitForTimeout(800);

// Scenario bar present, with all six chips.
if (await has('Soil Condition Scenario')) ok('scenario bar present');
else fail('scenario bar missing');
for (const chip of ['Healthy', 'Sterile', 'Saline', 'Heavy metal', 'Acidic', 'Compacted']) {
  if ((await page.getByRole('button', { name: new RegExp(`^${chip}$`, 'i') }).count()) >= 1)
    ok(`chip present: ${chip}`);
  else fail(`chip missing: ${chip}`);
}

// Switch to the AI tab so we can watch the diagnosis update as we load soils.
await page.getByRole('tab', { name: /AI Decision Support/i }).click();
await page.waitForTimeout(400);

// Each scenario → expected loaded-log label + AI remediation title.
const SCENARIOS = [
  { chip: 'Sterile', label: 'Biologically unhealthy (sterile)', title: 'Inoculate + Nutrient Pulse' },
  { chip: 'Saline', label: 'Saline-stressed', title: 'Freshwater Leaching' },
  { chip: 'Heavy metal', label: 'Heavy-metal contaminated (Cd)', title: 'Chelation + Electrokinetic Extraction' },
  { chip: 'Acidic', label: 'Acidic (low pH)', title: 'Liming to pH' },
  { chip: 'Compacted', label: 'Compacted / waterlogged', title: 'Tillage + Drainage' },
];

// On the AI tab the recommendation title + "Detected Soil" chip update live as
// we switch soils (the event log itself lives on the Monitoring Console tab).
for (const s of SCENARIOS) {
  await page.getByRole('button', { name: new RegExp(`^${s.chip}$`, 'i') }).click();
  await page.waitForTimeout(450);
  if (await has(s.title)) ok(`AI recommends "${s.title}" for ${s.chip}`);
  else fail(`AI did not recommend "${s.title}" for ${s.chip}`);
}

// Screenshot the saline diagnosis (the table's flagship "sensor catches it" case).
await page.getByRole('button', { name: /^Saline$/i }).click();
await page.waitForTimeout(450);
await page.screenshot({ path: `${OUT}/scenario_saline_ai.png` });

// Execute the recommended remediation, then confirm the Monitoring Console log
// recorded both the scenario load and its resolution.
await page.getByRole('button', { name: /^Execute$/ }).first().click();
await page.waitForTimeout(600);
await page.getByRole('tab', { name: /Monitoring Console/i }).click();
await page.waitForTimeout(400);
if (await has('Loaded soil scenario: Saline-stressed')) ok('monitor log records the scenario load');
else fail('monitor log missing the scenario load');
if (await has('Scenario resolved')) ok('executing remediation resolved the scenario');
else fail('remediation did not resolve the scenario');
await page.getByRole('tab', { name: /AI Decision Support/i }).click();
await page.waitForTimeout(300);

// Heavy-metal chemistry shows on the monitor as Critical (red Cadmium card).
await page.getByRole('button', { name: /^Heavy metal$/i }).click();
await page.waitForTimeout(400);
await page.getByRole('tab', { name: /Monitoring Console/i }).click();
await page.waitForTimeout(400);
if (await has('Cadmium')) ok('monitor shows Cadmium channel');
else fail('monitor missing Cadmium channel');
if ((await count('Critical')) >= 1) ok('a chemistry channel reads Critical');
else fail('no Critical chemistry channel for heavy-metal soil');
await page.screenshot({ path: `${OUT}/scenario_heavymetal_monitor.png` });

await browser.close();
console.log(failed ? '\n=== SCENARIO VERIFY: FAIL ===' : '\n=== SCENARIO VERIFY: PASS ===');
process.exit(failed ? 1 : 0);

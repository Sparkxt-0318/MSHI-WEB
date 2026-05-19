import fs from 'node:fs';
import path from 'node:path';
import type { BiosensorDataset } from '@/components/biosensor/sample-types';

/**
 * Loads the generated biosensor dataset at render time (server-side).
 * The file is produced by scripts/build_biosensor_data.py from the real
 * MSHI corpus; it is small enough to inline rather than client-fetch.
 */
export function loadBiosensorDataset(): BiosensorDataset {
  const p = path.join(process.cwd(), 'public', 'data', 'biosensor_samples.json');
  return JSON.parse(fs.readFileSync(p, 'utf8')) as BiosensorDataset;
}

import fs from 'node:fs';
import path from 'node:path';
import type {
  BiosensorDataset,
  DpvReference,
} from '@/components/biosensor/sample-types';

/**
 * Loads the generated biosensor dataset at render time (server-side).
 * The file is produced by scripts/build_biosensor_data.py from the real
 * MSHI corpus; it is small enough to inline rather than client-fetch.
 */
export function loadBiosensorDataset(): BiosensorDataset {
  const p = path.join(process.cwd(), 'public', 'data', 'biosensor_samples.json');
  return JSON.parse(fs.readFileSync(p, 'utf8')) as BiosensorDataset;
}

/**
 * Loads the digitized DPV reference curve (from scripts/build_dpv_reference.py).
 * This is NOT corpus data — see that script's provenance header.
 */
export function loadDpvReference(): DpvReference {
  const p = path.join(
    process.cwd(),
    'public',
    'data',
    'biosensor_dpv_reference.json',
  );
  return JSON.parse(fs.readFileSync(p, 'utf8')) as DpvReference;
}

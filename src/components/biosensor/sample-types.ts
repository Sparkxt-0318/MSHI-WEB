/**
 * Schema for the /biosensor gallery. Mirrors public/data/biosensor_samples.json,
 * which is generated from the real published corpus (Sparkxt-0318/MSHI@main:
 * biosensor_samples/) by scripts/build_biosensor_data.py. Real data only.
 *
 * The measurement set is non-uniform by study design: Phase I samples carry
 * CA + CV; Phase II adds OCP. There is no DPV trace in the corpus.
 */
export type Classification = 'healthy' | 'unhealthy' | 'saline';

export type TechniqueKey = 'ca' | 'cv' | 'ocp';

export interface Trace {
  /** X values, parsed from the CHI660E export and downsampled (even stride). */
  x: number[];
  /** Y values, paired 1:1 with x. */
  y: number[];
  /** Axis label derived from the file's column header (e.g. "Time (s)"). */
  xlabel: string;
  ylabel: string;
  /** Raw point count before downsampling. */
  n_raw: number;
  /** Point count actually plotted (<= 1500). */
  n_plotted: number;
}

export interface BiosensorSample {
  id: string;
  name: string;
  /** MSHI score in [0,1] from the published dataset. */
  mshi_score: number;
  classification: Classification;
  /** "Phase I" | "Phase II". */
  phase: string;
  trial_id: number;
  /** Techniques this sample actually has, in display order. */
  techniques: TechniqueKey[];
  traces: Partial<Record<TechniqueKey, Trace>>;
  /** Public paths to the verbatim raw exports for download. */
  raw_files: Partial<Record<TechniqueKey, string>>;
}

export interface BiosensorDataset {
  generated_from: string;
  raw_provenance: string;
  note: string;
  sample_count: number;
  samples: BiosensorSample[];
}

/**
 * A single DPV reference curve hand-digitized from the author's published
 * CHI660E export (the corpus has no per-sample dpv.txt). Shown once as a
 * sourced reference, never attributed to a gallery sample.
 */
export interface DpvReference {
  kind: 'reference';
  digitized: true;
  source: string;
  technique: string;
  omcz_peak_v: number;
  x: number[];
  y: number[];
  xlabel: string;
  ylabel: string;
  n_points: number;
}

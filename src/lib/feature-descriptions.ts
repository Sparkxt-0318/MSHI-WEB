// Knowledge base for the F+NPP model's input features. The detail panel
// uses this to render a structured 3-bullet explanation under each
// top-3 SHAP entry.
//
// Sources of these descriptions:
//   - WorldClim 2.1 bioclim variable definitions
//     (https://worldclim.org/data/bioclim.html)
//   - MODIS MOD17A3HGF NPP user guide
//   - MODIS MOD11A2 LST product spec
//   - SoilGrids 2.0 documentation (for soil features used by sibling
//     models — included here for completeness even though F+NPP does not
//     use them)
//   - Mechanism statements are paraphrased from MSHI's own RUN-A and
//     item-1-modis paper drafts (Q10 effect; aridity-limited respiration;
//     mineral-bound C protection; clay sign-flip Asia vs US).
//
// The detail panel renders three bullets per feature:
//   1. `description` — what the variable is, source, units
//   2. `mechanism`   — why it affects soil microbial respiration
//   3. `local`       — interpretation of the cell's own value
//
// `displayValue(raw)` converts the raw model-input scale to a human-
// readable number (units handled by the description bullet text).

export interface FeatureDescription {
  /** Human-readable display name shown in the panel header. */
  display: string;
  /** What the feature is + where it comes from. One sentence. */
  description: string;
  /** Biological/physical mechanism linking the feature to Rs. One sentence. */
  mechanism: string;
  /** Units string used by local templates. Empty if the value is unitless. */
  units: string;
  /** Optional transform from raw model-input scale to display scale. */
  displayValue?: (rawValue: number) => number;
  /** Locale-aware formatter; defaults to 1-decimal toFixed. */
  formatValue?: (displayValue: number) => string;
  /** Produces the third "At this cell" bullet from the displayed value. */
  local: (displayValue: number) => string;
}

const FEATURE_DESCRIPTIONS: Record<string, FeatureDescription> = {
  // ─── MODIS-derived (the four features that distinguish F+NPP from F) ───
  npp: {
    display: 'MODIS NPP',
    description:
      'Satellite-derived annual net primary productivity from the MODIS MOD17A3HGF product, reflecting plant carbon fixation.',
    mechanism:
      'Higher NPP feeds soil microbes more substrate via root exudates and leaf litter, driving up microbial respiration.',
    units: 'g C/m²/yr',
    // MOD17 NPP raw is scaled (kg C/m²/yr × 10000 = raw integer). The
    // build_atlas_lookup.py emits raw model-input units, so we divide
    // by 10 to display as g C/m²/yr.
    displayValue: (v) => v / 10,
    formatValue: (v) => v.toFixed(0),
    local: (v) =>
      `At this cell: ${v.toFixed(0)} g C/m²/yr — ${
        v > 600
          ? 'high productivity, abundant substrate for soil microbes'
          : v > 300
          ? 'moderate productivity, typical of mid-latitude biomes'
          : 'low productivity, limiting substrate availability'
      }.`,
  },

  lst_day: {
    display: 'MODIS LST (day)',
    description:
      '2020–2024 MODIS land-surface temperature averaged over daytime overpasses (MOD11A2 product).',
    mechanism:
      'Daytime surface temperature drives near-surface microbial enzyme rates and water-vapour-mediated substrate diffusion.',
    units: '°C',
    formatValue: (v) => v.toFixed(1),
    local: (v) =>
      `At this cell: ${v.toFixed(1)}°C — ${
        v > 25
          ? 'warm-to-hot surface, enzymes near optimum'
          : v > 10
          ? 'temperate daytime regime'
          : 'cool surface, daytime activity rate-limited'
      }.`,
  },

  lst_night: {
    display: 'MODIS LST (night)',
    description:
      '2020–2024 MODIS land-surface temperature averaged over nighttime overpasses (MOD11A2 product).',
    mechanism:
      'Night surface temperature controls the lower bound of microbial activity through the diel cycle; a cool night collapses the diurnal Rs envelope.',
    units: '°C',
    formatValue: (v) => v.toFixed(1),
    local: (v) =>
      `At this cell: ${v.toFixed(1)}°C — ${
        v > 15 ? 'warm nights sustain microbial activity' : 'cool nights reduce overnight respiration'
      }.`,
  },

  lst_diurnal_range: {
    display: 'LST diurnal range',
    description:
      'Difference between MODIS daytime and nighttime land-surface temperatures (derived: lst_day − lst_night).',
    mechanism:
      'A wider diurnal range usually means clearer skies and drier surfaces — both increase the share of respiration in the daytime peak and can suppress the overall daily mean.',
    units: '°C',
    formatValue: (v) => v.toFixed(1),
    local: (v) =>
      `At this cell: ${v.toFixed(1)}°C — ${
        v > 15
          ? 'large day-night swing, characteristic of arid or high-altitude surfaces'
          : v > 8
          ? 'moderate diurnal range'
          : 'small day-night swing, likely under heavy cloud or vegetation cover'
      }.`,
  },

  // ─── WorldClim bioclim ────────────────────────────────────────────────
  bio01: {
    display: 'Mean annual temperature',
    description:
      'WorldClim 2.1 mean annual air temperature averaged over 1970–2000.',
    mechanism:
      'Higher temperatures accelerate microbial enzyme kinetics (Q10 effect); extreme heat can also dehydrate soils and suppress activity.',
    units: '°C',
    formatValue: (v) => v.toFixed(1),
    local: (v) =>
      `At this cell: ${v.toFixed(1)}°C — ${
        v > 20
          ? 'warm climate, enzymes near optimum'
          : v > 5
          ? 'temperate climate, moderate Rs activity'
          : 'cold climate, enzyme activity rate-limited'
      }.`,
  },

  bio04: {
    display: 'Temperature seasonality',
    description:
      'WorldClim seasonality of monthly mean temperatures, computed as the standard deviation × 100 — a unitless seasonality score.',
    mechanism:
      'High seasonality usually means continental climates with long cold winters: microbial activity is concentrated into a short shoulder season, which compresses annual Rs.',
    units: '',
    formatValue: (v) => v.toFixed(0),
    local: (v) =>
      `At this cell: ${v.toFixed(0)} — ${
        v > 1000
          ? 'strongly seasonal, characteristic of continental interiors'
          : v > 500
          ? 'moderately seasonal climate'
          : 'low seasonality, marine or tropical climate'
      }.`,
  },

  bio05: {
    display: 'Max temp of warmest month',
    description:
      'WorldClim mean of the daily max temperature in the hottest month of the year.',
    mechanism:
      'Sets the upper envelope on microbial enzyme rates; in arid regions it also drives soil moisture loss, which can rapidly suppress Rs.',
    units: '°C',
    formatValue: (v) => v.toFixed(1),
    local: (v) =>
      `At this cell: ${v.toFixed(1)}°C — ${
        v > 35
          ? 'hot summer, possible heat/moisture stress on microbes'
          : v > 20
          ? 'warm summer peak'
          : 'cool summer peak'
      }.`,
  },

  bio06: {
    display: 'Min temp of coldest month',
    description:
      'WorldClim mean of the daily min temperature in the coldest month of the year.',
    mechanism:
      'Defines the depth and duration of microbial dormancy in winter; deep-cold winters shorten the active season and lower annual Rs.',
    units: '°C',
    formatValue: (v) => v.toFixed(1),
    local: (v) =>
      `At this cell: ${v.toFixed(1)}°C — ${
        v < -10
          ? 'severe winter cold, long microbial dormancy'
          : v < 5
          ? 'cold winters but liquid water seasonally available'
          : 'mild winters, near-year-round activity'
      }.`,
  },

  bio12: {
    display: 'Annual precipitation',
    description:
      'WorldClim total annual precipitation summed across all months.',
    mechanism:
      'Water availability controls microbial mobility and enzyme function; too little limits activity, too much depletes oxygen.',
    units: 'mm/yr',
    formatValue: (v) => v.toFixed(0),
    local: (v) =>
      `At this cell: ${v.toFixed(0)} mm/yr — ${
        v > 1500
          ? 'wet climate, possible waterlogging and anaerobic limitation'
          : v > 500
          ? 'moderate moisture, generally favourable for Rs'
          : 'dry climate, moisture-limited microbial activity'
      }.`,
  },

  bio14: {
    display: 'Precip of driest month',
    description:
      'WorldClim precipitation total in the driest month of the year.',
    mechanism:
      'Carries the dry-season floor on soil moisture; very low values translate to long soil-moisture limitation windows that interrupt Rs.',
    units: 'mm',
    formatValue: (v) => v.toFixed(0),
    local: (v) =>
      `At this cell: ${v.toFixed(0)} mm — ${
        v < 10
          ? 'pronounced dry season, microbial activity may halt'
          : 'rainfall sustained year-round, no strong drought floor'
      }.`,
  },

  bio15: {
    display: 'Precip seasonality',
    description:
      'WorldClim coefficient of variation in monthly precipitation — a unitless measure of how peaked rainfall is across the year.',
    mechanism:
      'High seasonality means flushes of microbial activity after rains (the "Birch effect"), but lower mean activity through dry months.',
    units: '',
    formatValue: (v) => v.toFixed(0),
    local: (v) =>
      `At this cell: ${v.toFixed(0)} — ${
        v > 100
          ? 'strongly monsoonal pattern, flush-and-dry pulse regime'
          : v > 50
          ? 'distinct wet/dry seasons'
          : 'rainfall fairly even across the year'
      }.`,
  },

  bio17: {
    display: 'Precip of driest quarter',
    description:
      'WorldClim precipitation total for the driest consecutive 3-month period.',
    mechanism:
      'Quarter-scale rainfall floor is what most ground-level microbial communities track over their seasonal cycle.',
    units: 'mm',
    formatValue: (v) => v.toFixed(0),
    local: (v) =>
      `At this cell: ${v.toFixed(0)} mm — ${
        v < 30
          ? 'extended dry quarter, sustained moisture limitation'
          : v < 100
          ? 'short dry quarter'
          : 'no clear dry quarter — wet year-round'
      }.`,
  },

  // ─── Soil features (not in F+NPP but referenced by sibling models) ───
  // Included so the knowledge base is complete; the F+NPP atlas SHAP
  // top-3 will not surface these because they aren't model inputs.

  soc: {
    display: 'Soil organic carbon',
    description:
      'SoilGrids 2.0 estimate of soil organic carbon in the top 30 cm.',
    mechanism:
      'SOC is the primary substrate pool for heterotrophic microbes; more SOC generally means more potential respiration, modulated by clay protection.',
    units: 'g/kg',
    formatValue: (v) => v.toFixed(1),
    local: (v) =>
      `At this cell: ${v.toFixed(1)} g/kg — ${
        v > 50
          ? 'carbon-rich soil, abundant substrate'
          : v > 20
          ? 'moderate SOC, typical agricultural/grassland soils'
          : 'carbon-poor soil, substrate-limited'
      }.`,
  },

  clay: {
    display: 'Soil clay fraction',
    description:
      'SoilGrids 2.0 estimate of clay fraction in the top 30 cm (% by weight).',
    mechanism:
      'Clay protects organic carbon from microbial access via mineral binding — high-clay soils often show suppressed respiration despite holding more SOC. The clay–Rs correlation actually flips sign between Asia (+0.302) and US (−0.048), one of the key findings of this work.',
    units: '%',
    formatValue: (v) => v.toFixed(1),
    local: (v) =>
      `At this cell: ${v.toFixed(1)}% clay — ${
        v > 35
          ? 'clay-dominated soil, strong mineral-C protection'
          : v > 15
          ? 'mixed-texture soil'
          : 'sandy soil, weaker C protection'
      }.`,
  },

  sand: {
    display: 'Soil sand fraction',
    description:
      'SoilGrids 2.0 estimate of sand fraction in the top 30 cm (% by weight).',
    mechanism:
      'Sand-dominated soils have less water-holding capacity and weaker organic-matter protection — usually associated with lower SOC but faster turnover of what is there.',
    units: '%',
    formatValue: (v) => v.toFixed(1),
    local: (v) =>
      `At this cell: ${v.toFixed(1)}% sand.`,
  },
};

/**
 * Look up a feature description by raw key (e.g. "npp", "bio01"). Returns
 * a fallback entry when the key isn't in the knowledge base, so the
 * UI never crashes on an unknown feature.
 */
export function getFeatureDescription(key: string): FeatureDescription {
  const known = FEATURE_DESCRIPTIONS[key];
  if (known) return known;
  return {
    display: key,
    description: `Model input feature: ${key}. No description available.`,
    mechanism:
      'Effect on soil respiration not yet documented in this knowledge base.',
    units: '',
    formatValue: (v) => v.toFixed(2),
    local: (v) => `At this cell: ${v.toFixed(2)}.`,
  };
}

/**
 * Resolve the displayed numeric value for a raw model-input value.
 * Applies the feature's `displayValue` transform if defined, otherwise
 * passes through.
 */
export function resolveDisplayValue(key: string, raw: number): number {
  const desc = FEATURE_DESCRIPTIONS[key];
  return desc?.displayValue ? desc.displayValue(raw) : raw;
}

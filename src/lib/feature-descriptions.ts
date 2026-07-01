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
      'Satellite estimate of yearly net primary productivity — how much carbon plants capture — from the MODIS MOD17A3HGF product.',
    mechanism:
      'More plant growth feeds soil microbes more food, through root exudates and fallen leaves, so respiration climbs.',
    units: 'g C/m²/yr',
    // MOD17 NPP raw is scaled (kg C/m²/yr × 10000 = raw integer). The
    // build_atlas_lookup.py emits raw model-input units, so we divide
    // by 10 to display as g C/m²/yr.
    displayValue: (v) => v / 10,
    formatValue: (v) => v.toFixed(0),
    local: (v) =>
      `At this cell: ${v.toFixed(0)} g C/m²/yr — ${
        v > 600
          ? 'high productivity, plenty of food for soil microbes'
          : v > 300
          ? 'moderate productivity, typical of mid-latitude regions'
          : 'low productivity, little food to go around'
      }.`,
  },

  lst_day: {
    display: 'MODIS LST (day)',
    description:
      'Daytime land-surface temperature from MODIS, averaged over 2020–2024 daytime passes (the MOD11A2 product).',
    mechanism:
      'Daytime warmth sets how fast microbial enzymes work near the surface, and how easily their food moves through the moisture in the soil.',
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
      'Nighttime land-surface temperature from MODIS, averaged over 2020–2024 night passes (the MOD11A2 product).',
    mechanism:
      'Nighttime warmth sets the floor on microbial activity over the day–night cycle; a cold night shuts activity down for hours at a stretch.',
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
      'The day-to-night swing in land-surface temperature (worked out as daytime minus nighttime LST).',
    mechanism:
      'A bigger day–night swing usually means clearer skies and drier ground — which push more of the day’s respiration into the afternoon peak and can lower the daily average.',
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
      'WorldClim 2.1 average annual air temperature, over 1970–2000.',
    mechanism:
      'Warmer temperatures speed up microbial enzymes — the well-known Q10 rule, that reaction rates rise with heat — though extreme heat can also dry the soil out and stall activity.',
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
      'How much monthly temperatures swing across the year (WorldClim, the standard deviation × 100 — a unitless score).',
    mechanism:
      'Big swings usually mean continental climates with long, cold winters, squeezing microbial activity into a short window and lowering the yearly total.',
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
      'WorldClim average of the daily high in the hottest month of the year.',
    mechanism:
      'Sets the ceiling on how fast microbial enzymes can run; in dry regions it also bakes moisture out of the soil, which can stall respiration quickly.',
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
      'WorldClim average of the daily low in the coldest month of the year.',
    mechanism:
      'Sets how deep and how long microbes go dormant in winter; brutally cold winters shorten the active season and lower the yearly total.',
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
      'WorldClim total yearly precipitation, summed over all months.',
    mechanism:
      'Water is what lets microbes move and their enzymes work; too little starves activity, too much drowns out the oxygen they need.',
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
      'Marks how dry the driest month gets; very low values mean long stretches where a lack of moisture puts respiration on hold.',
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
      'How uneven rainfall is across the year (WorldClim’s coefficient of variation — a unitless score).',
    mechanism:
      'Very uneven rainfall brings bursts of microbial activity right after rains — the so-called Birch effect — but slower activity through the dry months.',
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
      'WorldClim precipitation total for the driest run of three consecutive months.',
    mechanism:
      'The rainfall low over a whole season is what most soil microbial communities actually track through the year.',
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
      'Organic carbon is the main food supply for the microbes that break it down; more of it usually means more potential respiration, though clay can lock some of it away.',
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
      'Clay locks organic carbon away from microbes by binding it to mineral surfaces, so clay-rich soils often respire less even while holding more carbon. Strikingly, the clay–respiration relationship flips sign between Asia (+0.302) and the US (−0.048) — one of this project’s key findings.',
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
      'Sandy soils hold less water and shield organic matter poorly — usually less carbon overall, but what is there breaks down faster.',
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

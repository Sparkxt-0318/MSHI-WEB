import type { Metadata } from 'next';
import Link from 'next/link';
import { SectionLabel } from '@/components/site/section-label';
import { Callout } from '@/components/site/callout';
import { SiteFooter } from '@/components/site/site-footer';

export const metadata: Metadata = {
  title: 'Methods',
  description:
    'Data sources, feature engineering, model architecture, validation methodology, and sample-size notes for the MSHI-Geo continental ML upscaling.',
};

const FEATURE_GROUPS = [
  {
    name: 'SoilGrids 2.0',
    count: 8,
    items:
      'Bulk density, clay %, sand %, silt %, soil organic carbon, cation exchange capacity, pH (H₂O), nitrogen — all at 0–30 cm.',
  },
  {
    name: 'WorldClim 2.1 bioclim',
    count: 8,
    items:
      'Mean annual temperature, mean diurnal range, isothermality, temperature seasonality, max temperature warmest month, mean temperature wettest quarter, annual precipitation, precipitation seasonality.',
  },
  {
    name: 'MODIS continuous',
    count: 4,
    items:
      'Annual NPP (MOD17A3), annual mean LST (MOD11A2), NDVI annual mean (MOD13Q1), tree cover percent (MOD44B).',
  },
  {
    name: 'Engineered ratios',
    count: 4,
    items:
      'C:N ratio, clay:sand ratio, MAT × MAP product, NPP / annual precipitation (water-use efficiency proxy).',
  },
  {
    name: 'Categorical',
    count: 1,
    items: 'IGBP land-cover class (one-hot encoded into 17 categories).',
  },
];

export default function MethodsPage() {
  return (
    <>
      <section className="section-band border-b border-rule bg-paper">
        <div className="container-narrow">
          <SectionLabel number="·" label="Methods" />
          <h1 className="display-title mt-6 max-w-[16ch]">Methods.</h1>
          <p className="mt-8 max-w-prose text-lg leading-relaxed text-ink-soft">
            How the MSHI-Geo continental atlas is built. Data sources,
            features, model, and the cross-continental validation that lets
            us report a held-out R² rather than an in-sample one.
          </p>
        </div>
      </section>

      <article className="section-band bg-paper">
        <div className="container-narrow">
          {/* Data sources */}
          <h2 className="font-serif text-3xl font-bold leading-tight text-ink">
            Data sources
          </h2>
          <div className="body-prose mt-5">
            <p>
              All training and evaluation chamber data are drawn from two
              public databases:{' '}
              <Link
                href="https://github.com/bpbond/srdb"
                className="link-arrow"
                target="_blank"
                rel="noreferrer noopener"
              >
                SRDB v5
              </Link>{' '}
              (the Soil Respiration Database, Bond-Lamberty &amp; Thomson
              2018) and{' '}
              <Link
                href="https://github.com/bpbond/cosore"
                className="link-arrow"
                target="_blank"
                rel="noreferrer noopener"
              >
                COSORE
              </Link>{' '}
              (a continuous Rs database, Bond-Lamberty et&nbsp;al. 2020).
              Annual Rs values are extracted, harmonized to gC m⁻² yr⁻¹, and
              filtered to sites with at least one full year of measurement.
            </p>
            <p>
              Predictor rasters are sampled at each chamber site location:
              <Link
                href="https://www.isric.org/explore/soilgrids"
                className="link-arrow ml-1"
                target="_blank"
                rel="noreferrer noopener"
              >
                SoilGrids 2.0
              </Link>{' '}
              for soil physicochemistry,{' '}
              <Link
                href="https://www.worldclim.org/data/worldclim21.html"
                className="link-arrow"
                target="_blank"
                rel="noreferrer noopener"
              >
                WorldClim 2.1
              </Link>{' '}
              for bioclimatic variables, and four{' '}
              <Link
                href="https://lpdaac.usgs.gov/products/mod17a3hgfv006/"
                className="link-arrow"
                target="_blank"
                rel="noreferrer noopener"
              >
                MODIS
              </Link>{' '}
              continuous fields including the rank-1 SHAP feature: NPP from
              MOD17A3HGF.
            </p>
          </div>

          <Callout label="Sample size">
            Asia training: <strong>n = 600</strong> for the F (climate +
            soils) configuration; <strong>n = 463</strong> for the F+NPP
            configuration after dropping cells where MODIS NPP is NaN
            (24% of training cells, predominantly bare ground / desert).
            US held-out test: <strong>n = 274</strong> (intersection of
            SRDB+COSORE coverage with the F+NPP non-NaN mask).
          </Callout>

          {/* Features */}
          <h2 className="mt-16 font-serif text-3xl font-bold leading-tight text-ink">
            Feature engineering
          </h2>
          <p className="body-prose mt-5">
            The full feature set comprises 25 columns across five groups.
            The headline F+NPP configuration uses 17: the 8 SoilGrids
            soil features, the 8 WorldClim bioclim features, and MODIS NPP.
          </p>
          <ul className="mt-6 space-y-3 border-y border-rule py-6">
            {FEATURE_GROUPS.map((g) => (
              <li key={g.name} className="grid gap-2 md:grid-cols-12">
                <p className="md:col-span-3 font-mono text-[0.78rem] uppercase tracking-meta text-accent">
                  {g.name}
                </p>
                <p className="md:col-span-1 font-serif text-2xl font-bold leading-none text-ink">
                  {g.count}
                </p>
                <p className="md:col-span-8 text-[0.95rem] leading-relaxed text-ink">
                  {g.items}
                </p>
              </li>
            ))}
          </ul>

          {/* Model */}
          <h2 className="mt-16 font-serif text-3xl font-bold leading-tight text-ink">
            Model architecture
          </h2>
          <div className="body-prose mt-5">
            <p>
              XGBoost regressor, gradient-boosted decision trees on tabular
              features. Hyperparameters are swept on each spatial-block CV
              fold independently and the best configuration retained for
              the held-out US evaluation. Final hyperparameters fall in a
              standard regularized regime — max_depth 5–7, learning rate
              0.03–0.06, n_estimators 400–1200 — selected by within-Asia
              spatial-block CV mean R².
            </p>
            <p>
              SHAP (TreeExplainer) is used for the feature attribution
              analysis on the homepage. SHAP values are computed
              independently per held-out fold and aggregated by mean
              absolute value to produce the rank ordering reported.
            </p>
          </div>

          <Callout label="Why XGBoost">
            We tested random forests, gradient-boosted trees, and a small
            MLP. XGBoost dominated within-Asia spatial-block CV at every
            sample size we tried, with the gap widening at smaller n. The
            absolute transfer R² was robust to the specific tree-ensemble
            choice — what mattered was the <em>feature set</em>, not the
            learner.
          </Callout>

          {/* Validation */}
          <h2 className="mt-16 font-serif text-3xl font-bold leading-tight text-ink">
            Validation methodology
          </h2>
          <div className="body-prose mt-5">
            <p>
              Two layers of held-out evaluation, in this order:
            </p>
            <ol className="ml-6 list-decimal space-y-3">
              <li>
                <strong>Within-Asia spatial-block CV</strong> with 5° latitude
                bands — 5 folds, no chamber site appears in both train and
                test of any fold. This protects against the spatial-leak
                artifact that inflates conventional random-fold CV on
                geographic data.
              </li>
              <li>
                <strong>Asia → US held-out transfer</strong>. The model
                trained on the full Asian training set is applied to the
                274 US sites. R² and RMSE are computed against held-out
                chamber Rs. The 95% confidence interval on the transfer R²
                is computed by 2 000-iteration bootstrap resampling of the
                US site set with replacement.
              </li>
            </ol>
            <p>
              The headline F+NPP result — R² = +0.145, 95% CI [+0.026,
              +0.241] — is reported from this second layer. The CI
              excludes zero, which is the testable claim: <em>the
              Asia-trained F+NPP model contains predictive information
              about US soil respiration beyond the climatological mean.</em>
            </p>
          </div>

          <Callout label="Comparison configurations">
            <strong>F</strong> (climate + soils, no MODIS): transfer R² ≈ 0,
            CI overlaps zero. <strong>Full+MODIS</strong> (F + engineered
            ratios + IGBP one-hot): transfer R² &lt; 0 (worse than the
            mean), CI excludes zero on the wrong side. <strong>F+NPP</strong>{' '}
            is the best of any tested configuration. Köppen and IGBP
            stratification both fail to recover transfer when used as
            additional features.
          </Callout>

          <h2 className="mt-16 font-serif text-3xl font-bold leading-tight text-ink">
            Reproducibility
          </h2>
          <p className="body-prose mt-5">
            All training data manifests, feature extraction scripts, model
            artifacts (xgb_*.json), and held-out scoring routines are
            published at{' '}
            <Link
              href="https://github.com/Sparkxt-0318/MSHI"
              className="link-arrow"
              target="_blank"
              rel="noreferrer noopener"
            >
              github.com/Sparkxt-0318/MSHI
            </Link>
            . The atlas raster overlays on this site are exported directly
            from the same model artifacts.
          </p>
        </div>
      </article>

      <SiteFooter />
    </>
  );
}

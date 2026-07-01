import type { Metadata } from 'next';
import Link from 'next/link';
import { SectionLabel } from '@/components/site/section-label';
import { Callout } from '@/components/site/callout';
import { SiteFooter } from '@/components/site/site-footer';

export const metadata: Metadata = {
  title: 'Methods',
  description:
    'How the MSHI-Geo continental map is built: where the data comes from, which inputs the model uses, the model itself, how it was validated, and the sample-size caveats.',
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
            How the MSHI-Geo continental atlas is built: where the data comes
            from, which inputs the model uses, the model itself, and the
            cross-continental test that lets us report a held-out R² (scored on
            data the model never saw) rather than an in-sample one (scored on
            the very data it trained on).
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
              All the chamber measurements used for training and testing come
              from two public databases:{' '}
              <Link
                href="https://github.com/bpbond/srdb"
                className="link-arrow"
                target="_blank"
                rel="noreferrer noopener"
              >
                SRDB v5
              </Link>{' '}
              (the Soil Respiration Database; Bond-Lamberty &amp; Thomson
              2018) and{' '}
              <Link
                href="https://github.com/bpbond/cosore"
                className="link-arrow"
                target="_blank"
                rel="noreferrer noopener"
              >
                COSORE
              </Link>{' '}
              (a database of continuous soil-respiration records; Bond-Lamberty
              et&nbsp;al. 2020). We pull out the annual respiration (Rs) values,
              convert them all to the same units (gC m⁻² yr⁻¹), and keep only
              sites with at least one full year of measurement.
            </p>
            <p>
              At each of those sites we also read off a stack of map layers as
              the model&apos;s inputs:
              <Link
                href="https://www.isric.org/explore/soilgrids"
                className="link-arrow ml-1"
                target="_blank"
                rel="noreferrer noopener"
              >
                SoilGrids 2.0
              </Link>{' '}
              for the soil&apos;s physical and chemical properties,{' '}
              <Link
                href="https://www.worldclim.org/data/worldclim21.html"
                className="link-arrow"
                target="_blank"
                rel="noreferrer noopener"
              >
                WorldClim 2.1
              </Link>{' '}
              for climate, and four continuous{' '}
              <Link
                href="https://lpdaac.usgs.gov/products/mod17a3hgfv006/"
                className="link-arrow"
                target="_blank"
                rel="noreferrer noopener"
              >
                MODIS
              </Link>{' '}
              satellite layers — including the model&apos;s single most
              important input (its rank-1 SHAP feature), plant productivity
              (NPP) from MOD17A3HGF.
            </p>
          </div>

          <Callout label="Sample size">
            Asia training: <strong>n = 600</strong> for the F setup (climate +
            soils); <strong>n = 463</strong> for the F+NPP setup, once we drop
            the cells where the satellite NPP value is missing (NaN) — 24% of
            training cells, mostly bare ground and desert. US held-out test:{' '}
            <strong>n = 274</strong> (the SRDB+COSORE sites that also have a
            valid F+NPP value).
          </Callout>

          {/* Features */}
          <h2 className="mt-16 font-serif text-3xl font-bold leading-tight text-ink">
            Feature engineering
          </h2>
          <p className="body-prose mt-5">
            The full input set is 25 columns across five groups. The headline
            F+NPP setup uses 17 of them: the 8 SoilGrids soil features, the 8
            WorldClim climate (bioclim) features, and MODIS NPP.
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
              The model is an XGBoost regressor — gradient-boosted decision
              trees, a standard workhorse for table-shaped data. Its settings
              (hyperparameters) are tuned separately on each spatial-block
              cross-validation fold, and the best combination is carried
              forward to the held-out US test. The final settings land in an
              ordinary, well-regularized range — max_depth 5–7, learning rate
              0.03–0.06, n_estimators 400–1200 — chosen by the mean R² across
              the within-Asia spatial-block folds.
            </p>
            <p>
              To see which inputs the model actually leans on, we use SHAP (with
              the TreeExplainer algorithm) — a standard way to attribute a
              prediction to its inputs. SHAP values are computed separately for
              each held-out fold and averaged by absolute value to give the
              rankings shown on the homepage.
            </p>
          </div>

          <Callout label="Why XGBoost">
            We tried random forests, gradient-boosted trees, and a small neural
            network (an MLP). XGBoost won the within-Asia spatial-block
            cross-validation at every sample size we tested, and its lead grew
            as the sample shrank. The transfer R² itself barely moved when we
            swapped one tree-based model for another — what mattered was the
            choice of <em>inputs</em>, not the learner.
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
                <strong>Within-Asia spatial-block cross-validation</strong>{' '}
                using 5° latitude bands — 5 folds, and no chamber site ever
                appears in both the training and test halves of a fold. This
                guards against a subtle trap (spatial leakage) that makes
                ordinary random-split cross-validation look better than it
                should on geographic data.
              </li>
              <li>
                <strong>Asia → US held-out transfer</strong>. The model,
                trained on the full Asian set, is then turned loose on the
                274 US sites it has never seen. We score its predictions against
                the real chamber measurements (R² and RMSE — root-mean-square
                error), and put a 95% confidence interval on the transfer R² by
                bootstrap resampling — drawing the US sites at random, with
                replacement, 2 000 times.
              </li>
            </ol>
            <p>
              The headline F+NPP result — R² = +0.145, 95% CI [+0.026,
              +0.241] — comes from this second layer. Because that interval
              sits entirely above zero, we can make a real, testable claim:{' '}
              <em>the Asia-trained F+NPP model carries genuine predictive
              information about US soil respiration, beyond what the average
              climate alone would tell you.</em>
            </p>
          </div>

          <h2
            id="configurations"
            className="mt-16 font-serif text-3xl font-bold leading-tight text-ink"
          >
            Model configuration comparison
          </h2>
          <div className="body-prose mt-5">
            <p>
              We tested how well five different setups carry across continents.
              F+NPP gives the best held-out US R²; setups with more soil
              features, or split by climate zone, produce confidence intervals
              that touch or cross zero — results you can&apos;t tell apart from
              no skill at all.
            </p>
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full border border-rule font-sans text-[0.92rem] text-ink">
              <thead className="border-b border-rule bg-cream/60">
                <tr>
                  <th className="px-3 py-2 text-left font-mono text-[0.7rem] uppercase tracking-meta text-ink-soft">
                    Configuration
                  </th>
                  <th className="px-3 py-2 text-right font-mono text-[0.7rem] uppercase tracking-meta text-ink-soft">
                    Transfer R²
                  </th>
                  <th className="px-3 py-2 text-right font-mono text-[0.7rem] uppercase tracking-meta text-ink-soft">
                    95% CI
                  </th>
                  <th className="px-3 py-2 text-right font-mono text-[0.7rem] uppercase tracking-meta text-ink-soft">
                    n_train
                  </th>
                  <th className="px-3 py-2 text-left font-mono text-[0.7rem] uppercase tracking-meta text-ink-soft">
                    Takeaway
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-rule">
                  <td className="px-3 py-2 font-mono text-[0.85rem]">F (climate only)</td>
                  <td className="px-3 py-2 text-right font-mono text-[0.85rem]">+0.127</td>
                  <td className="px-3 py-2 text-right font-mono text-[0.78rem] text-ink-soft">
                    [+0.020, +0.212]
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-[0.85rem]">600</td>
                  <td className="px-3 py-2">
                    Climate alone already carries across continents.
                  </td>
                </tr>
                <tr className="border-b border-rule bg-cream/40">
                  <td className="px-3 py-2 font-mono text-[0.85rem] font-bold">F+NPP</td>
                  <td className="px-3 py-2 text-right font-mono text-[0.85rem] font-bold">
                    +0.145
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-[0.78rem] text-ink-soft">
                    [+0.026, +0.241]
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-[0.85rem]">463</td>
                  <td className="px-3 py-2">
                    Best transfer; satellite NPP (MODIS) is the top-ranked SHAP
                    driver.
                  </td>
                </tr>
                <tr className="border-b border-rule">
                  <td className="px-3 py-2 font-mono text-[0.85rem]">Full+MODIS</td>
                  <td className="px-3 py-2 text-right font-mono text-[0.85rem]">+0.072</td>
                  <td className="px-3 py-2 text-right font-mono text-[0.78rem] text-ink-soft">
                    [−0.084, +0.189]
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-[0.85rem]">463</td>
                  <td className="px-3 py-2">
                    More features hurt; the interval spans zero.
                  </td>
                </tr>
                <tr className="border-b border-rule">
                  <td className="px-3 py-2 font-mono text-[0.85rem]">Köppen C subset</td>
                  <td className="px-3 py-2 text-right font-mono text-[0.85rem]">−0.336</td>
                  <td className="px-3 py-2 text-right font-mono text-[0.78rem] text-ink-soft">
                    [−1.060, +0.035]
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-[0.85rem]">247</td>
                  <td className="px-3 py-2">
                    Splitting by climate zone fails; the interval is almost
                    entirely below zero.
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-mono text-[0.85rem]">Köppen D subset</td>
                  <td className="px-3 py-2 text-right font-mono text-[0.85rem]">−0.199</td>
                  <td className="px-3 py-2 text-right font-mono text-[0.78rem] text-ink-soft">
                    [−0.392, −0.061]
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-[0.85rem]">244</td>
                  <td className="px-3 py-2">
                    Splitting by climate zone fails differently; the interval is
                    entirely below zero.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="body-prose mt-6">
            <p>
              Taken together, the five setups point to a real-world limit on
              cross-continental transfer, not just a statistical one. Adding
              features (Full+MODIS) hurts rather than helps, so the fix
              isn&apos;t simply more data. Splitting by Köppen climate zone
              fails in two separate climate categories, so the problem
              isn&apos;t really about climate — it is rooted in soil and biology
              specific to each region. F+NPP succeeds where the others fail
              because MODIS NPP captures a biological signal that does travel
              between continents, while the soil features and climate-only
              splits do not.
            </p>
          </div>

          <h2 className="mt-16 font-serif text-3xl font-bold leading-tight text-ink">
            Reproducibility
          </h2>
          <p className="body-prose mt-5">
            The training-data manifests, feature-extraction scripts, model
            files (xgb_*.json), and held-out scoring routines are available on
            request. The atlas map layers on this site are exported straight
            from those same model files.
          </p>
        </div>
      </article>

      <SiteFooter />
    </>
  );
}

# Blockers and design decisions

A brief log of things this scaffolding run could not finish, and design
decisions made unilaterally where the brief left a defensible choice
to the implementer.

## Hard blockers

None. The site builds, the routes render, and every requested feature
has scaffolding plus a clearly-labeled placeholder where user input is
needed.

## Soft blockers (need user input to become "real")

1. **Mapbox public access token.** The `/atlas` page renders a
   deliberate "setup required" panel until `NEXT_PUBLIC_MAPBOX_TOKEN`
   is set. Cannot be filled in autonomously since it is account-bound.
2. **Image assets.** Four PNGs and one PDF must be supplied by the
   user — see `SUMMARY_FOR_USER.md` §"What needs your input".
3. **Biosensor sample data.** The gallery ships three explicit
   placeholders. Real `BiosensorSample` records (and the four
   electrochemistry CSVs per sample) must come from the published
   dataset.

## Design decisions made by the implementer

These were calls the brief explicitly invited ("make a defensible
choice and note it"). Each is reversible.

### Branch name

Brief asked for `claude/scaffold`; the harness pinned the working
branch to `claude/build-mshi-website-mxv1R`. Worked on the harness-
specified branch. Rename instructions are in `SUMMARY_FOR_USER.md`.

### Mapbox basemap

Default style is `mapbox://styles/mapbox/light-v11`. Quiet, off-white
land, no road labels. Closest stock match to the Bedrock palette
without authoring a custom Studio style. Override via
`NEXT_PUBLIC_MAPBOX_STYLE`.

### Atlas overlay coordinate bounds

Hard-coded the F+NPP raster bounds to `[60°E–150°E, 0°N–60°N]`. This
is a reasonable Asian study-domain rectangle but may not match the
exact extent of your published raster. Edit
`src/components/atlas/atlas-map.tsx:62-67` if needed.

### Carbon flux comparison numbers

Section 01 ships actual published global means: fossil fuels ~10,
soil Rs ~91, GPP ~120 (Pg C yr⁻¹). Citation footnote attributes them
to Friedlingstein 2022, Beer 2010, and Bond-Lamberty & Thomson 2018
respectively. These are not invented; they are well-known values.
If you'd rather cite different sources, edit `carbon-flux-chart.tsx`.

### Electrochemistry trace shapes

Generated deterministically from physics-motivated functions
(Cottrell-like decay for CA, sinusoidal sweep with Gaussian peaks
for CV, log drift for OCP, single Gaussian for DPV). They look like
real electrochemistry but are computed, not measured. Each panel
where they appear carries a "Placeholder · example data" badge so the
viewer cannot confuse them with real samples.

### Three placeholder samples vs. six

Shipped three. Brief allowed 3–6. Three was enough to demonstrate
all three classifier outputs (Healthy, Unhealthy, Saline-stressed)
and to fill a `lg:grid-cols-3` row cleanly. Add more by appending
to `PLACEHOLDER_SAMPLES`.

### Methods page voice

Wrote the methods page in the voice of a research paper's methods
section. Tightened the brief's bullet outline into prose with
embedded callouts for the headline numbers. No new numerical
results were invented. Speculative claims (e.g., the line about
XGBoost dominating "at every sample size we tried") are hedged
and explicitly flagged in `SUMMARY_FOR_USER.md` as invitations to
edit.

### Footer BibTeX

Placeholder BibTeX uses `{${siteConfig.year}}` interpolation so
that updating the year in `src/lib/site-config.ts` propagates to
the citation. Title, author, journal stay as `[placeholders]`
until you fill them in.

### "Research portfolio" branding

The site nav reads `MSHI · research portfolio`. Brief was explicit
about not signaling SaaS / startup. The wordmark uses the project's
acronym only; institutional affiliation lives in the hero band and
footer where it can be edited in one place via `site-config.ts`.

### What I deliberately did not build

- No analytics, sitemap, robots.txt, or social OG images.
- No "Get Started" / "Sign Up" / "Pricing" / "Trusted by" patterns.
- No emoji in headers or section labels.
- No autoplay, parallax, or hero carousels.
- No drop shadows on cards beyond the one on the atlas-teaser
  overlay card and the modal dialog (per the brief's "use sparingly,
  low-opacity" guidance).
- No stock photos.
- No backwards-compatibility shims or unused exports.

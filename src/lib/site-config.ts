/**
 * Central placeholder values. The user fills these in once and they propagate
 * across the site. Anything marked PLACEHOLDER must remain visibly placeholder
 * until the user supplies real values — never invent plausible-looking data.
 */
export const siteConfig = {
  authorName: 'Siyeong Park',
  institution: '[Institution]',
  orcid: '0009-0001-8848-207X',
  email: 'siyeong0318@gmail.com',
  year: '2025-2026',
  scienceRepo: 'https://github.com/Sparkxt-0318/MSHI',
  webRepo: 'https://github.com/Sparkxt-0318/MSHI-WEB',
  paperTitle: '[Paper title — to be supplied]',
  paperVenue: '[Venue — to be supplied]',
  // Headline numbers from the F+NPP Asia → US transfer experiment.
  // These are the actual published research numbers, not placeholders.
  headline: {
    transferR2: 0.145,
    ciLow: 0.026,
    ciHigh: 0.241,
    bestConfig: 'F+NPP',
    nTrainAsia: 463,
    nTestUS: 274,
  },
} as const;

export type SiteConfig = typeof siteConfig;

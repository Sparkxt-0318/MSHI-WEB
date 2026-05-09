import { SectionHero } from '@/components/home/section-hero';
import { SectionProblem } from '@/components/home/section-problem';
import { SectionFramework } from '@/components/home/section-framework';
import { SectionAtlasTeaser } from '@/components/home/section-atlas-teaser';
import { SiteFooter } from '@/components/site/site-footer';

export default function HomePage() {
  return (
    <>
      <SectionHero />
      <SectionProblem />
      <SectionFramework />
      <SectionAtlasTeaser />
      <SiteFooter />
    </>
  );
}

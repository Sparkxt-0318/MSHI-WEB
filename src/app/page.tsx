import { SectionHero } from '@/components/home/section-hero';
import { SectionProblem } from '@/components/home/section-problem';
import { SectionFramework } from '@/components/home/section-framework';
import { SectionAtlasTeaser } from '@/components/home/section-atlas-teaser';
import { SectionMechanism } from '@/components/home/section-mechanism';
import { SectionBiosensor } from '@/components/home/section-biosensor';
import { SectionIntegration } from '@/components/home/section-integration';
import { SectionRoadmap } from '@/components/home/section-roadmap';
import { SiteFooter } from '@/components/site/site-footer';

export default function HomePage() {
  return (
    <>
      <SectionHero />
      <SectionProblem />
      <SectionFramework />
      <SectionAtlasTeaser />
      <SectionMechanism />
      <SectionBiosensor />
      <SectionIntegration />
      <SectionRoadmap />
      <SiteFooter />
    </>
  );
}

'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
  type MotionValue,
} from 'framer-motion';
import { Reveal } from '@/components/site/reveal';
import { SimulationPoster } from '@/components/simulation/simulation-poster';
import { BiosensorIcon, ChamberIcon, GlobeIcon } from './scale-icons';
import { SoilChamberLayer, AtlasLayer } from './zoom-layers';

const ZoomCell = dynamic(() => import('./zoom-cell').then((m) => m.ZoomCell), {
  ssr: false,
  loading: () => <SimulationPoster className="h-full w-full object-cover opacity-90" />,
});

/** Serializable tier data passed from the server section. */
interface Tier {
  scale: string;
  title: string;
  body: string;
  color: string;
}

// Components are resolved on the client (they can't cross the server→client prop boundary).
const TIER_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  cm: BiosensorIcon,
  m: ChamberIcon,
  km: GlobeIcon,
};

function detectWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (c.getContext('webgl') || c.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

/** One cross-fading tier label over the dark scope. */
function ZoomLabel({ tier, opacity }: { tier: Tier; opacity: MotionValue<number> }) {
  const Icon = TIER_ICONS[tier.scale] ?? BiosensorIcon;
  return (
    <motion.div
      style={{ opacity }}
      className="absolute inset-x-0 bottom-0 max-w-md rounded-md border border-white/10 bg-[#0a1628]/70 p-5 backdrop-blur-sm"
    >
      <div className="flex items-center gap-3">
        <span className="font-serif text-4xl font-bold leading-none text-cyan-200">{tier.scale}</span>
        <Icon className="h-9 w-9 text-cyan-100/80" />
      </div>
      <h3 className="mt-3 font-serif text-lg font-bold text-paper">{tier.title}</h3>
      <p className="mt-1.5 line-clamp-3 text-[0.85rem] leading-snug text-paper/70">{tier.body}</p>
    </motion.div>
  );
}

/** Static three-tier grid — the reduced-motion fallback (mirrors the original). */
function StaticTiers({ tiers }: { tiers: readonly Tier[] }) {
  return (
    <div className="container-research">
      <div className="mt-16 grid gap-12 md:grid-cols-3">
        {tiers.map((tier, idx) => {
          const Icon = TIER_ICONS[tier.scale] ?? BiosensorIcon;
          return (
            <Reveal key={tier.scale} delayMs={idx * 100}>
              <article className="flex h-full flex-col border-t border-rule pt-6">
                <div className="flex items-baseline justify-between">
                  <span className={`font-serif text-5xl font-bold leading-none ${tier.color}`}>
                    {tier.scale}
                  </span>
                  <Icon className={`h-14 w-14 ${tier.color}`} />
                </div>
                <h3 className="mt-6 font-serif text-xl font-bold leading-snug text-ink">{tier.title}</h3>
                <p className="mt-4 max-w-prose text-[0.95rem] leading-relaxed text-ink-soft">{tier.body}</p>
              </article>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}

export function ScaleZoom({ tiers }: { tiers: readonly Tier[] }) {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const [reduced, setReduced] = React.useState(false);
  const [webgl, setWebgl] = React.useState<boolean | null>(null);
  const [armed, setArmed] = React.useState(false);
  const [phase, setPhase] = React.useState<'cm' | 'm' | 'km'>('cm');
  const [mobile, setMobile] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    setMobile(window.matchMedia('(max-width: 768px)').matches);
    setWebgl(detectWebGL());
  }, []);

  React.useEffect(() => {
    const node = trackRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setArmed(true);
          obs.disconnect();
        }
      },
      { rootMargin: '40% 0px' },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, []);

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ['start start', 'end end'],
  });
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    setPhase(v < 0.4 ? 'cm' : v < 0.72 ? 'm' : 'km');
  });

  const cmScale = useTransform(scrollYProgress, [0, 0.42], [1, 0.18]);
  const cmOpacity = useTransform(scrollYProgress, [0, 0.3, 0.42], [1, 1, 0]);
  const mScale = useTransform(scrollYProgress, [0.12, 0.42, 0.55, 0.85], [0.28, 1, 1, 0.16]);
  const mOpacity = useTransform(scrollYProgress, [0.12, 0.34, 0.62, 0.82], [0, 1, 1, 0]);
  const kmScale = useTransform(scrollYProgress, [0.55, 0.9], [0.22, 1]);
  const kmOpacity = useTransform(scrollYProgress, [0.55, 0.78, 1], [0, 1, 1]);
  const kmDrift = useTransform(scrollYProgress, [0.85, 1], [1, 1.06]);

  const cmLabel = useTransform(scrollYProgress, [0.02, 0.12, 0.3, 0.4], [0, 1, 1, 0]);
  const mLabel = useTransform(scrollYProgress, [0.38, 0.48, 0.6, 0.7], [0, 1, 1, 0]);
  const kmLabel = useTransform(scrollYProgress, [0.7, 0.8, 1, 1], [0, 1, 1, 1]);
  const ctaOpacity = useTransform(scrollYProgress, [0.9, 0.97], [0, 1]);

  if (reduced) return <StaticTiers tiers={tiers} />;

  const showCell = armed && webgl !== false;

  return (
    <div
      id="framework-zoom"
      ref={trackRef}
      className="relative w-full"
      style={{ height: mobile ? '240svh' : '340svh' }}
    >
      <div
        className="sticky top-16 h-[calc(100svh-4rem)] w-full overflow-hidden"
        style={{
          background: 'radial-gradient(120% 95% at 50% 30%, #15324f 0%, #0A1628 72%)',
          contain: 'paint',
        }}
      >
        {/* cm — 3D cell */}
        <motion.div
          className="absolute inset-0"
          style={{ scale: cmScale, opacity: cmOpacity, willChange: 'transform, opacity' }}
        >
          {showCell ? (
            <ZoomCell active={phase === 'cm'} />
          ) : (
            <SimulationPoster className="h-full w-full object-cover opacity-90" />
          )}
        </motion.div>

        {/* m — soil chamber */}
        <motion.div
          className="absolute inset-0"
          style={{
            scale: mScale,
            opacity: mOpacity,
            transformOrigin: '50% 54%',
            willChange: 'transform, opacity',
          }}
        >
          <SoilChamberLayer />
        </motion.div>

        {/* km — satellite atlas */}
        <motion.div
          className="absolute inset-0"
          style={{
            scale: kmScale,
            opacity: kmOpacity,
            transformOrigin: '50% 54%',
            willChange: 'transform, opacity',
          }}
        >
          <motion.div className="absolute inset-0" style={{ scale: kmDrift }}>
            <AtlasLayer />
          </motion.div>
        </motion.div>

        {/* cross-fading labels */}
        <div className="pointer-events-none absolute inset-x-0 bottom-10">
          <div className="container-research">
            <div className="relative h-40 max-w-md">
              <ZoomLabel tier={tiers[0]} opacity={cmLabel} />
              <ZoomLabel tier={tiers[1]} opacity={mLabel} />
              <ZoomLabel tier={tiers[2]} opacity={kmLabel} />
            </div>
          </div>
        </div>

        {/* closing CTA into /atlas */}
        <motion.div className="absolute inset-x-0 bottom-10" style={{ opacity: ctaOpacity }}>
          <div className="container-research flex justify-end">
            <Link
              href="/atlas"
              className="link-arrow inline-flex items-center gap-2 !border-cyan-300/60 !text-cyan-200"
            >
              See it at continental scale <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </motion.div>

        {/* scroll affordance */}
        <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center">
          <span className="rounded-full border border-white/15 bg-[#0a1628]/60 px-3 py-1 font-mono text-[0.6rem] uppercase tracking-[0.1em] text-white/70 backdrop-blur-sm">
            Scroll to zoom out · cm → m → km
          </span>
        </div>
      </div>
    </div>
  );
}

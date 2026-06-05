'use client';

import * as React from 'react';
import { CellScene } from './cell-scene';
import { LiveTraces } from './live-traces';
import { PlaybackControls } from './playback-controls';
import { ScaleBridge } from './scale-bridge';
import { SceneCaption } from './scene-caption';
import { Scoreboard } from './scoreboard';
import { SCOPE_BG } from './sim-constants';
import { SimulationPoster } from './simulation-poster';
import { useTimeline } from './use-timeline';

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

export function SimulationStage() {
  const timeline = useTimeline();
  const { progressUi, playing, reducedMotion } = timeline;
  const scopeRef = React.useRef<HTMLDivElement>(null);
  const [webgl, setWebgl] = React.useState<boolean | null>(null);
  const startedRef = React.useRef(false);

  React.useEffect(() => {
    setWebgl(detectWebGL());
  }, []);

  // Autoplay once when the scope first scrolls into view (unless reduced motion).
  React.useEffect(() => {
    if (reducedMotion || webgl === false) return;
    const node = scopeRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !startedRef.current) {
            startedRef.current = true;
            timeline.play();
            obs.disconnect();
          }
        }
      },
      { threshold: 0.4 },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [reducedMotion, timeline, webgl]);

  const showHint = !playing && progressUi < 0.02 && webgl !== false && !reducedMotion;

  return (
    <div className="w-full">
      <div
        ref={scopeRef}
        className="relative w-full overflow-hidden rounded-lg border border-white/10 shadow-[0_18px_60px_-24px_rgba(14,17,22,0.55)]"
        style={{
          height: 'clamp(380px, 56vh, 560px)',
          background: `radial-gradient(120% 90% at 50% 22%, #15324f 0%, ${SCOPE_BG} 72%)`,
        }}
      >
        {webgl === false ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <SimulationPoster className="h-full w-full object-cover opacity-90" />
            <p className="absolute bottom-3 font-mono text-[0.6rem] uppercase tracking-meta text-white/60">
              3D unavailable — showing a still
            </p>
          </div>
        ) : (
          <>
            <CellScene progressRef={timeline.progressRef} reducedMotion={reducedMotion} />

            {/* top-right: live scoreboard */}
            <div className="pointer-events-none absolute right-3 top-3">
              <Scoreboard progressUi={progressUi} />
            </div>

            {/* bottom-left: self-drawing scope panels (hidden on the smallest screens) */}
            <div className="pointer-events-none absolute bottom-3 left-3 hidden sm:block">
              <LiveTraces subscribe={timeline.subscribe} />
            </div>

            {/* orbit hint */}
            {showHint ? (
              <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full border border-white/15 bg-[#0a1628]/70 px-3 py-1 font-mono text-[0.6rem] uppercase tracking-meta text-white/70 backdrop-blur-sm">
                Drag to look around
              </div>
            ) : null}

            <ScaleBridge progressUi={progressUi} />
          </>
        )}
      </div>

      {/* controls + caption (cream page chrome below the scope) */}
      <div className="mt-5">
        {reducedMotion ? (
          <p className="mb-3 font-mono text-[0.65rem] uppercase tracking-meta text-ink-soft">
            Reduced-motion is on — showing the final frame. Drag the slider to explore.
          </p>
        ) : null}
        <PlaybackControls timeline={timeline} />
        <div className="mt-4 border-t border-rule pt-4">
          <SceneCaption progressUi={progressUi} />
        </div>
      </div>
    </div>
  );
}

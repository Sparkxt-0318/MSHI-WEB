'use client';

import * as React from 'react';
import { Brain, Monitor, Play, Pause, RotateCcw } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MonitorConsole } from './monitor-console';
import { AiAdvisor } from './ai-advisor';
import { ScenarioSelector } from './scenario-selector';
import { useRedoxSystem } from './use-redox-system';

/**
 * The "Live System" area below the 3D time-lapse: one shared simulated
 * closed-loop system, surfaced through two tabs — the operator monitoring
 * console and the AI decision-support advisor. The experiment is gated behind
 * an explicit Start; both tabs act on the same state.
 */
export function LiveSystem() {
  const api = useRedoxSystem();
  const { running, started, start, pause, reset } = api;

  const status = !started
    ? { label: 'Idle', hex: '#3A4048' }
    : running
      ? { label: 'Live', hex: '#2C5F2D' }
      : { label: 'Paused', hex: '#B85C00' };

  const btn =
    'inline-flex items-center gap-2 rounded-md px-4 py-2 font-mono text-xs uppercase tracking-meta transition-colors';

  return (
    <div>
      <p className="meta-label">Live System · simulated</p>
      <h2 className="section-title mt-4 max-w-[24ch]">The closed loop, running live.</h2>
      <p className="mt-6 max-w-prose text-[1rem] leading-relaxed text-ink-soft">
        A simulated operator console for the bioelectrochemical remediation rig. Press
        <span className="text-ink"> Start</span> and it reads the soil&rsquo;s redox potential
        (its electrical push-and-pull) in real time, while an AI advisor suggests fixes grounded
        in soil science. Load a degraded soil — salty, heavy-metal, acidic, compacted, or
        biologically dead — and watch the AI re-diagnose the main problem and change its plan.
        Switch scenarios anytime, run the recommendation, and watch the reading move back toward
        the healthy window.
      </p>

      {/* experiment control bar */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-md border border-rule bg-paper p-3">
        <span className="flex items-center gap-2 px-1 font-mono text-[0.7rem] uppercase tracking-meta text-ink-soft">
          <span
            className={`inline-block h-2.5 w-2.5 rounded-full ${running ? 'animate-pulse' : ''}`}
            style={{ background: status.hex }}
          />
          Experiment · {status.label}
        </span>
        <div className="flex flex-wrap gap-2">
          {running ? (
            <button type="button" onClick={pause} className={`${btn} border border-rule text-ink-soft hover:border-ink hover:text-ink`}>
              <Pause className="h-4 w-4" /> Pause
            </button>
          ) : (
            <button type="button" onClick={start} className={`${btn} bg-accent text-paper hover:bg-ink`}>
              <Play className="h-4 w-4" /> {started ? 'Resume' : 'Start Experiment'}
            </button>
          )}
          <button
            type="button"
            onClick={reset}
            disabled={!started}
            className={`${btn} border border-rule text-ink-soft hover:border-ink hover:text-ink disabled:opacity-40 disabled:hover:border-rule disabled:hover:text-ink-soft`}
          >
            <RotateCcw className="h-4 w-4" /> Reset
          </button>
        </div>
      </div>

      {/* scenario selector + dashboards (gated until the experiment is started) */}
      <div className="relative mt-6 space-y-6">
        <ScenarioSelector api={api} />
        <Tabs defaultValue="monitor">
          <TabsList>
            <TabsTrigger value="monitor">
              <Monitor className="h-3.5 w-3.5" /> Monitoring Console
            </TabsTrigger>
            <TabsTrigger value="ai">
              <Brain className="h-3.5 w-3.5" /> AI Decision Support
            </TabsTrigger>
          </TabsList>
          <TabsContent value="monitor" className="mt-6">
            <MonitorConsole api={api} />
          </TabsContent>
          <TabsContent value="ai" className="mt-6">
            <AiAdvisor api={api} />
          </TabsContent>
        </Tabs>

        {!started ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md border border-rule bg-paper/70 backdrop-blur-[2px]">
            <div className="max-w-sm px-6 text-center">
              <button
                type="button"
                onClick={start}
                className="inline-flex items-center gap-2.5 rounded-md bg-accent px-7 py-3.5 font-mono text-sm uppercase tracking-meta text-paper shadow-lg transition-transform hover:scale-105"
              >
                <Play className="h-5 w-5" /> Start Experiment
              </button>
              <p className="mt-4 text-[0.9rem] leading-relaxed text-ink-soft">
                Begins live redox sensing, 15-second scan cycles, and AI analysis.
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

'use client';

import * as React from 'react';
import { Brain, Monitor } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MonitorConsole } from './monitor-console';
import { AiAdvisor } from './ai-advisor';
import { useRedoxSystem } from './use-redox-system';

/**
 * The "Live System" area below the 3D time-lapse: one shared simulated
 * closed-loop system, surfaced through two tabs — the operator monitoring
 * console and the AI decision-support advisor. Both act on the same state,
 * so an action in either tab is reflected everywhere.
 */
export function LiveSystem() {
  const api = useRedoxSystem();

  return (
    <div>
      <p className="meta-label">Live System · simulated</p>
      <h2 className="section-title mt-4 max-w-[24ch]">The closed loop, running live.</h2>
      <p className="mt-6 max-w-prose text-[1rem] leading-relaxed text-ink-soft">
        A simulated operator console for the bioelectrochemical remediation rig. It senses
        soil redox potential in real time while an AI advisor proposes soil-science-backed
        interventions. Try the actions — release microbes, cycle the redox potential, or
        execute the AI&rsquo;s recommendation — and watch the redox move back toward the
        healthy reducing window.
      </p>

      <div className="mt-8">
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
      </div>
    </div>
  );
}

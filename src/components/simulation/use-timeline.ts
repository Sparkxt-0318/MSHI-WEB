'use client';

import * as React from 'react';
import { BASE_DURATION_S } from './sim-constants';
import type { TimelineApi } from './simulation-types';

/**
 * The single master clock. One `requestAnimationFrame` loop advances a
 * normalized progress held in a ref (read every frame by the 3D scene + SVG
 * traces, with zero React renders). A throttled mirror drives the chrome.
 */
export function useTimeline(): TimelineApi {
  const progressRef = React.useRef(0);
  const speedRef = React.useRef(1);
  const playingRef = React.useRef(false);
  const rafRef = React.useRef<number | null>(null);
  const lastTsRef = React.useRef(0);
  const lastMirrorRef = React.useRef(0);
  const subsRef = React.useRef<Set<(t: number) => void>>(new Set());

  const [playing, setPlaying] = React.useState(false);
  const [speed, setSpeedState] = React.useState(1);
  const [progressUi, setProgressUi] = React.useState(0);
  const [ended, setEnded] = React.useState(false);
  const [reducedMotion, setReducedMotion] = React.useState(false);

  const emit = React.useCallback((t: number) => {
    subsRef.current.forEach((cb) => cb(t));
  }, []);

  const mirror = React.useCallback((t: number, force = false) => {
    const now =
      typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (force || t <= 0 || t >= 1 || now - lastMirrorRef.current > 66) {
      lastMirrorRef.current = now;
      setProgressUi(t);
    }
  }, []);

  const subscribe = React.useCallback(
    (cb: (t: number) => void) => {
      subsRef.current.add(cb);
      cb(progressRef.current); // paint current state immediately on mount
      return () => {
        subsRef.current.delete(cb);
      };
    },
    [],
  );

  const stopLoop = React.useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const frame = React.useCallback(
    (ts: number) => {
      const dt = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;
      let t = progressRef.current + (dt / BASE_DURATION_S) * speedRef.current;
      if (t >= 1) {
        t = 1;
        progressRef.current = 1;
        playingRef.current = false;
        emit(1);
        mirror(1, true);
        setPlaying(false);
        setEnded(true);
        stopLoop();
        return;
      }
      progressRef.current = t;
      emit(t);
      mirror(t);
      rafRef.current = requestAnimationFrame(frame);
    },
    [emit, mirror, stopLoop],
  );

  const play = React.useCallback(() => {
    if (reducedMotion || playingRef.current) return;
    if (progressRef.current >= 1) {
      // restart from the top
      progressRef.current = 0;
      emit(0);
      mirror(0, true);
    }
    setEnded(false);
    playingRef.current = true;
    setPlaying(true);
    lastTsRef.current =
      typeof performance !== 'undefined' ? performance.now() : Date.now();
    rafRef.current = requestAnimationFrame(frame);
  }, [emit, frame, mirror, reducedMotion]);

  const pause = React.useCallback(() => {
    playingRef.current = false;
    setPlaying(false);
    stopLoop();
  }, [stopLoop]);

  const toggle = React.useCallback(() => {
    if (playingRef.current) pause();
    else play();
  }, [pause, play]);

  const setSpeed = React.useCallback((s: number) => {
    speedRef.current = s;
    setSpeedState(s);
  }, []);

  const scrubTo = React.useCallback(
    (t: number) => {
      const clamped = Math.min(1, Math.max(0, t));
      progressRef.current = clamped;
      lastTsRef.current =
        typeof performance !== 'undefined' ? performance.now() : Date.now();
      setEnded(clamped >= 1);
      emit(clamped);
      mirror(clamped, true);
    },
    [emit, mirror],
  );

  const reset = React.useCallback(() => {
    pause();
    scrubTo(0);
    setEnded(false);
  }, [pause, scrubTo]);

  // Reduced-motion: pose at the final frame, no autoplay.
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) {
      setReducedMotion(true);
      progressRef.current = 1;
      emit(1);
      mirror(1, true);
      setEnded(true);
    }
  }, [emit, mirror]);

  // Pause when the tab is hidden (avoids a giant catch-up frame on return).
  React.useEffect(() => {
    if (typeof document === 'undefined') return;
    const onVis = () => {
      if (document.hidden && playingRef.current) pause();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [pause]);

  // Cleanup on unmount.
  React.useEffect(() => () => stopLoop(), [stopLoop]);

  return {
    progressRef,
    subscribe,
    play,
    pause,
    toggle,
    setSpeed,
    scrubTo,
    reset,
    playing,
    speed,
    progressUi,
    ended,
    reducedMotion,
  };
}

// ============================================
// PrepHQ — usePerformance Hook
// Monitors renderer performance metrics
// ============================================

import { useCallback, useEffect, useRef, useState } from 'react';

export interface PerfMetrics {
  fps: number;
  memoryUsageMB: number;
  jsHeapMB: number;
  domNodes: number;
  longTasks: number;
  timestamp: number;
}

interface UsePerformanceOptions {
  /** Sampling interval in ms (default 2000) */
  interval?: number;
  /** Enable long task detection */
  detectLongTasks?: boolean;
}

interface UsePerformanceReturn {
  metrics: PerfMetrics | null;
  history: PerfMetrics[];
  isMonitoring: boolean;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

export function usePerformance({
  interval = 2000,
  detectLongTasks = true,
}: UsePerformanceOptions = {}): UsePerformanceReturn {
  const [metrics, setMetrics] = useState<PerfMetrics | null>(null);
  const [history, setHistory] = useState<PerfMetrics[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const longTaskCountRef = useRef(0);
  const longTaskObserverRef = useRef<PerformanceObserver | null>(null);

  // FPS counter via requestAnimationFrame
  const countFrame = useCallback(() => {
    frameCountRef.current++;
    rafRef.current = requestAnimationFrame(countFrame);
  }, []);

  const sample = useCallback(() => {
    const now = performance.now();
    const elapsed = (now - lastTimeRef.current) / 1000;
    const fps = elapsed > 0 ? Math.round(frameCountRef.current / elapsed) : 0;

    frameCountRef.current = 0;
    lastTimeRef.current = now;

    // Memory info (Chrome/Electron only)
    const memInfo = (performance as any).memory;
    const jsHeapMB = memInfo ? Math.round(memInfo.usedJSHeapSize / 1048576) : 0;
    const memoryUsageMB = memInfo ? Math.round(memInfo.totalJSHeapSize / 1048576) : 0;

    // DOM node count
    const domNodes = document.querySelectorAll('*').length;

    const sample: PerfMetrics = {
      fps,
      memoryUsageMB,
      jsHeapMB,
      domNodes,
      longTasks: longTaskCountRef.current,
      timestamp: Date.now(),
    };

    setMetrics(sample);
    setHistory((prev) => {
      const next = [...prev, sample];
      // Keep last 100 samples (~3.3 minutes at 2s interval)
      return next.length > 100 ? next.slice(-100) : next;
    });
  }, []);

  const start = useCallback(() => {
    if (isMonitoring) return;
    setIsMonitoring(true);

    // Start FPS counter
    frameCountRef.current = 0;
    lastTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(countFrame);

    // Start sampling timer
    timerRef.current = setInterval(sample, interval);

    // Long task observer
    if (detectLongTasks && typeof PerformanceObserver !== 'undefined') {
      try {
        longTaskCountRef.current = 0;
        const observer = new PerformanceObserver((list) => {
          longTaskCountRef.current += list.getEntries().length;
        });
        observer.observe({ entryTypes: ['longtask'] });
        longTaskObserverRef.current = observer;
      } catch {
        // longtask not supported
      }
    }
  }, [isMonitoring, countFrame, sample, interval, detectLongTasks]);

  const stop = useCallback(() => {
    setIsMonitoring(false);

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (longTaskObserverRef.current) {
      longTaskObserverRef.current.disconnect();
      longTaskObserverRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    setMetrics(null);
    setHistory([]);
    longTaskCountRef.current = 0;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      if (longTaskObserverRef.current) longTaskObserverRef.current.disconnect();
    };
  }, []);

  return { metrics, history, isMonitoring, start, stop, reset };
}

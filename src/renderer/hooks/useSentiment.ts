// ============================================
// PrepHQ — useSentiment Hook
// Manages sentiment analysis Web Worker
// ============================================

import { useCallback, useEffect, useRef, useState } from 'react';
import type { SentimentResult } from '../../shared/types';

interface UseSentimentReturn {
  isReady: boolean;
  analyze: (text: string) => void;
  lastResult: SentimentResult | null;
  history: SentimentResult[];
  averageValence: number;
}

export function useSentiment(): UseSentimentReturn {
  const workerRef = useRef<Worker | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [lastResult, setLastResult] = useState<SentimentResult | null>(null);
  const [history, setHistory] = useState<SentimentResult[]>([]);
  const historyRef = useRef<SentimentResult[]>([]);

  useEffect(() => {
    const worker = new Worker(
      new URL('../workers/sentiment.worker.ts', import.meta.url),
      { type: 'module' },
    );

    worker.onmessage = (event) => {
      const { type, payload } = event.data;

      switch (type) {
        case 'ready':
          setIsReady(true);
          break;
        case 'sentiment-result':
          const result: SentimentResult = {
            label: payload.label,
            confidence: payload.confidence,
            valence: payload.valence,
          };
          setLastResult(result);
          historyRef.current.push(result);
          if (historyRef.current.length > 200) {
            historyRef.current = historyRef.current.slice(-200);
          }
          setHistory([...historyRef.current]);
          break;
      }
    };

    worker.postMessage({ type: 'init' });
    workerRef.current = worker;

    return () => {
      worker.postMessage({ type: 'stop' });
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const analyze = useCallback((text: string) => {
    if (!workerRef.current || !isReady) return;
    workerRef.current.postMessage({
      type: 'analyze',
      payload: { text, timestamp: Date.now() },
    });
  }, [isReady]);

  const averageValence = history.length > 0
    ? Math.round((history.reduce((s, r) => s + r.valence, 0) / history.length) * 100) / 100
    : 0;

  return { isReady, analyze, lastResult, history, averageValence };
}

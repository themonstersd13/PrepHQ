// ============================================
// PrepHQ — useVoiceAnalytics Hook
// Manages audio analysis Web Worker for
// confidence scoring and stress detection
// ============================================

import { useCallback, useEffect, useRef, useState } from 'react';
import type { VoiceMetrics } from '../../shared/types';

interface UseVoiceAnalyticsOptions {
  enabled?: boolean;
}

interface UseVoiceAnalyticsReturn {
  isReady: boolean;
  isAnalyzing: boolean;
  error: string | null;
  currentMetrics: VoiceMetrics | null;
  metricsHistory: VoiceMetrics[];
  averageConfidence: number;
  averageStress: number;
  start: () => void;
  stop: () => void;
  clearHistory: () => void;
}

export function useVoiceAnalytics({
  enabled = true,
}: UseVoiceAnalyticsOptions = {}): UseVoiceAnalyticsReturn {
  const workerRef = useRef<Worker | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentMetrics, setCurrentMetrics] = useState<VoiceMetrics | null>(null);
  const [metricsHistory, setMetricsHistory] = useState<VoiceMetrics[]>([]);
  const metricsHistoryRef = useRef<VoiceMetrics[]>([]);

  // Initialize worker
  useEffect(() => {
    if (!enabled) return;

    const worker = new Worker(
      new URL('../workers/audio-analysis.worker.ts', import.meta.url),
      { type: 'module' },
    );

    worker.onmessage = (event) => {
      const { type, payload } = event.data;

      switch (type) {
        case 'ready':
          setIsReady(true);
          setError(null);
          break;
        case 'voice-metrics':
          setCurrentMetrics(payload as VoiceMetrics);
          metricsHistoryRef.current.push(payload);
          // Keep last 500 samples (~4 min at 2 per second)
          if (metricsHistoryRef.current.length > 500) {
            metricsHistoryRef.current = metricsHistoryRef.current.slice(-500);
          }
          setMetricsHistory([...metricsHistoryRef.current]);
          break;
        case 'error':
          setError(payload.message);
          break;
      }
    };

    worker.postMessage({ type: 'init' });
    workerRef.current = worker;

    return () => {
      worker.postMessage({ type: 'stop' });
      worker.terminate();
      workerRef.current = null;
      setIsReady(false);
    };
  }, [enabled]);

  const start = useCallback(async () => {
    if (isAnalyzing || !workerRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
        },
      });

      const audioContext = new AudioContext({ sampleRate: 16000 });
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;

      // ScriptProcessor for raw audio access (deprecated but reliable)
      const processor = audioContext.createScriptProcessor(2048, 1, 1);
      processor.onaudioprocess = (event) => {
        const buffer = event.inputBuffer.getChannelData(0);
        // Check if there's actual audio (not silence)
        let rms = 0;
        for (let i = 0; i < buffer.length; i++) rms += buffer[i] * buffer[i];
        rms = Math.sqrt(rms / buffer.length);

        if (rms > 0.01 && workerRef.current) {
          // Transfer a copy to worker
          const copy = new Float32Array(buffer);
          workerRef.current.postMessage(
            {
              type: 'process-buffer',
              payload: {
                buffer: copy.buffer,
                sampleRate: audioContext.sampleRate,
                timestamp: Date.now(),
              },
            },
            [copy.buffer],
          );
        }
      };

      source.connect(analyser);
      analyser.connect(processor);
      processor.connect(audioContext.destination);

      streamRef.current = stream;
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      processorRef.current = processor;
      setIsAnalyzing(true);
    } catch (err: any) {
      setError(err.message || 'Failed to start audio analysis');
    }
  }, [isAnalyzing]);

  const stop = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsAnalyzing(false);
  }, []);

  const clearHistory = useCallback(() => {
    metricsHistoryRef.current = [];
    setMetricsHistory([]);
    setCurrentMetrics(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  // Compute averages
  const averageConfidence = metricsHistory.length > 0
    ? Math.round(metricsHistory.reduce((s, m) => s + m.confidenceScore, 0) / metricsHistory.length)
    : 50;

  const averageStress = metricsHistory.length > 0
    ? Math.round(metricsHistory.reduce((s, m) => s + m.stressLevel, 0) / metricsHistory.length)
    : 20;

  return {
    isReady,
    isAnalyzing,
    error,
    currentMetrics,
    metricsHistory,
    averageConfidence,
    averageStress,
    start,
    stop,
    clearHistory,
  };
}

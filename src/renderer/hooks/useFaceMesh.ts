// ============================================
// PrepHQ — useFaceMesh Hook
// Manages vision Web Worker for face mesh + pose
// ============================================

import { useCallback, useEffect, useRef, useState } from 'react';
import type { FaceMeshMetrics, GazePoint, PostureSnapshot } from '../../shared/types';

interface UseFaceMeshOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  enabled?: boolean;
  fps?: number; // Target frames per second for analysis
}

interface UseFaceMeshReturn {
  isReady: boolean;
  isProcessing: boolean;
  error: string | null;
  // Latest metrics
  faceMesh: FaceMeshMetrics | null;
  posture: PostureSnapshot | null;
  gazeHistory: GazePoint[];
  // Controls
  start: () => void;
  stop: () => void;
  clearHistory: () => void;
}

export function useFaceMesh({
  videoRef,
  enabled = true,
  fps = 10,
}: UseFaceMeshOptions): UseFaceMeshReturn {
  const workerRef = useRef<Worker | null>(null);
  const animFrameRef = useRef<number>(0);
  const canvasRef = useRef<OffscreenCanvas | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [faceMesh, setFaceMesh] = useState<FaceMeshMetrics | null>(null);
  const [posture, setPosture] = useState<PostureSnapshot | null>(null);
  const [gazeHistory, setGazeHistory] = useState<GazePoint[]>([]);
  const lastProcessTime = useRef(0);
  const gazeHistoryRef = useRef<GazePoint[]>([]);

  // Initialize worker
  useEffect(() => {
    if (!enabled) return;

    const worker = new Worker(
      new URL('../workers/vision.worker.ts', import.meta.url),
      { type: 'module' },
    );

    worker.onmessage = (event) => {
      const { type, payload } = event.data;

      switch (type) {
        case 'ready':
          setIsReady(true);
          setError(null);
          break;
        case 'face-mesh-result':
          setFaceMesh({
            timestamp: payload.timestamp,
            gazeDirection: payload.gazeDirection,
            mouthOpenRatio: payload.mouthOpenRatio,
            eyeOpenRatio: payload.eyeOpenRatio,
            headPose: payload.headPose,
          });
          // Track gaze history
          if (payload.gazeTarget) {
            const gazePoint: GazePoint = {
              x: payload.gazeDirection.x,
              y: payload.gazeDirection.y,
              timestamp: payload.timestamp,
              target: payload.gazeTarget,
            };
            gazeHistoryRef.current.push(gazePoint);
            // Keep last 1000 points (~100 seconds at 10fps)
            if (gazeHistoryRef.current.length > 1000) {
              gazeHistoryRef.current = gazeHistoryRef.current.slice(-1000);
            }
            setGazeHistory([...gazeHistoryRef.current]);
          }
          break;
        case 'pose-result':
          setPosture({
            timestamp: payload.timestamp,
            shoulderAngle: payload.shoulderAngle,
            headTilt: payload.headTilt,
            isSlouching: payload.isSlouching,
            isExcessiveMovement: payload.isExcessiveMovement,
            score: payload.score,
          });
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

  // Frame processing loop
  const processLoop = useCallback(() => {
    const video = videoRef.current;
    const worker = workerRef.current;

    if (!video || !worker || !isReady || video.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(processLoop);
      return;
    }

    const now = performance.now();
    const interval = 1000 / fps;

    if (now - lastProcessTime.current >= interval) {
      lastProcessTime.current = now;

      try {
        // Create ImageBitmap from video frame
        createImageBitmap(video).then((bitmap) => {
          worker.postMessage(
            { type: 'process-frame', payload: { imageBitmap: bitmap, timestamp: now } },
            [bitmap] as any,
          );
        }).catch(() => {
          // Skip frame if bitmap creation fails
        });
      } catch {
        // Skip frame
      }
    }

    animFrameRef.current = requestAnimationFrame(processLoop);
  }, [videoRef, fps, isReady]);

  const start = useCallback(() => {
    if (isProcessing) return;
    setIsProcessing(true);
    animFrameRef.current = requestAnimationFrame(processLoop);
  }, [isProcessing, processLoop]);

  const stop = useCallback(() => {
    setIsProcessing(false);
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = 0;
    }
  }, []);

  const clearHistory = useCallback(() => {
    gazeHistoryRef.current = [];
    setGazeHistory([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  return {
    isReady,
    isProcessing,
    error,
    faceMesh,
    posture,
    gazeHistory,
    start,
    stop,
    clearHistory,
  };
}

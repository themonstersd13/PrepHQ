// ============================================
// PrepHQ — useAudioCapture Hook
// Manages microphone capture + speech recognition
// Uses Web Speech API as free local STT
// ============================================

import { useState, useRef, useCallback, useEffect } from 'react';
import type { TranscriptEntry, Speaker, Sentiment } from '../../shared/types';

interface UseAudioCaptureOptions {
  onTranscript: (entry: TranscriptEntry) => void;
  sessionId: string;
}

interface UseAudioCaptureReturn {
  isCapturing: boolean;
  isSpeaking: boolean;
  startCapture: () => Promise<void>;
  stopCapture: () => void;
  error: string | null;
}

// Simple sentiment analysis based on keywords
function analyzeSentiment(text: string): Sentiment {
  const lower = text.toLowerCase();
  const positiveWords = ['great', 'good', 'excellent', 'perfect', 'wonderful', 'amazing', 'love', 'thank', 'yes', 'absolutely', 'right'];
  const negativeWords = ['bad', 'wrong', 'terrible', 'no', 'not', 'never', 'fail', 'error', 'problem', 'difficult', 'hard', 'unfortunately'];

  let score = 0;
  for (const word of positiveWords) {
    if (lower.includes(word)) score++;
  }
  for (const word of negativeWords) {
    if (lower.includes(word)) score--;
  }

  if (score > 0) return 'POSITIVE';
  if (score < 0) return 'NEGATIVE';
  return 'NEUTRAL';
}

export function useAudioCapture({
  onTranscript,
  sessionId,
}: UseAudioCaptureOptions): UseAudioCaptureReturn {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const sessionStartRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  const startCapture = useCallback(async () => {
    try {
      setError(null);

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // Initialize Web Speech API
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setError('Speech recognition not supported in this browser');
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      sessionStartRef.current = Date.now();

      recognition.onstart = () => {
        setIsCapturing(true);
      };

      recognition.onspeechstart = () => {
        setIsSpeaking(true);
      };

      recognition.onspeechend = () => {
        setIsSpeaking(false);
      };

      recognition.onresult = (event: any) => {
        const result = event.results[event.results.length - 1];

        if (result.isFinal) {
          const text = result[0].transcript.trim();
          if (!text) return;

          const entry: TranscriptEntry = {
            sessionId,
            timestampOffset: Date.now() - sessionStartRef.current,
            speaker: 'USER' as Speaker,
            text,
            sentiment: analyzeSentiment(text),
          };

          onTranscript(entry);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'no-speech') return; // Normal — no speech detected
        if (event.error === 'aborted') return; // Normal — stopped by user
        console.error('[AudioCapture] Speech recognition error:', event.error);
        setError(`Speech recognition error: ${event.error}`);
      };

      // Auto-restart on end (continuous mode can still stop)
      recognition.onend = () => {
        if (isCapturing && recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch {
            // Already started — ignore
          }
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('[AudioCapture] Error:', err);
      setError(err.message || 'Failed to start audio capture');
    }
  }, [sessionId, onTranscript, isCapturing]);

  const stopCapture = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null; // Prevent auto-restart
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setIsCapturing(false);
    setIsSpeaking(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCapture();
    };
  }, [stopCapture]);

  return { isCapturing, isSpeaking, startCapture, stopCapture, error };
}

// ============================================
// PrepHQ — Text-to-Speech Hook
// Browser SpeechSynthesis API for AI interviewer voice
// ============================================

import { useCallback, useEffect, useRef, useState } from 'react';

interface UseTTSOptions {
  /** Voice name preference (will fallback to default) */
  voiceName?: string;
  /** Speech rate (0.5 - 2.0, default 1.0) */
  rate?: number;
  /** Pitch (0.5 - 2.0, default 1.0) */
  pitch?: number;
  /** Volume (0 - 1, default 1.0) */
  volume?: number;
  /** Enable/disable TTS globally */
  enabled?: boolean;
}

interface UseTTSReturn {
  /** Whether TTS is currently speaking */
  isSpeaking: boolean;
  /** Available voices */
  voices: SpeechSynthesisVoice[];
  /** Speak the given text */
  speak: (text: string) => void;
  /** Stop all current speech */
  stop: () => void;
  /** Whether SpeechSynthesis is available */
  isAvailable: boolean;
}

export function useTTS(options: UseTTSOptions = {}): UseTTSReturn {
  const { voiceName, rate = 1.0, pitch = 1.0, volume = 1.0, enabled = true } = options;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const isAvailable = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Load voices (they may load asynchronously)
  useEffect(() => {
    if (!isAvailable) return;

    const loadVoices = () => {
      const available = speechSynthesis.getVoices();
      if (available.length > 0) {
        setVoices(available);
      }
    };

    loadVoices();
    speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  }, [isAvailable]);

  const speak = useCallback(
    (text: string) => {
      if (!isAvailable || !enabled || !text.trim()) return;

      // Cancel any ongoing speech
      speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;

      // Try to find the preferred voice
      if (voiceName && voices.length > 0) {
        const preferred = voices.find((v) => v.name.includes(voiceName));
        if (preferred) {
          utterance.voice = preferred;
        }
      }

      // Prefer a natural-sounding English voice
      if (!utterance.voice && voices.length > 0) {
        const englishVoice =
          voices.find((v) => v.lang.startsWith('en') && v.name.includes('Natural')) ||
          voices.find((v) => v.lang.startsWith('en') && !v.localService) ||
          voices.find((v) => v.lang.startsWith('en'));
        if (englishVoice) {
          utterance.voice = englishVoice;
        }
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      utteranceRef.current = utterance;
      speechSynthesis.speak(utterance);
    },
    [isAvailable, enabled, rate, pitch, volume, voiceName, voices],
  );

  const stop = useCallback(() => {
    if (!isAvailable) return;
    speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isAvailable]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isAvailable) {
        speechSynthesis.cancel();
      }
    };
  }, [isAvailable]);

  return { isSpeaking, voices, speak, stop, isAvailable };
}

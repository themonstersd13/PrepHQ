// ============================================
// PrepHQ — Ghost Mode Page
// Full Ghost Mode with compliance, pill, transcript,
// audio capture, and Gemini analysis
// ============================================

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGhostStore } from '../stores/ghost-store';
import { useSettingsStore } from '../stores/settings-store';
import ComplianceModal from '../components/ghost/ComplianceModal';
import GhostPill from '../components/ghost/GhostPill';
import PanicOverlay from '../components/ghost/PanicOverlay';
import TranscriptPanel from '../components/ghost/TranscriptPanel';
import FillerWordCounter from '../components/analytics/FillerWordCounter';
import PostureAlert from '../components/analytics/PostureAlert';
import VoiceMetricsDisplay from '../components/analytics/VoiceMetricsDisplay';
import { useAudioCapture } from '../hooks/useAudioCapture';
import { useWebcam } from '../hooks/useWebcam';
import { useFaceMesh } from '../hooks/useFaceMesh';
import { useVoiceAnalytics } from '../hooks/useVoiceAnalytics';
import { useSentiment } from '../hooks/useSentiment';
import { FillerWordTracker, type FillerAnalysis } from '../services/filler-word-analyzer';
import { GlassButton } from '../components/ui';
import type { TranscriptEntry } from '../../shared/types';

interface GhostPageProps {
  onBack: () => void;
}

const GhostPage: React.FC<GhostPageProps> = ({ onBack }) => {
  const ghost = useGhostStore();
  const { geminiApiKey } = useSettingsStore();
  const [sessionTimer, setSessionTimer] = useState(0);
  const [timerInterval, setTimerInterval] = useState<ReturnType<typeof setInterval> | null>(null);
  const fillerTrackerRef = useRef(new FillerWordTracker());
  const [fillerAnalysis, setFillerAnalysis] = useState<FillerAnalysis | null>(null);

  // Webcam for posture/eye tracking (per requirements)
  const webcam = useWebcam();

  // ML hooks — face mesh, voice analytics, sentiment
  const faceMesh = useFaceMesh({ videoRef: webcam.videoRef, fps: 8 });
  const voiceAnalytics = useVoiceAnalytics();
  const sentiment = useSentiment();

  // Handle new transcript entries
  const handleTranscript = useCallback(
    async (entry: TranscriptEntry) => {
      ghost.addTranscript(entry);

      // Track filler words in real-time (only for user speech)
      if (entry.speaker === 'USER') {
        const snapshot = fillerTrackerRef.current.push(entry.text);
        setFillerAnalysis(snapshot);
        // Run sentiment analysis
        sentiment.analyze(entry.text);
      }

      // Push to main process for Gemini analysis
      try {
        await window.api.ghostPushTranscript(entry);
      } catch (err) {
        console.error('[Ghost] Failed to push transcript:', err);
      }
    },
    [ghost],
  );

  // Audio capture hook
  const { isCapturing, isSpeaking, startCapture, stopCapture, error: audioError } =
    useAudioCapture({
      onTranscript: handleTranscript,
      sessionId: ghost.sessionId || 'temp',
    });

  // Listen for IPC events from main process
  useEffect(() => {
    const unsubHint = window.api.onGhostHint((hint) => {
      ghost.setHints(hint);
      ghost.setGhostState('SUGGESTING');
    });

    const unsubState = window.api.onGhostStateChange((state) => {
      ghost.setGhostState(state);
    });

    const unsubPhase = window.api.onGhostPhaseChange((phase) => {
      ghost.setCurrentPhase(phase);
    });

    const unsubPanic = window.api.onPanicShortcut(async () => {
      await handlePanic();
    });

    return () => {
      unsubHint();
      unsubState();
      unsubPhase();
      unsubPanic();
    };
  }, []);

  // Init Gemini when entering Ghost Mode
  useEffect(() => {
    if (geminiApiKey) {
      window.api.initGemini(geminiApiKey).catch(console.error);
    }
  }, [geminiApiKey]);

  // Handle compliance acceptance
  const handleComplianceAccept = useCallback(async () => {
    ghost.setComplianceAccepted(true);
    ghost.setShowCompliance(false);

    // Start webcam (non-blocking)
    webcam.start().catch(() => {});

    // Start ML analytics
    faceMesh.start();
    voiceAnalytics.start().catch(() => {});

    // Create session
    try {
      const session = await window.api.createSession('GHOST');
      ghost.setSessionId(session.id);

      // Start Ghost session in main process
      await window.api.ghostStart(session.id);
      ghost.setIsActive(true);
      ghost.setGhostState('LISTENING');

      // Start audio capture
      await startCapture();

      // Start session timer
      const interval = setInterval(() => {
        setSessionTimer((prev) => prev + 1);
      }, 1000);
      setTimerInterval(interval);
    } catch (err: any) {
      console.error('[Ghost] Failed to start session:', err);
      // Still allow the session to proceed even if DB fails
      ghost.setIsActive(true);
      ghost.setGhostState('LISTENING');
      try {
        await startCapture();
        const interval = setInterval(() => {
          setSessionTimer((prev) => prev + 1);
        }, 1000);
        setTimerInterval(interval);
      } catch (audioErr) {
        console.error('[Ghost] Audio capture also failed:', audioErr);
      }
    }
  }, [ghost, startCapture, webcam]);

  // Handle stop session
  const handleStop = useCallback(async () => {
    stopCapture();
    webcam.stop();
    faceMesh.stop();
    voiceAnalytics.stop();

    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }

    try {
      await window.api.ghostStop();
    } catch (err) {
      console.error('[Ghost] Failed to stop session:', err);
    }

    ghost.setIsActive(false);
    ghost.setGhostState('IDLE');
    setSessionTimer(0);
    fillerTrackerRef.current.reset();
    setFillerAnalysis(null);
  }, [ghost, stopCapture, timerInterval, webcam]);

  // Handle manual analysis trigger
  const handleAnalyze = useCallback(async () => {
    ghost.setGhostState('PROCESSING');
    try {
      const result = await window.api.ghostTriggerAnalysis();
      if (result) {
        ghost.setHints(result);
        ghost.setGhostState('SUGGESTING');
      } else {
        ghost.setGhostState('LISTENING');
      }
    } catch (err) {
      console.error('[Ghost] Analysis failed:', err);
      ghost.setGhostState('LISTENING');
    }
  }, [ghost]);

  // Handle panic protocol
  const handlePanic = useCallback(async () => {
    try {
      const response = await window.api.ghostPanic();
      ghost.setPanicResponse(response);
      ghost.setShowPanicOverlay(true);
    } catch (err) {
      console.error('[Ghost] Panic failed:', err);
      ghost.setPanicResponse({
        stallScript:
          "That's a great question. Let me take a moment to organize my thoughts and consider the key aspects before diving in.",
        topic: 'General',
      });
      ghost.setShowPanicOverlay(true);
    }
  }, [ghost]);

  // Handle back — cleanup first
  const handleBack = useCallback(async () => {
    webcam.stop();
    await handleStop();
    ghost.reset();
    onBack();
  }, [handleStop, ghost, onBack, webcam]);

  // Format timer
  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex h-full flex-col">
      {/* Compliance Modal */}
      <ComplianceModal
        open={ghost.showCompliance}
        onAccept={handleComplianceAccept}
        onDecline={handleBack}
      />

      {/* Panic Overlay */}
      <PanicOverlay
        open={ghost.showPanicOverlay}
        response={ghost.panicResponse}
        onDismiss={() => ghost.setShowPanicOverlay(false)}
      />

      {/* Top Bar */}
      <div className="glass-subtle flex items-center justify-between border-b border-white/5 px-6 py-3">
        <div className="flex items-center gap-4">
          <GlassButton variant="ghost" size="sm" onClick={handleBack}>
            ← Back
          </GlassButton>
          <div className="h-4 w-px bg-white/10" />
          <span className="text-sm font-medium text-text-primary">👻 Ghost Mode</span>
          {ghost.isActive && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-full bg-neon-green/15 px-2 py-0.5 text-xs font-medium text-neon-green"
            >
              ● LIVE — {formatTime(sessionTimer)}
            </motion.span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {ghost.isActive && (
            <button
              onClick={webcam.toggle}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                webcam.isActive
                  ? 'bg-neon-green/15 text-neon-green'
                  : 'bg-white/5 text-text-muted hover:bg-white/10'
              }`}
              title={webcam.isActive ? 'Turn off camera' : 'Turn on camera'}
            >
              📷 Camera {webcam.isActive ? 'ON' : 'OFF'}
            </button>
          )}
          {isCapturing && (
            <span className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 text-xs text-text-secondary">
              <motion.span
                className="h-2.5 w-2.5 rounded-full bg-neon-red"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
              />
              {isSpeaking ? '🎙️ Speaking…' : '🎙️ Mic Active'}
            </span>
          )}
          {audioError && (
            <span className="rounded-lg bg-neon-red/10 px-3 py-1.5 text-xs text-neon-red">⚠️ {audioError}</span>
          )}
          {webcam.error && (
            <span className="rounded-lg bg-neon-red/10 px-3 py-1.5 text-xs text-neon-red">⚠️ {webcam.error}</span>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {!ghost.complianceAccepted ? (
        // Waiting for compliance
        <div className="flex flex-1 items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <span className="text-6xl">👻</span>
            <h2 className="mt-4 text-xl font-bold text-text-primary">Ghost Mode</h2>
            <p className="mt-2 text-sm text-text-secondary">
              Complete the compliance check to activate
            </p>
          </motion.div>
        </div>
      ) : (
        // Active Ghost session
        <div className="relative flex flex-1 overflow-hidden">
          {/* Center — Ghost Pill + Stats Overview */}
          <div className="flex flex-1 flex-col items-center justify-start overflow-y-auto p-8">
            <AnimatePresence>
              {ghost.isActive && (
                <GhostPill
                  state={ghost.ghostState}
                  phase={ghost.currentPhase}
                  hints={ghost.hints}
                  expanded={ghost.isPillExpanded}
                  onToggleExpand={() => ghost.setIsPillExpanded(!ghost.isPillExpanded)}
                  onPanic={handlePanic}
                  onAnalyze={handleAnalyze}
                  onStop={handleStop}
                />
              )}
            </AnimatePresence>

            {!ghost.isActive && ghost.complianceAccepted && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-16 text-center"
              >
                <span className="text-5xl">👻</span>
                <p className="mt-4 mb-6 text-sm text-text-secondary">
                  Session ended. You can start a new session or go back.
                </p>
                <div className="flex gap-3 justify-center">
                  <GlassButton variant="primary" size="md" onClick={handleComplianceAccept}>
                    🔄 Start New Session
                  </GlassButton>
                  <GlassButton variant="ghost" size="md" onClick={handleBack}>
                    ← Back to Home
                  </GlassButton>
                </div>
              </motion.div>
            )}

            {/* Quick Stats Grid */}
            {ghost.isActive && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-8 grid grid-cols-3 gap-4 w-full max-w-lg"
              >
                <div className="glass-subtle rounded-xl px-5 py-4 text-center">
                  <p className="text-2xl font-bold text-neon-blue">{ghost.transcripts.length}</p>
                  <p className="mt-1 text-xs text-text-muted">Transcripts</p>
                </div>
                <div className="glass-subtle rounded-xl px-5 py-4 text-center">
                  <p className="text-2xl font-bold text-neon-green">
                    {formatTime(sessionTimer)}
                  </p>
                  <p className="mt-1 text-xs text-text-muted">Duration</p>
                </div>
                <div className="glass-subtle rounded-xl px-5 py-4 text-center">
                  <p className="text-2xl font-bold text-neon-red">
                    {fillerAnalysis?.totalFillers ?? 0}
                  </p>
                  <p className="mt-1 text-xs text-text-muted">Fillers</p>
                </div>
              </motion.div>
            )}

            {/* ML Analytics Row */}
            {ghost.isActive && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-5 grid grid-cols-2 gap-4 w-full max-w-lg"
              >
                {/* Sentiment + Posture + Hints */}
                <div className="glass-subtle rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-semibold uppercase text-text-muted tracking-wider">
                    📊 Live Status
                  </h4>
                  <div className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                    <span className="text-xs text-text-secondary">Sentiment</span>
                    <span className={`text-sm font-bold ${
                      sentiment.lastResult?.label === 'POSITIVE' ? 'text-neon-green' :
                      sentiment.lastResult?.label === 'NEGATIVE' ? 'text-neon-red' : 'text-text-secondary'
                    }`}>
                      {sentiment.lastResult
                        ? (sentiment.lastResult.label === 'POSITIVE' ? '😊' :
                           sentiment.lastResult.label === 'NEGATIVE' ? '😟' : '😐')
                        : '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                    <span className="text-xs text-text-secondary">Posture</span>
                    <span className={`text-sm font-bold ${
                      faceMesh.posture && faceMesh.posture.score >= 70 ? 'text-neon-green' :
                      faceMesh.posture && faceMesh.posture.score >= 40 ? 'text-yellow-400' : 'text-text-muted'
                    }`}>
                      {faceMesh.posture ? `${faceMesh.posture.score}/100` : '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                    <span className="text-xs text-text-secondary">Hints</span>
                    <span className={`text-sm font-bold ${
                      ghost.hints ? 'text-neon-purple' : 'text-text-muted'
                    }`}>
                      {ghost.hints ? '✓ Ready' : 'Waiting…'}
                    </span>
                  </div>
                </div>

                {/* Voice Metrics or Filler Words */}
                <div className="glass-subtle rounded-xl p-4 space-y-3">
                  {voiceAnalytics.isAnalyzing ? (
                    <>
                      <h4 className="text-xs font-semibold uppercase text-text-muted tracking-wider">
                        🎙️ Voice Analytics
                      </h4>
                      <VoiceMetricsDisplay
                        currentMetrics={voiceAnalytics.currentMetrics}
                        averageConfidence={voiceAnalytics.averageConfidence}
                        averageStress={voiceAnalytics.averageStress}
                      />
                    </>
                  ) : fillerAnalysis && fillerAnalysis.totalFillers > 0 ? (
                    <FillerWordCounter analysis={fillerAnalysis} />
                  ) : (
                    <>
                      <h4 className="text-xs font-semibold uppercase text-text-muted tracking-wider">
                        🎙️ Voice
                      </h4>
                      <p className="text-xs text-text-muted py-4 text-center">Initializing audio…</p>
                    </>
                  )}
                </div>
              </motion.div>
            )}

            {/* Posture Alert (floating) */}
            {ghost.isActive && (
              <div className="mt-4 w-full max-w-lg">
                <PostureAlert posture={faceMesh.posture} />
              </div>
            )}
          </div>

          {/* Right side — Transcript */}
          {ghost.isActive && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="w-[380px] border-l border-white/5 p-5"
            >
              <TranscriptPanel
                transcripts={ghost.transcripts}
                className="h-full"
              />
            </motion.div>
          )}

          {/* Webcam PIP Overlay — larger and more visible */}
          {ghost.isActive && webcam.isActive && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              drag
              dragMomentum={false}
              className="absolute bottom-5 right-5 z-30 cursor-move overflow-hidden rounded-2xl border border-white/15 shadow-2xl"
            >
              <div className="relative h-[160px] w-[220px]">
                <video
                  ref={webcam.videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-neon-red animate-pulse" />
                    <span className="text-[11px] font-semibold text-white">You • Live</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
};

export default GhostPage;

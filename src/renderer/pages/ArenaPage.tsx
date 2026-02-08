// ============================================
// PrepHQ — Arena Mode Page
// Full interview simulator with AI persona,
// Monaco editor, chat, and code execution
// ============================================

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Panel, Group, Separator } from 'react-resizable-panels';
import { useArenaStore, BUILT_IN_PERSONAS } from '../stores/arena-store';
import { useSettingsStore } from '../stores/settings-store';
import PersonaSelector from '../components/arena/PersonaSelector';
import ArenaChat from '../components/arena/ArenaChat';
import CodeEditor from '../components/arena/CodeEditor';
import VideoFeed from '../components/arena/VideoFeed';
import Whiteboard from '../components/arena/Whiteboard';
import PostureAlert from '../components/analytics/PostureAlert';
import VoiceMetricsDisplay from '../components/analytics/VoiceMetricsDisplay';
import { GlassButton, Badge } from '../components/ui';
import { useTTS } from '../hooks/useTTS';
import { useWebcam } from '../hooks/useWebcam';
import { useFaceMesh } from '../hooks/useFaceMesh';
import { useVoiceAnalytics } from '../hooks/useVoiceAnalytics';
import { useSentiment } from '../hooks/useSentiment';
import type { PersonaProfile, ArenaStage } from '../../shared/types';

interface ArenaPageProps {
  onBack: () => void;
}

/** Build the system prompt for the AI persona */
function buildPersonaPrompt(persona: PersonaProfile): string {
  return `You are an AI interviewer named "${persona.name}".
Your personality: ${persona.description}
Strictness level: ${persona.strictness * 100}% (0 = very lenient, 100 = extremely strict)
Focus area: ${persona.focus}
Interruption frequency: ${persona.interruptionFrequency}
Speech pace: ${persona.speechPace}

RULES:
- Stay in character at all times.
- Ask probing follow-up questions relevant to your focus area.
- Adjust difficulty based on candidate's responses.
- At INTRO stage: Make small talk, then transition.
- At PROBLEM_STATEMENT stage: Present a coding or system design problem.
- At CLARIFICATION stage: Answer candidate's questions about the problem.
- At DEEP_DIVE stage: Ask follow-ups about complexity, edge cases, optimizations.
- At WRAPUP stage: Give brief feedback and score.
- Keep responses concise and natural.`;
}

const stageFlow: ArenaStage[] = ['INTRO', 'PROBLEM_STATEMENT', 'CLARIFICATION', 'DEEP_DIVE', 'WRAPUP'];

/** Retry wrapper for Gemini API calls with exponential backoff */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 2,
  baseDelay = 3000,
): Promise<T> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const is429 = err?.message?.includes('429') || err?.message?.includes('quota');
      if (!is429 || attempt === maxRetries) break;
      // Wait with exponential backoff
      await new Promise((r) => setTimeout(r, baseDelay * Math.pow(2, attempt)));
    }
  }
  throw lastError;
}

const ArenaPage: React.FC<ArenaPageProps> = ({ onBack }) => {
  const arena = useArenaStore();
  const { geminiApiKey } = useSettingsStore();
  const [runOutput, setRunOutput] = useState<{ stdout: string; stderr: string; exitCode: number } | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Webcam hook
  const webcam = useWebcam();

  // ML hooks — face mesh, voice analytics, sentiment
  const faceMesh = useFaceMesh({ videoRef: webcam.videoRef, fps: 8 });
  const voiceAnalytics = useVoiceAnalytics();
  const sentiment = useSentiment();

  // TTS hook — maps persona speech pace to rate
  const ttsRate = arena.selectedPersona?.speechPace === 'fast' ? 1.15 : arena.selectedPersona?.speechPace === 'slow' ? 0.85 : 1.0;
  const { speak, stop: stopTTS, isSpeaking, isAvailable: ttsAvailable } = useTTS({
    rate: ttsRate,
    enabled: ttsEnabled,
  });

  // Init Gemini on mount
  useEffect(() => {
    if (geminiApiKey) {
      window.api.initGemini(geminiApiKey).catch(console.error);
    }
  }, [geminiApiKey]);

  // Timer management
  useEffect(() => {
    if (arena.isActive && !timerRef.current) {
      timerRef.current = setInterval(() => {
        arena.setElapsedSeconds(arena.elapsedSeconds + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [arena.isActive]);

  // Separate effect for incrementing timer
  useEffect(() => {
    if (!arena.isActive) return;
    const interval = setInterval(() => {
      useArenaStore.setState((s) => ({ elapsedSeconds: s.elapsedSeconds + 1 }));
    }, 1000);
    return () => clearInterval(interval);
  }, [arena.isActive]);

  // Start a session when persona is selected
  const handleSelectPersona = useCallback(async (persona: PersonaProfile) => {
    arena.setSelectedPersona(persona);
    setApiError(null);

    try {
      // Start webcam automatically
      webcam.start().catch(() => {}); // Non-blocking, camera is optional

      // Start ML analytics
      faceMesh.start();
      voiceAnalytics.start().catch(() => {});

      const session = await window.api.createSession('ARENA');
      arena.setSessionId(session.id);
      arena.setIsActive(true);
      arena.setStage('INTRO');

      // System message
      arena.addMessage({
        role: 'system',
        content: `Interview started with ${persona.name}`,
        timestamp: Date.now(),
      });

      // Get AI's opening message with retry
      arena.setIsAiThinking(true);
      const prompt = buildPersonaPrompt(persona);
      const history = '';

      try {
        const response = await withRetry(() =>
          window.api.arenaInterviewerRespond(prompt, history, 'INTRO'),
        );

        arena.addMessage({
          role: 'interviewer',
          content: response,
          timestamp: Date.now(),
        });

        // Speak the AI's opening line
        if (ttsEnabled) speak(response);
      } catch (aiErr: any) {
        const isQuota = aiErr?.message?.includes('429') || aiErr?.message?.includes('quota');
        const errorMsg = isQuota
          ? '⚠️ Gemini API quota exceeded. Please wait a moment and try sending a message, or check your billing at ai.google.dev.'
          : '⚠️ AI connection failed. You can still practice — type messages and the AI will respond when available.';
        setApiError(isQuota ? 'API quota exceeded — responses may be delayed' : null);
        arena.addMessage({
          role: 'system',
          content: errorMsg,
          timestamp: Date.now(),
        });
      }
      arena.setIsAiThinking(false);
    } catch (err) {
      console.error('[Arena] Failed to start session:', err);
      arena.setIsAiThinking(false);
    }
  }, [arena, ttsEnabled, speak, webcam]);

  // Handle candidate sending a message
  const handleSendMessage = useCallback(async (message: string) => {
    if (!arena.selectedPersona || arena.isAiThinking) return;

    // Add candidate message
    arena.addMessage({
      role: 'candidate',
      content: message,
      timestamp: Date.now(),
    });

    // Run sentiment analysis on candidate message
    sentiment.analyze(message);

    // Determine if we should advance the stage
    const currentStageIndex = stageFlow.indexOf(arena.stage);
    const messageCount = arena.messages.filter((m) => m.role === 'candidate').length;

    // Simple heuristic: advance stage after a few exchanges
    let nextStage = arena.stage;
    if (arena.stage === 'INTRO' && messageCount >= 1) {
      nextStage = 'PROBLEM_STATEMENT';
      arena.setStage('PROBLEM_STATEMENT');
      arena.addMessage({
        role: 'system',
        content: '📋 Moving to Problem Statement…',
        timestamp: Date.now(),
      });
    } else if (arena.stage === 'PROBLEM_STATEMENT' && messageCount >= 2) {
      nextStage = 'CLARIFICATION';
      arena.setStage('CLARIFICATION');
    } else if (arena.stage === 'CLARIFICATION' && messageCount >= 4) {
      nextStage = 'DEEP_DIVE';
      arena.setStage('DEEP_DIVE');
      arena.addMessage({
        role: 'system',
        content: '🔍 Moving to Deep Dive…',
        timestamp: Date.now(),
      });
    }

    // Build conversation history
    const history = arena.messages
      .filter((m) => m.role !== 'system')
      .map((m) => `${m.role === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${m.content}`)
      .join('\n');

    // Get AI response
    arena.setIsAiThinking(true);
    try {
      const prompt = buildPersonaPrompt(arena.selectedPersona);
      const response = await withRetry(() =>
        window.api.arenaInterviewerRespond(prompt, history, nextStage),
      );

      // If problem statement stage, also set the code editor
      if (nextStage === 'PROBLEM_STATEMENT' && !arena.problemStatement) {
        arena.setProblemStatement(response);
      }

      arena.addMessage({
        role: 'interviewer',
        content: response,
        timestamp: Date.now(),
      });

      setApiError(null);
      // Speak the AI's response
      if (ttsEnabled) speak(response);
    } catch (err: any) {
      console.error('[Arena] AI response failed:', err);
      const isQuota = err?.message?.includes('429') || err?.message?.includes('quota');
      setApiError(isQuota ? 'API quota exceeded — please wait and retry' : null);
      arena.addMessage({
        role: 'system',
        content: isQuota
          ? '⚠️ API quota exceeded. Please wait ~60 seconds and try again.'
          : '⚠️ AI response failed. Please try again.',
        timestamp: Date.now(),
      });
    } finally {
      arena.setIsAiThinking(false);
    }
  }, [arena, ttsEnabled, speak]);

  // Run code
  const handleRunCode = useCallback(async () => {
    setIsRunning(true);
    setRunOutput(null);
    try {
      const result = await window.api.arenaRunCode(arena.code, arena.language);
      setRunOutput(result);
    } catch (err: any) {
      setRunOutput({ stdout: '', stderr: err.message || 'Execution failed', exitCode: 1 });
    } finally {
      setIsRunning(false);
    }
  }, [arena.code, arena.language]);

  // End interview
  const handleEndInterview = useCallback(async () => {
    arena.setStage('WRAPUP');

    // Get final feedback from AI
    if (arena.selectedPersona) {
      arena.setIsAiThinking(true);
      arena.addMessage({
        role: 'system',
        content: '🤝 Wrapping up the interview…',
        timestamp: Date.now(),
      });

      try {
        const history = arena.messages
          .filter((m) => m.role !== 'system')
          .map((m) => `${m.role === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${m.content}`)
          .join('\n');

        const prompt = buildPersonaPrompt(arena.selectedPersona) +
          '\n\nProvide a brief wrap-up with feedback: strengths, areas for improvement, and an overall rating out of 10.';
        const response = await withRetry(() =>
          window.api.arenaInterviewerRespond(prompt, history, 'WRAPUP'),
        );

        arena.addMessage({
          role: 'interviewer',
          content: response,
          timestamp: Date.now(),
        });

        // Speak the AI's wrapup
        if (ttsEnabled) speak(response);
      } catch (err) {
        console.error('[Arena] Wrapup failed:', err);
      } finally {
        arena.setIsAiThinking(false);
      }
    }

    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [arena, ttsEnabled, speak]);

  // Handle full back
  const handleBack = useCallback(() => {
    stopTTS();
    webcam.stop();
    faceMesh.stop();
    voiceAnalytics.stop();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    arena.reset();
    onBack();
  }, [arena, onBack, stopTTS, webcam, faceMesh, voiceAnalytics]);

  // Format timer
  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Show persona selector if no persona is chosen
  if (!arena.selectedPersona) {
    return <PersonaSelector onSelect={handleSelectPersona} onBack={handleBack} />;
  }

  return (
    <div className="flex h-full flex-col">
      {/* Top Bar */}
      <div className="glass-subtle flex items-center justify-between border-b border-white/5 px-6 py-3">
        <div className="flex items-center gap-4">
          <GlassButton variant="ghost" size="sm" onClick={handleBack}>
            ← Exit
          </GlassButton>
          <div className="h-4 w-px bg-white/10" />
          <span className="text-sm font-medium text-text-primary">⚔️ Arena Mode</span>
          <Badge variant="info" dot>
            {arena.selectedPersona.name}
          </Badge>
          {arena.isActive && (
            <span className="text-xs text-text-muted">
              {formatTime(arena.elapsedSeconds)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* TTS Toggle */}
          {ttsAvailable && (
            <GlassButton
              variant="ghost"
              size="sm"
              onClick={() => { setTtsEnabled(!ttsEnabled); if (ttsEnabled) stopTTS(); }}
              title={ttsEnabled ? 'Mute AI Voice' : 'Enable AI Voice'}
            >
              {ttsEnabled ? '🔊' : '🔇'} {isSpeaking && '●'}
            </GlassButton>
          )}

          {/* Camera Toggle */}
          <GlassButton
            variant="ghost"
            size="sm"
            onClick={() => webcam.toggle()}
            title={webcam.isActive ? 'Turn off camera' : 'Turn on camera'}
          >
            {webcam.isActive ? '📷' : '📷‍🚫'}
          </GlassButton>

          {/* View Toggle */}
          <div className="flex rounded-lg border border-white/10 overflow-hidden">
            <button
              className={`px-3.5 py-1.5 text-xs font-medium transition-colors ${
                arena.activeView === 'editor' ? 'bg-neon-blue/20 text-neon-blue' : 'text-text-muted hover:bg-white/5'
              }`}
              onClick={() => arena.setActiveView('editor')}
            >
              💻 Code
            </button>
            <button
              className={`px-3.5 py-1.5 text-xs font-medium transition-colors ${
                arena.activeView === 'whiteboard' ? 'bg-neon-purple/20 text-neon-purple' : 'text-text-muted hover:bg-white/5'
              }`}
              onClick={() => arena.setActiveView('whiteboard')}
            >
              🎨 Board
            </button>
            <button
              className={`px-3.5 py-1.5 text-xs font-medium transition-colors ${
                arena.activeView === 'split' ? 'bg-neon-green/20 text-neon-green' : 'text-text-muted hover:bg-white/5'
              }`}
              onClick={() => arena.setActiveView('split')}
            >
              ⊞ Split
            </button>
          </div>

          {/* API Error Indicator */}
          {apiError && (
            <span className="rounded-md bg-neon-red/10 px-3 py-1 text-xs text-neon-red">
              ⚠️ {apiError}
            </span>
          )}

          {arena.stage !== 'WRAPUP' ? (
            <GlassButton variant="danger" size="sm" onClick={handleEndInterview}>
              End Interview
            </GlassButton>
          ) : (
            <GlassButton variant="primary" size="sm" onClick={handleBack}>
              Done — Back to Home
            </GlassButton>
          )}
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 min-h-0">
        <Group orientation="horizontal">
          {/* Left — Code Editor or Whiteboard */}
          <Panel defaultSize={45} minSize={25}>
            {arena.activeView === 'editor' ? (
              <CodeEditor
                code={arena.code}
                language={arena.language}
                onCodeChange={arena.setCode}
                onLanguageChange={arena.setLanguage}
                onRunCode={handleRunCode}
                runOutput={runOutput}
                isRunning={isRunning}
                className="h-full"
              />
            ) : arena.activeView === 'whiteboard' ? (
              <Whiteboard
                onSnapshot={(b64) => {
                  // Send whiteboard snapshot to AI
                  if (arena.selectedPersona) {
                    const history = arena.messages
                      .filter((m) => m.role !== 'system')
                      .map((m) => `${m.role === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${m.content}`)
                      .join('\n');
                    window.api.arenaAnalyzeWhiteboard(b64, history).then((response: string) => {
                      arena.addMessage({ role: 'interviewer', content: response, timestamp: Date.now() });
                    }).catch(console.error);
                  }
                }}
                className="h-full"
              />
            ) : (
              /* Split view: stacked editor + whiteboard */
              <div className="flex h-full flex-col">
                <div className="flex-1 min-h-0">
                  <CodeEditor
                    code={arena.code}
                    language={arena.language}
                    onCodeChange={arena.setCode}
                    onLanguageChange={arena.setLanguage}
                    onRunCode={handleRunCode}
                    runOutput={runOutput}
                    isRunning={isRunning}
                    className="h-full"
                  />
                </div>
                <div className="h-px bg-white/5" />
                <div className="h-[250px] min-h-0">
                  <Whiteboard className="h-full" />
                </div>
              </div>
            )}
          </Panel>

          {/* Resize Handle */}
          <Separator className="w-1 bg-white/5 hover:bg-neon-blue/20 transition-colors" />

          {/* Middle — Chat */}
          <Panel defaultSize={33} minSize={20}>
            <ArenaChat
              messages={arena.messages}
              isAiThinking={arena.isAiThinking}
              persona={arena.selectedPersona}
              stage={arena.stage}
              onSendMessage={handleSendMessage}
              className="h-full"
            />
          </Panel>

          {/* Resize Handle */}
          <Separator className="w-1 bg-white/5 hover:bg-neon-blue/20 transition-colors" />

          {/* Right — Video Feeds + Analytics */}
          <Panel defaultSize={22} minSize={18} maxSize={30}>
            <div className="flex h-full flex-col overflow-y-auto p-4 gap-4">
              {/* Video Feeds */}
              <VideoFeed
                videoRef={webcam.videoRef}
                isActive={webcam.isActive}
                error={webcam.error}
                onToggle={() => webcam.toggle()}
                personaName={arena.selectedPersona.name}
                personaIcon={
                  arena.selectedPersona.focus === 'optimization' ? '⚡' :
                  arena.selectedPersona.focus === 'system_design' ? '🏗️' :
                  arena.selectedPersona.focus === 'reliability' ? '🔒' :
                  arena.selectedPersona.focus === 'behavioral' ? '💬' : '🚀'
                }
                isSpeaking={isSpeaking}
                variant="sidebar"
              />

              {/* Live Analytics Section */}
              <div className="glass-subtle rounded-xl p-4 space-y-4">
                <h4 className="text-xs font-semibold uppercase text-text-muted tracking-wider flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-neon-green animate-pulse" />
                  Live Analytics
                </h4>

                {/* Voice Metrics */}
                {voiceAnalytics.isAnalyzing && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-medium text-text-secondary">🎙️ Voice</p>
                    <VoiceMetricsDisplay
                      currentMetrics={voiceAnalytics.currentMetrics}
                      averageConfidence={voiceAnalytics.averageConfidence}
                      averageStress={voiceAnalytics.averageStress}
                    />
                  </div>
                )}

                {/* Sentiment Indicator */}
                <div className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2.5">
                  <span className="text-xs text-text-secondary">Sentiment</span>
                  {sentiment.lastResult ? (
                    <span className={`text-sm font-bold ${
                      sentiment.lastResult.label === 'POSITIVE' ? 'text-neon-green' :
                      sentiment.lastResult.label === 'NEGATIVE' ? 'text-neon-red' : 'text-text-secondary'
                    }`}>
                      {sentiment.lastResult.label === 'POSITIVE' ? '😊 Positive' :
                       sentiment.lastResult.label === 'NEGATIVE' ? '😟 Negative' : '😐 Neutral'}
                      <span className="ml-1 text-xs font-normal text-text-muted">
                        {Math.round(sentiment.lastResult.confidence * 100)}%
                      </span>
                    </span>
                  ) : (
                    <span className="text-xs text-text-muted">Waiting…</span>
                  )}
                </div>

                {/* Posture Score */}
                {faceMesh.posture && (
                  <div className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2.5">
                    <span className="text-xs text-text-secondary">🧘 Posture</span>
                    <span className={`text-sm font-bold ${
                      faceMesh.posture.score >= 70 ? 'text-neon-green' :
                      faceMesh.posture.score >= 40 ? 'text-yellow-400' : 'text-neon-red'
                    }`}>
                      {faceMesh.posture.score}/100
                    </span>
                  </div>
                )}
              </div>

              {/* Posture Alert (floating notification) */}
              <PostureAlert posture={faceMesh.posture} />
            </div>
          </Panel>
        </Group>
      </div>
    </div>
  );
};

export default ArenaPage;

// ============================================
// PrepHQ — Preload API Type Definitions
// Describes the shape exposed via contextBridge
// ============================================

import type { GhostHint, GhostState, InterviewPhase, PanicResponse, Session, TranscriptEntry } from '../shared/types';

/** API exposed to the renderer via contextBridge.exposeInMainWorld('api', ...) */
export interface PreloadApi {
  // ── App ───────────────────────────────────
  getVersion: () => Promise<string>;
  quit: () => void;

  // ── Window ────────────────────────────────
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  setClickThrough: (enabled: boolean) => void;

  // ── Ghost Mode ────────────────────────────
  ghostStart: (sessionId: string) => Promise<{ success: boolean }>;
  ghostStop: () => Promise<{ success: boolean }>;
  ghostPanic: () => Promise<PanicResponse>;
  ghostPushTranscript: (entry: TranscriptEntry) => Promise<void>;
  ghostTriggerAnalysis: () => Promise<GhostHint | null>;
  ghostGetState: () => Promise<{
    active: boolean;
    state: GhostState;
    phase: InterviewPhase;
    transcriptCount: number;
  }>;
  onGhostHint: (callback: (hint: GhostHint) => void) => () => void;
  onGhostStateChange: (callback: (state: GhostState) => void) => () => void;
  onGhostPhaseChange: (callback: (phase: InterviewPhase) => void) => () => void;

  // ── Audio ─────────────────────────────────
  startAudioCapture: () => Promise<void>;
  stopAudioCapture: () => Promise<void>;

  // ── Arena Mode ────────────────────────────
  arenaInterviewerRespond: (personaPrompt: string, history: string, stage: string) => Promise<string>;
  arenaAnalyzeWhiteboard: (imageBase64: string, context: string) => Promise<string>;
  arenaRunCode: (code: string, language: string) => Promise<{ stdout: string; stderr: string; exitCode: number }>;

  // ── Database ──────────────────────────────
  createSession: (mode: 'GHOST' | 'ARENA') => Promise<Session>;
  getSessions: () => Promise<Session[]>;
  getSession: (id: string) => Promise<Session | null>;
  deleteSession: (id: string) => Promise<void>;
  saveTranscript: (entry: TranscriptEntry) => Promise<void>;

  // ── Settings ──────────────────────────────
  getSetting: (key: string) => Promise<unknown>;
  setSetting: (key: string, value: unknown) => Promise<void>;

  // ── Gemini ────────────────────────────────
  initGemini: (apiKey: string) => Promise<{ success: boolean }>;

  // ── Shortcuts ─────────────────────────────
  onPanicShortcut: (callback: () => void) => () => void;

  // ── Platform ──────────────────────────────
  platform: NodeJS.Platform;
}

declare global {
  interface Window {
    api: PreloadApi;
  }
}

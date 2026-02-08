// ============================================
// PrepHQ — Preload Script
// Exposes a typed API to the renderer via contextBridge
// ============================================

import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../shared/constants/ipc-channels';
import type { GhostHint, GhostState, InterviewPhase } from '../shared/types';

/**
 * Helper: subscribe to an IPC event from main and return an unsubscribe fn.
 */
function createListener<T>(channel: string, callback: (data: T) => void): () => void {
  const handler = (_event: Electron.IpcRendererEvent, data: T) => callback(data);
  ipcRenderer.on(channel, handler);
  return () => ipcRenderer.removeListener(channel, handler);
}

contextBridge.exposeInMainWorld('api', {
  // ── App ───────────────────────────────────
  getVersion: () => ipcRenderer.invoke(IPC_CHANNELS.APP_GET_VERSION),
  quit: () => ipcRenderer.send(IPC_CHANNELS.APP_QUIT),

  // ── Window ────────────────────────────────
  minimize: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_MINIMIZE),
  maximize: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_MAXIMIZE),
  close: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_CLOSE),
  setClickThrough: (enabled: boolean) =>
    ipcRenderer.send(IPC_CHANNELS.WINDOW_SET_CLICK_THROUGH, enabled),

  // ── Ghost Mode ────────────────────────────
  ghostStart: (sessionId: string) => ipcRenderer.invoke(IPC_CHANNELS.GHOST_START, sessionId),
  ghostStop: () => ipcRenderer.invoke(IPC_CHANNELS.GHOST_STOP),
  ghostPanic: () => ipcRenderer.invoke(IPC_CHANNELS.GHOST_PANIC),
  ghostPushTranscript: (entry: import('../shared/types').TranscriptEntry) =>
    ipcRenderer.invoke('ghost:push-transcript', entry),
  ghostTriggerAnalysis: () => ipcRenderer.invoke('ghost:trigger-analysis'),
  ghostGetState: () => ipcRenderer.invoke('ghost:get-state'),
  onGhostHint: (callback: (hint: GhostHint) => void) =>
    createListener<GhostHint>(IPC_CHANNELS.GHOST_HINT_UPDATE, callback),
  onGhostStateChange: (callback: (state: GhostState) => void) =>
    createListener<GhostState>(IPC_CHANNELS.GHOST_STATE_CHANGE, callback),
  onGhostPhaseChange: (callback: (phase: InterviewPhase) => void) =>
    createListener<InterviewPhase>(IPC_CHANNELS.GHOST_PHASE_CHANGE, callback),

  // ── Audio ─────────────────────────────────
  startAudioCapture: () => ipcRenderer.invoke(IPC_CHANNELS.AUDIO_START_CAPTURE),
  stopAudioCapture: () => ipcRenderer.invoke(IPC_CHANNELS.AUDIO_STOP_CAPTURE),
  getSystemAudioSources: () => ipcRenderer.invoke(IPC_CHANNELS.AUDIO_SYSTEM_SOURCES),
  startSystemAudio: (sourceId: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.AUDIO_START_SYSTEM, sourceId),

  // ── Arena Mode ────────────────────────────
  arenaInterviewerRespond: (personaPrompt: string, history: string, stage: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.ARENA_INTERVIEWER_RESPOND, personaPrompt, history, stage),
  arenaAnalyzeWhiteboard: (imageBase64: string, context: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.ARENA_ANALYZE_WHITEBOARD, imageBase64, context),
  arenaRunCode: (code: string, language: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.ARENA_RUN_CODE, code, language),

  // ── Database ──────────────────────────────
  createSession: (mode: 'GHOST' | 'ARENA') =>
    ipcRenderer.invoke(IPC_CHANNELS.DB_CREATE_SESSION, mode),
  getSessions: () => ipcRenderer.invoke(IPC_CHANNELS.DB_GET_SESSIONS),
  getSession: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.DB_GET_SESSION, id),
  deleteSession: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.DB_DELETE_SESSION, id),
  saveTranscript: (entry: import('../shared/types').TranscriptEntry) =>
    ipcRenderer.invoke(IPC_CHANNELS.DB_SAVE_TRANSCRIPT, entry),

  // ── Settings ──────────────────────────────
  getSetting: (key: string) => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET, key),
  setSetting: (key: string, value: unknown) =>
    ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_SET, key, value),

  // ── Gemini ────────────────────────────────
  initGemini: (apiKey: string) => ipcRenderer.invoke('gemini:init', apiKey),

  // ── Shortcuts ─────────────────────────────
  onPanicShortcut: (callback: () => void) =>
    createListener<void>(IPC_CHANNELS.SHORTCUT_PANIC, callback),

  // ── Auto-Updater ─────────────────────────
  checkForUpdate: () => ipcRenderer.invoke(IPC_CHANNELS.APP_CHECK_UPDATE),
  installUpdate: () => ipcRenderer.invoke(IPC_CHANNELS.APP_INSTALL_UPDATE),
  onUpdateStatus: (callback: (data: any) => void) =>
    createListener<any>(IPC_CHANNELS.APP_UPDATE_STATUS, callback),

  // ── Performance ───────────────────────────
  getPerfMetrics: () => ipcRenderer.invoke(IPC_CHANNELS.PERF_GET_METRICS),

  // ── Platform ──────────────────────────────
  platform: process.platform,
});

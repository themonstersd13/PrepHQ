// ============================================
// PrepHQ — Ghost Session Manager (Main Process)
// Orchestrates the Ghost Mode pipeline:
// Audio capture → Transcript → Gemini analysis → UI hints
// ============================================

import { BrowserWindow } from 'electron';
import { IPC_CHANNELS } from '../../shared/constants/ipc-channels';
import type { GhostHint, GhostState, InterviewPhase, TranscriptEntry } from '../../shared/types';
import { analyzeContext, detectPhase, generatePanicScript, isGeminiReady } from './gemini-service';

interface GhostSession {
  sessionId: string;
  state: GhostState;
  currentPhase: InterviewPhase;
  transcriptBuffer: TranscriptEntry[];
  lastAnalysisTime: number;
  analysisInterval: ReturnType<typeof setInterval> | null;
}

const ANALYSIS_DEBOUNCE_MS = 3000; // Min time between analyses

let activeSession: GhostSession | null = null;
let mainWindow: BrowserWindow | null = null;

/**
 * Set the main window reference for IPC communication
 */
export function setMainWindow(win: BrowserWindow): void {
  mainWindow = win;
}

/**
 * Send state change to renderer
 */
function emitStateChange(state: GhostState): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(IPC_CHANNELS.GHOST_STATE_CHANGE, state);
  }
}

/**
 * Send phase change to renderer
 */
function emitPhaseChange(phase: InterviewPhase): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(IPC_CHANNELS.GHOST_PHASE_CHANGE, phase);
  }
}

/**
 * Send hint update to renderer
 */
function emitHintUpdate(hint: GhostHint): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(IPC_CHANNELS.GHOST_HINT_UPDATE, hint);
  }
}

/**
 * Start a new Ghost session
 */
export function startGhostSession(sessionId: string): void {
  if (activeSession) {
    stopGhostSession();
  }

  activeSession = {
    sessionId,
    state: 'LISTENING',
    currentPhase: 'UNKNOWN',
    transcriptBuffer: [],
    lastAnalysisTime: 0,
    analysisInterval: null,
  };

  emitStateChange('LISTENING');
  console.log(`[Ghost] Session started: ${sessionId}`);
}

/**
 * Stop the active Ghost session
 */
export function stopGhostSession(): void {
  if (!activeSession) return;

  if (activeSession.analysisInterval) {
    clearInterval(activeSession.analysisInterval);
  }

  activeSession.state = 'IDLE';
  emitStateChange('IDLE');
  console.log(`[Ghost] Session stopped: ${activeSession.sessionId}`);
  activeSession = null;
}

/**
 * Push a new transcript entry and trigger analysis if needed
 */
export async function pushTranscript(entry: TranscriptEntry): Promise<void> {
  if (!activeSession) return;

  activeSession.transcriptBuffer.push(entry);

  // Keep only last 50 entries for context window management
  if (activeSession.transcriptBuffer.length > 50) {
    activeSession.transcriptBuffer = activeSession.transcriptBuffer.slice(-50);
  }

  // Debounce analysis
  const now = Date.now();
  if (now - activeSession.lastAnalysisTime < ANALYSIS_DEBOUNCE_MS) return;

  await runAnalysis();
}

/**
 * Manually trigger analysis (e.g., from renderer "Analyze" button)
 */
export async function triggerAnalysis(): Promise<GhostHint | null> {
  return runAnalysis();
}

/**
 * Run the Gemini analysis pipeline
 */
async function runAnalysis(): Promise<GhostHint | null> {
  if (!activeSession || !isGeminiReady()) return null;

  activeSession.state = 'PROCESSING';
  activeSession.lastAnalysisTime = Date.now();
  emitStateChange('PROCESSING');

  try {
    // Build transcript context string
    const context = activeSession.transcriptBuffer
      .map((t) => `[${t.speaker}]: ${t.text}`)
      .join('\n');

    // Detect phase
    const phase = await detectPhase(context);
    if (phase !== activeSession.currentPhase) {
      activeSession.currentPhase = phase;
      emitPhaseChange(phase);
    }

    // Analyze context and get hints
    const hint = await analyzeContext(context, activeSession.currentPhase);

    activeSession.state = 'SUGGESTING';
    emitStateChange('SUGGESTING');
    emitHintUpdate(hint);

    // Revert to LISTENING after a delay
    setTimeout(() => {
      if (activeSession) {
        activeSession.state = 'LISTENING';
        emitStateChange('LISTENING');
      }
    }, 2000);

    return hint;
  } catch (error) {
    console.error('[Ghost] Analysis error:', error);
    activeSession.state = 'LISTENING';
    emitStateChange('LISTENING');
    return null;
  }
}

/**
 * Handle panic protocol
 */
export async function handlePanic(): Promise<{ stallScript: string; topic: string }> {
  const context = activeSession
    ? activeSession.transcriptBuffer
        .slice(-10)
        .map((t) => `[${t.speaker}]: ${t.text}`)
        .join('\n')
    : '';

  return generatePanicScript(context);
}

/**
 * Get current session state
 */
export function getGhostSessionState(): {
  active: boolean;
  state: GhostState;
  phase: InterviewPhase;
  transcriptCount: number;
} {
  if (!activeSession) {
    return { active: false, state: 'IDLE', phase: 'UNKNOWN', transcriptCount: 0 };
  }

  return {
    active: true,
    state: activeSession.state,
    phase: activeSession.currentPhase,
    transcriptCount: activeSession.transcriptBuffer.length,
  };
}

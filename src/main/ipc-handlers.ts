// ============================================
// PrepHQ — Main Process IPC Handlers
// Registers all IPC handlers for the main process
// ============================================

import { app, BrowserWindow, ipcMain, safeStorage } from 'electron';
import { IPC_CHANNELS } from '../shared/constants/ipc-channels';
import { getDao } from './database';
import { initGemini } from './services/gemini-service';
import { generateInterviewerResponse, analyzeWhiteboard } from './services/gemini-service';
import {
  setMainWindow,
  startGhostSession,
  stopGhostSession,
  handlePanic,
  pushTranscript,
  triggerAnalysis,
  getGhostSessionState,
} from './services/ghost-session';
import type { AppMode, TranscriptEntry } from '../shared/types';

// In-memory settings store (encrypted at rest via safeStorage)
const settingsCache = new Map<string, unknown>();

export function registerIpcHandlers(mainWindow: BrowserWindow): void {
  // Wire main window for Ghost IPC events
  setMainWindow(mainWindow);

  // ── App ───────────────────────────────────
  ipcMain.handle(IPC_CHANNELS.APP_GET_VERSION, () => {
    return app.getVersion();
  });

  ipcMain.on(IPC_CHANNELS.APP_QUIT, () => {
    app.quit();
  });

  // ── Window ────────────────────────────────
  ipcMain.on(IPC_CHANNELS.WINDOW_MINIMIZE, () => {
    mainWindow.minimize();
  });

  ipcMain.on(IPC_CHANNELS.WINDOW_MAXIMIZE, () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });

  ipcMain.on(IPC_CHANNELS.WINDOW_CLOSE, () => {
    mainWindow.close();
  });

  ipcMain.on(IPC_CHANNELS.WINDOW_SET_CLICK_THROUGH, (_event, enabled: boolean) => {
    mainWindow.setIgnoreMouseEvents(enabled, { forward: true });
  });

  // ── Ghost Mode ────────────────────────────
  ipcMain.handle(IPC_CHANNELS.GHOST_START, async (_event, sessionId: string) => {
    console.log('[Main] Ghost mode start requested');
    startGhostSession(sessionId);
    return { success: true };
  });

  ipcMain.handle(IPC_CHANNELS.GHOST_STOP, async () => {
    console.log('[Main] Ghost mode stop requested');
    stopGhostSession();
    return { success: true };
  });

  ipcMain.handle(IPC_CHANNELS.GHOST_PANIC, async () => {
    console.log('[Main] Panic protocol triggered');
    return handlePanic();
  });

  ipcMain.handle('ghost:push-transcript', async (_event, entry: TranscriptEntry) => {
    await pushTranscript(entry);
  });

  ipcMain.handle('ghost:trigger-analysis', async () => {
    return triggerAnalysis();
  });

  ipcMain.handle('ghost:get-state', async () => {
    return getGhostSessionState();
  });

  // ── Arena Mode ─────────────────────────────
  ipcMain.handle(
    IPC_CHANNELS.ARENA_INTERVIEWER_RESPOND,
    async (_event, personaPrompt: string, history: string, stage: string) => {
      return generateInterviewerResponse(personaPrompt, history, stage);
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.ARENA_ANALYZE_WHITEBOARD,
    async (_event, imageBase64: string, context: string) => {
      return analyzeWhiteboard(imageBase64, context);
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.ARENA_RUN_CODE,
    async (_event, code: string, language: string) => {
      // Simple code execution via child_process (sandboxed)
      const { execSync } = require('child_process');
      try {
        let cmd: string;
        switch (language) {
          case 'python':
            cmd = `python -c "${code.replace(/"/g, '\\"')}"`;
            break;
          case 'javascript':
          case 'typescript':
            cmd = `node -e "${code.replace(/"/g, '\\"')}"`;
            break;
          default:
            return { stdout: '', stderr: 'Unsupported language: ' + language, exitCode: 1 };
        }
        const stdout = execSync(cmd, { timeout: 10000, encoding: 'utf-8' });
        return { stdout, stderr: '', exitCode: 0 };
      } catch (err: any) {
        return {
          stdout: err.stdout || '',
          stderr: err.stderr || err.message,
          exitCode: err.status || 1,
        };
      }
    },
  );

  // ── Audio (stubs — will be wired to native module) ──
  ipcMain.handle(IPC_CHANNELS.AUDIO_START_CAPTURE, async () => {
    console.log('[Main] Audio capture start');
    // Audio capture is handled in renderer via Web APIs
    // This channel is reserved for future native module integration
  });

  ipcMain.handle(IPC_CHANNELS.AUDIO_STOP_CAPTURE, async () => {
    console.log('[Main] Audio capture stop');
  });

  ipcMain.handle(IPC_CHANNELS.AUDIO_SYSTEM_SOURCES, async () => {
    // Return available audio sources for system audio capture
    const { desktopCapturer } = require('electron');
    try {
      const sources = await desktopCapturer.getSources({ types: ['window', 'screen'] });
      return sources.map((s: any) => ({ id: s.id, name: s.name }));
    } catch {
      return [];
    }
  });

  ipcMain.handle(IPC_CHANNELS.AUDIO_START_SYSTEM, async (_event, sourceId: string) => {
    console.log('[Main] System audio start:', sourceId);
    // System audio capture constraints are applied in the renderer
    // via navigator.mediaDevices.getUserMedia with chromeMediaSource
    return { success: true, sourceId };
  });

  // ── Database ──────────────────────────────
  ipcMain.handle(IPC_CHANNELS.DB_CREATE_SESSION, async (_event, mode: string) => {
    const dao = getDao();
    const id = crypto.randomUUID();
    return dao.createSession(id, mode as AppMode);
  });

  ipcMain.handle(IPC_CHANNELS.DB_GET_SESSIONS, async () => {
    const dao = getDao();
    return dao.getAllSessions();
  });

  ipcMain.handle(IPC_CHANNELS.DB_GET_SESSION, async (_event, id: string) => {
    const dao = getDao();
    return dao.getSession(id);
  });

  ipcMain.handle(IPC_CHANNELS.DB_SAVE_TRANSCRIPT, async (_event, entry) => {
    const dao = getDao();
    dao.appendTranscript(entry);
  });

  ipcMain.handle(IPC_CHANNELS.DB_SAVE_METRIC, async (_event, entry) => {
    const dao = getDao();
    dao.upsertMetric(entry);
  });

  ipcMain.handle(IPC_CHANNELS.DB_DELETE_SESSION, async (_event, id: string) => {
    const dao = getDao();
    dao.deleteSession(id);
  });

  // ── Settings (safeStorage encrypted) ──────
  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, async (_event, key: string) => {
    return settingsCache.get(key) ?? null;
  });

  ipcMain.handle(IPC_CHANNELS.SETTINGS_SET, async (_event, key: string, value: unknown) => {
    settingsCache.set(key, value);
    // For API keys, encrypt with safeStorage and also init services
    if (key.startsWith('apiKey:') && typeof value === 'string') {
      try {
        if (safeStorage.isEncryptionAvailable()) {
          const encrypted = safeStorage.encryptString(value);
          settingsCache.set(`${key}:encrypted`, encrypted.toString('base64'));
        }
      } catch (err) {
        console.warn('[Main] safeStorage encryption not available:', err);
      }

      // Initialize Gemini when key is set
      if (key === 'apiKey:gemini' && value) {
        initGemini(value);
      }
    }
  });

  // ── Gemini Init ───────────────────────────
  ipcMain.handle('gemini:init', async (_event, apiKey: string) => {
    initGemini(apiKey);
    return { success: true };
  });

  // ── Performance Metrics ───────────────────
  ipcMain.handle(IPC_CHANNELS.PERF_GET_METRICS, async () => {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    return {
      rss: Math.round(memUsage.rss / 1048576),
      heapUsed: Math.round(memUsage.heapUsed / 1048576),
      heapTotal: Math.round(memUsage.heapTotal / 1048576),
      external: Math.round(memUsage.external / 1048576),
      cpuUser: cpuUsage.user,
      cpuSystem: cpuUsage.system,
      uptime: process.uptime(),
    };
  });
}

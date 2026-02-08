// ============================================
// PrepHQ — Electron Main Process
// ============================================

import { app, BrowserWindow, globalShortcut, session } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { registerIpcHandlers } from './main/ipc-handlers';
import { closeDatabase } from './main/database';
import { IPC_CHANNELS } from './shared/constants/ipc-channels';
import { initAutoUpdater } from './main/services/auto-updater';

// ── Privacy: Disable all telemetry & crash reporting ──
app.commandLine.appendSwitch('disable-features', 'SpareRendererForSitePerProcess');
app.commandLine.appendSwitch('disable-breakpad'); // No crash reports
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    frame: false, // Frameless for custom title bar
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0a0a0f',
      symbolColor: '#ffffff',
      height: 36,
    },
    backgroundColor: '#0a0a0f',
    webPreferences: {
      preload: path.join(__dirname, 'index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // Register all IPC handlers
  registerIpcHandlers(mainWindow);

  // Load the app
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  // Open DevTools in development
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.webContents.openDevTools();
  }

  // Initialize auto-updater (production only)
  if (!MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    initAutoUpdater(mainWindow);
  }

  // Register global shortcut: Ctrl+Shift+H for Panic Protocol
  globalShortcut.register('CommandOrControl+Shift+H', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(IPC_CHANNELS.SHORTCUT_PANIC);
    }
  });
};

app.on('ready', () => {
  // ── Privacy: Block all outgoing requests except Gemini API ──
  const allowedDomains = [
    'generativelanguage.googleapis.com',
    'localhost',
    '127.0.0.1',
    // MediaPipe models + WASM runtime
    'cdn.jsdelivr.net',
    'storage.googleapis.com',
    // PeerJS signaling
    '0.peerjs.com',
  ];

  session.defaultSession.webRequest.onBeforeRequest(
    { urls: ['*://*/*'] },
    (details, callback) => {
      try {
        const url = new URL(details.url);
        const isAllowed =
          url.protocol === 'file:' ||
          url.protocol === 'devtools:' ||
          url.protocol === 'chrome-extension:' ||
          url.hostname === '' ||
          allowedDomains.some((d) => url.hostname.includes(d));

        callback({ cancel: !isAllowed });
      } catch {
        callback({ cancel: false });
      }
    },
  );

  // ── Privacy: Remove referrer and tracking headers ──
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    delete details.requestHeaders['Referer'];
    delete details.requestHeaders['Origin'];
    callback({ requestHeaders: details.requestHeaders });
  });

  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  closeDatabase();
});

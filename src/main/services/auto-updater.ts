// ============================================
// PrepHQ — Auto-Updater Service
// OTA updates via electron-updater + GitHub Releases
// ============================================

import { autoUpdater, type UpdateCheckResult, type UpdateInfo } from 'electron-updater';
import { BrowserWindow, ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/constants/ipc-channels';

let mainWindow: BrowserWindow | null = null;

function sendUpdateStatus(status: string, data?: any) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(IPC_CHANNELS.APP_UPDATE_STATUS, { status, ...data });
  }
}

export function initAutoUpdater(win: BrowserWindow): void {
  mainWindow = win;

  // Configure updater
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowPrerelease = false;

  // ── Events ──
  autoUpdater.on('checking-for-update', () => {
    sendUpdateStatus('checking');
  });

  autoUpdater.on('update-available', (info: UpdateInfo) => {
    sendUpdateStatus('available', {
      version: info.version,
      releaseDate: info.releaseDate,
      releaseNotes: info.releaseNotes,
    });
    // Auto-download
    autoUpdater.downloadUpdate();
  });

  autoUpdater.on('update-not-available', () => {
    sendUpdateStatus('not-available');
  });

  autoUpdater.on('download-progress', (progress) => {
    sendUpdateStatus('downloading', {
      percent: progress.percent,
      transferred: progress.transferred,
      total: progress.total,
      bytesPerSecond: progress.bytesPerSecond,
    });
  });

  autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
    sendUpdateStatus('downloaded', {
      version: info.version,
    });
  });

  autoUpdater.on('error', (err: Error) => {
    sendUpdateStatus('error', { message: err.message });
  });

  // ── IPC Handlers ──
  ipcMain.handle(IPC_CHANNELS.APP_CHECK_UPDATE, async (): Promise<UpdateCheckResult | null> => {
    try {
      return await autoUpdater.checkForUpdates();
    } catch (err: any) {
      console.warn('[AutoUpdater] Check failed:', err.message);
      return null;
    }
  });

  ipcMain.handle(IPC_CHANNELS.APP_INSTALL_UPDATE, async () => {
    autoUpdater.quitAndInstall(false, true);
  });

  // Check for updates on startup (after a short delay)
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch(() => {
      // Silently fail — no internet or no releases
    });
  }, 10_000);
}

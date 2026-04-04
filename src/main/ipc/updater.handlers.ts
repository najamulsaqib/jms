// src/main/ipc/updater.handlers.ts
import { ipcMain, app } from 'electron';
import type { AppUpdater } from '../updater';

export function registerUpdaterHandlers(updater: AppUpdater) {
  // Get current update channel
  ipcMain.handle('updater:getChannel', async () => {
    return updater.getCurrentChannel();
  });

  // Set update channel
  ipcMain.handle('updater:setChannel', async (_event, channel: 'latest' | 'beta') => {
    await updater.switchChannel(channel);
    return channel;
  });

  // Check for updates manually
  ipcMain.handle('updater:checkForUpdates', async () => {
    await updater.checkForUpdates();
  });

  // Get current app version
  ipcMain.handle('updater:getVersion', () => {
    return app.getVersion();
  });
}

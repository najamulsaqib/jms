// src/main/updater.ts
import { app, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';

type UpdateStore = {
  get<T>(key: string, defaultValue: T): T;
  set(key: string, value: string): void;
};

export class AppUpdater {
  private storePromise: Promise<UpdateStore> | null = null;

  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;

    // Configure auto-updater
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;

    // Set channel based on user preference
    void this.setUpdateChannel();

    // Check for updates on startup (only in production)
    if (app.isPackaged) {
      void this.checkForUpdates();
    }

    this.setupListeners();
  }

  private async getStore(): Promise<UpdateStore> {
    if (!this.storePromise) {
      this.storePromise = import('electron-store').then(
        ({ default: Store }) => {
          return new Store() as UpdateStore;
        },
      );
    }

    return this.storePromise;
  }

  async setUpdateChannel() {
    const store = await this.getStore();

    // Get channel preference (default: 'latest')
    const channel = store.get<'latest' | 'beta'>('updateChannel', 'latest');

    // Set the allowPrerelease flag
    autoUpdater.allowPrerelease = channel === 'beta';

    log.info(`Update channel set to: ${channel}`);
  }

  setupListeners() {
    // When update is available
    autoUpdater.on('update-available', async (info) => {
      const store = await this.getStore();
      const channel = store.get<'latest' | 'beta'>('updateChannel', 'latest');
      const channelLabel = channel === 'beta' ? ' (Beta)' : '';

      log.info('Update available:', info);
      dialog
        .showMessageBox({
          type: 'info',
          title: 'Update Available',
          message: `A new version ${info.version}${channelLabel} is available!`,
          detail: `Current version: ${app.getVersion()}\nNew version: ${info.version}\n\nWould you like to download it now?`,
          buttons: ['Download', 'Later'],
          defaultId: 0,
          cancelId: 1,
        })
        .then((result) => {
          if (result.response === 0) {
            autoUpdater.downloadUpdate();
            dialog.showMessageBox({
              type: 'info',
              title: 'Downloading Update',
              message: 'Downloading update in the background...',
              detail: 'You will be notified when the download is complete.',
              buttons: ['OK'],
            });
          }
          return result;
        })
        .catch((err) => {
          log.error('Error showing update dialog:', err);
        });
    });

    // When update is not available
    autoUpdater.on('update-not-available', (info) => {
      log.info('Update not available:', info);
    });

    // When update is downloaded
    autoUpdater.on('update-downloaded', (info) => {
      log.info('Update downloaded:', info);
      dialog
        .showMessageBox({
          type: 'info',
          title: 'Update Ready',
          message: 'Update downloaded successfully!',
          detail: `Version ${info.version} has been downloaded and is ready to install.\n\nThe application will restart to apply the update.`,
          buttons: ['Restart Now', 'Later'],
          defaultId: 0,
          cancelId: 1,
        })
        .then((result) => {
          if (result.response === 0) {
            autoUpdater.quitAndInstall();
          }
          return result;
        })
        .catch((err) => {
          log.error('Error showing restart dialog:', err);
        });
    });

    // Error handling
    autoUpdater.on('error', (err) => {
      log.error('Update error:', err);
      dialog.showMessageBox({
        type: 'error',
        title: 'Update Error',
        message: 'An error occurred while checking for updates.',
        detail: err.toString(),
        buttons: ['OK'],
      });
    });
  }

  async checkForUpdates() {
    if (app.isPackaged) {
      await this.setUpdateChannel(); // Refresh channel before checking
      autoUpdater.checkForUpdates();
    } else {
      log.info('Skipping update check in development');
    }
  }

  async switchChannel(channel: 'latest' | 'beta') {
    const store = await this.getStore();

    store.set('updateChannel', channel);
    await this.setUpdateChannel();
    log.info(`Switched to ${channel} channel`);

    // Check for updates on the new channel
    void this.checkForUpdates();
  }

  async getCurrentChannel(): Promise<'latest' | 'beta'> {
    const store = await this.getStore();

    return store.get<'latest' | 'beta'>('updateChannel', 'latest');
  }
}

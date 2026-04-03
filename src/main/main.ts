/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { initDatabase } from './db/client';
import { TaxRecordRepository } from './db/taxRecord.repository';
import { registerTaxRecordIpcHandlers } from './ipc/taxRecord.handlers';
import { resolveHtmlPath } from './util';

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;

    // Configure auto-updater
    autoUpdater.autoDownload = false; // Don't auto-download, ask user first
    autoUpdater.autoInstallOnAppQuit = true;

    // Check for updates on startup (only in production)
    if (app.isPackaged) {
      autoUpdater.checkForUpdates();
    }

    // When update is available
    autoUpdater.on('update-available', (info) => {
      log.info('Update available:', info);
      dialog
        .showMessageBox({
          type: 'info',
          title: 'Update Available',
          message: `A new version ${info.version} is available!`,
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
            autoUpdater.quitAndInstall(false, true);
          }
          return result;
        })
        .catch((err) => {
          log.error('Error showing update ready dialog:', err);
        });
    });

    // Handle errors
    autoUpdater.on('error', (error) => {
      log.error('Update error:', error);
      dialog.showMessageBox({
        type: 'error',
        title: 'Update Error',
        message: 'Failed to check for updates',
        detail: error.message,
        buttons: ['OK'],
      });
    });

    // Download progress
    autoUpdater.on('download-progress', (progressObj) => {
      const message = `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}%`;
      log.info(message);
    });
  }

  // Manual check for updates
  checkForUpdates() {
    if (app.isPackaged) {
      autoUpdater.checkForUpdates();
    } else {
      dialog.showMessageBox({
        type: 'info',
        title: 'Development Mode',
        message: 'Auto-update is only available in production builds.',
        buttons: ['OK'],
      });
    }
  }
}

let mainWindow: BrowserWindow | null = null;
let appUpdater: AppUpdater | null = null;

// Export function to check for updates
export function checkForUpdates() {
  if (appUpdater) {
    appUpdater.checkForUpdates();
  }
}

// IPC handler for manual update check
ipcMain.on('check-for-updates', () => {
  checkForUpdates();
});

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug').default();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    title: 'JMS Tax',
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  appUpdater = new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    const db = initDatabase();
    const taxRecordRepository = new TaxRecordRepository(db);
    registerTaxRecordIpcHandlers(taxRecordRepository);

    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);

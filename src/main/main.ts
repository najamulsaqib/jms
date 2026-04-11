/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import { app, BrowserWindow, shell, ipcMain, net } from 'electron';
import log from 'electron-log';
import path from 'path';
import { registerUpdaterHandlers } from './ipc/updater.handlers';
import MenuBuilder from './menu';
import { enablePortalAdBlocking } from './portalAdblocker';
import { AppUpdater } from './updater';
import { resolveHtmlPath } from './util';

let mainWindow: BrowserWindow | null = null;
let appUpdater: AppUpdater | null = null;

log.transports.file.level = 'info';

const getErrorDetails = (error: unknown) => {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}\n${error.stack ?? ''}`;
  }

  return String(error);
};

process.on('uncaughtException', (error) => {
  log.error('Main process uncaughtException', getErrorDetails(error));
});

process.on('unhandledRejection', (reason) => {
  log.error('Main process unhandledRejection', getErrorDetails(reason));
});

// Export function to check for updates
export function checkForUpdates() {
  if (appUpdater) {
    appUpdater.checkForUpdates();
  }
}

// IPC handler for network status (more reliable than navigator.onLine on Windows)
ipcMain.handle('net:isOnline', () => net.isOnline());

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

  await enablePortalAdBlocking();

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
    // Matches the app's bg-slate-50 background — prevents white flash while
    // React is initializing, especially on first Windows launch (no V8 cache yet)
    backgroundColor: '#f8fafc',
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
      sandbox: false,
      webviewTag: true,
    },
  });

  log.info('Main window created');

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    log.error('Renderer process gone', JSON.stringify(details));
  });

  mainWindow.webContents.on('unresponsive', () => {
    log.error('Renderer became unresponsive');
  });

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
      return;
    }
    // On Windows, ready-to-show can fire before React finishes its first paint
    // (no V8 JIT cache on first install). A short delay ensures the UI is visible.
    if (process.platform === 'win32') {
      setTimeout(() => mainWindow?.show(), 200);
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

// INFO: Intercept new windows opened from webview tags (target="_blank", window.open, etc.)
// and load them inside the same webview instead of opening a new OS window.
app.on('web-contents-created', (_event, contents) => {
  contents.on('render-process-gone', (_goneEvent, details) => {
    log.error(
      'WebContents render-process-gone',
      JSON.stringify({
        type: contents.getType(),
        url: contents.getURL(),
        reason: details.reason,
        exitCode: details.exitCode,
      }),
    );
  });

  contents.on('unresponsive', () => {
    log.error(
      'WebContents became unresponsive',
      JSON.stringify({
        type: contents.getType(),
        url: contents.getURL(),
      }),
    );
  });

  if (contents.getType() === 'webview') {
    // Can't call contents.loadURL() from inside this handler (DataClone error).
    // Instead, send an IPC message to the renderer and let it call loadURL on
    // the webview DOM element, which works fine from the renderer process.
    contents.setWindowOpenHandler(({ url }) => {
      mainWindow?.webContents.send('webview-navigate', url);
      return { action: 'deny' };
    });
  }
});

app
  .whenReady()
  .then(async () => {
    await createWindow();

    // Initialize updater and register IPC handlers
    appUpdater = new AppUpdater();
    registerUpdaterHandlers(appUpdater);

    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) {
        createWindow().catch((error) => {
          log.error(
            'Failed to re-create main window on activate:',
            getErrorDetails(error),
          );
        });
      }
    });
  })
  .catch((error) => {
    log.error('Failed to initialize app:', getErrorDetails(error));
  });

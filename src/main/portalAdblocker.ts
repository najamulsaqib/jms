import { app, session } from 'electron';
import { promises as fs } from 'fs';
import path from 'path';
import { ElectronBlocker } from '@ghostery/adblocker-electron';
import { PORTAL_WEBVIEW_PARTITION } from '@shared/portalSession';

let adblockInitPromise: Promise<void> | null = null;

function isKnownIncompatibleRuntime() {
  const major = Number.parseInt(process.versions.electron.split('.')[0], 10);
  return process.platform === 'win32' && Number.isFinite(major) && major >= 35;
}

export async function enablePortalAdBlocking() {
  console.warn('Portal ad blocker is temporarily disabled.');
  return;

  if (adblockInitPromise) {
    return adblockInitPromise;
  }

  adblockInitPromise = (async () => {
    if (isKnownIncompatibleRuntime()) {
      console.warn(
        'Portal ad blocker disabled due to known Windows/Electron compatibility issue.',
      );
      return;
    }

    const fetchImpl = globalThis.fetch;

    if (typeof fetchImpl !== 'function') {
      console.warn(
        'Portal ad blocker disabled because fetch API is not available in the main process.',
      );
      return;
    }

    try {
      const blocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(
        fetchImpl,
        {
          path: path.join(app.getPath('userData'), 'engine.bin'),
          read: fs.readFile,
          write: fs.writeFile,
        },
      );

      const portalSession = session.fromPartition(PORTAL_WEBVIEW_PARTITION);
      blocker.enableBlockingInSession(portalSession);
    } catch (error) {
      adblockInitPromise = null;
      console.warn('Failed to initialize portal ad blocker:', error);
    }
  })();

  return adblockInitPromise;
}

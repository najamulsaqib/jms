import { app, session } from 'electron';
import { ElectronBlocker } from '@ghostery/adblocker-electron';
import { PORTAL_WEBVIEW_PARTITION } from '@shared/portalSession';

export async function enablePortalAdBlocking() {
  const fetchImpl = globalThis.fetch;

  if (typeof fetchImpl !== 'function') {
    console.warn('Portal ad blocker is unavailable because fetch is missing.');
    return;
  }

  try {
    const blocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetchImpl);

    blocker.enableBlockingInSession(
      session.fromPartition(PORTAL_WEBVIEW_PARTITION),
    );
  } catch (error) {
    console.warn('Failed to initialize portal ad blocker:', error);
  }
}

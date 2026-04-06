import { useEffect, useRef, useState } from 'react';
import AppLayout from '@components/layout/AppLayout';
import LoadingSpinner from '@components/common/LoadingSpinner';

const FBR_WEBSITE_URL = 'https://iris.fbr.gov.pk/';

// Webview is an Electron-specific element; use a loose type
type WebviewElement = HTMLElement & {
  src: string;
  goBack: () => void;
  goForward: () => void;
  reload: () => void;
  canGoBack: () => boolean;
  canGoForward: () => boolean;
  getURL: () => string;
  loadURL: (url: string) => Promise<void>;
  executeJavaScript: (code: string) => Promise<unknown>;
};

export default function FBRPage() {
  const webviewRef = useRef<WebviewElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentURL, setCurrentURL] = useState(FBR_WEBSITE_URL);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);

  const updateNavState = () => {
    const wv = webviewRef.current;
    if (!wv) return;
    setCanGoBack(wv.canGoBack());
    setCanGoForward(wv.canGoForward());
    setCurrentURL(wv.getURL());
  };

  useEffect(() => {
    const wv = webviewRef.current;
    if (!wv) return;

    const onStartLoading = () => setIsLoading(true);
    const onStopLoading = () => {
      setIsLoading(false);
      setHasError(false);
      updateNavState();
    };
    const onFailLoad = (e: any) => {
      // Error code -3 is an aborted load (e.g. redirect), not a real failure
      if (e.errorCode !== -3) {
        setIsLoading(false);
        setHasError(true);
      }
    };
    const onNavigate = () => updateNavState();

    // INFO: Intercept window.open and <a target="_blank"> to route all navigation
    // through IPC and load URLs in the same webview (avoids Electron limitations
    // like incomplete setWindowOpenHandler support and DataClone errors).
    const injectLinkInterceptor = () => {
      (wv as any)
        .executeJavaScript(
          `
        window.open = function(url) {
          if (url) window.location.href = url;
          return null;
        };
        if (!window.__jmsLinkInterceptorAdded) {
          window.__jmsLinkInterceptorAdded = true;
          document.addEventListener('click', function(e) {
            var el = e.target;
            while (el) {
              if (el.tagName === 'A') {
                var t = el.getAttribute('target');
                if (t && !['_self', '_parent', '_top', ''].includes(t) && el.href) {
                  e.preventDefault();
                  e.stopPropagation();
                  window.location.href = el.href;
                  return;
                }
              }
              el = el.parentElement;
            }
          }, true);
        }
      `,
        )
        .catch(() => {});
    };

    // IPC fallback: main process sends this when setWindowOpenHandler fires
    // (e.g. middle-click or any popup the JS interceptor didn't catch).
    // Preload strips the IPC event — handler receives (url) not (event, url)
    const onWebviewNavigate = (url: unknown) => {
      if (typeof url === 'string') wv.loadURL(url).catch(() => {});
    };
    (window as any).electron?.ipcRenderer.on(
      'webview-navigate',
      onWebviewNavigate,
    );

    wv.addEventListener('did-start-loading', onStartLoading);
    wv.addEventListener('did-stop-loading', onStopLoading);
    wv.addEventListener('did-fail-load', onFailLoad);
    wv.addEventListener('did-navigate', onNavigate);
    wv.addEventListener('did-navigate-in-page', onNavigate);
    wv.addEventListener('dom-ready', injectLinkInterceptor);

    // eslint-disable-next-line consistent-return
    return () => {
      wv.removeEventListener('did-start-loading', onStartLoading);
      wv.removeEventListener('did-stop-loading', onStopLoading);
      wv.removeEventListener('did-fail-load', onFailLoad);
      wv.removeEventListener('did-navigate', onNavigate);
      wv.removeEventListener('did-navigate-in-page', onNavigate);
      wv.removeEventListener('dom-ready', injectLinkInterceptor);
      (window as any).electron?.ipcRenderer.removeListener?.(
        'webview-navigate',
        onWebviewNavigate,
      );
    };
  }, []);

  const handleReload = () => {
    setHasError(false);
    setIsLoading(true);
    webviewRef.current?.reload();
  };

  const handleHome = () => {
    webviewRef.current?.loadURL(FBR_WEBSITE_URL).catch(() => {});
  };

  return (
    <AppLayout breadcrumbs={[{ label: 'FBR Portal' }]} fullscreen>
      <div className="relative w-full h-full flex flex-col">
        {/* Browser toolbar */}
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 border-b border-slate-200 shrink-0">
          <button
            onClick={() => webviewRef.current?.goBack()}
            disabled={!canGoBack}
            title="Back"
            className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <svg
              className="w-4 h-4 text-slate-700"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <button
            onClick={() => webviewRef.current?.goForward()}
            disabled={!canGoForward}
            title="Forward"
            className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <svg
              className="w-4 h-4 text-slate-700"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          <button
            onClick={handleReload}
            title="Reload"
            className="p-1.5 rounded hover:bg-slate-200 transition-colors"
          >
            {isLoading ? (
              <svg
                className="w-4 h-4 text-slate-700 animate-spin"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            ) : (
              <svg
                className="w-4 h-4 text-slate-700"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            )}
          </button>

          <button
            onClick={handleHome}
            title="FBR Home"
            className="p-1.5 rounded hover:bg-slate-200 transition-colors"
          >
            <svg
              className="w-4 h-4 text-slate-700"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
          </button>

          <div className="flex-1 bg-white border border-slate-300 rounded-md px-3 py-1 text-sm text-slate-500 truncate select-text">
            {currentURL}
          </div>
        </div>

        {/* Loading overlay */}
        {isLoading && !hasError && (
          <div className="absolute inset-0 top-12 flex items-center justify-center bg-white z-10">
            <div className="flex flex-col items-center gap-4">
              <LoadingSpinner size="lg" />
              <p className="text-slate-600">Loading...</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {hasError && (
          <div className="flex items-center justify-center flex-1">
            <div className="text-center p-8">
              <p className="text-lg font-semibold text-red-600 mb-2">
                Unable to Load Page
              </p>
              <p className="text-slate-600 mb-4">
                Please check your internet connection and try again.
              </p>
              <button
                onClick={handleReload}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Webview — full Chromium engine, same as Chrome */}
        {/* eslint-disable react/no-unknown-property */}
        <webview
          ref={webviewRef as any}
          src={FBR_WEBSITE_URL}
          style={{
            flex: 1,
            width: '100%',
            display: hasError ? 'none' : 'flex',
          }}
          allowpopups
          useragent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        />
        {/* eslint-enable react/no-unknown-property */}
      </div>
    </AppLayout>
  );
}

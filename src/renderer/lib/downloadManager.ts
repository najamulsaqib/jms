/**
 * Download Manager for FBR Portal
 * Handles file downloads with proper error handling and progress tracking
 */

export interface DownloadItem {
  filename: string;
  url: string;
  size?: number;
  state?: 'progressing' | 'completed' | 'cancelled' | 'interrupted';
}

/**
 * Setup download handling for iframe
 * This function can be used to intercept and manage downloads
 */
export const setupDownloadHandler = (
  iframeRef: React.RefObject<HTMLIFrameElement>,
) => {
  if (!iframeRef.current) return;

  try {
    const iframeDoc = iframeRef.current.contentDocument;
    if (!iframeDoc) return;

    // Listen for download attempts within iframe
    iframeDoc.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;

      // Check if it's a download link
      if (target.tagName === 'A') {
        const href = (target as HTMLAnchorElement).href;
        const download = (target as HTMLAnchorElement).download;

        if (download || href.includes('download')) {
          console.log('Download detected:', href);
          // Browser native download will handle it automatically
        }
      }
    });
  } catch (error) {
    // CORS restrictions prevent direct access to iframe content in most cases
    console.log('Iframe content access restricted (expected for cross-origin)');
  }
};

/**
 * Helper to trigger a file download
 */
export const triggerDownload = (
  filename: string,
  content: string | Blob,
  mimeType: string = 'application/octet-stream',
) => {
  const blob =
    content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

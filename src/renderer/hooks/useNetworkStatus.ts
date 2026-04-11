import { INTERVALS } from '@lib/enums';
import { useCallback, useEffect, useRef, useState } from 'react';

// INFO: We originally used electron's `net.isOnline()` via IPC, but it was unreliable
// on Windows 11 — it would incorrectly report online/offline status. We also tried
// `navigator.onLine`, but that only checks if a network interface exists, not actual
// internet connectivity, which made it equally unreliable on Windows 11.
//
// The current solution actively pings a lightweight endpoint every 15 seconds to
// verify real internet connectivity, which works consistently across all platforms.
const PING_URL = 'https://www.google.com/generate_204'; // 204 No Content — lightweight, no response body

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const checkConnection = useCallback(async () => {
    try {
      // Abort the request if it takes longer than 5 seconds to avoid hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      await fetch(PING_URL, {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      setIsOnline(true);
    } catch {
      setIsOnline(false);
    }
  }, []);

  useEffect(() => {
    // Check immediately on mount
    checkConnection();
    // Then keep polling on the interval
    intervalRef.current = setInterval(checkConnection, INTERVALS.FIVE_SECONDS);

    // Also re-check whenever the browser fires online/offline events
    // so status updates quickly when the network changes rather than
    // waiting for the next poll cycle
    const handleChange = () => checkConnection();
    window.addEventListener('online', handleChange);
    window.addEventListener('offline', handleChange);

    return () => {
      clearInterval(intervalRef.current);
      window.removeEventListener('online', handleChange);
      window.removeEventListener('offline', handleChange);
    };
  }, [checkConnection]);

  return isOnline;
}

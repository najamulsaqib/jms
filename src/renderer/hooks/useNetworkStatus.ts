import { useEffect, useState } from 'react';

async function getOnlineStatus(): Promise<boolean> {
  try {
    const online = await (window as any).electron?.net?.isOnline();
    return typeof online === 'boolean' ? online : navigator.onLine;
  } catch {
    return navigator.onLine;
  }
}

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    getOnlineStatus().then(setIsOnline);

    const handleChange = () => getOnlineStatus().then(setIsOnline);

    window.addEventListener('online', handleChange);
    window.addEventListener('offline', handleChange);

    return () => {
      window.removeEventListener('online', handleChange);
      window.removeEventListener('offline', handleChange);
    };
  }, []);

  return isOnline;
}

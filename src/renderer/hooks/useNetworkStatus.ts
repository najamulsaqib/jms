import { useEffect, useState } from 'react';

const { net } = (window as any).electron;

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    net.isOnline().then(setIsOnline);

    const handleOnline = () => net.isOnline().then(setIsOnline);
    const handleOffline = () => net.isOnline().then(setIsOnline);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

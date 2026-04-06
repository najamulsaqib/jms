import { useTab } from '@contexts/TabContext';
import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';

/**
 * Hook to navigate to a page in a new tab
 * Usage: const tabNavigate = useTabNavigate();
 * tabNavigate('/tax-records', 'Tax Records', '📋');
 */
export function useTabNavigate() {
  const { openTab } = useTab();
  const navigate = useNavigate();

  return useCallback(
    (path: string, title: string, icon?: React.ReactNode) => {
      openTab(path, title, icon);
      navigate(path);
    },
    [openTab, navigate],
  );
}

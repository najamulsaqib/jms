import { HomeIcon } from '@heroicons/react/24/outline';
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';

export interface Tab {
  id: string;
  title: string;
  path: string;        // Root path — used for deduplication when opening tabs
  currentPath: string; // Current navigation position within the tab
  icon?: React.ReactNode;
}

interface TabContextType {
  tabs: Tab[];
  activeTabId: string;
  openTab: (path: string, title: string, icon?: React.ReactNode) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  closeAllTabs: () => void;
  updateTabCurrentPath: (tabId: string, currentPath: string, title?: string) => void;
  reorderTabs: (fromId: string, toId: string) => void;
}

const TabContext = createContext<TabContextType | undefined>(undefined);

// Initialize with Dashboard tab as default
const defaultTab: Tab = {
  id: 'dashboard-default',
  title: 'Dashboard',
  path: '/',
  currentPath: '/',
  icon: <HomeIcon className="h-5 w-5" />,
};

export function TabProvider({ children }: { children: ReactNode }) {
  const [tabs, setTabs] = useState<Tab[]>([defaultTab]);
  const [activeTabId, setActiveTabId] = useState<string>('dashboard-default');

  const openTab = useCallback(
    (path: string, title: string, icon?: React.ReactNode) => {
      setTabs((prevTabs) => {
        // Check if tab already exists
        const existingTab = prevTabs.find((tab) => tab.path === path);
        if (existingTab) {
          setActiveTabId(existingTab.id);
          return prevTabs;
        }

        // Create new tab
        const newTab: Tab = {
          id: `tab-${Date.now()}-${Math.random()}`,
          title,
          path,
          currentPath: path,
          icon,
        };

        setActiveTabId(newTab.id);
        return [...prevTabs, newTab];
      });
    },
    [],
  );

  const closeTab = useCallback(
    (tabId: string) => {
      // Prevent closing the default dashboard tab
      if (tabId === 'dashboard-default') {
        return;
      }

      setTabs((prevTabs) => {
        const newTabs = prevTabs.filter((tab) => tab.id !== tabId);

        // If closing the active tab, switch to another
        if (activeTabId === tabId) {
          setActiveTabId(
            newTabs.length > 0
              ? newTabs[newTabs.length - 1].id
              : 'dashboard-default',
          );
        }

        return newTabs;
      });
    },
    [activeTabId],
  );

  const setActiveTab = useCallback((tabId: string) => {
    setActiveTabId(tabId);
  }, []);

  const closeAllTabs = useCallback(() => {
    setTabs([defaultTab]);
    setActiveTabId('dashboard-default');
  }, []);

  const updateTabCurrentPath = useCallback((tabId: string, currentPath: string, title?: string) => {
    setTabs((prevTabs) =>
      prevTabs.map((tab) =>
        tab.id === tabId ? { ...tab, currentPath, ...(title ? { title } : {}) } : tab,
      ),
    );
  }, []);

  const reorderTabs = useCallback((fromId: string, toId: string) => {
    if (fromId === toId) return;
    setTabs((prevTabs) => {
      const fromIndex = prevTabs.findIndex((t) => t.id === fromId);
      const toIndex = prevTabs.findIndex((t) => t.id === toId);
      if (fromIndex === -1 || toIndex === -1) return prevTabs;
      const next = [...prevTabs];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      tabs,
      activeTabId,
      openTab,
      closeTab,
      setActiveTab,
      closeAllTabs,
      updateTabCurrentPath,
      reorderTabs,
    }),
    [tabs, activeTabId, openTab, closeTab, setActiveTab, closeAllTabs, updateTabCurrentPath, reorderTabs],
  );

  return <TabContext.Provider value={value}>{children}</TabContext.Provider>;
}

export function useTab() {
  const context = useContext(TabContext);
  if (context === undefined) {
    throw new Error('useTab must be used within a TabProvider');
  }
  return context;
}

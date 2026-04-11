import { HomeIcon } from '@heroicons/react/24/outline';
import React, {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useReducer,
  ReactNode,
} from 'react';

export interface Tab {
  id: string;
  title: string;
  path: string; // Root path — used for deduplication when opening tabs
  currentPath: string; // Current navigation position within the tab
  icon?: React.ReactNode;
}

interface TabContextType {
  tabs: Tab[];
  activeTabId: string;
  activeTab: Tab | null;
  tabsByPath: Record<string, Tab>;
  portalTabs: Tab[];
  openPortalTabIds: Set<string>;
  openTab: (path: string, title: string, icon?: React.ReactNode) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  closeAllTabs: () => void;
  updateTabCurrentPath: (
    tabId: string,
    currentPath: string,
    title?: string,
  ) => void;
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

type TabState = {
  tabs: Tab[];
  activeTabId: string;
};

type TabAction =
  | {
      type: 'OPEN_TAB';
      path: string;
      title: string;
      icon?: React.ReactNode;
    }
  | { type: 'CLOSE_TAB'; tabId: string }
  | { type: 'SET_ACTIVE_TAB'; tabId: string }
  | {
      type: 'UPDATE_TAB_CURRENT_PATH';
      tabId: string;
      currentPath: string;
      title?: string;
    }
  | { type: 'CLOSE_ALL_TABS' }
  | { type: 'REORDER_TABS'; fromId: string; toId: string };

function createTabId() {
  return `tab-${Date.now()}-${Math.random()}`;
}

function tabReducer(state: TabState, action: TabAction): TabState {
  switch (action.type) {
    case 'OPEN_TAB': {
      const existing = state.tabs.find((tab) => tab.path === action.path);
      if (existing) {
        return { ...state, activeTabId: existing.id };
      }

      const newTab: Tab = {
        id: createTabId(),
        title: action.title,
        path: action.path,
        currentPath: action.path,
        icon: action.icon,
      };

      return {
        tabs: [...state.tabs, newTab],
        activeTabId: newTab.id,
      };
    }

    case 'CLOSE_TAB': {
      if (action.tabId === 'dashboard-default') return state;

      const closeIndex = state.tabs.findIndex((tab) => tab.id === action.tabId);
      if (closeIndex === -1) return state;

      const nextTabs = state.tabs.filter((tab) => tab.id !== action.tabId);
      if (state.activeTabId !== action.tabId) {
        return { ...state, tabs: nextTabs };
      }

      const fallbackIndex = Math.max(0, closeIndex - 1);
      const nextActive = nextTabs[fallbackIndex] ?? defaultTab;
      return {
        tabs: nextTabs.length > 0 ? nextTabs : [defaultTab],
        activeTabId: nextActive.id,
      };
    }

    case 'SET_ACTIVE_TAB': {
      if (!state.tabs.some((tab) => tab.id === action.tabId)) return state;
      return { ...state, activeTabId: action.tabId };
    }

    case 'UPDATE_TAB_CURRENT_PATH': {
      return {
        ...state,
        tabs: state.tabs.map((tab) =>
          tab.id === action.tabId
            ? {
                ...tab,
                currentPath: action.currentPath,
                ...(action.title ? { title: action.title } : {}),
              }
            : tab,
        ),
      };
    }

    case 'CLOSE_ALL_TABS': {
      return {
        tabs: [defaultTab],
        activeTabId: defaultTab.id,
      };
    }

    case 'REORDER_TABS': {
      if (action.fromId === action.toId) return state;

      const fromIndex = state.tabs.findIndex((tab) => tab.id === action.fromId);
      const toIndex = state.tabs.findIndex((tab) => tab.id === action.toId);
      if (fromIndex === -1 || toIndex === -1) return state;

      const nextTabs = [...state.tabs];
      const [moved] = nextTabs.splice(fromIndex, 1);
      nextTabs.splice(toIndex, 0, moved);

      return {
        ...state,
        tabs: nextTabs,
      };
    }

    default:
      return state;
  }
}

export function TabProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(tabReducer, {
    tabs: [defaultTab],
    activeTabId: defaultTab.id,
  });

  const { tabs, activeTabId } = state;

  const openTab = useCallback(
    (path: string, title: string, icon?: React.ReactNode) => {
      dispatch({ type: 'OPEN_TAB', path, title, icon });
    },
    [],
  );

  const closeTab = useCallback((tabId: string) => {
    dispatch({ type: 'CLOSE_TAB', tabId });
  }, []);

  const setActiveTab = useCallback((tabId: string) => {
    dispatch({ type: 'SET_ACTIVE_TAB', tabId });
  }, []);

  const closeAllTabs = useCallback(() => {
    dispatch({ type: 'CLOSE_ALL_TABS' });
  }, []);

  const updateTabCurrentPath = useCallback(
    (tabId: string, currentPath: string, title?: string) => {
      dispatch({ type: 'UPDATE_TAB_CURRENT_PATH', tabId, currentPath, title });
    },
    [],
  );

  const reorderTabs = useCallback((fromId: string, toId: string) => {
    dispatch({ type: 'REORDER_TABS', fromId, toId });
  }, []);

  const activeTab = useMemo(
    () => tabs.find((tab) => tab.id === activeTabId) ?? null,
    [tabs, activeTabId],
  );

  const tabsByPath = useMemo(() => {
    return tabs.reduce<Record<string, Tab>>((acc, tab) => {
      acc[tab.path] = tab;
      return acc;
    }, {});
  }, [tabs]);

  const portalTabs = useMemo(
    () => tabs.filter((tab) => tab.path.startsWith('/portal/')),
    [tabs],
  );

  const openPortalTabIds = useMemo(
    () => new Set(portalTabs.map((tab) => tab.path.replace('/portal/', ''))),
    [portalTabs],
  );

  const value = useMemo(
    () => ({
      tabs,
      activeTabId,
      activeTab,
      tabsByPath,
      portalTabs,
      openPortalTabIds,
      openTab,
      closeTab,
      setActiveTab,
      closeAllTabs,
      updateTabCurrentPath,
      reorderTabs,
    }),
    [
      tabs,
      activeTabId,
      activeTab,
      tabsByPath,
      portalTabs,
      openPortalTabIds,
      openTab,
      closeTab,
      setActiveTab,
      closeAllTabs,
      updateTabCurrentPath,
      reorderTabs,
    ],
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

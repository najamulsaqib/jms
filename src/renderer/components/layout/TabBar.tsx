import { useTab } from '@contexts/TabContext';
import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';

function getTitleFromPath(pathname: string): string {
  if (pathname === '/') return 'Dashboard';
  if (pathname === '/tax-records') return 'Tax Records';
  if (pathname === '/tax-records/new') return 'New Tax Record';
  if (pathname === '/sales-tax') return 'Sales Tax';
  if (pathname === '/fbr-portal') return 'FBR Portal';
  if (pathname === '/settings') return 'Settings';
  if (/^\/tax-records\/[^/]+\/edit$/.test(pathname)) return 'Edit Tax Record';
  if (/^\/tax-records\/[^/]+$/.test(pathname)) return 'Tax Record';
  return 'Page';
}

export default function TabBar() {
  const { tabs, activeTabId, closeTab, setActiveTab, updateTabCurrentPath } =
    useTab();
  const navigate = useNavigate();
  const location = useLocation();

  const activeTab = tabs.find((tab) => tab.id === activeTabId);
  const prevActiveTabIdRef = useRef(activeTabId);

  // When the active tab changes (user clicked a tab), navigate to where that tab last was
  useEffect(() => {
    if (prevActiveTabIdRef.current === activeTabId) return;
    prevActiveTabIdRef.current = activeTabId;
    if (activeTab && activeTab.currentPath !== location.pathname) {
      navigate(activeTab.currentPath);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTabId]);

  // When the URL changes due to in-tab navigation, save the new position and update the title
  useEffect(() => {
    if (activeTab && activeTab.currentPath !== location.pathname) {
      updateTabCurrentPath(
        activeTabId,
        location.pathname,
        getTitleFromPath(location.pathname),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <div className="bg-white border-b border-slate-300 px-4 h-8">
      <div className="flex items-center gap-1 overflow-x-auto cursor-pointer">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`flex items-center gap-2 px-3 py-2 mt-0.5 border cursor-pointer transition-colors rounded-t-lg ${
              activeTabId === tab.id
                ? 'border-slate-300 text-slate-900 border-b-0 bg-white'
                : 'border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon && <span className="text-sm">{tab.icon}</span>}
            <span className="text-sm font-medium whitespace-nowrap max-w-48 overflow-hidden text-ellipsis">
              {tab.title}
            </span>
            {tab.id !== 'dashboard-default' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
                className="p-0.5 rounded transition-colors ml-1"
                title="Close tab"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

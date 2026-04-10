import { useEffect } from 'react';
import LoadingSpinner from '@components/common/LoadingSpinner';
import Dashboard from '@pages/dashboard/Dashboard';
import WebPortal from '@pages/web-portals/Portal';
import SalesTax from '@pages/sales-tax/SalesTax';
import Settings from '@pages/settings';
import TaxRecordDetailPage from '@pages/tax-records/TaxRecordDetail';
import TaxRecordFormPage from '@pages/tax-records/TaxRecordForm';
import TaxRecordsPage from '@pages/tax-records/TaxRecords';
import { QueryClientProvider } from '@tanstack/react-query';
import {
  Route,
  HashRouter as Router,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TabProvider, useTab } from './contexts/TabContext';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { usePortalPages } from './hooks/usePortalPages';
import { queryClient } from './lib/queryClient';
import LoginPage from './pages/auth/Login';
import NoInternetPage from './pages/NoInternet';

import './styles.css';

// INFO: All portal webviews are always mounted so they are never destroyed when
// switching tabs or navigating away. CSS display:none hides inactive ones.
function PersistentPortals() {
  const location = useLocation();
  const navigate = useNavigate();
  const { portalPages } = usePortalPages();
  const { tabs, closeTab } = useTab();
  const activePages = portalPages.filter((p) => p.isActive);

  // Remove tabs whose portal has been deleted from settings.
  useEffect(() => {
    const existingPortalIds = new Set(portalPages.map((p) => p.id));
    const orphanedPortalTabs = tabs.filter((tab) => {
      if (!tab.path.startsWith('/portal/')) return false;
      const portalId = tab.path.replace('/portal/', '');
      return !existingPortalIds.has(portalId);
    });

    orphanedPortalTabs.forEach((tab) => closeTab(tab.id));
  }, [portalPages, tabs, closeTab]);

  // If the current route is a portal that no longer exists (deleted while tab was open),
  // close its tab and navigate away to prevent a crash on a blank route.
  useEffect(() => {
    const match = location.pathname.match(/^\/portal\/(.+)$/);
    if (!match) return;
    const portalId = match[1];
    const stillExists = activePages.some((p) => p.id === portalId);
    if (!stillExists) {
      const tab = tabs.find((t) => t.path === `/portal/${portalId}`);
      if (tab) closeTab(tab.id);
      navigate('/');
    }
  }, [activePages, location.pathname, tabs, closeTab, navigate]);

  return (
    <>
      {activePages.map((page) => {
        const isActive = location.pathname === `/portal/${page.id}`;
        return (
          <div
            key={page.id}
            style={{ display: isActive ? 'contents' : 'none' }}
          >
            <WebPortal page={page} />
          </div>
        );
      })}
    </>
  );
}

function AppRoutes() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!session) {
    return <LoginPage />;
  }

  return (
    <Router>
      {/* Portal webviews live outside Routes so they are never unmounted */}
      <PersistentPortals />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/tax-records" element={<TaxRecordsPage />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/tax-records/new" element={<TaxRecordFormPage />} />
        <Route
          path="/tax-records/:taxRecordId"
          element={<TaxRecordDetailPage />}
        />
        <Route
          path="/tax-records/:taxRecordId/edit"
          element={<TaxRecordFormPage />}
        />
        <Route path="/sales-tax" element={<SalesTax />} />
        {/* Render nothing for portal routes — PersistentPortals above handles them */}
        <Route path="/portal/:portalId" element={null} />
      </Routes>
      <Toaster position="bottom-right" richColors />
    </Router>
  );
}

export default function App() {
  const isOnline = useNetworkStatus();

  if (!isOnline) {
    return <NoInternetPage />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TabProvider>
          <AppRoutes />
        </TabProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

import LoadingSpinner from '@components/common/LoadingSpinner';
import Dashboard from '@pages/dashboard/Dashboard';
import FBRPage from '@pages/fbr/FBRPortal';
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
} from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TabProvider } from './contexts/TabContext';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { queryClient } from './lib/queryClient';
import LoginPage from './pages/auth/Login';
import NoInternetPage from './pages/NoInternet';

import './styles.css';

// INFO: Always mounted so the webview is never destroyed when switching tabs.
// CSS display:none hides it without unmounting.
function PersistentFBRPage() {
  const location = useLocation();
  const isActive = location.pathname === '/fbr-portal';
  return (
    <div style={{ display: isActive ? 'contents' : 'none' }}>
      <FBRPage />
    </div>
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
      {/* FBRPage lives outside Routes so it is never unmounted when switching tabs */}
      <PersistentFBRPage />
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
        {/* Render nothing for /fbr-portal — PersistentFBRPage above handles it */}
        <Route path="/fbr-portal" element={null} />
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

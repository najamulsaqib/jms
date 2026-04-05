import LoadingSpinner from '@components/common/LoadingSpinner';
import Dashboard from '@pages/dashboard/Dashboard';
import Settings from '@pages/settings';
import TaxRecordDetailPage from '@pages/tax-records/TaxRecordDetail';
import TaxRecordFormPage from '@pages/tax-records/TaxRecordForm';
import TaxRecordsPage from '@pages/tax-records/TaxRecords';
import { QueryClientProvider } from '@tanstack/react-query';
import { Route, HashRouter as Router, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { queryClient } from './lib/queryClient';
import LoginPage from './pages/auth/Login';
import NoInternetPage from './pages/NoInternet';
import './styles.css';

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
        <AppRoutes />
      </AuthProvider>
    </QueryClientProvider>
  );
}

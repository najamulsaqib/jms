import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from '@pages/dashboard/Dashboard';
import TaxRecordsPage from '@pages/tax-records/TaxRecords';
import TaxRecordFormPage from '@pages/tax-records/TaxRecordForm';
import TaxRecordDetailPage from '@pages/tax-records/TaxRecordDetail';
import './styles.css';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/tax-records" element={<TaxRecordsPage />} />
        <Route path="/tax-records/new" element={<TaxRecordFormPage />} />
        <Route path="/tax-records/:taxRecordId" element={<TaxRecordDetailPage />} />
        <Route path="/tax-records/:taxRecordId/edit" element={<TaxRecordFormPage />} />
      </Routes>
    </Router>
  );
}

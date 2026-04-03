import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from '@pages/dashboard/Dashboard';
import TaxRecordsPage from '@pages/tax-records/TaxRecordsPage';
import TaxRecordFormPage from '@pages/tax-records/TaxRecordFormPage';
import './styles.css';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/tax-records" element={<TaxRecordsPage />} />
        <Route path="/tax-records/new" element={<TaxRecordFormPage />} />
        <Route path="/tax-records/:taxRecordId/edit" element={<TaxRecordFormPage />} />
      </Routes>
    </Router>
  );
}

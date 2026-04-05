import AppLayout from '@components/layout/AppLayout';
import Button from '@components/ui/Button';
import Card from '@components/ui/Card';
import { PlusIcon } from '@heroicons/react/20/solid';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

export default function SalesTaxPage() {
  const navigate = useNavigate();

  return (
    <AppLayout
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Sales Tax' }]}
    >
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Sales Tax</h1>
            <p className="mt-2 text-slate-600">
              Manage sales tax registrations, returns, and filings for your
              clients.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="md"
              disabled
              icon={PlusIcon}
              onClick={() => navigate('/sales-tax/new')}
            >
              Add New Registration
            </Button>
          </div>
        </div>

        {/* Empty State */}
        <Card>
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-2 text-sm font-semibold text-slate-900">
              No sales tax records yet
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Get started by creating your first sales tax registration
            </p>
            <div className="mt-6">
              <Button
                disabled
                onClick={() => navigate('/sales-tax/new')}
                icon={PlusIcon}
              >
                Add First Registration
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}

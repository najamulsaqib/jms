import { DocumentTextIcon } from '@heroicons/react/24/outline';
import AppLayout from '@components/layout/AppLayout';
import ServiceCard from '@components/common/ServiceCard';
import { useTaxRecords } from '@hooks/useTaxRecords';

export default function Dashboard() {
  const { taxRecords } = useTaxRecords();

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Welcome to JMS Tax</h1>
          <p className="mt-2 text-lg text-slate-600">
            Manage your tax services and client records efficiently
          </p>
        </div>

        {/* Services Grid */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Services
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <ServiceCard
              title="Tax Records"
              description="Manage client tax records, including reference numbers, CNICs, contact details, and filing status."
              icon={DocumentTextIcon}
              href="/tax-records"
              stats={{
                label: 'Total Records',
                value: taxRecords.length,
              }}
              color="blue"
            />

            {/* Placeholder for future services */}
            <div className="relative bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 p-6 text-center">
              <div className="text-slate-400">
                <svg
                  className="mx-auto h-12 w-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-semibold text-slate-900">
                  More services coming soon
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Additional tax services will be added here
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Quick Overview
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="bg-linear-to-br from-blue-50 to-blue-100/50 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900">Tax Records</p>
              <p className="mt-2 text-3xl font-bold text-blue-600">
                {taxRecords.length}
              </p>
            </div>
            <div className="bg-linear-to-br from-green-50 to-green-100/50 rounded-lg p-4">
              <p className="text-sm font-medium text-green-900">Active Clients</p>
              <p className="mt-2 text-3xl font-bold text-green-600">
                {taxRecords.filter(t => t.status !== 'active').length}
              </p>
            </div>
            <div className="bg-linear-to-br from-purple-50 to-purple-100/50 rounded-lg p-4">
              <p className="text-sm font-medium text-purple-900">Completed</p>
              <p className="mt-2 text-3xl font-bold text-purple-600">
                {taxRecords.filter(t => t.status === 'active').length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

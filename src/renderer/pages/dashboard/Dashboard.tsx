import { DocumentTextIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import AppLayout from '@components/layout/AppLayout';
import ServiceCard from '@components/common/ServiceCard';
import { useTotalCount } from '@hooks/useTaxRecords';

export default function Dashboard() {
  const { data: totalClients = 0 } = useTotalCount();

  return (
    <AppLayout breadcrumbs={[{ label: 'Dashboard' }]}>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Welcome to JMS Tax
          </h1>
          <p className="mt-2 text-lg text-slate-600">
            Manage your tax services and client records efficiently
          </p>
        </div>

        {/* Services Grid */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Services
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <ServiceCard
              title="Tax Records"
              description="Manage client tax records, including reference numbers, CNICs, contact details, and filing status."
              icon={DocumentTextIcon}
              href="/tax-records"
              stats={{
                label: 'Total Clients',
                value: totalClients,
              }}
              color="blue"
            />

            <ServiceCard
              title="Sales Tax"
              description="Track and manage your sales tax clients, filings, and deadlines all in one place."
              icon={BanknotesIcon}
              href="/sales-tax"
              color="green"
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
      </div>
    </AppLayout>
  );
}

import { useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { PlusIcon, MagnifyingGlassIcon, CheckCircleIcon, PauseCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/20/solid';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import AppLayout from '@components/layout/AppLayout';
import DataTable, {
  type DataTableColumn,
  type SortState,
} from '@components/table/DataTable';
import Button from '@components/ui/Button';
import Card from '@components/ui/Card';
import ConfirmDialog from '@components/ui/ConfirmDialog';
import EmptyState from '@components/common/EmptyState';
import LoadingSpinner from '@components/common/LoadingSpinner';
import { useTaxRecords } from '@hooks/useTaxRecords';
import { TaxRecord } from '@shared/taxRecord.contracts';
import { Chip } from '@components/ui/Chip';

function sortRows(rows: TaxRecord[], sortState: SortState): TaxRecord[] {
  const sorted = [...rows];
  sorted.sort((a, b) => {
    let comparison = 0;

    if (sortState.key === 'id') {
      comparison = a.id - b.id;
    } else if (sortState.key === 'referenceNumber') {
      comparison = a.referenceNumber.localeCompare(b.referenceNumber);
    } else if (sortState.key === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else if (sortState.key === 'cnic') {
      comparison = a.cnic.localeCompare(b.cnic);
    } else if (sortState.key === 'email') {
      comparison = a.email.localeCompare(b.email);
    } else if (sortState.key === 'reference') {
      comparison = a.reference.localeCompare(b.reference);
    } else if (sortState.key === 'status') {
      comparison = a.status.localeCompare(b.status);
    } else {
      comparison =
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }

    return sortState.direction === 'asc' ? comparison : -comparison;
  });

  return sorted;
}

export default function TaxRecordsPage() {
  const navigate = useNavigate();
  const { taxRecords, loading, deletingId, error, deleteTaxRecord } =
    useTaxRecords();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortState, setSortState] = useState<SortState>({
    key: 'id',
    direction: 'asc',
  });
  const [pendingDeleteRecord, setPendingDeleteRecord] =
    useState<TaxRecord | null>(null);

  const requestDelete = (record: TaxRecord) => {
    setPendingDeleteRecord(record);
  };

  const cancelDelete = () => {
    if (deletingId !== null) {
      return;
    }
    setPendingDeleteRecord(null);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteRecord) {
      return;
    }

    const deleted = await deleteTaxRecord(pendingDeleteRecord.id);
    if (deleted) {
      setPendingDeleteRecord(null);
    }
  };

  const filtered = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return taxRecords.filter((record) => {
      if (!normalizedSearch) {
        return true;
      }

      const searchableValues = [
        record.referenceNumber,
        record.id,
        record.name,
        record.cnic,
        record.email,
        record.reference,
        record.status,
        record.notes,
        record.createdAt,
        new Date(record.createdAt).toLocaleString(),
      ];

      return searchableValues.some((value) =>
        String(value).toLowerCase().includes(normalizedSearch),
      );
    });
  }, [searchQuery, taxRecords]);

  const sortedRecords = useMemo(
    () => sortRows(filtered, sortState),
    [filtered, sortState],
  );

  const columns: DataTableColumn<TaxRecord>[] = [
    {
      id: 'referenceNumber',
      header: 'Reference #',
      sortable: true,
      render: (record) => (
        <span className="font-medium text-slate-900">
          {record.referenceNumber}
        </span>
      ),
    },
    {
      id: 'name',
      header: 'Name',
      sortable: true,
      render: (record) => (
        <span className="font-medium text-slate-900">{record.name}</span>
      ),
    },
    {
      id: 'cnic',
      header: 'CNIC',
      sortable: true,
      render: (record) => <span className="text-slate-600">{record.cnic}</span>,
    },
    {
      id: 'email',
      header: 'Email',
      sortable: true,
      render: (record) => (
        <span className="text-slate-600">{record.email}</span>
      ),
    },
    {
      id: 'reference',
      header: 'Reference',
      sortable: true,
      render: (record) => (
        <span className="text-slate-600">{record.reference}</span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      sortable: true,
      align: 'center',
      render: (record) => (
        <Chip
          variant={
            {
              active: 'green',
              inactive: 'red',
              'late-filer': 'orange',
            }[record.status] || ('slate' as any)
          }
        >
          {record.status}
        </Chip>
      ),
    },
    {
      id: 'createdAt',
      header: 'Created',
      sortable: true,
      align: 'right',
      render: (record) => (
        <span className="text-sm text-slate-500">
          {new Date(record.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: 'updatedAt',
      header: 'Updated',
      sortable: true,
      align: 'right',
      render: (record) => (
        <span className="text-sm text-slate-500">
          {new Date(record.updatedAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      align: 'right',
      render: (record) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="danger"
            size="sm"
            type="button"
            busy={deletingId === record.id}
            onClick={() => requestDelete(record)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AppLayout
      breadcrumbs={[
        { label: 'Dashboard', href: '/' },
        { label: 'Tax Records' },
      ]}
    >
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Tax Records</h1>
            <p className="mt-2 text-slate-600">
              Manage client tax records, including reference numbers, CNICs,
              contact details, and filing status.
            </p>
          </div>
          <Button
            type="button"
            size="md"
            onClick={() => navigate('/tax-records/new')}
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add New Entry
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-6">
            Filers Overview
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {/* Active Filers Card */}
            <div className="relative overflow-hidden bg-white rounded-xl p-6 shadow-md border-l-4 border-green-500 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">Active Filers</p>
                  <p className="mt-3 text-4xl font-extrabold text-slate-900">
                    {taxRecords.filter(t => t.status === 'active').length}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Currently active clients
                  </p>
                </div>
                <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircleIcon className="w-7 h-7 text-green-600" />
                </div>
              </div>
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-green-50 rounded-tl-full -mr-8 -mb-8"></div>
            </div>

            {/* Inactive Filers Card */}
            <div className="relative overflow-hidden bg-white rounded-xl p-6 shadow-md border-l-4 border-slate-400 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">Inactive Filers</p>
                  <p className="mt-3 text-4xl font-extrabold text-slate-900">
                    {taxRecords.filter(t => t.status === 'inactive').length}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    No longer filing
                  </p>
                </div>
                <div className="flex-shrink-0 w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                  <PauseCircleIcon className="w-7 h-7 text-slate-600" />
                </div>
              </div>
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-slate-50 rounded-tl-full -mr-8 -mb-8"></div>
            </div>

            {/* Late Filers Card */}
            <div className="relative overflow-hidden bg-white rounded-xl p-6 shadow-md border-l-4 border-red-500 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">Late Filers</p>
                  <p className="mt-3 text-4xl font-extrabold text-slate-900">
                    {taxRecords.filter(t => t.status === 'late-filer').length}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Require attention
                  </p>
                </div>
                <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <ExclamationTriangleIcon className="w-7 h-7 text-red-600" />
                </div>
              </div>
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-red-50 rounded-tl-full -mr-8 -mb-8"></div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search reference #, name, CNIC, email, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
            />
          </div>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <p className="text-sm text-red-800">{error}</p>
          </Card>
        )}

        {/* Data Table */}
        {loading && (
          <Card>
            <LoadingSpinner className="py-12" size="lg" />
            <p className="text-center text-slate-600 mt-4">
              Loading records...
            </p>
          </Card>
        )}

        {!loading && sortedRecords.length === 0 && (
          <Card>
            <EmptyState
              icon={<DocumentTextIcon className="w-full h-full" />}
              title={searchQuery ? 'No records found' : 'No tax records yet'}
              description={
                searchQuery
                  ? 'Try adjusting your search query'
                  : 'Get started by creating your first tax record'
              }
              action={
                !searchQuery ? (
                  <Button onClick={() => navigate('/tax-records/new')}>
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Add First Record
                  </Button>
                ) : undefined
              }
            />
          </Card>
        )}

        {!loading && sortedRecords.length > 0 && (
          <Card padding="none">
            <DataTable
              columns={columns}
              rows={sortedRecords}
              getRowId={(row) => row.id}
              sortState={sortState}
              onSortChange={setSortState}
              onRowClick={(row) => navigate(`/tax-records/${row.id}`)}
              emptyMessage="No entries found"
            />
          </Card>
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={pendingDeleteRecord !== null}
          title="Delete this record?"
          message={
            pendingDeleteRecord
              ? `This action cannot be undone. The record for ${pendingDeleteRecord.name} will be permanently deleted.`
              : ''
          }
          cancelLabel="Keep record"
          confirmLabel="Delete permanently"
          confirmVariant="danger"
          busy={
            pendingDeleteRecord !== null &&
            deletingId === pendingDeleteRecord.id
          }
          onCancel={cancelDelete}
          onConfirm={confirmDelete}
        />
      </div>
    </AppLayout>
  );
}

import { useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import AppLayout from '@components/layout/AppLayout';
import DataTable, {
  type DataTableColumn,
  type SortState,
} from '@components/table/DataTable';
import Button from '@components/ui/Button';
import Badge from '@components/ui/Badge';
import Card from '@components/ui/Card';
import ConfirmDialog from '@components/ui/ConfirmDialog';
import EmptyState from '@components/common/EmptyState';
import LoadingSpinner from '@components/common/LoadingSpinner';
import { useTaxRecords } from '@hooks/useTaxRecords';
import { TaxRecord } from '@shared/taxRecord.contracts';

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

function getStatusVariant(
  status: string,
): 'success' | 'warning' | 'danger' | 'info' | 'default' {
  const lower = status.toLowerCase();
  if (lower.includes('completed') || lower.includes('done')) return 'success';
  if (lower.includes('pending') || lower.includes('in progress'))
    return 'warning';
  if (lower.includes('rejected') || lower.includes('failed')) return 'danger';
  if (lower.includes('review')) return 'info';
  return 'default';
}

export default function TaxRecordsPage() {
  const navigate = useNavigate();
  const { taxRecords, loading, deletingId, error, deleteTaxRecord } = useTaxRecords();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortState, setSortState] = useState<SortState>({
    key: 'id',
    direction: 'asc',
  });
  const [pendingDeleteRecord, setPendingDeleteRecord] = useState<TaxRecord | null>(null);

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
      render: (record) => <span className="text-slate-600">{record.email}</span>,
    },
    {
      id: 'reference',
      header: 'Reference',
      sortable: true,
      render: (record) => <span className="text-slate-600">{record.reference}</span>,
    },
    {
      id: 'status',
      header: 'Status',
      sortable: true,
      align: 'center',
      render: (record) => (
        <Badge variant={getStatusVariant(record.status)}>{record.status}</Badge>
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
      id: 'actions',
      header: 'Actions',
      align: 'right',
      render: (record) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={() => navigate(`/tax-records/${record.id}/edit`)}
          >
            Edit
          </Button>
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
              Manage client tax records, including reference numbers, CNICs, contact
              details, and filing status.
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
            <p className="text-center text-slate-600 mt-4">Loading records...</p>
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
            pendingDeleteRecord !== null && deletingId === pendingDeleteRecord.id
          }
          onCancel={cancelDelete}
          onConfirm={confirmDelete}
        />
      </div>
    </AppLayout>
  );
}

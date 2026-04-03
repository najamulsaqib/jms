import { useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  PauseCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/20/solid';
import { DocumentTextIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
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
import { taxRecordApi } from '@services/taxRecord.api';
import { TaxRecord, TaxRecordStatus } from '@shared/taxRecord.contracts';
import { Chip } from '@components/ui/Chip';
import SelectField from '@components/ui/SelectField';
import {
  sortRows,
  downloadCSV,
  type SearchField,
  SEARCH_FIELD_OPTIONS,
  SEARCH_FIELD_PLACEHOLDER,
} from './taxRecords.helpers';

export default function TaxRecordsPage() {
  const navigate = useNavigate();
  const { taxRecords, loading, deletingId, error, deleteTaxRecord, reload } =
    useTaxRecords();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState<SearchField>('all');
  const [sortState, setSortState] = useState<SortState>({
    key: 'id',
    direction: 'asc',
  });
  const [pendingDeleteRecord, setPendingDeleteRecord] =
    useState<TaxRecord | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<TaxRecordStatus>('active');
  const [bulkUpdating, setBulkUpdating] = useState(false);

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
      toast.success('Record deleted successfully');
      setPendingDeleteRecord(null);
    }
  };

  const filtered = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    if (!normalizedSearch) return taxRecords;

    return taxRecords.filter((record) => {
      if (searchField === 'all') {
        return [
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
        ].some((v) => String(v).toLowerCase().includes(normalizedSearch));
      }

      const fieldValue: Record<string, unknown> = {
        referenceNumber: record.referenceNumber,
        name: record.name,
        cnic: record.cnic,
        email: record.email,
        reference: record.reference,
        status: record.status,
        notes: record.notes,
      };
      return String(fieldValue[searchField] ?? '').toLowerCase().includes(normalizedSearch);
    });
  }, [searchQuery, searchField, taxRecords]);

  const sortedRecords = useMemo(
    () => sortRows(filtered, sortState),
    [filtered, sortState],
  );

  const allSelected =
    sortedRecords.length > 0 &&
    sortedRecords.every((r) => selectedIds.has(r.id));
  const someSelected =
    sortedRecords.some((r) => selectedIds.has(r.id)) && !allSelected;

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedRecords.map((r) => r.id)));
    }
  };

  const toggleOne = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkUpdate = async () => {
    setBulkUpdating(true);
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) => {
          const record = taxRecords.find((r) => r.id === id);
          if (!record) return Promise.resolve();
          return taxRecordApi.update(id, {
            referenceNumber: record.referenceNumber,
            name: record.name,
            cnic: record.cnic,
            email: record.email,
            password: record.password,
            reference: record.reference,
            status: bulkStatus,
            notes: record.notes,
          });
        }),
      );
      await reload();
      toast.success(
        `Updated ${selectedIds.size} record${selectedIds.size > 1 ? 's' : ''}`,
      );
      setSelectedIds(new Set());
    } catch {
      toast.error('Some records failed to update');
    } finally {
      setBulkUpdating(false);
    }
  };

  const columns: DataTableColumn<TaxRecord>[] = [
    {
      id: 'checkbox',
      pinned: true,
      header: (
        <input
          type="checkbox"
          checked={allSelected}
          ref={(el) => {
            if (el) el.indeterminate = someSelected;
          }}
          onChange={toggleAll}
          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
          aria-label="Select all"
        />
      ),
      render: (record) => (
        <input
          type="checkbox"
          checked={selectedIds.has(record.id)}
          onChange={() => toggleOne(record.id)}
          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
          aria-label={`Select ${record.name}`}
        />
      ),
    },
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
      render: (record) => <Chip variant="grey">{record.reference.replace(/-/g, ' ')}</Chip>,
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
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => {
                downloadCSV(sortedRecords);
                toast.success(`Exported ${sortedRecords.length} record${sortedRecords.length !== 1 ? 's' : ''} to CSV`);
              }}
            >
              <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
              Export CSV
            </Button>
            <Button
              type="button"
              size="md"
              onClick={() => navigate('/tax-records/new')}
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add New Entry
            </Button>
          </div>
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
                  <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">
                    Active Filers
                  </p>
                  <p className="mt-3 text-4xl font-extrabold text-slate-900">
                    {taxRecords.filter((t) => t.status === 'active').length}
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
                  <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">
                    Inactive Filers
                  </p>
                  <p className="mt-3 text-4xl font-extrabold text-slate-900">
                    {taxRecords.filter((t) => t.status === 'inactive').length}
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
                  <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">
                    Late Filers
                  </p>
                  <p className="mt-3 text-4xl font-extrabold text-slate-900">
                    {taxRecords.filter((t) => t.status === 'late-filer').length}
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
          <div className="flex items-end gap-3">
            <div className="w-44 shrink-0">
              <SelectField
                id="searchField"
                label="Search in"
                value={searchField}
                onChange={(e) => {
                  setSearchField(e.target.value as SearchField);
                  setSearchQuery('');
                }}
                options={SEARCH_FIELD_OPTIONS}
              />
            </div>
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder={SEARCH_FIELD_PLACEHOLDER[searchField]}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
              />
            </div>
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

        {!loading && selectedIds.size > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
            <span className="text-sm font-medium text-blue-900">
              {selectedIds.size} record{selectedIds.size > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2 ml-auto">
              <label className="text-sm font-medium text-blue-900">
                Set status to:
              </label>
              <select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value as TaxRecordStatus)}
                className="rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="late-filer">Late Filer</option>
              </select>
              <Button
                type="button"
                size="sm"
                busy={bulkUpdating}
                onClick={handleBulkUpdate}
              >
                Apply
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setSelectedIds(new Set())}
              >
                Deselect
              </Button>
            </div>
          </div>
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

import { useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  PauseCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from '@heroicons/react/20/solid';
import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import CsvImportModal from './CsvImportModal';
import CsvExportModal from './CsvExportModal';
import { toast } from 'sonner';
import AppLayout from '@components/layout/AppLayout';
import StatCard from '@components/common/StatCard';
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
  const [referenceFilter, setReferenceFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortState, setSortState] = useState<SortState>({
    key: 'id',
    direction: 'asc',
  });
  const [pendingDeleteRecord, setPendingDeleteRecord] =
    useState<TaxRecord | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<TaxRecordStatus>('active');
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [showCsvExport, setShowCsvExport] = useState(false);

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
    let results = taxRecords;

    // Apply reference filter
    if (referenceFilter !== 'all') {
      results = results.filter(
        (record) => record.reference === referenceFilter,
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      results = results.filter((record) => record.status === statusFilter);
    }

    // Apply search
    const normalizedSearch = searchQuery.trim().toLowerCase();
    if (normalizedSearch) {
      results = results.filter((record) => {
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
        return String(fieldValue[searchField] ?? '')
          .toLowerCase()
          .includes(normalizedSearch);
      });
    }

    return results;
  }, [searchQuery, searchField, referenceFilter, statusFilter, taxRecords]);

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

  const clearFilters = () => {
    setReferenceFilter('all');
    setStatusFilter('all');
    setSearchQuery('');
    setSearchField('all');
  };

  const hasActiveFilters =
    referenceFilter !== 'all' ||
    statusFilter !== 'all' ||
    searchQuery.trim() !== '';

  // Get unique reference options
  const referenceOptions = Array.from(
    new Set(taxRecords.map((r) => r.reference)),
  )
    .sort()
    .map((ref) => ({
      value: ref,
      label: ref.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    }));

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
      render: (record) => (
        <Chip variant="grey">{record.reference.replace(/-/g, ' ')}</Chip>
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
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-slate-900">Tax Records</h1>
            <p className="mt-2 text-slate-600">
              Manage client tax records, including reference numbers, CNICs,
              contact details, and filing status.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-1 justify-end">
            <Button
              type="button"
              variant="secondary"
              size="md"
              icon={ArrowUpTrayIcon}
              onClick={() => setShowCsvImport(true)}
            >
              Import CSV
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="md"
              icon={ArrowDownTrayIcon}
              onClick={() => setShowCsvExport(true)}
            >
              Export CSV
            </Button>
            <Button
              type="button"
              size="md"
              icon={PlusIcon}
              onClick={() => navigate('/tax-records/new')}
            >
              Add New Entry
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard
            label="Active Filers"
            value={taxRecords.filter((t) => t.status === 'active').length}
            subtext="Currently active clients"
            icon={CheckCircleIcon}
            color="green"
          />
          <StatCard
            label="Late Filers"
            value={taxRecords.filter((t) => t.status === 'late-filer').length}
            subtext="Filed tax late"
            icon={ExclamationTriangleIcon}
            color="orange"
          />
          <StatCard
            label="Inactive Filers"
            value={taxRecords.filter((t) => t.status === 'inactive').length}
            subtext="Require follow-up"
            icon={ExclamationTriangleIcon}
            color="red"
          />
        </div>

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

        {!loading && selectedIds.size > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
            <span className="text-sm font-medium text-blue-900">
              {selectedIds.size} record{selectedIds.size > 1 ? 's' : ''}{' '}
              selected
            </span>
            <div className="flex items-center gap-2 ml-auto">
              <label className="text-sm font-medium text-blue-900">
                Set status to:
              </label>
              <select
                value={bulkStatus}
                onChange={(e) =>
                  setBulkStatus(e.target.value as TaxRecordStatus)
                }
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

        <Card padding="none">
          {/* Integrated Filters Bar */}
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 space-y-2">
            {/* Row 1: Unified search bar */}
            <div className="flex items-stretch rounded-lg border border-slate-300 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
              <select
                id="searchField"
                value={searchField}
                onChange={(e) => {
                  setSearchField(e.target.value as SearchField);
                  setSearchQuery('');
                }}
                className="shrink-0 border-r border-slate-200 bg-slate-50 pl-3 pr-7 text-xs font-medium text-slate-600 focus:outline-none cursor-pointer"
              >
                {SEARCH_FIELD_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="relative flex-1 min-w-0">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="search"
                  type="text"
                  placeholder={SEARCH_FIELD_PLACEHOLDER[searchField]}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-none"
                />
              </div>
            </div>

            {/* Row 2: Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <select
                id="referenceFilter"
                value={referenceFilter}
                onChange={(e) => setReferenceFilter(e.target.value)}
                className="flex-1 min-w-32.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              >
                <option value="all">All References</option>
                {referenceOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 min-w-30 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="late-filer">Late Filer</option>
              </select>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg border border-slate-300 hover:border-red-200 transition-colors whitespace-nowrap"
                >
                  <XMarkIcon className="h-3.5 w-3.5" />
                  Clear
                </button>
              )}
            </div>
          </div>
          {/* Table */}
          {!loading && (
            <DataTable
              columns={columns}
              rows={sortedRecords}
              getRowId={(row) => row.id}
              sortState={sortState}
              onSortChange={setSortState}
              onRowClick={(row) => navigate(`/tax-records/${row.id}`)}
            />
          )}
        </Card>

        {/* CSV Export Modal */}
        <CsvExportModal
          isOpen={showCsvExport}
          records={sortedRecords}
          onClose={() => setShowCsvExport(false)}
        />

        {/* CSV Import Modal */}
        <CsvImportModal
          isOpen={showCsvImport}
          onClose={() => setShowCsvImport(false)}
          onImported={reload}
        />

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

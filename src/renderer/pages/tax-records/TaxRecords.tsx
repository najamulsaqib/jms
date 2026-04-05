import FloatingActionBar from '@components/common/FloatingActionBar';
import LoadingSpinner from '@components/common/LoadingSpinner';
import StatCard from '@components/common/StatCard';
import AppLayout from '@components/layout/AppLayout';
import BulkActionModal from '@components/modals/BulkActionModal';
import DataTable, {
  type DataTableColumn,
  type SortState,
} from '@components/table/DataTable';
import Pagination from '@components/table/Pagination';
import Button from '@components/ui/Button';
import Card from '@components/ui/Card';
import { Chip } from '@components/ui/Chip';
import ConfirmDialog from '@components/ui/ConfirmDialog';
import DropdownMenu, {
  type DropdownMenuItem,
} from '@components/ui/DropdownMenu';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/20/solid';
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  FolderIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import {
  useBulkDeleteRecords,
  useBulkUpdateStatus,
  useDistinctReferences,
  usePaginatedTaxRecords,
  useStatusCounts,
} from '@hooks/useTaxRecords';
import { TaxRecord, TaxRecordStatus } from '@shared/taxRecord.contracts';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import CsvExportModal from './CsvExportModal';
import CsvImportModal from './CsvImportModal';
import {
  SEARCH_FIELD_OPTIONS,
  SEARCH_FIELD_PLACEHOLDER,
  type SearchField,
} from './taxRecords.helpers';

const DEFAULT_PAGE_SIZE = 25;

export default function TaxRecordsPage() {
  const navigate = useNavigate();

  // Pagination + filter state
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [searchField, setSearchField] = useState<SearchField>('all');
  const [referenceFilter, setReferenceFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortState, setSortState] = useState<SortState>({
    key: 'updatedAt',
    direction: 'desc',
  });

  // Debounce search input
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(0);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  // Reset page when any filter/sort changes
  const resetPage = () => setPage(0);

  // Server-side data
  const {
    records,
    total,
    loading,
    error,
    deleteTaxRecord,
    deletingId,
    reload,
  } = usePaginatedTaxRecords({
    page,
    pageSize,
    sortKey: sortState.key,
    sortDirection: sortState.direction,
    search: debouncedSearch,
    searchField,
    referenceFilter,
    statusFilter,
  });

  const { data: statusCounts } = useStatusCounts();
  const { data: distinctReferences = [] } = useDistinctReferences();
  const {
    bulkUpdateStatus,
    bulkUpdateAllStatus,
    isUpdating: bulkUpdating,
  } = useBulkUpdateStatus();
  const { bulkDelete, isDeleting: bulkDeleting } = useBulkDeleteRecords();

  // Selection
  const [pendingDeleteRecord, setPendingDeleteRecord] =
    useState<TaxRecord | null>(null);
  const [pendingBulkDelete, setPendingBulkDelete] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<TaxRecordStatus>('active');
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [showCsvExport, setShowCsvExport] = useState(false);
  const [bulkUpdateMode, setBulkUpdateMode] = useState<
    'selected' | 'all' | null
  >(null);
  const [showBulkActionModal, setShowBulkActionModal] = useState(false);

  const requestDelete = (record: TaxRecord) => setPendingDeleteRecord(record);

  const cancelDelete = () => {
    if (deletingId !== null) return;
    setPendingDeleteRecord(null);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteRecord) return;
    const deleted = await deleteTaxRecord(pendingDeleteRecord.id);
    if (deleted) {
      toast.success('Record deleted successfully');
      setPendingDeleteRecord(null);
    }
  };

  const confirmBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    const deleted = await bulkDelete(ids);
    if (deleted) {
      toast.success(`${ids.length} record${ids.length > 1 ? 's' : ''} deleted`);
      setSelectedIds(new Set());
      setPendingBulkDelete(false);
    }
  };

  const allSelected =
    records.length > 0 && records.every((r) => selectedIds.has(r.id));
  const someSelected =
    records.some((r) => selectedIds.has(r.id)) && !allSelected;

  const toggleAll = () => {
    if (allSelected) {
      // Deselect only current page
      setSelectedIds((prev) => {
        const next = new Set(prev);
        records.forEach((r) => next.delete(r.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        records.forEach((r) => next.add(r.id));
        return next;
      });
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

  const requestBulkUpdate = (mode: 'selected' | 'all') => {
    setBulkUpdateMode(mode);
  };

  const handleBulkActionApply = (
    mode: 'selected' | 'all',
    status: TaxRecordStatus,
  ) => {
    setBulkStatus(status);
    setBulkUpdateMode(mode);
  };

  const cancelBulkUpdate = () => {
    if (bulkUpdating) return;
    setBulkUpdateMode(null);
  };

  const confirmBulkUpdate = async () => {
    if (!bulkUpdateMode) return;

    let success = false;

    if (bulkUpdateMode === 'all') {
      // Update all records (filtered)
      success = await bulkUpdateAllStatus(bulkStatus, {
        search: debouncedSearch,
        searchField,
        referenceFilter,
        statusFilter,
      });

      if (success) {
        const count = total;
        toast.success(
          `Updated ${count} record${count !== 1 ? 's' : ''} to ${bulkStatus}`,
        );
        await reload();
        setBulkUpdateMode(null);
      } else {
        toast.error('Bulk update failed');
      }
    } else {
      // Update selected only
      success = await bulkUpdateStatus(Array.from(selectedIds), bulkStatus);

      if (success) {
        toast.success(
          `Updated ${selectedIds.size} record${selectedIds.size > 1 ? 's' : ''} to ${bulkStatus}`,
        );
        setSelectedIds(new Set());
        await reload();
        setBulkUpdateMode(null);
      } else {
        toast.error('Bulk update failed');
      }
    }
  };

  const clearFilters = () => {
    setReferenceFilter('all');
    setStatusFilter('all');
    setSearchQuery('');
    setSearchField('all');
    setPage(0);
  };

  const hasActiveFilters =
    referenceFilter !== 'all' ||
    statusFilter !== 'all' ||
    searchQuery.trim() !== '';

  const referenceOptions = distinctReferences.map((ref) => ({
    value: ref,
    label: ref.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
  }));

  // Dropdown menu items
  const dropdownMenuItems: DropdownMenuItem[] = [
    ...(total > 0
      ? [
          {
            label: 'Bulk Actions',
            icon: FolderIcon,
            onClick: () => setShowBulkActionModal(true),
            badge: selectedIds.size > 0 ? selectedIds.size : undefined,
          },
        ]
      : []),
    {
      label: 'Import CSV',
      icon: ArrowUpTrayIcon,
      onClick: () => setShowCsvImport(true),
    },
    {
      label: 'Export CSV',
      icon: ArrowDownTrayIcon,
      onClick: () => setShowCsvExport(true),
    },
  ];

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
          aria-label="Select all on page"
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
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => requestDelete(record)}
            className="flex items-center justify-center w-8 h-8 text-red-400 hover:text-red-500 hover:bg-red-200 rounded-lg transition-colors"
            title="Delete selected"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
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
          <div className="flex items-center gap-2">
            <DropdownMenu items={dropdownMenuItems} />
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
            value={statusCounts?.active ?? 0}
            subtext="Currently active clients"
            icon={CheckCircleIcon}
            color="green"
          />
          <StatCard
            label="Late Filers"
            value={statusCounts?.lateFiler ?? 0}
            subtext="Filed tax late"
            icon={ExclamationTriangleIcon}
            color="orange"
          />
          <StatCard
            label="Inactive Filers"
            value={statusCounts?.inactive ?? 0}
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

        <Card padding="none" className="mb-20">
          {/* Filters Bar */}
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 space-y-2">
            {/* Row 1: Unified search bar */}
            <div className="flex items-stretch rounded-lg border border-slate-300 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
              <select
                id="searchField"
                value={searchField}
                onChange={(e) => {
                  setSearchField(e.target.value as SearchField);
                  setSearchQuery('');
                  resetPage();
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
                onChange={(e) => {
                  setReferenceFilter(e.target.value);
                  resetPage();
                }}
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
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  resetPage();
                }}
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
          {loading ? (
            <div className="py-12">
              <LoadingSpinner className="py-4" size="lg" />
              <p className="text-center text-slate-600 mt-4">
                Loading records...
              </p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              rows={records}
              getRowId={(row) => row.id}
              sortState={sortState}
              onSortChange={(next) => {
                setSortState(next);
                resetPage();
              }}
              onRowClick={(row) => navigate(`/tax-records/${row.id}`)}
            />
          )}

          {/* Pagination */}
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(0);
            }}
          />
        </Card>

        {/* CSV Export Modal */}
        <CsvExportModal
          isOpen={showCsvExport}
          records={records}
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

        {/* Bulk Update Confirmation Dialog */}
        <ConfirmDialog
          isOpen={bulkUpdateMode !== null}
          title={`Update ${bulkUpdateMode === 'all' ? 'all' : 'selected'} records?`}
          message={
            bulkUpdateMode === 'all'
              ? `This will update ${hasActiveFilters ? 'all filtered' : 'all'} records (${total} total) to "${bulkStatus}". This action cannot be undone.`
              : `This will update ${selectedIds.size} selected record${selectedIds.size > 1 ? 's' : ''} to "${bulkStatus}". This action cannot be undone.`
          }
          cancelLabel="Cancel"
          confirmLabel={`Update ${bulkUpdateMode === 'all' ? `All (${total})` : `Selected (${selectedIds.size})`}`}
          confirmVariant="primary"
          busy={bulkUpdating}
          onCancel={cancelBulkUpdate}
          onConfirm={confirmBulkUpdate}
        />

        {/* Bulk Action Modal */}
        <BulkActionModal
          isOpen={showBulkActionModal}
          selectedCount={selectedIds.size}
          totalCount={total}
          hasActiveFilters={hasActiveFilters}
          onClose={() => setShowBulkActionModal(false)}
          onApplyToSelected={(status) =>
            handleBulkActionApply('selected', status)
          }
          onApplyToAll={(status) => handleBulkActionApply('all', status)}
        />

        {/* Bulk Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={pendingBulkDelete}
          title={`Delete ${selectedIds.size} record${selectedIds.size > 1 ? 's' : ''}?`}
          message={`This action cannot be undone. ${selectedIds.size} selected record${selectedIds.size > 1 ? 's' : ''} will be permanently deleted.`}
          cancelLabel="Cancel"
          confirmLabel={`Delete ${selectedIds.size} record${selectedIds.size > 1 ? 's' : ''}`}
          confirmVariant="danger"
          busy={bulkDeleting}
          onCancel={() => setPendingBulkDelete(false)}
          onConfirm={confirmBulkDelete}
        />

        {/* Floating Action Bar */}
        <FloatingActionBar
          selectedCount={selectedIds.size}
          totalCount={total}
          status={bulkStatus}
          hasActiveFilters={hasActiveFilters}
          onStatusChange={setBulkStatus}
          onApplyToSelected={() => requestBulkUpdate('selected')}
          onApplyToAll={() => requestBulkUpdate('all')}
          onClearSelection={() => setSelectedIds(new Set())}
          onDeleteSelected={() => setPendingBulkDelete(true)}
        />
      </div>
    </AppLayout>
  );
}

import Button from '@components/ui/Button';
import { TaxRecordStatus } from '@shared/taxRecord.contracts';
import { useState } from 'react';

interface BulkActionModalProps {
  isOpen: boolean;
  selectedCount: number;
  totalCount: number;
  hasActiveFilters: boolean;
  onClose: () => void;
  onApplyToSelected: (status: TaxRecordStatus) => void;
  onApplyToAll: (status: TaxRecordStatus) => void;
}

export default function BulkActionModal({
  isOpen,
  selectedCount,
  totalCount,
  hasActiveFilters,
  onClose,
  onApplyToSelected,
  onApplyToAll,
}: BulkActionModalProps) {
  const [selectedStatus, setSelectedStatus] =
    useState<TaxRecordStatus>('active');

  if (!isOpen) return null;

  const handleClose = () => {
    setSelectedStatus('active');
    onClose();
  };

  const handleApplyToSelected = () => {
    onApplyToSelected(selectedStatus);
    setSelectedStatus('active');
    handleClose();
  };

  const handleApplyToAll = () => {
    onApplyToAll(selectedStatus);
    setSelectedStatus('active');
    handleClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-xl shadow-2xl max-w-md w-full pointer-events-auto animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">
              Bulk Status Update
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Select a status to apply to your records
            </p>
          </div>

          {/* Body */}
          <div className="px-6 py-6 space-y-6">
            {/* Status Selection */}
            <div>
              <label
                htmlFor="modal-status-select"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Change status to:
              </label>
              <div className="space-y-2">
                {[
                  { value: 'active', label: 'Active', color: 'green' },
                  { value: 'inactive', label: 'Inactive', color: 'red' },
                  { value: 'late-filer', label: 'Late Filer', color: 'orange' },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedStatus === option.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="status"
                      value={option.value}
                      checked={selectedStatus === option.value}
                      onChange={(e) =>
                        setSelectedStatus(e.target.value as TaxRecordStatus)
                      }
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">
                          {option.label}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded ${
                            option.color === 'green'
                              ? 'bg-green-100 text-green-800'
                              : option.color === 'red'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-orange-100 text-orange-800'
                          }`}
                        >
                          {option.label}
                        </span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-2 gap-3">
              {selectedCount > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-2xl font-bold text-blue-900">
                    {selectedCount}
                  </div>
                  <div className="text-xs text-blue-700 mt-0.5">
                    Selected records
                  </div>
                </div>
              )}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-2xl font-bold text-slate-900">
                  {totalCount}
                </div>
                <div className="text-xs text-slate-700 mt-0.5">
                  {hasActiveFilters ? 'Filtered records' : 'Total records'}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 rounded-b-xl flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
            >
              Cancel
            </Button>
            {selectedCount > 0 && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleApplyToSelected}
              >
                Apply to {selectedCount} Selected
              </Button>
            )}
            <Button
              type="button"
              variant={selectedCount > 0 ? 'secondary' : 'primary'}
              size="sm"
              onClick={handleApplyToAll}
            >
              Apply to {hasActiveFilters ? 'Filtered' : 'All'} ({totalCount})
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

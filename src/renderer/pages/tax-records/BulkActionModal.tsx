import Button from '@components/ui/Button';
import Modal from '@components/ui/Modal';
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

  const handleClose = () => {
    setSelectedStatus('active');
    onClose();
  };

  const handleApplyToSelected = () => {
    onApplyToSelected(selectedStatus);
    handleClose();
  };

  const handleApplyToAll = () => {
    onApplyToAll(selectedStatus);
    handleClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Bulk Status Update"
      description="Select a status to apply to your records"
      size="sm"
      footer={
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleClose}
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
      }
    >
      <div className="space-y-6">
        <div>
          <p className="block text-sm font-medium text-slate-700 mb-2">
            Change status to:
          </p>
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
              </label>
            ))}
          </div>
        </div>

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
    </Modal>
  );
}

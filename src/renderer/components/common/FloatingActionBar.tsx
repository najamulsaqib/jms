import { TrashIcon, XMarkIcon } from '@heroicons/react/20/solid';
import { CheckCircleIcon, CheckIcon } from '@heroicons/react/24/outline';
import { TaxRecordStatus } from '@shared/taxRecord.contracts';

interface FloatingActionBarProps {
  selectedCount: number;
  totalCount: number;
  status: TaxRecordStatus;
  hasActiveFilters: boolean;
  onStatusChange: (status: TaxRecordStatus) => void;
  onApplyToSelected: () => void;
  onApplyToAll: () => void;
  onClearSelection: () => void;
  onDeleteSelected: () => void;
}

export default function FloatingActionBar({
  selectedCount,
  totalCount,
  status,
  hasActiveFilters,
  onStatusChange,
  onApplyToSelected,
  onApplyToAll,
  onClearSelection,
  onDeleteSelected,
}: FloatingActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 whitespace-nowrap">
        {/* Selection count */}
        <div className="flex items-center gap-1.5 pr-3 border-r border-slate-700 text-sm">
          <span className="font-semibold">{selectedCount}</span>
          <span className="text-slate-300">of {totalCount} selected</span>
        </div>

        {/* Status selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-slate-300">Status:</span>
          <select
            id="floating-bulk-status"
            value={status}
            onChange={(e) => onStatusChange(e.target.value as TaxRecordStatus)}
            className="px-2 py-1 text-sm border border-slate-600 rounded-lg bg-slate-800 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="late-filer">Late Filer</option>
          </select>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 pl-3 border-l border-slate-700">
          <button
            type="button"
            onClick={onApplyToSelected}
            className="flex items-center justify-center w-8 h-8 text-blue-400 hover:text-blue-300 hover:bg-blue-900/40 rounded-lg transition-colors"
            title="Apply to selected"
          >
            <CheckIcon className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onApplyToAll}
            className="flex items-center justify-center w-8 h-8 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            title={hasActiveFilters ? 'Apply to filtered' : 'Apply to all'}
          >
            <CheckCircleIcon className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onDeleteSelected}
            className="flex items-center justify-center w-8 h-8 text-red-400 hover:text-red-300 hover:bg-red-900/40 rounded-lg transition-colors"
            title="Delete selected"
          >
            <TrashIcon className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onClearSelection}
            className="flex items-center justify-center w-8 h-8 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            title="Clear selection"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

import { XMarkIcon } from '@heroicons/react/20/solid';
import { CheckIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { TaxRecordStatus } from '@shared/taxRecord.contracts';
import Button from '@components/ui/Button';

interface FloatingActionBarProps {
  selectedCount: number;
  totalCount: number;
  status: TaxRecordStatus;
  hasActiveFilters: boolean;
  onStatusChange: (status: TaxRecordStatus) => void;
  onApplyToSelected: () => void;
  onApplyToAll: () => void;
  onClearSelection: () => void;
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
}: FloatingActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-4 px-6 py-3 bg-slate-900 text-white rounded-full shadow-2xl border border-slate-700">
        {/* Selection count */}
        <div className="flex items-center gap-2 pr-4 border-r border-slate-700">
          <span className="font-semibold">{selectedCount}</span>
          <span className="text-slate-300 text-sm">
            of {totalCount} selected
          </span>
        </div>

        {/* Status selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-300">Status:</span>
          <select
            id="floating-bulk-status"
            value={status}
            onChange={(e) => onStatusChange(e.target.value as TaxRecordStatus)}
            className="px-3 py-1.5 text-sm border border-slate-600 rounded-lg bg-slate-800 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="late-filer">Late Filer</option>
          </select>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 pl-4 border-l border-slate-700">
          <Button
            type="button"
            size="sm"
            onClick={onApplyToSelected}
            icon={CheckIcon}
            className="bg-blue-600 hover:bg-blue-700 border-0 text-white"
          >
            Apply to Selected
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={onApplyToAll}
            icon={CheckCircleIcon}
            className="bg-slate-600 hover:bg-slate-700 border-0 text-white"
          >
            {hasActiveFilters ? 'Apply to Filtered' : 'Apply to All'}
          </Button>

          <button
            type="button"
            onClick={onClearSelection}
            className="flex items-center justify-center w-8 h-8 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors ml-2"
            title="Clear selection"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

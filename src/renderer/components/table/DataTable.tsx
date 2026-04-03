import { type ReactNode } from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/20/solid';

export type SortDirection = 'asc' | 'desc';

export type SortState = {
  key: string;
  direction: SortDirection;
};

export type DataTableColumn<T> = {
  id: string;
  header: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  className?: string;
  render: (row: T) => ReactNode;
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string | number;
  emptyMessage?: string;
  sortState?: SortState;
  onSortChange?: (nextSort: SortState) => void;
  onRowClick?: (row: T) => void;
};

const alignClasses = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

export default function DataTable<T>({
  columns,
  rows,
  getRowId,
  emptyMessage = 'No records available.',
  sortState,
  onSortChange,
  onRowClick,
}: DataTableProps<T>) {
  const handleSort = (columnId: string, sortable?: boolean) => {
    if (!sortable || !onSortChange) {
      return;
    }

    const sameColumn = sortState?.key === columnId;
    const nextDirection: SortDirection =
      sameColumn && sortState?.direction === 'asc' ? 'desc' : 'asc';

    onSortChange({ key: columnId, direction: nextDirection });
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((column) => {
              const isSorted = sortState?.key === column.id;
              const align = column.align || 'left';

              return (
                <th
                  key={column.id}
                  scope="col"
                  className={`px-6 py-3 text-xs font-semibold text-slate-700 uppercase tracking-wider ${alignClasses[align]} ${column.className || ''}`}
                >
                  {column.sortable ? (
                    <button
                      type="button"
                      onClick={() => handleSort(column.id, column.sortable)}
                      className="group inline-flex items-center gap-1 hover:text-slate-900 transition-colors"
                    >
                      {column.header}
                      <span className="flex-none">
                        {isSorted ? (
                          sortState?.direction === 'asc' ? (
                            <ChevronUpIcon className="h-4 w-4 text-blue-600" />
                          ) : (
                            <ChevronDownIcon className="h-4 w-4 text-blue-600" />
                          )
                        ) : (
                          <ChevronUpIcon className="h-4 w-4 text-slate-300 group-hover:text-slate-400" />
                        )}
                      </span>
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody className="bg-white divide-y divide-slate-200">
          {rows.length ? (
            rows.map((row) => (
              <tr
                key={getRowId(row)}
                className={`hover:bg-slate-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((column) => {
                  const align = column.align || 'left';
                  return (
                    <td
                      key={`${getRowId(row)}-${column.id}`}
                      className={`px-6 py-4 whitespace-nowrap text-sm ${alignClasses[align]} ${column.className || ''}`}
                      onClick={column.id === 'actions' ? (e) => e.stopPropagation() : undefined}
                    >
                      {column.render(row)}
                    </td>
                  );
                })}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-12 text-center text-sm text-slate-500"
              >
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

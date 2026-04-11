import { type CSSProperties, type ReactNode } from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/20/solid';
import { BugAntIcon } from '@heroicons/react/24/outline';

export type SortDirection = 'asc' | 'desc';

export type SortState = {
  key: string;
  direction: SortDirection;
};

export type DataTableColumn<T> = {
  id: string;
  header: ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  size?: string | number;
  pinned?: boolean;
  className?: string;
  render: (row: T) => ReactNode;
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string | number;
  emptyMessage?: string;
  sortState?: SortState | null;
  onSortChange?: (nextSort: SortState | null) => void;
  onRowClick?: (row: T) => void;
  footer?: ReactNode;
};

const alignClasses = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

function getColumnSizeStyle<T>({
  size,
}: DataTableColumn<T>): CSSProperties | undefined {
  if (size === undefined) {
    return undefined;
  }

  const resolvedSize = typeof size === 'number' ? `${size}px` : size;

  return {
    width: resolvedSize,
    minWidth: resolvedSize,
    maxWidth: resolvedSize,
  };
}

function getCellContent(content: ReactNode, hasSize: boolean): ReactNode {
  if (!hasSize) return content;
  return (
    <div className="overflow-hidden text-ellipsis whitespace-nowrap">
      {content}
    </div>
  );
}

function SortIcon({
  active,
  direction,
}: {
  active: boolean;
  direction?: SortDirection;
}) {
  return (
    <span className="flex flex-col -space-y-1.5 ml-0.5">
      <ChevronUpIcon
        className={`h-3 w-3 transition-colors ${
          active && direction === 'asc'
            ? 'text-blue-500'
            : 'text-slate-300 group-hover:text-slate-400'
        }`}
      />
      <ChevronDownIcon
        className={`h-3 w-3 transition-colors ${
          active && direction === 'desc'
            ? 'text-blue-500'
            : 'text-slate-300 group-hover:text-slate-400'
        }`}
      />
    </span>
  );
}

export default function DataTable<T>({
  columns,
  rows,
  getRowId,
  emptyMessage = 'No records available.',
  sortState,
  onSortChange,
  onRowClick,
  footer,
}: DataTableProps<T>) {
  const handleSort = (columnId: string, sortable?: boolean) => {
    if (!sortable || !onSortChange) {
      return;
    }

    const sameColumn = sortState?.key === columnId;

    if (sameColumn && sortState?.direction === 'desc') {
      onSortChange(null);
      return;
    }

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
              const sizeStyle = getColumnSizeStyle(column);
              const pinnedClasses = column.pinned
                ? 'sticky left-0 z-10 bg-slate-50 after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-slate-200'
                : '';

              return (
                <th
                  key={column.id}
                  scope="col"
                  style={sizeStyle}
                  className={`px-6 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${alignClasses[align]} ${isSorted ? 'text-blue-700' : 'text-slate-700'} ${pinnedClasses} ${column.className || ''}`}
                >
                  {column.sortable ? (
                    <button
                      type="button"
                      onClick={() => handleSort(column.id, column.sortable)}
                      className="group flex items-center justify-between w-full hover:text-slate-900 transition-colors whitespace-nowrap cursor-pointer"
                    >
                      {column.header}
                      <SortIcon
                        active={isSorted}
                        direction={sortState?.direction}
                      />
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
                  const sizeStyle = getColumnSizeStyle(column);
                  return (
                    <td
                      key={`${getRowId(row)}-${column.id}`}
                      style={sizeStyle}
                      className={`px-6 py-4 text-sm ${alignClasses[align]} ${column.pinned ? 'sticky left-0 z-10 bg-white after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-slate-200' : ''} ${column.className || ''}`}
                      onClick={
                        column.id === 'actions' || column.id === 'checkbox'
                          ? (e) => e.stopPropagation()
                          : undefined
                      }
                    >
                      {getCellContent(column.render(row), !!column.size)}
                    </td>
                  );
                })}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="px-6 py-16 text-center">
                <div className="flex flex-col items-center gap-2">
                  <BugAntIcon className="h-10 w-10 text-slate-500" />
                  <p className="text-sm text-slate-500">{emptyMessage}</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
        {footer && <tfoot>{footer}</tfoot>}
      </table>
    </div>
  );
}

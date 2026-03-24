import { type ReactNode } from 'react';

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
};

export default function DataTable<T>({
  columns,
  rows,
  getRowId,
  emptyMessage = 'No records available.',
  sortState,
  onSortChange,
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
    <div className="table-shell">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => {
              const isSorted = sortState?.key === column.id;

              return (
                <th
                  key={column.id}
                  className={[
                    column.className,
                    column.sortable ? 'is-sortable' : '',
                    column.align ? `is-${column.align}` : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <button
                    type="button"
                    className="table-head-button"
                    onClick={() => handleSort(column.id, column.sortable)}
                    disabled={!column.sortable}
                  >
                    {column.header}
                    {column.sortable ? (
                      <span
                        className={
                          isSorted ? 'sort-indicator active' : 'sort-indicator'
                        }
                      >
                        {isSorted && sortState?.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    ) : null}
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {rows.length ? (
            rows.map((row) => (
              <tr key={getRowId(row)}>
                {columns.map((column) => (
                  <td
                    key={`${getRowId(row)}-${column.id}`}
                    className={[
                      column.className,
                      column.align ? `is-${column.align}` : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td className="table-empty" colSpan={columns.length}>
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

DataTable.defaultProps = {
  emptyMessage: 'No records available.',
  sortState: undefined,
  onSortChange: undefined,
};

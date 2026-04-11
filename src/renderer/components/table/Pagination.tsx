import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100, 250, 500, 1000];

type PaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

function buildPageWindows(
  current: number,
  totalPages: number,
): (number | '...')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i);
  }
  const pages: (number | '...')[] = [];
  // Always show first 2
  pages.push(0, 1);
  if (current > 3) pages.push('...');
  // Middle window around current
  const start = Math.max(2, current - 1);
  const end = Math.min(totalPages - 3, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < totalPages - 4) pages.push('...');
  // Always show last 2
  pages.push(totalPages - 2, totalPages - 1);
  return [...new Set(pages)];
}

export default function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, total);

  const pages = buildPageWindows(page, totalPages);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-white">
      {/* Left: per-page + summary */}
      <div className="flex items-center gap-3 text-sm text-slate-600">
        <span>Rows per page:</span>
        <select
          value={pageSize}
          onChange={(e) => {
            onPageSizeChange(Number(e.target.value));
          }}
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {PAGE_SIZE_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <span className="text-slate-400">
          {total === 0 ? '0 records' : `${from}–${to} of ${total}`}
        </span>
      </div>

      {/* Right: page controls */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0}
          className="inline-flex items-center justify-center h-8 w-8 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>

        {pages.map((p, i) =>
          p === '...' ? (
            <span
              // eslint-disable-next-line react/no-array-index-key
              key={`ellipsis-${i}`}
              className="inline-flex items-center justify-center h-8 w-8 text-sm text-slate-400 select-none"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p as number)}
              className={`inline-flex items-center justify-center h-8 w-8 rounded-md text-sm font-medium transition-colors ${
                p === page
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
              aria-current={p === page ? 'page' : undefined}
            >
              {(p as number) + 1}
            </button>
          ),
        )}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1}
          className="inline-flex items-center justify-center h-8 w-8 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

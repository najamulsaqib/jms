import StatCard from '@components/common/StatCard';
import DataTable, { type DataTableColumn } from '@components/table/DataTable';
import {
  CodeBracketIcon,
  CurrencyDollarIcon,
  NumberedListIcon,
} from '@heroicons/react/24/outline';
import { useMemo } from 'react';
import { type SummaryRow, type ValidationIssue, fmt } from './types';

type ResultsStepProps = {
  summary: SummaryRow[];
  issues: ValidationIssue[];
  revenuePercentage: number;
  onPercentageChange: (percentage: number) => void;
};

export default function ResultsStep({
  summary,
  issues,
  revenuePercentage,
  onPercentageChange,
}: ResultsStepProps) {
  const totalValue = summary.reduce((s, r) => s + r.value, 0);
  const totalRevenue = summary.reduce((s, r) => s + r.saleRevenue, 0);
  const totalTax = summary.reduce((s, r) => s + r.salesTax, 0);
  const totalQty = summary.reduce((s, r) => s + r.quantity, 0);
  const totalInvoices = summary.reduce((s, r) => s + r.invoiceCount, 0);

  const columns: DataTableColumn<SummaryRow>[] = useMemo(
    () => [
      {
        id: 'hsCode',
        header: 'HS Code',
        render: (row) => (
          <span className="font-mono text-xs font-semibold text-slate-800">
            {row.hsCode}
          </span>
        ),
      },
      {
        id: 'invoiceCount',
        header: 'Invoices',
        align: 'center',
        render: (row) => row.invoiceCount.toLocaleString(),
      },
      {
        id: 'quantity',
        header: 'Quantity',
        align: 'center',
        render: (row) => fmt(row.quantity),
      },
      {
        id: 'value',
        header: 'Value',
        align: 'center',
        render: (row) => <span className="font-medium">{fmt(row.value)}</span>,
      },
      {
        id: 'saleRevenue',
        header: `Sale Revenue (+${revenuePercentage}%)`,
        align: 'center',
        render: (row) => (
          <span className="font-medium text-blue-700">
            {fmt(row.saleRevenue)}
          </span>
        ),
      },
      {
        id: 'salesTax',
        header: 'Sales Tax',
        align: 'right',
        render: (row) => (
          <span className="font-medium">{fmt(row.salesTax)}</span>
        ),
      },
    ],
    [revenuePercentage],
  );

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <StatCard
          label="HS Codes"
          value={summary.length.toLocaleString()}
          subtext="unique codes"
          icon={CodeBracketIcon}
          color="green"
        />
        <StatCard
          label="Total Invoices"
          value={totalInvoices.toLocaleString()}
          subtext="rows processed"
          icon={NumberedListIcon}
          color="blue"
        />
        <StatCard
          label="Total Value"
          value={fmt(totalValue)}
          subtext="PKR"
          icon={CurrencyDollarIcon}
          color="neon"
        />
        <StatCard
          label="Total Sale Revenue"
          value={fmt(totalRevenue)}
          subtext="PKR"
          icon={CurrencyDollarIcon}
          color="orange"
        />
        <StatCard
          label="Total Sales Tax"
          value={fmt(totalTax)}
          subtext="PKR"
          icon={CurrencyDollarIcon}
          color="red"
        />
      </div>

      {/* Percentage Adjuster */}

      {/* Issues */}
      {issues.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2">
            {issues.length} row{issues.length !== 1 ? 's' : ''} skipped
          </p>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {issues.map((issue, i) => (
              <p key={i} className="text-xs text-amber-700">
                <span className="font-mono bg-amber-100 rounded px-1 mr-1.5">
                  Row {issue.row}
                </span>
                {issue.reason}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Summary table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-slate-800">
              Summary by HS Code
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Sale Revenue = Value × {(1 + revenuePercentage / 100).toFixed(3)}
            </p>
          </div>

          <div className="flex items-center gap-3 justify-end">
            <label className="text-sm font-medium text-slate-700">
              Revenue Adjustment:
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={revenuePercentage}
              onChange={(e) => {
                const num = parseFloat(e.target.value);
                if (!Number.isNaN(num) && num >= 0 && num <= 100) {
                  onPercentageChange(num);
                }
              }}
              className="w-20 px-2 py-1.5 border border-slate-300 rounded-lg text-sm font-medium text-center focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
            <span className="text-sm text-slate-600">%</span>
          </div>
        </div>

        <DataTable
          columns={columns}
          rows={summary}
          getRowId={(row) => row.hsCode}
          emptyMessage="No data to display."
          footer={
            <tr className="bg-white text-blue-700 text-sm font-semibold border-t-">
              <td className="px-6 py-3 text-xs uppercase tracking-wider whitespace-nowrap sticky left-0">
                Totals
              </td>
              <td className="px-6 py-3 text-center tabular-nums whitespace-nowrap">
                {totalInvoices.toLocaleString()}
              </td>
              <td className="px-6 py-3 text-center tabular-nums whitespace-nowrap">
                {fmt(totalQty)}
              </td>
              <td className="px-6 py-3 text-center tabular-nums whitespace-nowrap">
                {fmt(totalValue)}
              </td>
              <td className="px-6 py-3 text-center tabular-nums whitespace-nowrap">
                {fmt(totalRevenue)}
              </td>
              <td className="px-6 py-3 text-right tabular-nums whitespace-nowrap">
                {fmt(totalTax)}
              </td>
            </tr>
          }
        />
      </div>
    </div>
  );
}

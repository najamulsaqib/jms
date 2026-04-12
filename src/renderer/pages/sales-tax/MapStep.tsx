import DataTable, { type DataTableColumn } from '@components/table/DataTable';
import Card from '@components/ui/Card';
import SelectField from '@components/ui/SelectField';
import { CheckCircleIcon } from '@heroicons/react/20/solid';
import { useMemo } from 'react';
import { REQUIRED_FIELDS } from './types';

const CSV_PREVIEW_ROWS = 5;

type MapStepProps = {
  headers: string[];
  rows: string[][];
  mapping: Record<string, string>;
  onMappingChange: (mapping: Record<string, string>) => void;
};

export default function MapStep({
  headers,
  rows,
  mapping,
  onMappingChange,
}: MapStepProps) {
  const unmappedRequired = REQUIRED_FIELDS.filter((f) => !mapping[f.id]);

  // Transform raw rows into objects with headers as keys
  const previewData = useMemo(
    () =>
      rows
        .slice(0, CSV_PREVIEW_ROWS)
        .map((row) =>
          Object.fromEntries(headers.map((h, i) => [h, row[i] ?? ''])),
        ),
    [rows, headers],
  );

  // Define dynamic columns based on headers
  const columns: DataTableColumn<Record<string, string>>[] = useMemo(
    () =>
      headers.map((header) => ({
        id: header,
        header,
        size: '160px',
        render: (row) => {
          const value = row[header] || '—';
          return (
            <span className="text-slate-700 text-xs" title={value}>
              {value}
            </span>
          );
        },
      })),
    [headers],
  );

  return (
    <div className="space-y-4 grid md:grid-cols-3 gap-4">
      {/* Column mapping card */}
      <Card className="space-y-0 h-full">
        <div className="px-6 py-4 border-b border-slate-100 bg-linear-to-r from-slate-50 to-white">
          <p className="text-sm font-semibold text-slate-900">Column Mapping</p>
          <p className="text-xs text-slate-500 mt-1.5">
            <span className="font-semibold text-slate-700">
              {rows.length.toLocaleString()}
            </span>{' '}
            rows •{' '}
            <span className="font-semibold text-slate-700">
              {headers.length}
            </span>{' '}
            columns
          </p>
        </div>

        <div className="px-6 py-4 space-y-3.5 flex-1">
          <p className="text-xs text-slate-500 leading-relaxed">
            Map each required field to the matching column from your CSV.
          </p>

          {REQUIRED_FIELDS.map((field) => {
            const mapped = !!mapping[field.id];
            return (
              <div key={field.id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">
                    {field.label}
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  {mapped && (
                    <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  )}
                </div>
                <SelectField
                  value={mapping[field.id] ?? ''}
                  onChange={(value) =>
                    onMappingChange({
                      ...mapping,
                      [field.id]: value,
                    })
                  }
                  options={[
                    { value: '', label: 'Select column...' },
                    ...headers.map((h) => ({ value: h, label: h })),
                  ]}
                  placeholder="Select column..."
                />
              </div>
            );
          })}
        </div>

        {unmappedRequired.length > 0 && (
          <div className="mx-6 mb-4 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
            <p className="text-xs text-amber-800 font-medium">
              Missing:{' '}
              <span className="text-amber-900">
                {unmappedRequired.map((f) => f.label).join(', ')}
              </span>
            </p>
          </div>
        )}
      </Card>
      {/* CSV data preview */}
      <Card className="md:col-span-2 h-full">
        <div className="px-6 py-4 border-b border-slate-100 bg-linear-to-r from-slate-50 to-white shrink-0">
          <p className="text-sm font-semibold text-slate-900">CSV Preview</p>
          <p className="text-xs text-slate-500 mt-1.5">
            Showing {Math.min(CSV_PREVIEW_ROWS, rows.length)} of{' '}
            <span className="font-semibold text-slate-700">
              {rows.length.toLocaleString()}
            </span>{' '}
            rows
          </p>
        </div>
        <DataTable
          columns={columns}
          rows={previewData}
          getRowId={(row) => JSON.stringify(row)}
          emptyMessage="No data to display."
        />
      </Card>
    </div>
  );
}

import Button from '@components/ui/Button';
import CheckboxField from '@components/ui/CheckboxField';
import Modal from '@components/ui/Modal';
import { ArrowDownTrayIcon, TableCellsIcon } from '@heroicons/react/20/solid';
import { useExportRecords, useTotalCount } from '@hooks/useTaxRecords';
import { triggerDownload } from '@lib/downloadManager';
import { taxRecordApi } from '@services/taxRecord.api';
import { TaxRecord } from '@shared/taxRecord.contracts';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export type CsvField =
  | 'referenceNumber'
  | 'name'
  | 'cnic'
  | 'phone'
  | 'email'
  | 'password'
  | 'reference'
  | 'status'
  | 'notes'
  | 'createdAt'
  | 'updatedAt';

type CsvFieldOption = {
  id: CsvField;
  label: string;
  header: string;
  defaultChecked: boolean;
  section: string;
};

const CSV_FIELD_OPTIONS: CsvFieldOption[] = [
  {
    id: 'referenceNumber',
    label: 'Reference Number',
    header: 'Reference #',
    defaultChecked: true,
    section: 'Personal Information',
  },
  {
    id: 'name',
    label: 'Full Name',
    header: 'Name',
    defaultChecked: true,
    section: 'Personal Information',
  },
  {
    id: 'cnic',
    label: 'CNIC',
    header: 'CNIC',
    defaultChecked: true,
    section: 'Personal Information',
  },
  {
    id: 'phone',
    label: 'Phone Number',
    header: 'Phone',
    defaultChecked: true,
    section: 'Personal Information',
  },
  {
    id: 'reference',
    label: 'Reference',
    header: 'Reference',
    defaultChecked: true,
    section: 'Personal Information',
  },
  {
    id: 'email',
    label: 'Email Address',
    header: 'Email',
    defaultChecked: true,
    section: 'Account Credentials',
  },
  {
    id: 'password',
    label: 'Password',
    header: 'Password',
    defaultChecked: false,
    section: 'Account Credentials',
  },
  {
    id: 'status',
    label: 'Status',
    header: 'Status',
    defaultChecked: true,
    section: 'Status & Dates',
  },
  {
    id: 'createdAt',
    label: 'Created Date',
    header: 'Created',
    defaultChecked: false,
    section: 'Status & Dates',
  },
  {
    id: 'updatedAt',
    label: 'Last Modified',
    header: 'Last Modified',
    defaultChecked: false,
    section: 'Status & Dates',
  },
  {
    id: 'notes',
    label: 'Notes',
    header: 'Notes',
    defaultChecked: true,
    section: 'Additional Notes',
  },
];

const SECTIONS = CSV_FIELD_OPTIONS.reduce<Record<string, CsvFieldOption[]>>(
  (acc, field) => {
    if (!acc[field.section]) acc[field.section] = [];
    acc[field.section].push(field);
    return acc;
  },
  {},
);

const DEFAULT_FIELDS = new Set<CsvField>(
  CSV_FIELD_OPTIONS.filter((f) => f.defaultChecked).map((f) => f.id),
);

function escape(v: unknown) {
  return `"${String(v ?? '').replace(/"/g, '""')}"`;
}

function buildCSV(records: TaxRecord[], selected: Set<CsvField>): string {
  const fields = CSV_FIELD_OPTIONS.filter((f) => selected.has(f.id));
  const headers = fields.map((f) => f.header);
  const csvRows = records.map((r) =>
    fields
      .map((f) => {
        switch (f.id) {
          case 'referenceNumber':
            return escape(r.referenceNumber);
          case 'name':
            return escape(r.name);
          case 'cnic':
            return escape(r.cnic);
          case 'phone':
            return escape(r.phone);
          case 'email':
            return escape(r.email);
          case 'password':
            return escape(r.password);
          case 'reference':
            return escape(r.reference.replace(/-/g, ' '));
          case 'status':
            return escape(r.status);
          case 'notes':
            return escape(r.notes);
          case 'createdAt':
            return escape(new Date(r.createdAt).toLocaleDateString());
          case 'updatedAt':
            return escape(new Date(r.updatedAt).toLocaleDateString());
          default:
            return '';
        }
      })
      .join(','),
  );
  return [headers.join(','), ...csvRows].join('\n');
}

type Props = {
  isOpen: boolean;
  ids: number[];
  onClose: () => void;
};

export default function CsvExportModal({ isOpen, ids, onClose }: Props) {
  const queryClient = useQueryClient();
  const { data: totalCount } = useTotalCount();

  const [selected, setSelected] = useState<Set<CsvField>>(
    new Set(DEFAULT_FIELDS),
  );
  const [scope, setScope] = useState<'all' | 'selected'>('selected');
  const [step, setStep] = useState<'configure' | 'confirm'>('configure');

  const effectiveScope = ids.length > 0 ? scope : 'all';

  const toggle = (field: CsvField) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(field)) next.delete(field);
      else next.add(field);
      return next;
    });
  };

  const handleClose = () => {
    setSelected(new Set(DEFAULT_FIELDS));
    setScope('selected');
    setStep('configure');
    onClose();
  };

  const { exportRecords, isExporting } = useExportRecords();

  const handleConfirmExport = () => {
    exportRecords(effectiveScope === 'selected' ? ids : [], {
      onSuccess: async (records) => {
        triggerDownload(
          'tax-records.csv',
          buildCSV(records, selected),
          'text/csv',
        );

        try {
          await taxRecordApi.logCsvExport(records, {
            scope: effectiveScope,
            selectedCount: selected.size,
            totalFields: CSV_FIELD_OPTIONS.length,
            selectedFields: CSV_FIELD_OPTIONS.filter((f) =>
              selected.has(f.id),
            ).map((f) => f.id),
          });
          await queryClient.invalidateQueries({
            queryKey: ['auditLog', 'tax-record'],
          });
        } catch {
          // Keep export non-blocking if audit logging fails.
        }

        toast.success(
          `${records.length} record${records.length !== 1 ? 's' : ''} exported`,
        );
        handleClose();
      },
      onError: () => {
        toast.error('Failed to export records');
      },
    });
  };

  const scopeLabel =
    effectiveScope === 'selected'
      ? `${ids.length} selected record${ids.length !== 1 ? 's' : ''}`
      : totalCount !== undefined
        ? `All ${totalCount} record${totalCount !== 1 ? 's' : ''}`
        : 'All records';

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Export as CSV"
      size="md"
      hideHeader
      bodyClassName="p-0"
    >
      {/* Header */}
      <div className="bg-blue-600 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 shrink-0">
            <TableCellsIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-base font-semibold text-white leading-tight">
              Export as CSV
            </p>
            <p className="text-sm text-blue-200 mt-0.5">
              {step === 'configure'
                ? 'Choose scope and fields to include'
                : 'Review before downloading'}
            </p>
          </div>
        </div>
      </div>

      {step === 'configure' ? (
        <>
          {/* Scope selector — only when there's a selection */}
          {ids.length > 0 && (
            <div className="px-6 pt-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                What to export
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setScope('selected')}
                  className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium text-left transition-colors ${
                    scope === 'selected'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="block font-semibold">Selected records</span>
                  <span className="block text-xs mt-0.5 font-normal opacity-75">
                    {ids.length} record{ids.length !== 1 ? 's' : ''} chosen
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setScope('all')}
                  className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium text-left transition-colors ${
                    scope === 'all'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="block font-semibold">All records</span>
                  <span className="block text-xs mt-0.5 font-normal opacity-75">
                    {totalCount !== undefined
                      ? `${totalCount} total`
                      : 'Every record'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Field selection */}
          <div className="px-3 pt-4 pb-2">
            <div className="flex items-center justify-between mb-3 px-3">
              <span className="text-xs text-slate-500">
                <span className="font-semibold text-slate-700">
                  {selected.size}
                </span>{' '}
                of {CSV_FIELD_OPTIONS.length} fields selected
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setSelected(new Set(CSV_FIELD_OPTIONS.map((f) => f.id)))
                  }
                  className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Select all
                </button>
                <span className="text-slate-300 text-xs">|</span>
                <button
                  type="button"
                  onClick={() => setSelected(new Set())}
                  className="text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="space-y-4 max-h-64 overflow-y-auto pr-1 -mr-1">
              {Object.entries(SECTIONS).map(([section, fields]) => (
                <div key={section}>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-3">
                    {section}
                  </p>
                  <div className="space-y-1.5 pl-3.5">
                    {fields.map((field) => (
                      <CheckboxField
                        key={field.id}
                        id={`csv-${field.id}`}
                        label={field.label}
                        checked={selected.has(field.id)}
                        onChange={() => toggle(field.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="px-6 py-4 flex gap-3 justify-end border-t border-slate-100 mt-3">
            <Button
              variant="secondary"
              type="button"
              size="sm"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => setStep('confirm')}
              disabled={selected.size === 0}
              icon={ArrowDownTrayIcon}
            >
              Export{' '}
              {effectiveScope === 'selected'
                ? `${ids.length} Selected`
                : 'All Records'}
            </Button>
          </div>
        </>
      ) : (
        <>
          {/* Confirmation step */}
          <div className="px-6 py-5 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 divide-y divide-slate-200">
              <div className="px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-slate-500">Records</span>
                <span className="text-sm font-semibold text-slate-800">
                  {scopeLabel}
                </span>
              </div>
              <div className="px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-slate-500">Fields</span>
                <span className="text-sm font-semibold text-slate-800">
                  {selected.size} of {CSV_FIELD_OPTIONS.length}
                </span>
              </div>
              <div className="px-4 py-3">
                <p className="text-xs text-slate-400 mb-1.5">Included fields</p>
                <div className="flex flex-wrap gap-1.5">
                  {CSV_FIELD_OPTIONS.filter((f) => selected.has(f.id)).map(
                    (f) => (
                      <span
                        key={f.id}
                        className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20"
                      >
                        {f.label}
                      </span>
                    ),
                  )}
                </div>
              </div>
            </div>

            {selected.has('password') && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                Password field is included — make sure you handle this file
                securely.
              </p>
            )}
          </div>

          <div className="px-6 py-4 flex gap-3 justify-between border-t border-slate-100">
            <Button
              variant="secondary"
              type="button"
              size="sm"
              onClick={() => setStep('configure')}
              disabled={isExporting}
            >
              Back
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmExport}
              busy={isExporting}
              icon={ArrowDownTrayIcon}
            >
              Confirm &amp; Download
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}

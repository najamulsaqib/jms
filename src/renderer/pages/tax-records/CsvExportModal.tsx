import Button from '@components/ui/Button';
import CheckboxField from '@components/ui/CheckboxField';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { ArrowDownTrayIcon, TableCellsIcon } from '@heroicons/react/20/solid';
import { TaxRecord } from '@shared/taxRecord.contracts';
import { useState } from 'react';

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

function downloadCSV(records: TaxRecord[], selected: Set<CsvField>) {
  const fields = CSV_FIELD_OPTIONS.filter((f) => selected.has(f.id));
  const headers = fields.map((f) => f.header);

  const csvRows = records.map((r) => {
    return fields
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
      .join(',');
  });

  const csv = [headers.join(','), ...csvRows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'tax-records.csv';
  a.click();
  URL.revokeObjectURL(url);
}

type Props = {
  isOpen: boolean;
  records: TaxRecord[];
  onClose: () => void;
};

export default function CsvExportModal({ isOpen, records, onClose }: Props) {
  const [selected, setSelected] = useState<Set<CsvField>>(
    new Set(DEFAULT_FIELDS),
  );

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
    onClose();
  };

  const handleExport = () => {
    downloadCSV(records, selected);
    handleClose();
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="mx-auto w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 shrink-0">
                <TableCellsIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold text-white leading-tight">
                  Export as CSV
                </DialogTitle>
                <p className="text-sm text-blue-200 mt-0.5">
                  Choose which fields to include
                </p>
              </div>
            </div>

            {/* Record count badge */}
            <div className="mt-4 rounded-lg bg-white/15 px-3 py-2">
              <p className="text-xs text-blue-200 leading-none mb-1">
                Exporting
              </p>
              <p className="text-sm font-semibold text-white leading-tight">
                {records.length} record{records.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Field selection */}
          <div className="px-3 pt-4 pb-2">
            {/* Select all / clear */}
            <div className="flex items-center justify-between mb-3">
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

            {/* Sections */}
            <div className="space-y-4 max-h-64 overflow-y-auto pr-1 -mr-1">
              {Object.entries(SECTIONS).map(([section, fields]) => (
                <div key={section}>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    {section}
                  </p>
                  <div className="space-y-1.5 pl-0.5">
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

          {/* Actions */}
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
              onClick={handleExport}
              disabled={selected.size === 0}
              icon={ArrowDownTrayIcon}
            >
              Download CSV
            </Button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

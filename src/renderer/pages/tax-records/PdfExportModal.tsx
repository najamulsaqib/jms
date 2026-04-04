import Button from '@components/ui/Button';
import CheckboxField from '@components/ui/CheckboxField';
import { useAuth } from '@contexts/AuthContext';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { ArrowDownTrayIcon, DocumentTextIcon } from '@heroicons/react/20/solid';
import { TaxRecord } from '@shared/taxRecord.contracts';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  PDF_FIELD_OPTIONS,
  type PdfField,
  type PdfCompanyInfo,
  generateTaxRecordPdf,
} from './taxRecordPdf';

type PdfExportModalProps = {
  isOpen: boolean;
  record: TaxRecord;
  onClose: () => void;
};

const DEFAULT_FIELDS = new Set(
  PDF_FIELD_OPTIONS.filter((f) => f.defaultChecked).map((f) => f.id),
);

// Group options by section, preserving insertion order
const SECTIONS = PDF_FIELD_OPTIONS.reduce<
  Record<string, typeof PDF_FIELD_OPTIONS>
>((acc, field) => {
  if (!acc[field.section]) acc[field.section] = [];
  acc[field.section].push(field);
  return acc;
}, {});

export default function PdfExportModal({
  isOpen,
  record,
  onClose,
}: PdfExportModalProps) {
  const { user } = useAuth();
  const [selected, setSelected] = useState<Set<PdfField>>(
    new Set(DEFAULT_FIELDS),
  );

  const toggle = (field: PdfField) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(field)) next.delete(field);
      else next.add(field);
      return next;
    });
  };

  const handleExport = () => {
    if (selected.size === 0) {
      toast.error('Select at least one field to export');
      return;
    }

    const metadata = user?.user_metadata;
    const companyInfoOverrides: Partial<PdfCompanyInfo> = {
      name:
        (metadata?.company_name as string | undefined) ||
        (metadata?.full_name as string | undefined),
      tagline: metadata?.description as string | undefined,
      address: metadata?.address as string | undefined,
      phone: metadata?.phone_number as string | undefined,
      contactName:
        (metadata?.full_name as string | undefined) ||
        (metadata?.company_name as string | undefined),
    };

    generateTaxRecordPdf(record, selected, companyInfoOverrides);
    toast.success('PDF downloaded');
    onClose();
  };

  const handleClose = () => {
    setSelected(new Set(DEFAULT_FIELDS));
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />

      {/* Panel */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="mx-auto w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 shrink-0">
                <DocumentTextIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold text-white leading-tight">
                  Export as PDF
                </DialogTitle>
                <p className="text-sm text-blue-200 mt-0.5">
                  Choose which fields to include
                </p>
              </div>
            </div>

            {/* Record name badge */}
            <div className="mt-4 rounded-lg bg-white/15 px-3 py-2">
              <p className="text-xs text-blue-200 leading-none mb-1">Record</p>
              <p className="text-sm font-semibold text-white leading-tight truncate">
                {record.name}
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
                of {PDF_FIELD_OPTIONS.length} fields selected
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setSelected(new Set(PDF_FIELD_OPTIONS.map((f) => f.id)))
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
                        id={`pdf-${field.id}`}
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
              Download PDF
            </Button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

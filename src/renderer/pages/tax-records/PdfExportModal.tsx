import Button from '@components/ui/Button';
import CheckboxField from '@components/ui/CheckboxField';
import Modal from '@components/ui/Modal';
import { useAuth } from '@contexts/AuthContext';
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
  onExported?: (details: {
    selectedFields: string[];
    selectedCount: number;
    totalFields: number;
  }) => Promise<void> | void;
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
  onExported,
}: PdfExportModalProps) {
  const { userInfo } = useAuth();
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

  const handleExport = async () => {
    if (selected.size === 0) {
      toast.error('Select at least one field to export');
      return;
    }

    const companyInfoOverrides: Partial<PdfCompanyInfo> = {
      name: userInfo?.companyName || userInfo?.fullName,
      tagline: userInfo?.description,
      address: userInfo?.address,
      phone: userInfo?.phoneNumber,
      contactName: userInfo?.fullName || userInfo?.companyName,
    };

    generateTaxRecordPdf(record, selected, companyInfoOverrides);
    await onExported?.({
      selectedFields: Array.from(selected),
      selectedCount: selected.size,
      totalFields: PDF_FIELD_OPTIONS.length,
    });
    toast.success('PDF downloaded');
    onClose();
  };

  const handleClose = () => {
    setSelected(new Set(DEFAULT_FIELDS));
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 shrink-0">
            <DocumentTextIcon className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-base font-semibold text-slate-900 leading-tight">
              Export as PDF
            </p>
            <p className="text-sm text-slate-500 mt-0.5">
              Choose which fields to include
            </p>
          </div>
        </div>
      }
      size="md"
      footer={
        <div className="flex gap-3 justify-end">
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
      }
      bodyClassName="px-3 pt-4 pb-2"
    >
      <div className="rounded-lg bg-slate-50 px-3 py-2 mb-4 border border-slate-200">
        <p className="text-xs text-slate-500 leading-none mb-1">Record</p>
        <p className="text-sm font-semibold text-slate-800 leading-tight truncate">
          {record.name}
        </p>
      </div>

      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-slate-500">
          <span className="font-semibold text-slate-700">{selected.size}</span>{' '}
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
    </Modal>
  );
}

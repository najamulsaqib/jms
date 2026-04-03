import { useState, useRef } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { ArrowUpTrayIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/20/solid';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import Button from '@components/ui/Button';
import { taxRecordApi } from '@services/taxRecord.api';
import { CreateTaxRecordInput, TaxRecordStatus } from '@shared/taxRecord.contracts';
import { toKebabCase } from './taxRecordForm.helpers';

type Step = 'upload' | 'map' | 'results';

type ImportError = { row: number; label: string; reason: string };
type ImportResult = { added: number; errors: ImportError[] };

const SYSTEM_FIELDS: { id: keyof CreateTaxRecordInput; label: string; required: boolean }[] = [
  { id: 'referenceNumber', label: 'Reference Number', required: true },
  { id: 'name',            label: 'Full Name',        required: true },
  { id: 'cnic',            label: 'CNIC',             required: true },
  { id: 'email',           label: 'Email Address',    required: true },
  { id: 'password',        label: 'Password',         required: true },
  { id: 'reference',       label: 'Reference',        required: false },
  { id: 'status',          label: 'Status',           required: false },
  { id: 'notes',           label: 'Notes',            required: false },
];

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  // Parse character-by-character so newlines inside quoted fields are preserved
  // as part of the field value rather than treated as row separators.
  const allRows: string[][] = [];
  let currentRow: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch   = text[i];
    const next = text[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') { current += '"'; i++; } // escaped quote
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) {
      currentRow.push(current.trim());
      current = '';
    } else if ((ch === '\r' || ch === '\n') && !inQuotes) {
      if (ch === '\r' && next === '\n') i++; // skip \n in \r\n
      currentRow.push(current.trim());
      current = '';
      if (currentRow.length > 0 && currentRow.some((c) => c !== '')) {
        allRows.push(currentRow);
      }
      currentRow = [];
    } else {
      current += ch; // newlines inside quotes land here and are kept
    }
  }

  // Flush the last field/row
  if (current.trim() !== '' || currentRow.length > 0) {
    currentRow.push(current.trim());
    if (currentRow.some((c) => c !== '')) allRows.push(currentRow);
  }

  if (allRows.length === 0) return { headers: [], rows: [] };
  return { headers: allRows[0], rows: allRows.slice(1) };
}

function normalizeStatus(val: string): TaxRecordStatus {
  const v = val.toLowerCase().trim().replace(/[\s_]/g, '-');
  if (v === 'inactive') return 'inactive';
  if (v === 'late-filer' || v === 'latefiler') return 'late-filer';
  return 'active';
}

function autoDetectMapping(headers: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  const normalize = (s: string) => s.toLowerCase().replace(/[\s_-]/g, '');
  const aliases: Record<string, string[]> = {
    referenceNumber: ['referencenumber', 'refnumber', 'ref#', 'ref', 'referenceno', 'refno'],
    name:            ['name', 'fullname', 'clientname'],
    cnic:            ['cnic', 'nic', 'nationalid', 'idcard'],
    email:           ['email', 'emailaddress', 'mail'],
    password:        ['password', 'pass', 'pwd'],
    reference:       ['reference', 'referredby', 'referrer'],
    status:          ['status', 'filingstatus'],
    notes:           ['notes', 'note', 'remarks', 'comment', 'comments'],
  };
  for (const field of SYSTEM_FIELDS) {
    const match = headers.find((h) =>
      (aliases[field.id] ?? [field.id]).includes(normalize(h)),
    );
    if (match) result[field.id] = match;
  }
  return result;
}

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onImported: () => void;
};

export default function CsvImportModal({ isOpen, onClose, onImported }: Props) {
  const [step, setStep]           = useState<Step>('upload');
  const [headers, setHeaders]     = useState<string[]>([]);
  const [rows, setRows]           = useState<string[][]>([]);
  const [fileName, setFileName]   = useState('');
  const [fileError, setFileError] = useState('');
  const [mapping, setMapping]     = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [result, setResult]       = useState<ImportResult | null>(null);
  const fileInputRef              = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setFileError('');
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setFileError('Only .csv files are supported.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { headers: h, rows: r } = parseCSV(text);
      if (h.length === 0) { setFileError('The CSV file appears to be empty.'); return; }
      setHeaders(h);
      setRows(r);
      setFileName(file.name);
      setMapping(autoDetectMapping(h));
      setStep('map');
    };
    reader.readAsText(file);
  };

  const getCell = (row: string[], fieldId: string) => {
    const col = mapping[fieldId];
    if (!col) return '';
    const idx = headers.indexOf(col);
    return idx >= 0 ? (row[idx] ?? '').trim() : '';
  };

  const handleImport = async () => {
    setImporting(true);
    let added = 0;
    const errors: ImportError[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // +1 header, +1 for 1-indexing

      try {
        const referenceNumber = getCell(row, 'referenceNumber');
        const name            = getCell(row, 'name');
        const cnic            = getCell(row, 'cnic');
        const email           = getCell(row, 'email');
        const password        = getCell(row, 'password');
        const rawReference    = getCell(row, 'reference');
        const rawStatus       = getCell(row, 'status');
        const notes           = getCell(row, 'notes');

        // Validate required fields
        const missing: string[] = [];
        if (!referenceNumber) missing.push('Reference Number');
        if (!name)            missing.push('Name');
        if (!cnic)            missing.push('CNIC');
        if (!email)           missing.push('Email');
        if (!password)        missing.push('Password');

        if (missing.length > 0) {
          errors.push({ row: rowNum, label: name || `Row ${rowNum}`, reason: `Missing: ${missing.join(', ')}` });
          continue;
        }

        const payload: CreateTaxRecordInput = {
          referenceNumber,
          name,
          cnic: cnic.replace(/\D/g, ''),
          email,
          password,
          reference: rawReference ? toKebabCase(rawReference) : 'self',
          status: normalizeStatus(rawStatus),
          notes,
        };

        await taxRecordApi.create(payload);
        added++;
      } catch (err: unknown) {
        const raw    = err instanceof Error ? err.message : String(err);
        const reason = raw.replace(/^Error invoking remote method '[^']+': (Error: )?/, '');
        const label  = getCell(row, 'name') || `Row ${rowNum}`;
        errors.push({ row: rowNum, label, reason });
      }
    }

    setResult({ added, errors });
    setImporting(false);
    setStep('results');
    if (added > 0) onImported();
  };

  const handleClose = () => {
    setStep('upload');
    setHeaders([]);
    setRows([]);
    setFileName('');
    setFileError('');
    setMapping({});
    setResult(null);
    onClose();
  };

  const unmappedRequired = SYSTEM_FIELDS.filter((f) => f.required && !mapping[f.id]);

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="mx-auto w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 shrink-0">
                <ArrowUpTrayIcon className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-base font-semibold text-white leading-tight">
                  Import CSV
                </DialogTitle>
                <p className="text-sm text-blue-200 mt-0.5 truncate">
                  {step === 'upload'  && 'Upload a CSV file to bulk-import records'}
                  {step === 'map'     && `Map columns from "${fileName}" to record fields`}
                  {step === 'results' && 'Import complete — review the results below'}
                </p>
              </div>
              {/* Step dots */}
              <div className="flex items-center gap-1.5 ml-2 shrink-0">
                {(['upload', 'map', 'results'] as Step[]).map((s) => (
                  <div key={s} className={`h-2 w-2 rounded-full transition-colors ${step === s ? 'bg-white' : 'bg-white/30'}`} />
                ))}
              </div>
            </div>
          </div>

          {/* ── Step 1: Upload ── */}
          {step === 'upload' && (
            <div className="p-6">
              <div
                className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) handleFile(file);
                }}
              >
                <DocumentTextIcon className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-700">
                  Drop your CSV file here, or <span className="text-blue-600">click to browse</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">Only .csv files supported</p>
              </div>
              {fileError && (
                <p className="mt-3 text-sm text-red-600">{fileError}</p>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
              <div className="flex justify-end mt-4">
                <Button variant="secondary" size="sm" type="button" onClick={handleClose}>Cancel</Button>
              </div>
            </div>
          )}

          {/* ── Step 2: Map Fields ── */}
          {step === 'map' && (
            <div className="p-6">
              <p className="text-sm text-slate-500 mb-1">
                <span className="font-semibold text-slate-700">{rows.length}</span> data rows detected in{' '}
                <span className="font-medium text-slate-700">{fileName}</span>.
              </p>
              <p className="text-xs text-slate-400 mb-4">
                Fields marked <span className="text-red-500 font-medium">*</span> are required — rows missing them will be skipped.
              </p>

              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 -mr-1">
                {SYSTEM_FIELDS.map((field) => (
                  <div key={field.id} className="flex items-center gap-3">
                    <div className="w-44 shrink-0 flex items-center gap-1">
                      <span className="text-sm font-medium text-slate-700">{field.label}</span>
                      {field.required && <span className="text-red-500 text-xs leading-none">*</span>}
                    </div>
                    <select
                      value={mapping[field.id] ?? ''}
                      onChange={(e) => setMapping((prev) => ({ ...prev, [field.id]: e.target.value }))}
                      className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="">— not mapped —</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                    {mapping[field.id] ? (
                      <CheckCircleIcon className="h-4 w-4 text-green-500 shrink-0" />
                    ) : (
                      <div className="h-4 w-4 shrink-0" />
                    )}
                  </div>
                ))}
              </div>

              {unmappedRequired.length > 0 && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-4">
                  Still required: <span className="font-medium">{unmappedRequired.map((f) => f.label).join(', ')}</span>
                </p>
              )}

              <div className="flex justify-between items-center mt-5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  className="text-sm text-slate-500 hover:text-slate-700"
                  onClick={() => setStep('upload')}
                >
                  ← Change file
                </button>
                <Button
                  size="sm"
                  type="button"
                  onClick={handleImport}
                  busy={importing}
                  disabled={unmappedRequired.length > 0}
                >
                  Import {rows.length} Record{rows.length !== 1 ? 's' : ''}
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 3: Results ── */}
          {step === 'results' && result && (
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                  <CheckCircleIcon className="h-9 w-9 text-green-500 shrink-0" />
                  <div>
                    <p className="text-3xl font-bold text-green-700">{result.added}</p>
                    <p className="text-sm text-green-600">Records added</p>
                  </div>
                </div>
                <div className={`border rounded-xl p-4 flex items-center gap-3 ${result.errors.length > 0 ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                  <XCircleIcon className={`h-9 w-9 shrink-0 ${result.errors.length > 0 ? 'text-red-400' : 'text-slate-300'}`} />
                  <div>
                    <p className={`text-3xl font-bold ${result.errors.length > 0 ? 'text-red-700' : 'text-slate-400'}`}>{result.errors.length}</p>
                    <p className={`text-sm ${result.errors.length > 0 ? 'text-red-600' : 'text-slate-400'}`}>Skipped / errored</p>
                  </div>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="rounded-lg border border-red-100 overflow-hidden">
                  <div className="bg-red-50 px-3 py-2 border-b border-red-100">
                    <p className="text-xs font-semibold text-red-700 uppercase tracking-wider">Skipped rows</p>
                  </div>
                  <div className="max-h-52 overflow-y-auto divide-y divide-red-50">
                    {result.errors.map((e, i) => (
                      <div key={i} className="px-3 py-2.5 flex items-start gap-3 bg-white">
                        <span className="text-xs font-mono bg-red-100 text-red-600 rounded px-1.5 py-0.5 shrink-0 mt-0.5">
                          Row {e.row}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{e.label}</p>
                          <p className="text-xs text-red-500 mt-0.5">{e.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.errors.length === 0 && (
                <p className="text-sm text-green-600 text-center py-2">All rows imported successfully!</p>
              )}

              <div className="flex justify-end mt-5 pt-4 border-t border-slate-100">
                <Button size="sm" type="button" onClick={handleClose}>Done</Button>
              </div>
            </div>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
}

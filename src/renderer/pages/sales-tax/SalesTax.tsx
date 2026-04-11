import AppLayout from '@components/layout/AppLayout';
import Button from '@components/ui/Button';
import { useAuth } from '@contexts/AuthContext';
import { CheckCircleIcon } from '@heroicons/react/20/solid';
import { ArrowDownTrayIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { toast } from 'sonner';
import { autoDetectMapping, cleanNumber, parseCSV } from './csvUtils';
import MapStep from './MapStep';
import ResultsStep from './ResultsStep';
import { generateSalesTaxPdf } from './salesTaxPdf';
import { type Step, type SummaryRow, type ValidationIssue } from './types';
import UploadStep from './UploadStep';

// ── Main Page ───────────────────────────────────────────────────────────────

export default function SalesTaxPage() {
  const { userInfo } = useAuth();
  const [step, setStep] = useState<Step>('upload');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [fileName, setFileName] = useState('');
  const [fileError, setFileError] = useState('');
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [summary, setSummary] = useState<SummaryRow[]>([]);
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [revenuePercentage, setRevenuePercentage] = useState(1.5);

  // ── Handlers ──

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
      if (h.length === 0) {
        setFileError('The CSV file appears to be empty or has no headers.');
        return;
      }
      setHeaders(h);
      setRows(r);
      setFileName(file.name);
      setMapping(autoDetectMapping(h));
      setStep('map');
    };
    reader.readAsText(file, 'latin1');
  };

  const getCell = (row: string[], fieldId: string) => {
    const col = mapping[fieldId];
    if (!col) return '';
    const idx = headers.indexOf(col);
    return idx >= 0 ? (row[idx] ?? '').trim() : '';
  };

  const handleCalculate = () => {
    const accumulator = new Map<
      string,
      { quantity: number; value: number; salesTax: number; count: number }
    >();
    const newIssues: ValidationIssue[] = [];

    rows.forEach((row, i) => {
      const rowNum = i + 1;
      const hsCode = getCell(row, 'hsCode').replace(/[="]/g, '').trim();
      const rawQty = getCell(row, 'quantity');
      const rawValue = getCell(row, 'value');
      const rawTax = getCell(row, 'salesTax');

      if (!hsCode) {
        newIssues.push({
          row: rowNum,
          reason: 'Missing HS Code — row skipped',
        });
        return;
      }

      const quantity = cleanNumber(rawQty);
      const value = cleanNumber(rawValue);
      const salesTax = cleanNumber(rawTax);

      const existing = accumulator.get(hsCode);
      if (existing) {
        existing.quantity += quantity;
        existing.value += value;
        existing.salesTax += salesTax;
        existing.count += 1;
      } else {
        accumulator.set(hsCode, { quantity, value, salesTax, count: 1 });
      }
    });

    const result: SummaryRow[] = Array.from(accumulator.entries())
      .map(([hsCode, data]) => ({
        hsCode,
        invoiceCount: data.count,
        quantity: data.quantity,
        value: data.value,
        saleRevenue: data.value * (1 + revenuePercentage / 100),
        salesTax: data.salesTax,
      }))
      .sort((a, b) => a.hsCode.localeCompare(b.hsCode));

    setSummary(result);
    setIssues(newIssues);
    setStep('results');
  };

  const handleReset = () => {
    setStep('upload');
    setHeaders([]);
    setRows([]);
    setFileName('');
    setFileError('');
    setMapping({});
    setSummary([]);
    setIssues([]);
  };

  const handlePercentageChange = (newPercentage: number) => {
    setRevenuePercentage(newPercentage);
    // Recalculate summary with new percentage
    const updated = summary.map((row) => ({
      ...row,
      saleRevenue: row.value * (1 + newPercentage / 100),
    }));
    setSummary(updated);
  };

  // ── Step indicator ──

  const steps: { id: Step; label: string }[] = [
    { id: 'upload', label: 'Upload' },
    { id: 'map', label: 'Map Columns' },
    { id: 'results', label: 'Results' },
  ];
  const stepIndex = steps.findIndex((s) => s.id === step);

  return (
    <AppLayout
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Sales Tax' }]}
    >
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Sales Tax Analysis
        </h1>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-8">
        {steps.map((s, idx) => {
          const done = idx < stepIndex;
          const active = idx === stepIndex;
          return (
            <div key={s.id} className="flex items-center">
              <div className="flex items-center gap-2">
                <div
                  className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                    ${done ? 'bg-blue-600 text-white' : active ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}
                >
                  {done ? <CheckCircleIcon className="h-4 w-4" /> : idx + 1}
                </div>
                <span
                  className={`text-sm font-medium ${active ? 'text-slate-900' : done ? 'text-blue-600' : 'text-slate-400'}`}
                >
                  {s.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`h-px w-10 mx-3 ${idx < stepIndex ? 'bg-blue-400' : 'bg-slate-200'}`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Actions bar — shown on all steps except upload */}
      {step !== 'upload' && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="text-sm text-slate-500 hover:text-slate-700 transition-colors flex items-center gap-1"
              onClick={handleReset}
            >
              <ArrowPathIcon className="h-3.5 w-3.5" />
              Change file
            </button>
            {step === 'results' && (
              <>
                <span className="text-slate-300 text-xs">|</span>
                <button
                  type="button"
                  className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
                  onClick={() => setStep('map')}
                >
                  ← Remap columns
                </button>
              </>
            )}
            <span className="text-slate-300 text-xs">|</span>
            <p className="text-sm text-slate-500">
              <span className="font-semibold text-slate-800">
                {rows.length.toLocaleString()}
              </span>{' '}
              rows in{' '}
              <span className="font-semibold text-slate-800">{fileName}</span>
            </p>
          </div>
          {step === 'results' && (
            <Button
              size="sm"
              icon={ArrowDownTrayIcon}
              onClick={() => {
                try {
                  generateSalesTaxPdf(
                    summary,
                    revenuePercentage,
                    userInfo
                      ? {
                          name: userInfo.companyName || userInfo.fullName,
                          phone: userInfo.phoneNumber,
                          address: userInfo.address,
                          contactName: userInfo.fullName,
                          tagline: userInfo.description,
                        }
                      : undefined,
                  );
                  toast.success('PDF downloaded successfully');
                } catch {
                  toast.error('Failed to download PDF');
                }
              }}
            >
              Download PDF
            </Button>
          )}
          {step === 'map' && (
            <Button size="sm" icon={ArrowPathIcon} onClick={handleCalculate}>
              Calculate
            </Button>
          )}
        </div>
      )}

      {/* Step content */}
      {step === 'upload' && (
        <UploadStep onFile={handleFile} fileError={fileError} />
      )}

      {step === 'map' && (
        <MapStep
          headers={headers}
          rows={rows}
          mapping={mapping}
          onMappingChange={setMapping}
        />
      )}

      {step === 'results' && (
        <ResultsStep
          summary={summary}
          issues={issues}
          revenuePercentage={revenuePercentage}
          onPercentageChange={handlePercentageChange}
        />
      )}
    </AppLayout>
  );
}

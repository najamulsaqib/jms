import LoadingSpinner from '@components/common/LoadingSpinner';
import AppLayout from '@components/layout/AppLayout';
import Button from '@components/ui/Button';
import Card from '@components/ui/Card';
import { Chip } from '@components/ui/Chip';
import ConfirmDialog from '@components/ui/ConfirmDialog';
import SelectField from '@components/ui/SelectField';
import TextField from '@components/ui/TextField';
import {
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  CheckIcon,
  ClipboardDocumentIcon,
  ClipboardIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  EyeIcon,
  EyeSlashIcon,
  IdentificationIcon,
  KeyIcon,
  LinkIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
} from '@heroicons/react/20/solid';
import { useTaxRecord } from '@hooks/useTaxRecords';
import { taxRecordApi } from '@services/taxRecord.api';
import { TaxRecord } from '@shared/taxRecord.contracts';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import PdfExportModal from './PdfExportModal';
import {
  buildReferenceOptions,
  createHandleChange,
  CUSTOM_REFERENCE_VALUE,
  EMPTY_FORM_VALUES,
  type FieldErrors,
  type FormValues,
} from './taxRecordForm.helpers';

function recordToFormValues(
  record: TaxRecord,
  referenceValues: string[],
): FormValues {
  return {
    referenceNumber: record.referenceNumber,
    name: record.name,
    cnic: record.cnic,
    email: record.email,
    password: record.password,
    selectedReference: referenceValues.includes(record.reference)
      ? record.reference
      : CUSTOM_REFERENCE_VALUE,
    customReference: referenceValues.includes(record.reference)
      ? ''
      : record.reference,
    status: record.status,
    notes: record.notes,
  };
}

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'late-filer', label: 'Late Filer' },
];

export default function TaxRecordDetailPage() {
  const { taxRecordId } = useParams<{ taxRecordId: string }>();
  const navigate = useNavigate();

  const parsedId = useMemo(() => {
    if (!taxRecordId) return null;
    const id = Number(taxRecordId);
    return Number.isNaN(id) ? null : id;
  }, [taxRecordId]);

  const {
    record,
    loading,
    error: queryError,
    updateTaxRecord,
    deleteTaxRecord,
    saving,
    deleting,
  } = useTaxRecord(parsedId);

  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);

  const [formValues, setFormValues] = useState<FormValues>(EMPTY_FORM_VALUES);
  const [initialFormValues, setInitialFormValues] =
    useState<FormValues>(EMPTY_FORM_VALUES);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [referenceOptions, setReferenceOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);

  // Visibility and copy states
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<
    'email' | 'password' | 'cnic' | null
  >(null);

  const enterEditMode = async () => {
    if (!record) return;
    try {
      const allRecords = await taxRecordApi.list();
      // Exclude current record from the reference options
      const otherRecords = allRecords.filter((r) => r.id !== record.id);
      const options = buildReferenceOptions(otherRecords);

      setReferenceOptions(options);
      const referenceValues = options.map((o) => o.value);
      const values = recordToFormValues(record, referenceValues);
      setFormValues(values);
      setInitialFormValues(values);
    } catch {
      // proceed with empty reference options on load failure
    }
    setFieldErrors({});
    setError(null);
    setMode('edit');
  };

  const handleChange = createHandleChange({
    formValues,
    setFormValues,
    setFieldErrors,
  });

  const handleEditCancel = () => {
    const hasChanges =
      JSON.stringify(formValues) !== JSON.stringify(initialFormValues);
    if (hasChanges) {
      setShowUnsavedWarning(true);
    } else {
      setMode('view');
    }
  };

  const handleEditSubmit = async (event: { preventDefault(): void }) => {
    event.preventDefault();
    if (!parsedId) return;

    const nextErrors: FieldErrors = {};
    const reference =
      formValues.selectedReference === CUSTOM_REFERENCE_VALUE
        ? formValues.customReference.trim()
        : formValues.selectedReference.trim();

    if (!formValues.name.trim()) nextErrors.name = 'Name is required.';
    if (!formValues.referenceNumber.trim())
      nextErrors.referenceNumber = 'Reference number is required.';
    if (!/^\d{13}$/.test(formValues.cnic))
      nextErrors.cnic = 'CNIC must be exactly 13 digits.';
    if (!formValues.email.trim()) nextErrors.email = 'Email is required.';
    else if (!/^\S+@\S+\.\S+$/.test(formValues.email.trim()))
      nextErrors.email = 'Email format is invalid.';
    if (!formValues.password.trim())
      nextErrors.password = 'Password is required.';
    if (formValues.selectedReference === CUSTOM_REFERENCE_VALUE) {
      if (!formValues.customReference.trim())
        nextErrors.customReference = 'Reference is required.';
      else if (
        formValues.customReference.trim().toLowerCase() ===
        formValues.name.trim().toLowerCase()
      )
        nextErrors.customReference = 'Reference must be different from Name.';
    } else if (!reference) {
      nextErrors.reference = 'Reference is required.';
    } else if (
      reference.toLowerCase() === formValues.name.trim().toLowerCase()
    ) {
      nextErrors.reference = 'Reference must be different from Name.';
    }
    if (!['active', 'inactive', 'late-filer'].includes(formValues.status))
      nextErrors.status = 'Status is required.';

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    const uniquenessErrors = await taxRecordApi.validateUniqueness(
      {
        referenceNumber: formValues.referenceNumber,
        cnic: formValues.cnic,
        email: formValues.email,
      },
      parsedId,
    );

    if (Object.keys(uniquenessErrors).length > 0) {
      setFieldErrors((current) => ({
        ...current,
        ...uniquenessErrors,
      }));
      setError(null);
      return;
    }

    setError(null);
    setFieldErrors({});

    const { data: updated, error: updateError } = await updateTaxRecord({
      referenceNumber: formValues.referenceNumber,
      name: formValues.name,
      cnic: formValues.cnic,
      email: formValues.email,
      password: formValues.password,
      reference,
      status: formValues.status,
      notes: formValues.notes,
    });

    if (!updated) {
      const mappedErrors: FieldErrors = {};

      if (updateError?.includes('Email already exists')) {
        mappedErrors.email = 'Email already exists.';
      }

      if (updateError?.includes('CNIC already exists')) {
        mappedErrors.cnic = 'CNIC already exists.';
      }

      if (updateError?.includes('Reference number already exists')) {
        mappedErrors.referenceNumber = 'Reference number already exists.';
      }

      if (Object.keys(mappedErrors).length > 0) {
        setFieldErrors((current) => ({
          ...current,
          ...mappedErrors,
        }));
        setError(null);
        return;
      }

      setError(updateError ?? 'Failed to save record.');
      return;
    }

    setInitialFormValues(formValues);
    setMode('view');
    toast.success('Record updated successfully');
  };

  const handleDelete = async () => {
    const deleted = await deleteTaxRecord();
    if (deleted) {
      toast.success('Record deleted successfully');
      navigate('/tax-records', { replace: true });
    } else {
      toast.error('Failed to delete record');
      setPendingDelete(false);
    }
  };

  const handleCopy = async (
    text: string,
    field: 'email' | 'password' | 'cnic',
  ) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      const label =
        field === 'email'
          ? 'Email'
          : field === 'password'
            ? 'Password'
            : 'CNIC';
      toast.success(`${label} copied to clipboard`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy to clipboard');
    }
  };

  const allReferenceOptions = referenceOptions;

  return (
    <AppLayout
      breadcrumbs={[
        { label: 'Dashboard', href: '/' },
        { label: 'Tax Records', href: '/tax-records' },
        { label: record?.name ?? 'Record' },
      ]}
    >
      <div className="max-w-6xl">
        <button
          type="button"
          onClick={() => navigate('/tax-records')}
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 mb-5 transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Tax Records
        </button>

        {loading && (
          <Card>
            <LoadingSpinner className="py-12" size="lg" />
          </Card>
        )}

        {!loading && !record && (
          <Card>
            <p className="text-center text-slate-600 py-12">
              Record not found.
            </p>
          </Card>
        )}

        {!loading && record && (
          <>
            {/* Hero Header */}
            <div className="flex items-center gap-4 bg-white rounded-xl border border-slate-200 px-5 py-4 shadow-sm mb-5">
              <div className="shrink-0 w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-lg font-bold text-blue-600 select-none">
                  {record.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold text-slate-900 truncate">
                    {record.name}
                  </h1>
                  <Chip
                    variant={
                      ({
                        active: 'green',
                        inactive: 'red',
                        'late-filer': 'orange',
                      }[record.status] || 'slate') as any
                    }
                    size="md"
                  >
                    {record.status}
                  </Chip>
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400 flex-wrap">
                  <span>Ref # {record.referenceNumber}</span>
                  <span>·</span>
                  <span>
                    Created{' '}
                    {new Date(record.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <span>·</span>
                  <span>
                    Updated{' '}
                    {new Date(record.updatedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
              {mode === 'view' && (
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    icon={ArrowDownTrayIcon}
                    onClick={() => setShowPdfModal(true)}
                  >
                    Export PDF
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    icon={PencilIcon}
                    onClick={enterEditMode}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    icon={TrashIcon}
                    onClick={() => setPendingDelete(true)}
                  >
                    Delete
                  </Button>
                </div>
              )}
            </div>

            {(error || queryError) && (
              <Card className="mb-5 border-red-200 bg-red-50">
                <p className="text-sm text-red-800">
                  {error ?? queryError ?? 'An error occurred.'}
                </p>
              </Card>
            )}

            {/* VIEW MODE */}
            {mode === 'view' && (
              <div className="space-y-5">
                {/* 2-col grid: Personal Info + Account Credentials */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* Personal Information */}
                  <Card>
                    <div className="flex items-center gap-2 mb-5 pb-4 border-b border-slate-100">
                      <div className="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center shrink-0">
                        <UserIcon className="h-4 w-4 text-blue-600" />
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        Personal Information
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                      <div className="space-y-1">
                        <p className="text-[12px] font-medium text-slate-400 uppercase tracking-wide flex items-center gap-1">
                          <UserIcon className="h-3 w-3" /> Full Name
                        </p>
                        <p className="text-sm font-medium text-slate-900">
                          {record.name}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[12px] font-medium text-slate-400 uppercase tracking-wide flex items-center gap-1">
                          <IdentificationIcon className="h-3 w-3" /> CNIC
                        </p>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-mono text-slate-900 bg-slate-50 px-2 py-1 rounded border border-slate-200 flex-1 select-all">
                            {record.cnic}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(record.cnic, 'cnic')}
                            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors shrink-0"
                            title="Copy CNIC"
                          >
                            {copiedField === 'cnic' ? (
                              <CheckIcon className="h-3.5 w-3.5 text-green-600" />
                            ) : (
                              <ClipboardIcon className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[12px] font-medium text-slate-400 uppercase tracking-wide flex items-center gap-1">
                          <ClipboardDocumentIcon className="h-3 w-3" />{' '}
                          Reference Number
                        </p>
                        <p className="text-sm font-medium text-slate-900">
                          {record.referenceNumber}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[12px] font-medium text-slate-400 uppercase tracking-wide flex items-center gap-1">
                          <LinkIcon className="h-3 w-3" /> Reference
                        </p>
                        <p className="text-sm font-medium text-slate-900 capitalize">
                          {record.reference.replace(/-/g, ' ')}
                        </p>
                      </div>
                    </div>
                  </Card>

                  {/* Account Credentials */}
                  <Card>
                    <div className="flex items-center gap-2 mb-5 pb-4 border-b border-slate-100">
                      <div className="w-7 h-7 rounded-md bg-emerald-50 flex items-center justify-center shrink-0">
                        <KeyIcon className="h-4 w-4 text-emerald-600" />
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        Account Credentials
                      </h3>
                    </div>
                    <div className="space-y-5">
                      <div className="space-y-1">
                        <p className="text-[12px] font-medium text-slate-400 uppercase tracking-wide flex items-center gap-1">
                          <EnvelopeIcon className="h-3 w-3" /> Email Address
                        </p>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-mono text-slate-900 bg-slate-50 px-2 py-1 rounded border border-slate-200 flex-1 select-all">
                            {record.email}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(record.email, 'email')}
                            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors shrink-0"
                            title="Copy email"
                          >
                            {copiedField === 'email' ? (
                              <CheckIcon className="h-3.5 w-3.5 text-green-600" />
                            ) : (
                              <ClipboardIcon className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[12px] font-medium text-slate-400 uppercase tracking-wide flex items-center gap-1">
                          <KeyIcon className="h-3 w-3" /> Password
                        </p>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-mono text-slate-900 bg-slate-50 px-2 py-1 rounded border border-slate-200 flex-1 select-all">
                            {showPassword ? record.password : '••••••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors shrink-0"
                            title={
                              showPassword ? 'Hide password' : 'Show password'
                            }
                          >
                            {showPassword ? (
                              <EyeSlashIcon className="h-3.5 w-3.5" />
                            ) : (
                              <EyeIcon className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopy(record.password, 'password')
                            }
                            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors shrink-0"
                            title="Copy password"
                          >
                            {copiedField === 'password' ? (
                              <CheckIcon className="h-3.5 w-3.5 text-green-600" />
                            ) : (
                              <ClipboardIcon className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Additional Notes */}
                {record.notes && (
                  <Card>
                    <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-100">
                      <div className="w-7 h-7 rounded-md bg-amber-50 flex items-center justify-center shrink-0">
                        <DocumentTextIcon className="h-4 w-4 text-amber-600" />
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        Additional Notes
                      </h3>
                    </div>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {record.notes}
                    </p>
                  </Card>
                )}
              </div>
            )}

            {/* EDIT MODE */}
            {mode === 'edit' && (
              <form onSubmit={handleEditSubmit} className="space-y-5">
                {/* Personal Info */}
                <Card>
                  <div className="flex items-center gap-2 mb-5 pb-4 border-b border-slate-100">
                    <div className="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center shrink-0">
                      <UserIcon className="h-4 w-4 text-blue-600" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Personal Information
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <TextField
                      id="referenceNumber"
                      name="referenceNumber"
                      label="Reference Number"
                      value={formValues.referenceNumber}
                      onChange={handleChange}
                      error={fieldErrors.referenceNumber}
                      placeholder="REF-001"
                    />
                    <TextField
                      id="name"
                      name="name"
                      label="Name"
                      value={formValues.name}
                      onChange={handleChange}
                      error={fieldErrors.name}
                      placeholder="John Doe"
                    />
                    <TextField
                      id="cnic"
                      name="cnic"
                      label="CNIC"
                      value={formValues.cnic}
                      onChange={handleChange}
                      error={fieldErrors.cnic}
                      placeholder="3520112345671"
                    />
                    <div className="space-y-5">
                      <SelectField
                        id="selectedReference"
                        name="selectedReference"
                        label="Reference"
                        value={formValues.selectedReference}
                        onChange={handleChange}
                        options={allReferenceOptions}
                        error={fieldErrors.selectedReference}
                      />
                      {formValues.selectedReference ===
                        CUSTOM_REFERENCE_VALUE && (
                        <TextField
                          id="customReference"
                          name="customReference"
                          label="Custom Reference"
                          value={formValues.customReference}
                          onChange={handleChange}
                          error={fieldErrors.customReference}
                          placeholder="Enter custom reference"
                        />
                      )}
                    </div>
                  </div>
                </Card>

                {/* Credentials + Status */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <Card>
                    <div className="flex items-center gap-2 mb-5 pb-4 border-b border-slate-100">
                      <div className="w-7 h-7 rounded-md bg-emerald-50 flex items-center justify-center shrink-0">
                        <KeyIcon className="h-4 w-4 text-emerald-600" />
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        Account Credentials & Status
                      </h3>
                    </div>
                    <div className="space-y-5">
                      <TextField
                        id="email"
                        name="email"
                        label="Email"
                        value={formValues.email}
                        onChange={handleChange}
                        error={fieldErrors.email}
                        placeholder="john@example.com"
                      />
                      <TextField
                        id="password"
                        name="password"
                        label="Password"
                        value={formValues.password}
                        onChange={handleChange}
                        error={fieldErrors.password}
                        placeholder="Enter password"
                      />
                      <SelectField
                        id="status"
                        name="status"
                        label="Status"
                        value={formValues.status}
                        onChange={handleChange}
                        options={STATUS_OPTIONS}
                        error={fieldErrors.status}
                      />
                    </div>
                  </Card>

                  <Card>
                    <div className="flex items-center gap-2 mb-5 pb-4 border-b border-slate-100">
                      <div className="w-7 h-7 rounded-md bg-slate-100 flex items-center justify-center shrink-0">
                        <ClipboardDocumentIcon className="h-4 w-4 text-slate-600" />
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        Notes
                      </h3>
                    </div>
                    <div className="space-y-5">
                      <textarea
                        id="notes"
                        name="notes"
                        value={formValues.notes}
                        onChange={handleChange}
                        rows={10}
                        className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
                        placeholder="Additional notes..."
                      />
                      {fieldErrors.notes && (
                        <p className="text-sm text-red-600">
                          {fieldErrors.notes}
                        </p>
                      )}
                    </div>
                  </Card>
                </div>

                <div className="flex gap-3 pt-1 justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleEditCancel}
                    disabled={saving}
                    size="sm"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" busy={saving} size="sm">
                    Save Changes
                  </Button>
                </div>
              </form>
            )}
          </>
        )}

        <ConfirmDialog
          isOpen={pendingDelete}
          title="Delete this record?"
          message={
            record
              ? `This action cannot be undone. The record for ${record.name} will be permanently deleted.`
              : ''
          }
          cancelLabel="Keep record"
          confirmLabel="Delete permanently"
          confirmVariant="danger"
          busy={deleting}
          onCancel={() => {
            if (!deleting) setPendingDelete(false);
          }}
          onConfirm={handleDelete}
        />

        <ConfirmDialog
          isOpen={showUnsavedWarning}
          title="Discard unsaved changes?"
          message="You have unsaved changes. Are you sure you want to leave?"
          cancelLabel="Keep editing"
          confirmLabel="Discard changes"
          confirmVariant="danger"
          onCancel={() => setShowUnsavedWarning(false)}
          onConfirm={() => {
            setShowUnsavedWarning(false);
            setMode('view');
          }}
        />

        {record && (
          <PdfExportModal
            isOpen={showPdfModal}
            record={record}
            onClose={() => setShowPdfModal(false)}
          />
        )}
      </div>
    </AppLayout>
  );
}

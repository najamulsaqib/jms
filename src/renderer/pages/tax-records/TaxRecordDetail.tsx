import LoadingSpinner from '@components/common/LoadingSpinner';
import AppLayout from '@components/layout/AppLayout';
import Button from '@components/ui/Button';
import Card from '@components/ui/Card';
import { Chip } from '@components/ui/Chip';
import ConfirmDialog from '@components/ui/ConfirmDialog';
import SelectField from '@components/ui/SelectField';
import TextField from '@components/ui/TextField';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  IdentificationIcon,
  EnvelopeIcon,
  KeyIcon,
  LinkIcon,
  DocumentTextIcon,
  CalendarIcon,
  ClipboardDocumentIcon,
  EyeIcon,
  EyeSlashIcon,
  ClipboardIcon,
  CheckIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/20/solid';
import PdfExportModal from './PdfExportModal';
import { toast } from 'sonner';
import { taxRecordApi } from '@services/taxRecord.api';
import { TaxRecord } from '@shared/taxRecord.contracts';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createHandleChange,
  CUSTOM_REFERENCE_VALUE,
  EMPTY_FORM_VALUES,
  buildReferenceOptions,
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

  const [record, setRecord] = useState<TaxRecord | null>(null);
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
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

  useEffect(() => {
    if (!parsedId) return;
    let mounted = true;
    setLoading(true);
    setError(null);

    taxRecordApi
      .getById(parsedId)
      .then((r) => {
        if (mounted) setRecord(r);
      })
      .catch((err) => {
        if (mounted)
          setError(
            err instanceof Error ? err.message : 'Failed to load record.',
          );
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [parsedId]);

  const enterEditMode = async () => {
    if (!record) return;
    try {
      const allRecords = await taxRecordApi.list();
      // Exclude current record from the reference options
      const otherRecords = allRecords.filter((r) => r.id !== record.id);
      const options = buildReferenceOptions(otherRecords);

      console.log('OPTIONS', options);
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

  const handleEditSubmit = async (event: React.FormEvent) => {
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

    setSaving(true);
    setError(null);
    setFieldErrors({});

    try {
      const updated = await taxRecordApi.update(parsedId, {
        referenceNumber: formValues.referenceNumber,
        name: formValues.name,
        cnic: formValues.cnic,
        email: formValues.email,
        password: formValues.password,
        reference,
        status: formValues.status,
        notes: formValues.notes,
      });
      setRecord(updated);
      setInitialFormValues(formValues);
      setMode('view');
      toast.success('Record updated successfully');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to save record.';
      if (message === 'Email already exists.')
        setFieldErrors((c) => ({ ...c, email: message }));
      else if (message === 'CNIC already exists.')
        setFieldErrors((c) => ({ ...c, cnic: message }));
      else if (message === 'Reference number already exists.')
        setFieldErrors((c) => ({ ...c, referenceNumber: message }));
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!parsedId) return;
    setDeleting(true);
    try {
      await taxRecordApi.remove(parsedId);
      toast.success('Record deleted successfully');
      navigate('/tax-records', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete record.');
      toast.error('Failed to delete record');
      setPendingDelete(false);
      setDeleting(false);
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
      <div className="max-w-3xl">
        <button
          type="button"
          onClick={() => navigate('/tax-records')}
          className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 mb-6 transition-colors"
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
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  {record.name}
                </h1>
                <p className="mt-1 text-medium text-slate-500">
                  Ref # {record.referenceNumber}
                </p>
              </div>
              {mode === 'view' && (
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPdfModal(true)}
                  >
                    <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                    Export PDF
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={enterEditMode}
                  >
                    <PencilIcon className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => setPendingDelete(true)}
                  >
                    <TrashIcon className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              )}
            </div>

            {error && (
              <Card className="mb-6 border-red-200 bg-red-50">
                <p className="text-sm text-red-800">{error}</p>
              </Card>
            )}

            {/* VIEW MODE */}
            {mode === 'view' && (
              <div className="space-y-6">
                {/* Status Banner */}
                <Card className="bg-linear-to-r from-slate-50 to-white border-l-4 border-l-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-slate-500 mb-1">
                        Current Status
                      </h3>
                      <Chip
                        variant={
                          {
                            active: 'green',
                            inactive: 'red',
                            'late-filer': 'orange',
                          }[record.status] || ('slate' as any)
                        }
                        size="md"
                      >
                        {record.status}
                      </Chip>
                    </div>
                    <div className="text-right space-y-3">
                      <div className="flex items-center justify-end text-sm text-slate-700">
                        <div className="mr-1">Created:</div>
                        <CalendarIcon className="h-4 w-4 mr-1 text-slate-400" />
                        {new Date(record.createdAt).toLocaleDateString(
                          'en-US',
                          {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          },
                        )}
                      </div>
                      <div className="flex items-center justify-end text-sm text-slate-700">
                        <div className="mr-1">Last modified:</div>
                        <CalendarIcon className="h-4 w-4 mr-1 text-slate-400" />
                        {new Date(record.updatedAt).toLocaleDateString(
                          'en-US',
                          {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          },
                        )}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Personal Information */}
                <Card>
                  <div className="border-b border-slate-200 pb-4 mb-6">
                    <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                      <UserIcon className="h-5 w-5 mr-2 text-blue-600" />
                      Personal Information
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                        Full Name
                      </label>
                      <div className="text-base font-medium text-slate-900">
                        {record.name}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide flex items-center">
                        <IdentificationIcon className="h-3.5 w-3.5 mr-1" />
                        CNIC
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="text-base font-mono text-slate-900 bg-slate-50 px-3 py-2 rounded-md border border-slate-200 flex-1 select-all">
                          {record.cnic}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(record.cnic, 'cnic')}
                          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors shrink-0"
                          title="Copy CNIC"
                        >
                          {copiedField === 'cnic' ? (
                            <CheckIcon className="h-4 w-4 text-green-600" />
                          ) : (
                            <ClipboardIcon className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide flex items-center">
                        <ClipboardDocumentIcon className="h-3.5 w-3.5 mr-1" />
                        Reference Number
                      </label>
                      <div className="text-base font-medium text-slate-900">
                        {record.referenceNumber}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide flex items-center">
                        <LinkIcon className="h-3.5 w-3.5 mr-1" />
                        Reference
                      </label>
                      <div className="text-base font-medium text-slate-900 capitalize">
                        {record.reference.replace(/-/g, ' ')}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Account Credentials */}
                <Card>
                  <div className="border-b border-slate-200 pb-4 mb-6">
                    <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                      <KeyIcon className="h-5 w-5 mr-2 text-emerald-600" />
                      Account Credentials
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide flex items-center">
                        <EnvelopeIcon className="h-3.5 w-3.5 mr-1" />
                        Email Address
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="text-base font-mono text-slate-900 bg-slate-50 px-3 py-2 rounded-md border border-slate-200 flex-1 select-all">
                          {record.email}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(record.email, 'email')}
                          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors shrink-0"
                          title="Copy email"
                        >
                          {copiedField === 'email' ? (
                            <CheckIcon className="h-4 w-4 text-green-600" />
                          ) : (
                            <ClipboardIcon className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide flex items-center">
                        <KeyIcon className="h-3.5 w-3.5 mr-1" />
                        Password
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="text-base font-mono text-slate-900 bg-slate-50 px-3 py-2 rounded-md border border-slate-200 flex-1 select-all">
                          {showPassword ? record.password : '••••••••••••'}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                            title={
                              showPassword ? 'Hide password' : 'Show password'
                            }
                          >
                            {showPassword ? (
                              <EyeSlashIcon className="h-4 w-4" />
                            ) : (
                              <EyeIcon className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopy(record.password, 'password')
                            }
                            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                            title="Copy password"
                          >
                            {copiedField === 'password' ? (
                              <CheckIcon className="h-4 w-4 text-green-600" />
                            ) : (
                              <ClipboardIcon className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Additional Notes */}
                {record.notes && (
                  <Card>
                    <div className="border-b border-slate-200 pb-4 mb-6">
                      <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                        <DocumentTextIcon className="h-5 w-5 mr-2 text-amber-600" />
                        Additional Notes
                      </h3>
                    </div>
                    <div className="prose prose-sm max-w-none">
                      <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {record.notes}
                      </p>
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* EDIT MODE */}
            {mode === 'edit' && (
              <Card>
                <form onSubmit={handleEditSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <TextField
                      id="cnic"
                      name="cnic"
                      label="CNIC"
                      value={formValues.cnic}
                      onChange={handleChange}
                      error={fieldErrors.cnic}
                      placeholder="3520112345671"
                    />
                    <TextField
                      id="email"
                      name="email"
                      label="Email"
                      value={formValues.email}
                      onChange={handleChange}
                      error={fieldErrors.email}
                      placeholder="john@example.com"
                    />
                  </div>

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
                    id="selectedReference"
                    name="selectedReference"
                    label="Reference"
                    value={formValues.selectedReference}
                    onChange={handleChange}
                    options={allReferenceOptions}
                    error={fieldErrors.selectedReference}
                  />

                  {formValues.selectedReference === CUSTOM_REFERENCE_VALUE && (
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

                  <SelectField
                    id="status"
                    name="status"
                    label="Status"
                    value={formValues.status}
                    onChange={handleChange}
                    options={STATUS_OPTIONS}
                    error={fieldErrors.status}
                  />

                  <div className="space-y-1">
                    <label
                      htmlFor="notes"
                      className="block text-sm font-medium text-slate-700"
                    >
                      Notes
                      <textarea
                        id="notes"
                        name="notes"
                        value={formValues.notes}
                        onChange={handleChange}
                        rows={8}
                        className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
                        placeholder="Additional notes..."
                      />
                    </label>
                    {fieldErrors.notes && (
                      <p className="text-sm text-red-600">
                        {fieldErrors.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-slate-200">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleEditCancel}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" busy={saving}>
                      Save Changes
                    </Button>
                  </div>
                </form>
              </Card>
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

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  UserIcon,
  KeyIcon,
  ClipboardDocumentIcon,
} from '@heroicons/react/20/solid';
import AppLayout from '@components/layout/AppLayout';
import Button from '@components/ui/Button';
import Card from '@components/ui/Card';
import ConfirmDialog from '@components/ui/ConfirmDialog';
import SelectField from '@components/ui/SelectField';
import TextField from '@components/ui/TextField';
import { taxRecordApi } from '@services/taxRecord.api';
import {
  createHandleChange,
  createHandleSubmit,
  CUSTOM_REFERENCE_VALUE,
  EMPTY_FORM_VALUES,
  buildReferenceOptions,
  type FieldErrors,
  type FormValues,
} from './taxRecordForm.helpers';

export default function TaxRecordFormPage() {
  const { taxRecordId } = useParams<{ taxRecordId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const parsedId = useMemo(() => {
    if (!taxRecordId) {
      return null;
    }

    const id = Number(taxRecordId);
    return Number.isNaN(id) ? null : id;
  }, [taxRecordId]);

  const isEditMode = parsedId !== null;

  const [formValues, setFormValues] = useState<FormValues>(EMPTY_FORM_VALUES);
  const [initialFormValues, setInitialFormValues] = useState<FormValues | null>(
    null,
  );
  const [referenceOptions, setReferenceOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const existingEntries = await taxRecordApi.list();
        if (!mounted) return;

        if (isEditMode && parsedId !== null) {
          const todo = await taxRecordApi.getById(parsedId);
          if (!mounted) return;

          // Build reference options, excluding current record's name
          const options = buildReferenceOptions(
            existingEntries,
            todo.name.trim(),
          );
          setReferenceOptions(options);

          const nextFormValues: FormValues = {
            referenceNumber: todo.referenceNumber,
            name: todo.name,
            cnic: todo.cnic,
            email: todo.email,
            password: todo.password,
            selectedReference: options.some((o) => o.value === todo.reference)
              ? todo.reference
              : CUSTOM_REFERENCE_VALUE,
            customReference: options.some((o) => o.value === todo.reference)
              ? ''
              : todo.reference,
            status: todo.status,
            notes: todo.notes,
          };

          setFormValues(nextFormValues);
          setInitialFormValues(nextFormValues);
        } else {
          const options = buildReferenceOptions(existingEntries);
          setReferenceOptions(options);
        }
      } catch (err) {
        if (!mounted) return;
        const message =
          err instanceof Error ? err.message : 'Failed to load data.';
        setError(message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [isEditMode, parsedId]);

  const handleChange = createHandleChange({
    formValues,
    setFormValues,
    setFieldErrors,
  });
  const handleSubmit = createHandleSubmit({
    formValues,
    parsedId,
    isEditMode,
    setFieldErrors,
    setSaving,
    setError,
    setSuccess,
    setInitialFormValues,
    navigate,
    onSaved: () => queryClient.invalidateQueries({ queryKey: ['taxRecords'] }),
  });

  const handleCancel = () => {
    const hasChanges =
      initialFormValues &&
      JSON.stringify(formValues) !== JSON.stringify(initialFormValues);

    if (hasChanges) {
      setShowUnsavedWarning(true);
    } else {
      navigate('/tax-records');
    }
  };

  const confirmCancel = () => {
    setShowUnsavedWarning(false);
    navigate('/tax-records');
  };

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'late-filer', label: 'Late Filer' },
  ];

  const allReferenceOptions = referenceOptions;

  return (
    <AppLayout
      breadcrumbs={[
        { label: 'Dashboard', href: '/' },
        { label: 'Tax Records', href: '/tax-records' },
        { label: isEditMode ? 'Edit Record' : 'New Record' },
      ]}
    >
      <div className="max-w-6xl">
        {/* Back Button */}
        <button
          type="button"
          onClick={() => navigate('/tax-records')}
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 mb-5 transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Tax Records
        </button>

        {/* Page Header */}
        <div className="flex items-center gap-4 bg-white rounded-xl border border-slate-200 px-5 py-4 shadow-sm mb-5">
          <div className="shrink-0 w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <UserIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {isEditMode ? 'Edit Tax Record' : 'New Tax Record'}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {isEditMode
                ? 'Update the tax record information below'
                : 'Fill in the details to create a new tax record'}
            </p>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <Card className="mb-5 border-red-200 bg-red-50">
            <p className="text-sm text-red-800">{error}</p>
          </Card>
        )}
        {success && (
          <Card className="mb-5 border-green-200 bg-green-50">
            <p className="text-sm text-green-800">{success}</p>
          </Card>
        )}

        {/* Form */}
        {loading ? (
          <Card>
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-blue-600" />
              <p className="mt-4 text-slate-600">Loading record...</p>
            </div>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
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
                </div>
              </div>
            </Card>

            {/* Credentials + Status & Notes */}
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
                    options={statusOptions}
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
                  <p className="text-sm text-red-600">{fieldErrors.notes}</p>
                )}
              </Card>
            </div>

            <div className="flex gap-3 pt-1 justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={handleCancel}
                disabled={saving}
                size="sm"
              >
                Cancel
              </Button>
              <Button type="submit" busy={saving} size="sm">
                {isEditMode ? 'Update Record' : 'Create Record'}
              </Button>
            </div>
          </form>
        )}

        {/* Unsaved Changes Warning */}
        <ConfirmDialog
          isOpen={showUnsavedWarning}
          title="Discard unsaved changes?"
          message="You have unsaved changes. Are you sure you want to leave this page?"
          cancelLabel="Keep editing"
          confirmLabel="Discard changes"
          confirmVariant="danger"
          onCancel={() => setShowUnsavedWarning(false)}
          onConfirm={confirmCancel}
        />
      </div>
    </AppLayout>
  );
}

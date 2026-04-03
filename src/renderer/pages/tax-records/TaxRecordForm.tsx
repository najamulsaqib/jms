import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/20/solid';
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
  type FieldErrors,
  type FormValues,
} from './taxRecordForm.helpers';

export default function TaxRecordFormPage() {
  const { taxRecordId } = useParams<{ taxRecordId: string }>();
  const navigate = useNavigate();

  const parsedId = useMemo(() => {
    if (!taxRecordId) {
      return null;
    }

    const id = Number(taxRecordId);
    return Number.isNaN(id) ? null : id;
  }, [taxRecordId]);

  const isEditMode = parsedId !== null;

  const [formValues, setFormValues] = useState<FormValues>(EMPTY_FORM_VALUES);
  const [initialFormValues, setInitialFormValues] =
    useState<FormValues | null>(null);
  const [referenceOptions, setReferenceOptions] = useState<string[]>([]);
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

        const references = new Set<string>(['Self']);
        existingEntries.forEach((entry) => {
          if (entry.name.trim()) references.add(entry.name.trim());
          if (entry.reference.trim()) references.add(entry.reference.trim());
        });

        if (isEditMode && parsedId !== null) {
          const todo = await taxRecordApi.getById(parsedId);
          if (!mounted) return;

          references.delete(todo.name.trim());
          setReferenceOptions(
            Array.from(references).sort((a, b) => a.localeCompare(b)),
          );

          const nextFormValues: FormValues = {
            referenceNumber: todo.referenceNumber,
            name: todo.name,
            cnic: todo.cnic,
            email: todo.email,
            password: todo.password,
            selectedReference: references.has(todo.reference)
              ? todo.reference
              : CUSTOM_REFERENCE_VALUE,
            customReference: references.has(todo.reference) ? '' : todo.reference,
            status: todo.status,
            notes: todo.notes,
          };

          setFormValues(nextFormValues);
          setInitialFormValues(nextFormValues);
        } else {
          setReferenceOptions(
            Array.from(references).sort((a, b) => a.localeCompare(b)),
          );
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

  const handleChange = createHandleChange({ formValues, setFormValues, setFieldErrors });
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

  const allReferenceOptions = [
    { value: 'Self', label: 'Self' },
    ...referenceOptions.filter((ref) => ref !== 'Self').map((ref) => ({ value: ref, label: ref })),
    { value: CUSTOM_REFERENCE_VALUE, label: '+ Add Custom Reference' },
  ];

  return (
    <AppLayout
      breadcrumbs={[
        { label: 'Dashboard', href: '/' },
        { label: 'Tax Records', href: '/tax-records' },
        { label: isEditMode ? 'Edit Record' : 'New Record' },
      ]}
    >
      <div className="max-w-3xl">
        {/* Back Button */}
        <button
          type="button"
          onClick={() => navigate('/tax-records')}
          className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 mb-6 transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Tax Records
        </button>

        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">
            {isEditMode ? 'Edit Tax Record' : 'New Tax Record'}
          </h1>
          <p className="mt-2 text-slate-600">
            {isEditMode
              ? 'Update the tax record information below'
              : 'Fill in the details to create a new tax record'}
          </p>
        </div>

        {/* Messages */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <p className="text-sm text-red-800">{error}</p>
          </Card>
        )}

        {success && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <p className="text-sm text-green-800">{success}</p>
          </Card>
        )}

        {/* Form */}
        <Card>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-blue-600" />
              <p className="mt-4 text-slate-600">Loading record...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Reference Number & Name */}
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

              {/* CNIC & Email */}
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

              {/* Password */}
              <TextField
                id="password"
                name="password"
                label="Password"
                value={formValues.password}
                onChange={handleChange}
                error={fieldErrors.password}
                placeholder="Enter password"
              />

              {/* Reference Selection */}
              <SelectField
                id="selectedReference"
                name="selectedReference"
                label="Reference"
                value={formValues.selectedReference}
                onChange={handleChange}
                options={allReferenceOptions}
                error={fieldErrors.selectedReference}
              />

              {/* Custom Reference */}
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

              {/* Status */}
              <SelectField
                id="status"
                name="status"
                label="Status"
                value={formValues.status}
                onChange={handleChange}
                options={statusOptions}
                error={fieldErrors.status}
              />

              {/* Notes */}
              <div className="space-y-1">
                <label htmlFor="notes" className="block text-sm font-medium text-slate-700">
                  Notes
                  <textarea
                    id="notes"
                    name="notes"
                    value={formValues.notes}
                    onChange={handleChange}
                    rows={4}
                    className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
                    placeholder="Additional notes..."
                  />
                </label>
                {fieldErrors.notes && (
                  <p className="text-sm text-red-600">{fieldErrors.notes}</p>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button type="submit" busy={saving}>
                  {isEditMode ? 'Update Record' : 'Create Record'}
                </Button>
              </div>
            </form>
          )}
        </Card>

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

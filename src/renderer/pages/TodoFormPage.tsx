import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../components/ui/Button';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import SelectField from '../components/ui/SelectField';
import TextField from '../components/ui/TextField';
import { todoApi } from '../services/todo.api';
import {
  createHandleChange,
  createHandleSubmit,
  CUSTOM_REFERENCE_VALUE,
  EMPTY_FORM_VALUES,
  type FieldErrors,
  type FormValues,
} from './todoForm.helpers';

export default function TodoFormPage() {
  const { todoId } = useParams<{ todoId: string }>();
  const navigate = useNavigate();

  const parsedId = useMemo(() => {
    if (!todoId) {
      return null;
    }

    const id = Number(todoId);
    return Number.isNaN(id) ? null : id;
  }, [todoId]);

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

    const loadTodo = async () => {
      if (!isEditMode || parsedId === null) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const existingEntries = await todoApi.list();
        const references = new Set<string>();
        existingEntries.forEach((entry) => {
          if (entry.name.trim()) {
            references.add(entry.name.trim());
          }
          if (entry.reference.trim()) {
            references.add(entry.reference.trim());
          }
        });

        const todo = await todoApi.getById(parsedId);
        if (!mounted) {
          return;
        }

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
      } catch (err) {
        if (!mounted) {
          return;
        }
        const message =
          err instanceof Error ? err.message : 'Failed to load entry.';
        setError(message);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    const initializeCreateForm = async () => {
      setLoading(true);
      setError(null);

      try {
        const existingEntries = await todoApi.list();
        if (!mounted) {
          return;
        }
        const references = new Set<string>();
        existingEntries.forEach((entry) => {
          if (entry.name.trim()) {
            references.add(entry.name.trim());
          }
          if (entry.reference.trim()) {
            references.add(entry.reference.trim());
          }
        });
        setReferenceOptions(
          Array.from(references).sort((a, b) => a.localeCompare(b)),
        );
        setFormValues(EMPTY_FORM_VALUES);
        setInitialFormValues(EMPTY_FORM_VALUES);
      } catch (err) {
        if (!mounted) {
          return;
        }
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to load reference options.';
        setError(message);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    if (isEditMode && parsedId !== null) {
      loadTodo();
    } else {
      initializeCreateForm();
    }

    return () => {
      mounted = false;
    };
  }, [isEditMode, parsedId]);

  const handleChange = createHandleChange({
    formValues,
    setFormValues,
    setFieldErrors,
  });

  const hasUnsavedChanges = useMemo(() => {
    if (!initialFormValues) {
      return false;
    }

    return JSON.stringify(formValues) !== JSON.stringify(initialFormValues);
  }, [formValues, initialFormValues]);

  const handleBackNavigation = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedWarning(true);
      return;
    }

    navigate('/');
  };

  const confirmBackNavigation = () => {
    setShowUnsavedWarning(false);
    navigate('/');
  };

  const handleSubmit = createHandleSubmit({
    formValues,
    isEditMode,
    parsedId,
    navigate,
    setFieldErrors,
    setError,
    setSuccess,
    setSaving,
    setInitialFormValues,
  });

  return (
    <main className="dashboard-page">
      <section className="dashboard-card form-card">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-eyebrow">
              Tax Record
            </p>
            <h1>Individual Tax Record Information</h1>
            <p className="todo-subtitle">
              Tax record details for a customer, including personal info, tax status, and references.
            </p>
          </div>
          <Button
            variant="secondary"
            type="button"
            onClick={handleBackNavigation}
          >
            Back
          </Button>
        </header>

        {loading ? (
          <p className="todo-empty">Loading entry...</p>
        ) : (
          <form className="entry-form" onSubmit={handleSubmit}>
            <TextField
              id="reference-number"
              label="Reference Number"
              hint="Unique identifier"
              name="referenceNumber"
              value={formValues.referenceNumber}
              maxLength={64}
              placeholder="Enter unique reference number"
              onChange={handleChange}
              error={fieldErrors.referenceNumber}
              required
            />

            <TextField
              id="record-name"
              label="Name"
              hint="Person name for this case"
              name="name"
              value={formValues.name}
              maxLength={140}
              placeholder="Enter name"
              onChange={handleChange}
              error={fieldErrors.name}
              required
            />

            <TextField
              id="record-cnic"
              label="CNIC"
              hint="Strict 13 digits National ID number"
              name="cnic"
              value={formValues.cnic}
              inputMode="numeric"
              minLength={13}
              maxLength={13}
              placeholder="1234512345671"
              onChange={handleChange}
              error={fieldErrors.cnic}
              required
            />
            <div className="row">
              <TextField
                id="record-email"
                label="Email"
                name="email"
                value={formValues.email}
                maxLength={254}
                placeholder="name@example.com"
                onChange={handleChange}
                error={fieldErrors.email}
                required
              />

              <TextField
                id="record-password"
                label="Password"
                name="password"
                value={formValues.password}
                maxLength={256}
                placeholder="Paste password here"
                onChange={handleChange}
                error={fieldErrors.password}
                required
              />
            </div>

            <SelectField
              id="record-status"
              label="Status"
              name="status"
              value={formValues.status}
              onChange={handleChange}
              error={fieldErrors.status}
              required
              options={[
                { label: 'Active', value: 'active' },
                { label: 'Inactive', value: 'inactive' },
                { label: 'Late-filer', value: 'late-filer' },
              ]}
            />

            <div className="row">
              <SelectField
                label="Reference"
                name="selectedReference"
                value={formValues.selectedReference}
                onChange={handleChange}
                error={fieldErrors.reference}
                required
                options={[
                  { label: 'Select reference', value: '' },
                  ...referenceOptions.map((option) => ({
                    label: option,
                    value: option,
                  })),
                  {
                    label: 'Create new reference',
                    value: CUSTOM_REFERENCE_VALUE,
                  },
                ]}
              />

              {formValues.selectedReference === CUSTOM_REFERENCE_VALUE ? (
                <TextField
                  label="New Reference Name"
                  name="customReference"
                  value={formValues.customReference}
                  maxLength={140}
                  placeholder="Referrer name"
                  onChange={handleChange}
                  error={fieldErrors.customReference}
                  required
                />
              ) : null}
            </div>

            <label className="field-group" htmlFor="record-notes">
              <span className="field-label">Notes</span>
              <span className="field-hint">
                Any additional information about this case (max 4000 chars).
              </span>
              <textarea
                id="record-notes"
                className="ui-textarea"
                name="notes"
                value={formValues.notes}
                rows={5}
                maxLength={4000}
                placeholder="Enter any notes..."
                onChange={handleChange}
              />
            </label>

            <div className="form-actions">
              <Button type="submit" size="lg" busy={saving}>
                {isEditMode ? 'Save' : 'Create'}
              </Button>
              <Button
                variant="ghost"
                type="button"
                onClick={handleBackNavigation}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        {error ? <p className="todo-error">{error}</p> : null}
        {success ? <p className="todo-success">{success}</p> : null}

        <ConfirmDialog
          isOpen={showUnsavedWarning}
          title="Unsaved changes"
          message="You have unsaved changes. If you go back now, your edits will be lost."
          cancelLabel="Stay here"
          confirmLabel="Go back"
          confirmVariant="danger"
          onCancel={() => setShowUnsavedWarning(false)}
          onConfirm={confirmBackNavigation}
        />
      </section>
    </main>
  );
}

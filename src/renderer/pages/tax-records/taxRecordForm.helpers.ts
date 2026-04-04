import { ChangeEvent, Dispatch, SetStateAction } from 'react';
import { type NavigateFunction } from 'react-router-dom';
import { toast } from 'sonner';
import { taxRecordApi } from '@services/taxRecord.api';
import { type TaxRecordStatus } from '@shared/taxRecord.contracts';

export const CUSTOM_REFERENCE_VALUE = '__custom_reference__';

/**
 * Convert a string to kebab-case format
 * Removes all non-alphanumeric characters and replaces them with hyphens
 */
export const toKebabCase = (str: string): string => {
  return str
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export type FieldErrors = Record<string, string | undefined>;

export type FormValues = {
  referenceNumber: string;
  name: string;
  cnic: string;
  email: string;
  password: string;
  selectedReference: string;
  customReference: string;
  status: TaxRecordStatus;
  notes: string;
};

export const EMPTY_FORM_VALUES: FormValues = {
  referenceNumber: '',
  name: '',
  cnic: '',
  email: '',
  password: '',
  selectedReference: 'self',
  customReference: '',
  status: 'active',
  notes: '',
};

type ReferenceOption = { value: string; label: string };

/**
 * Build deduplicated reference options
 * - Values: kebab-case (for uniqueness)
 * - Labels: human-readable (for UI)
 * - Order: Self first, then users alphabetically, then Add Custom
 */
export const buildReferenceOptions = (
  existingRecords: Array<{ name: string; reference: string }>,
  excludeValue?: string,
): ReferenceOption[] => {
  // Map: kebab-case value -> human-readable label
  const seen = new Map<string, string>();

  // Add Self first
  seen.set('self', 'Self');

  // Add all names from records
  for (const record of existingRecords) {
    const name = record.name.trim();
    if (!name) continue;

    const kebab = toKebabCase(name);
    if (!kebab || seen.has(kebab)) continue;

    seen.set(kebab, name);
  }

  // Remove excluded value
  if (excludeValue) {
    seen.delete(toKebabCase(excludeValue));
  }

  // Build options array
  const options: ReferenceOption[] = [];

  // 1. Self first
  if (seen.has('self')) {
    options.push({ value: 'self', label: seen.get('self')! });
    seen.delete('self');
  }

  // 2. Rest sorted alphabetically by label
  const rest = [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  for (const [value, label] of rest) {
    options.push({ value, label });
  }

  // 3. Add Custom at end
  options.push({
    value: CUSTOM_REFERENCE_VALUE,
    label: '+ Add Custom Reference',
  });

  return options;
};

type HandleChangeOptions = {
  formValues: FormValues;
  setFormValues: Dispatch<SetStateAction<FormValues>>;
  setFieldErrors: Dispatch<SetStateAction<FieldErrors>>;
};

const isFormFieldName = (name: string): name is keyof FormValues =>
  name in EMPTY_FORM_VALUES;

export const createHandleChange = ({
  formValues,
  setFormValues,
  setFieldErrors,
}: HandleChangeOptions) => {
  return (
    event: ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = event.target;

    if (!isFormFieldName(name) || !(name in formValues)) {
      return;
    }

    const nextValue =
      name === 'cnic' ? value.replace(/\D/g, '').slice(0, 13) : value;

    setFormValues((current) => {
      return {
        ...current,
        [name]: nextValue,
      };
    });

    setFieldErrors((current) => {
      if (name === 'selectedReference') {
        return {
          ...current,
          reference: undefined,
          customReference: undefined,
        };
      }

      if (name === 'customReference') {
        return {
          ...current,
          customReference: undefined,
        };
      }

      if (name in current) {
        return {
          ...current,
          [name]: undefined,
        };
      }

      return current;
    });
  };
};

type HandleSubmitOptions = {
  formValues: FormValues;
  isEditMode: boolean;
  parsedId: number | null;
  navigate: NavigateFunction;
  setFieldErrors: Dispatch<SetStateAction<FieldErrors>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setSuccess: Dispatch<SetStateAction<string | null>>;
  setSaving: Dispatch<SetStateAction<boolean>>;
  setInitialFormValues: Dispatch<SetStateAction<FormValues | null>>;
  onSaved?: () => void;
};

export const createHandleSubmit = ({
  formValues,
  isEditMode,
  parsedId,
  navigate,
  setFieldErrors,
  setError,
  setSuccess,
  setSaving,
  setInitialFormValues,
  onSaved,
}: HandleSubmitOptions) => {
  return async (event: any) => {
    event.preventDefault();

    const nextFieldErrors: FieldErrors = {};

    // Get reference value and normalize to kebab-case
    let reference = '';
    if (formValues.selectedReference === CUSTOM_REFERENCE_VALUE) {
      reference = toKebabCase(formValues.customReference);
    } else {
      // selectedReference is already in kebab-case from buildReferenceOptions
      reference = formValues.selectedReference.trim();
    }

    if (!formValues.name.trim()) {
      nextFieldErrors.name = 'Name is required.';
    }

    if (!formValues.referenceNumber.trim()) {
      nextFieldErrors.referenceNumber = 'Reference number is required.';
    }

    if (!/^\d{13}$/.test(formValues.cnic)) {
      nextFieldErrors.cnic = 'CNIC must be exactly 13 digits.';
    }

    if (!formValues.email.trim()) {
      nextFieldErrors.email = 'Email is required.';
    } else if (!/^\S+@\S+\.\S+$/.test(formValues.email.trim())) {
      nextFieldErrors.email = 'Email format is invalid.';
    }

    if (!formValues.password.trim()) {
      nextFieldErrors.password = 'Password is required.';
    }

    if (formValues.selectedReference === CUSTOM_REFERENCE_VALUE) {
      if (!formValues.customReference.trim()) {
        nextFieldErrors.customReference = 'Reference is required.';
      } else if (
        toKebabCase(formValues.customReference) === toKebabCase(formValues.name)
      ) {
        nextFieldErrors.customReference =
          'Reference must be different from Name.';
      }
    } else if (!reference) {
      nextFieldErrors.reference = 'Reference is required.';
    } else if (reference === toKebabCase(formValues.name)) {
      nextFieldErrors.reference = 'Reference must be different from Name.';
    }

    if (!['active', 'inactive', 'late-filer'].includes(formValues.status)) {
      nextFieldErrors.status = 'Status is required.';
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setError(null);
      setSuccess(null);
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    setFieldErrors({});

    try {
      const uniquenessErrors = await taxRecordApi.validateUniqueness(
        {
          referenceNumber: formValues.referenceNumber,
          cnic: formValues.cnic,
          email: formValues.email,
        },
        isEditMode && parsedId !== null ? parsedId : undefined,
      );

      if (Object.keys(uniquenessErrors).length > 0) {
        setFieldErrors((current) => ({
          ...current,
          ...uniquenessErrors,
        }));
        setError(null);
        setSuccess(null);
        return;
      }

      if (isEditMode && parsedId !== null) {
        await taxRecordApi.update(parsedId, {
          referenceNumber: formValues.referenceNumber,
          name: formValues.name,
          cnic: formValues.cnic,
          email: formValues.email,
          password: formValues.password,
          reference,
          status: formValues.status,
          notes: formValues.notes,
        });
        setInitialFormValues(formValues);
        setSuccess('Entry updated successfully.');
        toast.success('Record updated successfully');
        onSaved?.();
      } else {
        const created = await taxRecordApi.create({
          referenceNumber: formValues.referenceNumber,
          name: formValues.name,
          cnic: formValues.cnic,
          email: formValues.email,
          password: formValues.password,
          reference,
          status: formValues.status,
          notes: formValues.notes,
        });
        toast.success('Record created successfully');
        onSaved?.();
        navigate(`/tax-records/${created.id}`, { replace: true });
        setSuccess('Entry created successfully.');
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to save entry.';

      if (message.includes('Email already exists')) {
        setFieldErrors((current) => ({
          ...current,
          email: 'Email already exists.',
        }));
        return;
      }

      if (message.includes('CNIC already exists')) {
        setFieldErrors((current) => ({
          ...current,
          cnic: 'CNIC already exists.',
        }));
        return;
      }

      if (message.includes('Reference number already exists')) {
        setFieldErrors((current) => ({
          ...current,
          referenceNumber: 'Reference number already exists.',
        }));
        return;
      }

      // Only show toast for unexpected errors
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };
};

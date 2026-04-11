import { ChangeEvent, Dispatch, SetStateAction } from 'react';
import { type NavigateFunction } from 'react-router-dom';
import { toast } from 'sonner';
import { encodeRecordId } from '@lib/recordId';
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

/**
 * Validate phone number for edit mode
 * Accepts 10 digits (will be prefixed with 0092 automatically)
 * Returns error message if invalid, else returns null
 */
export const validatePhoneEdit = (phone: string): string | null => {
  if (!phone || !phone.trim()) return null; // Phone is optional
  const trimmed = phone.trim();
  if (!/^\d{10}$/.test(trimmed)) {
    return 'Phone must be exactly 10 digits';
  }
  return null;
};

/**
 * Normalize phone number for bulk import
 * Accepts: 03123456789, 3123456789, +923123456789, or null
 * Returns: normalized to 00923123456789 or empty string if null
 * Throws: if format is invalid
 */
export const normalizePhoneBulk = (phone: string): string => {
  if (!phone || !phone.trim()) return ''; // Null/empty is allowed in bulk

  const trimmed = phone.trim();
  const digitsOnly = trimmed.replace(/\D/g, '');

  // Format 1: 03123456789 (11 digits starting with 03)
  if (/^03\d{9}$/.test(trimmed)) {
    return '0092' + digitsOnly.slice(1); // 0092 + 3123456789
  }

  // Format 2: 3123456789 (10 digits)
  if (/^\d{10}$/.test(trimmed)) {
    return '0092' + trimmed;
  }

  // Format 3: +923123456789 (12 digits, starts with +92)
  if (/^\+92\d{10}$/.test(trimmed)) {
    return '0092' + digitsOnly.slice(2);
  }

  // Format 4: 00923123456789 (14 digits, starts with 0092)
  if (/^0092\d{10}$/.test(trimmed)) {
    return trimmed;
  }

  // Invalid format
  throw new Error(
    'Phone must be in one of these formats: 03123456789, 3123456789, +923123456789, or 00923123456789',
  );
};

/**
 * Normalize status for bulk import and edits
 * Accepts: ACTIVE, Active, a, 1, INACTIVE, Inactive, i, in, 0, LATEFILER, Late-Filer, lf, 2, etc.
 * Returns: normalized status (active, inactive, late-filer)
 * Defaults to: inactive if unrecognized or empty
 */
export const normalizeStatus = (val: string): TaxRecordStatus => {
  if (!val || !val.trim()) return 'inactive'; // Default to inactive

  // Normalize input: lowercase, trim, remove spaces/underscores/hyphens
  const normalized = val
    .toLowerCase()
    .trim()
    .replace(/[\s_-]/g, '');

  // Map various formats to standard status
  if (normalized === 'active' || normalized === 'a' || normalized === '1') {
    return 'active';
  }

  if (
    normalized === 'latefiler' ||
    normalized === 'late' ||
    normalized === 'lf' ||
    normalized === '2'
  ) {
    return 'late-filer';
  }

  if (
    normalized === 'inactive' ||
    normalized === 'in' ||
    normalized === 'i' ||
    normalized === '0'
  ) {
    return 'inactive';
  }

  // Default to inactive if unrecognized
  return 'inactive';
};

export type FieldErrors = Record<string, string | undefined>;

export type FormValues = {
  referenceNumber: string;
  name: string;
  cnic: string;
  phone: string;
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
  phone: '',
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
      name === 'cnic'
        ? value.replace(/\D/g, '').slice(0, 13)
        : name === 'notes'
          ? value.slice(0, 5000)
          : value;

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

    if (
      formValues.email.trim() &&
      !/^\S+@\S+\.\S+$/.test(formValues.email.trim())
    ) {
      nextFieldErrors.email = 'Email format is invalid.';
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

    if (formValues.notes.length > 5000) {
      nextFieldErrors.notes = `Notes must be 5000 characters or fewer (${formValues.notes.length}/5000).`;
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
      // Check uniqueness per user — validated in parallel.
      const uniquenessErrors = await taxRecordApi.validateUniqueness(
        {
          referenceNumber: formValues.referenceNumber,
          cnic: formValues.cnic,
        },
        isEditMode && parsedId !== null ? parsedId : undefined,
      );

      if (Object.keys(uniquenessErrors).length > 0) {
        setFieldErrors((current) => ({ ...current, ...uniquenessErrors }));
        setError(null);
        setSuccess(null);
        return;
      }

      // Add "0092" prefix to phone before saving
      const phoneWithPrefix = formValues.phone ? `0092${formValues.phone}` : '';

      const recordPayload = {
        referenceNumber: formValues.referenceNumber,
        name: formValues.name,
        cnic: formValues.cnic,
        phone: phoneWithPrefix,
        email: formValues.email,
        password: formValues.password,
        reference,
        status: formValues.status,
        notes: formValues.notes,
      };

      if (isEditMode && parsedId !== null) {
        await taxRecordApi.update(parsedId, recordPayload);
        setInitialFormValues(formValues);
        setSuccess('Entry updated successfully.');
        toast.success('Record updated successfully');
        onSaved?.();
      } else {
        const created = await taxRecordApi.create(recordPayload);
        toast.success('Record created successfully');
        onSaved?.();
        navigate(`/tax-records/${encodeRecordId(created.id)}`, {
          replace: true,
        });
        setSuccess('Entry created successfully.');
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to save entry.';

      // Safety net: map any DB-level uniqueness violations that slipped through
      // (e.g. race condition between validateUniqueness and save).
      const uniquenessFieldMap: Record<string, keyof FieldErrors> = {
        'CNIC already exists': 'cnic',
        'Reference number already exists': 'referenceNumber',
      };

      const matchedField = Object.entries(uniquenessFieldMap).find(([key]) =>
        message.includes(key),
      );

      if (matchedField) {
        setFieldErrors((current) => ({
          ...current,
          [matchedField[1]]: `${matchedField[0]}.`,
        }));
        return;
      }

      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };
};

import { ChangeEvent, Dispatch, SetStateAction } from 'react';
import { type NavigateFunction } from 'react-router-dom';
import { taxRecordApi } from '@services/taxRecord.api';
import { type TaxRecordStatus } from '@shared/taxRecord.contracts';

export const CUSTOM_REFERENCE_VALUE = '__custom_reference__';

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
}: HandleSubmitOptions) => {
  return async (event: any) => {
    event.preventDefault();

    const nextFieldErrors: FieldErrors = {};
    const reference =
      formValues.selectedReference === CUSTOM_REFERENCE_VALUE
        ? formValues.customReference.trim()
        : formValues.selectedReference.trim();

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
        formValues.customReference.trim().toLowerCase() ===
        formValues.name.trim().toLowerCase()
      ) {
        nextFieldErrors.customReference =
          'Reference must be different from Name.';
      }
    } else if (!reference) {
      nextFieldErrors.reference = 'Reference is required.';
    } else if (
      reference.toLowerCase() === formValues.name.trim().toLowerCase()
    ) {
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
        navigate(`/tax-records/${created.id}`, { replace: true });
        setSuccess('Entry created successfully.');
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to save entry.';

      if (message === 'Email already exists.') {
        setFieldErrors((current) => ({
          ...current,
          email: 'Email already exists.',
        }));
      } else if (message === 'CNIC already exists.') {
        setFieldErrors((current) => ({
          ...current,
          cnic: 'CNIC already exists.',
        }));
      } else if (message === 'Reference number already exists.') {
        setFieldErrors((current) => ({
          ...current,
          referenceNumber: 'Reference number already exists.',
        }));
      }

      setError(message);
    } finally {
      setSaving(false);
    }
  };
};

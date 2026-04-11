import React, { ChangeEvent } from 'react';
import {
  ClipboardDocumentIcon,
  KeyIcon,
  UserIcon,
} from '@heroicons/react/20/solid';
import Card from '@components/ui/Card';
import SelectField from '@components/ui/SelectField';
import TextField from '@components/ui/TextField';
import {
  CUSTOM_REFERENCE_VALUE,
  type FieldErrors,
  type FormValues,
} from './taxRecordForm.helpers';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'late-filer', label: 'Late Filer' },
];

type Props = {
  formValues: FormValues;
  referenceOptions: Array<{ value: string; label: string }>;
  fieldErrors: FieldErrors;
  onChange: (
    event: ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => void;
};

export default function TaxRecordFormFields({
  formValues,
  referenceOptions,
  fieldErrors,
  onChange,
}: Props) {
  return (
    <>
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
            onChange={onChange}
            error={fieldErrors.referenceNumber}
            placeholder="REF-001"
          />
          <TextField
            id="name"
            name="name"
            label="Name"
            value={formValues.name}
            onChange={onChange}
            error={fieldErrors.name}
            placeholder="John Doe"
          />
          <TextField
            id="cnic"
            name="cnic"
            label="CNIC"
            value={formValues.cnic}
            onChange={onChange}
            error={fieldErrors.cnic}
            placeholder="3520112345671"
          />
          <TextField
            id="phone"
            name="phone"
            label="Phone"
            prefix="0092"
            inputMode="numeric"
            maxLength={10}
            value={formValues.phone}
            onChange={onChange}
            error={fieldErrors.phone}
            placeholder="3123456789"
          />
          <SelectField
            id="selectedReference"
            label="Reference"
            value={formValues.selectedReference}
            onChange={(value) =>
              onChange({
                target: { name: 'selectedReference', value },
              } as ChangeEvent<HTMLSelectElement>)
            }
            options={referenceOptions}
            error={fieldErrors.selectedReference}
          />
          {formValues.selectedReference === CUSTOM_REFERENCE_VALUE && (
            <TextField
              id="customReference"
              name="customReference"
              label="Custom Reference"
              value={formValues.customReference}
              onChange={onChange}
              error={fieldErrors.customReference}
              placeholder="Enter custom reference"
            />
          )}
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
              onChange={onChange}
              error={fieldErrors.email}
              placeholder="john@example.com"
            />
            <TextField
              id="password"
              name="password"
              label="Password"
              value={formValues.password}
              onChange={onChange}
              error={fieldErrors.password}
              placeholder="Enter password"
            />
            <SelectField
              id="status"
              label="Status"
              value={formValues.status}
              onChange={(value) =>
                onChange({
                  target: { name: 'status', value },
                } as ChangeEvent<HTMLSelectElement>)
              }
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
            <h3 className="text-sm font-semibold text-slate-900">Notes</h3>
          </div>
          <textarea
            id="notes"
            name="notes"
            value={formValues.notes}
            onChange={onChange}
            rows={10}
            maxLength={5000}
            className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
            placeholder="Additional notes..."
          />
          <div className="flex items-center justify-between mt-1.5">
            {fieldErrors.notes ? (
              <p className="text-sm text-red-600">{fieldErrors.notes}</p>
            ) : (
              <span />
            )}
            <p
              className={`text-xs tabular-nums ${
                formValues.notes.length >= 5000
                  ? 'text-red-500 font-medium'
                  : formValues.notes.length >= 4500
                    ? 'text-amber-500'
                    : 'text-slate-400'
              }`}
            >
              {formValues.notes.length} / 5000
            </p>
          </div>
        </Card>
      </div>
    </>
  );
}

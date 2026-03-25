import { type SelectHTMLAttributes } from 'react';

type SelectOption = {
  label: string;
  value: string;
};

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  hint?: string;
  error?: string;
  options: SelectOption[];
};

export default function SelectField({
  id,
  label,
  hint,
  error,
  options,
  className,
  ...props
}: SelectFieldProps) {
  return (
    <label className="field-group" htmlFor={id}>
      <span className="field-label">{label}</span>
      {hint ? <span className="field-hint">{hint}</span> : null}
      <select
        id={id}
        className={['ui-select', error ? 'has-error' : '', className]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <span className="field-error">{error}</span> : null}
    </label>
  );
}

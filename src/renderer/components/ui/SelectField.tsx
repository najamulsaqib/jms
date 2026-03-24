import { type SelectHTMLAttributes } from 'react';

type SelectOption = {
  label: string;
  value: string;
};

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: SelectOption[];
};

export default function SelectField({
  id,
  label,
  options,
  className,
  ...props
}: SelectFieldProps) {
  return (
    <label className="field-group" htmlFor={id}>
      <span className="field-label">{label}</span>
      <select
        id={id}
        className={['ui-select', className].filter(Boolean).join(' ')}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

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
  className = '',
  ...props
}: SelectFieldProps) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      {hint && <p className="text-sm text-slate-500">{hint}</p>}
      <select
        id={id}
        className={`
          block w-full rounded-lg border border-slate-300 bg-white pl-3 pr-8 py-2.5 text-sm text-slate-900 shadow-sm
          focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20
          disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
          transition-colors
          ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : ''}
          ${className}
        `}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

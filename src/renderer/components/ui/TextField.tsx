import { type InputHTMLAttributes, type ReactNode } from 'react';

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
  suffix?: ReactNode;
};

export default function TextField({
  id,
  label,
  hint,
  error,
  suffix,
  className = '',
  ...props
}: TextFieldProps) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      {hint && <p className="text-sm text-slate-500">{hint}</p>}
      <div className="relative">
        <input
          id={id}
          type="text"
          className={`
            block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm
            placeholder:text-slate-400
            focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20
            disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
            transition-colors
            ${suffix ? 'pr-10' : ''}
            ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : ''}
            ${className}
          `}
          {...props}
        />
        {suffix && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {suffix}
          </div>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

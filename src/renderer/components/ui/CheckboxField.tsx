import { type InputHTMLAttributes } from 'react';

type CheckboxFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type'
> & {
  label: string;
  hint?: string;
};

export default function CheckboxField({
  id,
  label,
  hint,
  className = '',
  ...props
}: CheckboxFieldProps) {
  return (
    <label
      htmlFor={id}
      className={`flex w-full cursor-pointer items-start ${className}`}
    >
      <div className="flex h-5 items-center">
        <input
          id={id}
          type="checkbox"
          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          {...props}
        />
      </div>
      <div className="ml-3">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        {hint && <p className="text-sm text-slate-500">{hint}</p>}
      </div>
    </label>
  );
}

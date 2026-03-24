import { type InputHTMLAttributes } from 'react';

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string;
  hint?: string;
  error?: string;
};

export default function TextField({
  id,
  label,
  hint,
  error,
  className,
  ...props
}: TextFieldProps) {
  return (
    <label className="field-group" htmlFor={id}>
      <span className="field-label">{label}</span>
      {hint ? <span className="field-hint">{hint}</span> : null}
      <input
        id={id}
        type="text"
        className={['ui-input', error ? 'has-error' : '', className]
          .filter(Boolean)
          .join(' ')}
        {...props}
      />
      {error ? <span className="field-error">{error}</span> : null}
    </label>
  );
}

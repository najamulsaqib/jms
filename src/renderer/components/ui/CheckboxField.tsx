import { type InputHTMLAttributes } from 'react';

type CheckboxFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string;
  hint?: string;
};

export default function CheckboxField({
  id,
  label,
  hint,
  className,
  ...props
}: CheckboxFieldProps) {
  return (
    <label className={['checkbox-field', className].filter(Boolean).join(' ')} htmlFor={id}>
      <input id={id} type="checkbox" {...props} />
      <span>{label}</span>
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}

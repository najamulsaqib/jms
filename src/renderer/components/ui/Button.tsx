import React, { type ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  busy?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-sm',
  secondary:
    'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus:ring-blue-500',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm',
  ghost: 'bg-slate-100 text-slate-700 hover:bg-slate-200 focus:ring-slate-500',
};

// Padding when button has no icon (text only)
const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-sm',
};

// Square padding on mobile → normal padding on sm+
const iconSizeClasses: Record<ButtonSize, string> = {
  sm: 'p-1.5 sm:px-3 sm:py-1.5 text-xs',
  md: 'p-2 sm:px-4 sm:py-2 text-sm',
  lg: 'p-2.5 sm:px-5 sm:py-2.5 text-sm',
};

const iconDimensions: Record<ButtonSize, string> = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-4 w-4',
};

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={`animate-spin shrink-0 ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export default function Button({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  busy = false,
  icon: Icon,
  disabled,
  type = 'button',
  onClick,
  ...props
}: ButtonProps) {
  const hasIcon = !!Icon;
  const dim = iconDimensions[size];

  const classes = [
    'inline-flex items-center justify-center font-semibold rounded-lg whitespace-nowrap transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed',
    variantClasses[variant],
    hasIcon ? iconSizeClasses[size] : sizeClasses[size],
    !disabled && !busy && 'hover:-translate-y-0.5',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const handleClick: ButtonProps['onClick'] = (event) => {
    if (type === 'button') {
      event.preventDefault();
    }

    onClick?.(event);
  };

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || busy}
      onClick={handleClick}
      {...props}
    >
      {busy ? (
        <>
          <Spinner className={dim} />
          <span className="hidden sm:inline sm:ml-1.5">Processing…</span>
        </>
      ) : (
        <>
          {Icon && <Icon className={`${dim} shrink-0`} />}
          {children && (
            <span
              className={hasIcon ? 'hidden sm:inline sm:ml-1.5' : undefined}
            >
              {children}
            </span>
          )}
        </>
      )}
    </button>
  );
}

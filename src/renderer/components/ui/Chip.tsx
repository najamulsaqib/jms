import React from 'react';

export interface ChipProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: 'default' | 'grey' | 'primary' | 'outline' | 'green' | 'red' | 'amber' | 'purple' | 'blue' | 'teal' | 'cyan' | 'indigo' | 'violet' | 'fuchsia' | 'pink' | 'rose' | 'sky' | 'emerald' | 'lime' | 'yellow' | 'orange';
  size?: 'sm' | 'md' | 'lg';
  rounded?: 'default' | 'full';
  icon?: React.ReactNode;
  onRemove?: () => void;
  clickable?: boolean;
}

const variantClasses = {
  default: 'bg-slate-100 text-slate-700',
  grey: 'bg-slate-200 text-slate-700',
  primary: 'bg-blue-100 text-blue-700',
  outline: 'border border-slate-300 bg-transparent text-slate-700',
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
  amber: 'bg-amber-100 text-amber-700',
  purple: 'bg-purple-100 text-purple-700',
  blue: 'bg-sky-100 text-sky-700',
  teal: 'bg-teal-100 text-teal-700',
  cyan: 'bg-cyan-100 text-cyan-700',
  indigo: 'bg-indigo-100 text-indigo-700',
  violet: 'bg-violet-100 text-violet-700',
  fuchsia: 'bg-fuchsia-100 text-fuchsia-700',
  pink: 'bg-pink-100 text-pink-700',
  rose: 'bg-rose-100 text-rose-700',
  sky: 'bg-sky-100 text-sky-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  lime: 'bg-lime-100 text-lime-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  orange: 'bg-orange-100 text-orange-700',
};

const sizeClasses = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm',
  lg: 'px-4 py-2 text-base',
};

const roundedClasses = {
  default: 'rounded-md',
  full: 'rounded-full',
};

export const Chip = React.forwardRef<HTMLDivElement, ChipProps>(
  (
    {
      children,
      variant = 'default',
      size = 'sm',
      rounded = 'default',
      className = '',
      icon,
      onRemove,
      clickable = false,
      onClick,
      ...props
    },
    ref
  ) => {
    const Component = clickable || onClick ? 'button' : 'div';

    return (
      <Component
        ref={ref as any}
        className={`
          inline-flex items-center font-medium transition-colors
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${roundedClasses[rounded]}
          ${clickable || onClick ? 'cursor-pointer hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2' : ''}
          ${className}
        `}
        onClick={onClick}
        type={Component === 'button' ? 'button' : undefined}
        {...(props as any)}
      >
        {icon && <span className="mr-1.5 flex items-center">{icon}</span>}
        <span className="flex items-center capitalize">{children}</span>
        {onRemove && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="ml-1.5 inline-flex items-center justify-center rounded-full hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-offset-2"
            aria-label="Remove"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </Component>
    );
  }
);

Chip.displayName = 'Chip';

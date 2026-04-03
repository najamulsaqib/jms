interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default';
  size?: 'sm' | 'md';
}

const variantClasses = {
  success: 'bg-green-100 text-green-800 ring-green-600/20',
  warning: 'bg-yellow-100 text-yellow-800 ring-yellow-600/20',
  danger: 'bg-red-100 text-red-800 ring-red-600/20',
  info: 'bg-blue-100 text-blue-800 ring-blue-600/20',
  default: 'bg-slate-100 text-slate-800 ring-slate-600/20',
};

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
};

export default function Badge({ children, variant = 'default', size = 'sm' }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center rounded-full font-medium ring-1 ring-inset
        ${variantClasses[variant]}
        ${sizeClasses[size]}
      `}
    >
      {children}
    </span>
  );
}

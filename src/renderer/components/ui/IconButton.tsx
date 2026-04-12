import React, { ReactNode } from 'react';

interface IconButtonProps {
  icon: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  variant?: 'default' | 'subtle' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'p-1',
  md: 'p-1.5',
  lg: 'p-2',
};

const variantClasses = {
  default:
    'hover:bg-slate-200 active:bg-slate-300 transition-colors rounded-md',
  subtle: 'hover:bg-slate-100 active:bg-slate-200 transition-colors rounded-md',
  danger:
    'text-slate-400 hover:bg-red-50 hover:text-red-600 active:bg-red-100 transition-colors rounded-md',
};

export default function IconButton({
  icon,
  onClick,
  disabled = false,
  title,
  type = 'button',
  className = '',
  variant = 'default',
  size = 'md',
}: IconButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {icon}
    </button>
  );
}

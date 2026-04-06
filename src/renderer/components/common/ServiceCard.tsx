import React from 'react';
import { useNavigate } from 'react-router-dom';

interface ServiceCardProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  stats?: {
    label: string;
    value: string | number;
  };
  color?: 'blue' | 'green' | 'purple' | 'orange';
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-50',
    icon: 'text-blue-600',
    hover: 'hover:bg-blue-100',
    border: 'border-blue-200',
  },
  green: {
    bg: 'bg-green-50',
    icon: 'text-green-600',
    hover: 'hover:bg-green-100',
    border: 'border-green-200',
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'text-purple-600',
    hover: 'hover:bg-purple-100',
    border: 'border-purple-200',
  },
  orange: {
    bg: 'bg-orange-50',
    icon: 'text-orange-600',
    hover: 'hover:bg-orange-100',
    border: 'border-orange-200',
  },
};

export default function ServiceCard({
  title,
  description,
  icon: Icon,
  href,
  stats,
  color = 'blue',
}: ServiceCardProps) {
  const navigate = useNavigate();
  const colors = colorClasses[color];

  return (
    <button
      type="button"
      onClick={() => navigate(href)}
      className="group relative bg-white rounded-xl border border-slate-200 p-6 text-left transition-all hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div
          className={`shrink-0 ${colors.bg} ${colors.border} border rounded-lg p-3`}
        >
          <Icon className={`h-6 w-6 ${colors.icon}`} />
        </div>
        {stats && (
          <div className="ml-4 text-right">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              {stats.label}
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {stats.value}
            </p>
          </div>
        )}
      </div>

      <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600 line-clamp-2">{description}</p>
    </button>
  );
}

interface StatCardProps {
  label: string;
  value: number | string;
  subtext?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'green' | 'orange' | 'red' | 'blue';
}

const colorClasses = {
  green: {
    border: 'border-green-300',
    iconBg: 'bg-green-100',
    icon: 'text-green-400',
  },
  orange: {
    border: 'border-orange-200',
    iconBg: 'bg-orange-50',
    icon: 'text-orange-300',
  },
  red: {
    border: 'border-red-300',
    iconBg: 'bg-red-50',
    icon: 'text-red-400',
  },
  blue: {
    border: 'border-blue-300',
    iconBg: 'bg-blue-50',
    icon: 'text-blue-400',
  },
};

export default function StatCard({
  label,
  value,
  subtext,
  icon: Icon,
  color,
}: StatCardProps) {
  const c = colorClasses[color];
  return (
    <div
      className={`flex items-center gap-3 bg-white rounded-xl border border-l-4 ${c.border} px-4 py-3 sm:px-5 sm:py-4 shadow-sm hover:shadow-md transition-shadow`}
    >
      <div
        className={`shrink-0 w-9 h-9 sm:w-10 sm:h-10 ${c.iconBg} rounded-lg flex items-center justify-center`}
      >
        <Icon className={`w-5 h-5 ${c.icon}`} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] sm:text-xs font-medium text-slate-400 uppercase tracking-wide truncate">
          {label}
        </p>
        <p className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
          {value}
        </p>
        {subtext && (
          <p className="text-[10px] sm:text-xs text-slate-400 truncate">
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
}

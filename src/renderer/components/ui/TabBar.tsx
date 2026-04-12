import { useState, type ComponentType, type ReactNode } from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  badge?: string | number;
}

interface TabBarProps {
  tabs: TabItem[];
  /** Controlled active tab id */
  value?: string;
  /** Initial tab id for uncontrolled mode */
  defaultValue?: string;
  onChange?: (id: string) => void;
  /** underline — navigation-style with bottom border indicator
   *  pills    — segmented toggle buttons (default) */
  variant?: 'underline' | 'pills';
  className?: string;
  /** Render prop receives the currently active tab id.
   *  Omit when you only need the tab bar (content rendered elsewhere). */
  children?: (activeId: string) => ReactNode;
}

export default function TabBar({
  tabs,
  value,
  defaultValue,
  onChange,
  variant = 'pills',
  className = '',
  children,
}: TabBarProps) {
  const [internalActive, setInternalActive] = useState(
    defaultValue ?? tabs[0]?.id ?? '',
  );

  // Support both controlled (value prop) and uncontrolled mode
  const activeId = value ?? internalActive;

  const handleSelect = (id: string) => {
    if (value === undefined) setInternalActive(id);
    onChange?.(id);
  };

  return (
    <div className={className}>
      {/* ── Underline variant ── */}
      {variant === 'underline' && (
        <div className="border-b border-slate-200">
          <div className="-mb-px flex overflow-x-auto">
            {tabs.map((tab) => {
              const active = activeId === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleSelect(tab.id)}
                  className={`flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                    active
                      ? 'border-blue-600 text-blue-700'
                      : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                  }`}
                >
                  {Icon && (
                    <Icon
                      className={`h-4 w-4 ${active ? 'text-blue-600' : 'text-slate-400'}`}
                    />
                  )}
                  {tab.label}
                  {tab.badge !== undefined && (
                    <span
                      className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold ${
                        active
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Pills variant ── */}
      {variant === 'pills' && (
        <div className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1.5">
          {tabs.map((tab) => {
            const active = activeId === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleSelect(tab.id)}
                className={`flex flex-1 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                  active
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {Icon && (
                  <Icon
                    className={`h-4 w-4 shrink-0 ${active ? 'text-blue-600' : 'text-slate-400'}`}
                  />
                )}
                {tab.label}
                {tab.badge !== undefined && (
                  <span
                    className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold ${
                      active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Tab content via render prop */}
      {children && <div className="mt-4">{children(activeId)}</div>}
    </div>
  );
}

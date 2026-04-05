import { UserCircleIcon } from '@heroicons/react/24/outline';
import Card from '@components/ui/Card';
import { useAuth } from '@contexts/AuthContext';
import type { SectionItem, SettingsSection } from './settings.types';

interface SettingsSidebarProps {
  activeSection: SettingsSection;
  sections: SectionItem[];
  onSelectSection: (section: SettingsSection) => void;
}

export default function SettingsSidebar({
  activeSection,
  sections,
  onSelectSection,
}: SettingsSidebarProps) {
  const { userInfo } = useAuth();

  return (
    <Card padding="none" className="overflow-hidden border-slate-200">
      <div className="border-b border-slate-200 bg-white px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-blue-100 bg-blue-50">
            <UserCircleIcon className="h-7 w-7 text-blue-500" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {userInfo?.fullName || userInfo?.email || 'Account'}
            </p>
            <p className="truncate text-xs text-slate-500">
              {userInfo?.email ?? 'Not signed in'}
            </p>
          </div>
        </div>
      </div>

      <nav className="p-2">
        {sections.map((section) => {
          const active = activeSection === section.id;
          const Icon = section.icon;

          return (
            <button
              key={section.id}
              type="button"
              onClick={() => onSelectSection(section.id)}
              className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
              {section.label}
            </button>
          );
        })}
      </nav>
    </Card>
  );
}

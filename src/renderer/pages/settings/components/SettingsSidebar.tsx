import Card from '@components/ui/Card';
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
  return (
    <>
      {/* ── Small screens: horizontal tab bar ── */}
      <div className="lg:hidden">
        <div className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1.5">
          {sections.map((section) => {
            const active = activeSection === section.id;
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => onSelectSection(section.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                  active
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${active ? 'text-blue-600' : 'text-slate-400'}`}
                />
                {section.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Large screens: vertical sidebar card ── */}
      <Card
        padding="none"
        className="hidden lg:block overflow-hidden border-slate-200"
      >
        <nav className="p-2">
          {sections.map((section) => {
            const active = activeSection === section.id;
            const Icon = section.icon;

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => onSelectSection(section.id)}
                className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm font-medium transition-colors cursor-pointer ${
                  active
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${active ? 'text-blue-600' : 'text-slate-400'}`}
                />
                {section.label}
              </button>
            );
          })}
        </nav>
      </Card>
    </>
  );
}

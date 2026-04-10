// src/renderer/pages/settings/index.tsx
import AppLayout from '@components/layout/AppLayout';
import {
  UserGroupIcon,
  Squares2X2Icon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import { useState } from 'react';
import SettingsSidebar from './components/SettingsSidebar';
import UpdateChannelSection from './components/UpdateChannelSection';
import UserInfoSection from './components/UserInfoSection';
import PortalPagesSection from './components/PortalPagesSection';
import type { SettingsSection, SectionItem } from './components/settings.types';

const sections: SectionItem[] = [
  {
    id: 'users',
    label: 'Users',
    description: 'Account and profile details',
    icon: UserGroupIcon,
  },
  {
    id: 'portals',
    label: 'Portals',
    description: 'Web portals and custom pages',
    icon: GlobeAltIcon,
  },
  {
    id: 'updates',
    label: 'Updates',
    description: 'Release track and update checks',
    icon: Squares2X2Icon,
  },
];

function SettingsContent() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('users');

  return (
    <div className="mx-auto">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900">
            Settings
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Manage your account and application preferences
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <SettingsSidebar
            activeSection={activeSection}
            sections={sections}
            onSelectSection={setActiveSection}
          />
        </aside>

        <div className="space-y-6">
          {activeSection === 'users' && <UserInfoSection />}

          {activeSection === 'portals' && <PortalPagesSection />}

          {activeSection === 'updates' && <UpdateChannelSection />}
        </div>
      </div>
    </div>
  );
}

export default function Settings() {
  return (
    <AppLayout title="Settings" breadcrumbs={[{ label: 'Settings' }]}>
      <SettingsContent />
    </AppLayout>
  );
}

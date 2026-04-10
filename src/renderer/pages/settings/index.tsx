// src/renderer/pages/settings/index.tsx
import AppLayout from '@components/layout/AppLayout';
import {
  UserGroupIcon,
  UsersIcon,
  Squares2X2Icon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import { useState } from 'react';
import { useAuth } from '@contexts/AuthContext';
import SettingsSidebar from './components/SettingsSidebar';
import UpdateChannelSection from './components/UpdateChannelSection';
import UserInfoSection from './components/UserInfoSection';
import PortalPagesSection from './components/PortalPagesSection';
import TeamManagementSection from './components/TeamManagementSection';
import type { SettingsSection, SectionItem } from './components/settings.types';

const allSections: SectionItem[] = [
  {
    id: 'users',
    label: 'Users',
    description: 'Account and profile details',
    icon: UserGroupIcon,
  },
  {
    id: 'team',
    label: 'Team Management',
    description: 'Manage team members',
    icon: UsersIcon,
    adminOnly: true,
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
  const { userInfo } = useAuth();
  const [activeSection, setActiveSection] = useState<SettingsSection>('users');

  // Filter sections based on admin role
  const sections = allSections.filter(
    (section) => !section.adminOnly || userInfo?.isAdmin,
  );

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
          {
            {
              users: <UserInfoSection />,
              team: <TeamManagementSection />,
              portals: <PortalPagesSection />,
              updates: <UpdateChannelSection />,
            }[activeSection]
          }
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

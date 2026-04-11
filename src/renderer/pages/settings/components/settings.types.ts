import type { ComponentType } from 'react';

export type SettingsSection = 'users' | 'team' | 'portals' | 'updates';

export interface SectionItem {
  id: SettingsSection;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

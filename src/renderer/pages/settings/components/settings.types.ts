import type { ComponentType } from 'react';

export type SettingsSection = 'users' | 'updates' | 'portals';

export interface SectionItem {
  id: SettingsSection;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}

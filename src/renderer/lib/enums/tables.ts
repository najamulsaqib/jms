export const TABLES = {
  TAX_RECORDS: 'tax_records',
  PORTAL_PAGES: 'portal_pages',
  PROFILES: 'profiles',
  AUDIT_LOGS: 'audit_logs',
  USER_PERMISSIONS: 'user_permissions',
} as const;

export type TableName = (typeof TABLES)[keyof typeof TABLES];

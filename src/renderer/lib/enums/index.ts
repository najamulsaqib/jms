export { TABLES, type TableName } from './tables';
export { EDGE_FUNCTIONS, type EdgeFunctionName } from './edgeFunctions';

export const MODULES = {
  TAX_RECORD: 'tax-record',
  PORTAL_PAGE: 'portal-page',
  AUTH: 'auth',
  TEAM_MANAGEMENT: 'team-management',
  USER_PERMISSIONS: 'user-permissions',
} as const;

export type ModuleName = (typeof MODULES)[keyof typeof MODULES];

export const AUDIT_ACTIONS = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  BULK_CREATE: 'bulk-create',
  BULK_UPDATE: 'bulk-update',
  BULK_DELETE: 'bulk-delete',
  EXPORT_PDF: 'export-pdf',
  EXPORT_CSV: 'export-csv',
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

/** Snapshot `event` field values stored in audit_logs.snapshot JSONB */
export const AUDIT_EVENTS = {
  PDF_EXPORTED: 'pdf_exported',
  CSV_EXPORTED: 'csv_exported',
  BULK_STATUS_UPDATED_SELECTED: 'bulk_status_updated_selected',
  BULK_STATUS_UPDATED_ALL: 'bulk_status_updated_all',
} as const;

export type AuditEvent = (typeof AUDIT_EVENTS)[keyof typeof AUDIT_EVENTS];

/* Standard page sizes for pagination. */
export const PAGE_SIZE = {
  TABLES: 10,
  AUDIT_LOGS: 5,
  BULK_OPERATIONS: 1000,
};

export type PageSize = (typeof PAGE_SIZE)[keyof typeof PAGE_SIZE];

/* Interval constants in milliseconds for various polling or refresh operations. */
export const INTERVALS = {
  NETWORK_CHECK: 1500,
  REFRESH: 1500,
  QUERY_STALE: 300000, // 5 minutes
};

export type IntervalName = (typeof INTERVALS)[keyof typeof INTERVALS];

/* Local storage keys for persisting user preferences or app state. */
export const PAGE_KEYS = {
  TAX_RECORDS: 'tax-records',
  PORTAL_PAGES: 'portal-pages',
  AUDIT_LOGS: 'audit-logs',
  TEAM_MANAGEMENT: 'team-management',
  MANAGED_USERS: 'managed-users',
};

export type PageKey = (typeof PAGE_KEYS)[keyof typeof PAGE_KEYS];

/** Map MODULES to their corresponding PAGE_KEYS for query key construction */
export const MODULE_TO_PAGE_KEY: Record<string, string> = {
  [MODULES.TAX_RECORD]: PAGE_KEYS.TAX_RECORDS,
  [MODULES.PORTAL_PAGE]: PAGE_KEYS.PORTAL_PAGES,
  [MODULES.TEAM_MANAGEMENT]: PAGE_KEYS.TEAM_MANAGEMENT,
  [MODULES.AUTH]: PAGE_KEYS.MANAGED_USERS,
  [MODULES.USER_PERMISSIONS]: PAGE_KEYS.MANAGED_USERS,
};

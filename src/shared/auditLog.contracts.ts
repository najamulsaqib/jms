export type AuditLogAction = string;

export interface AuditLog {
  id: number;
  module: string;
  recordId: string | null;
  action: AuditLogAction;
  changedBy: string | null;
  managedBy: string | null;
  changedByName: string | null;
  changes: Record<string, { from: unknown; to: unknown }> | null;
  snapshot: Record<string, unknown> | null;
  createdAt: string;
}

export interface CreateAuditLogInput {
  module: string;
  recordId?: string | null;
  action: AuditLogAction;
  changedByName: string;
  managedBy?: string | null;
  changes?: Record<string, { from: unknown; to: unknown }>;
  snapshot?: Record<string, unknown>;
}

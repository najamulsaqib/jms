import { toCamelCase } from '@lib/caseTransform';
import { TABLES } from '@lib/enums';
import { supabase } from '@lib/supabase';
import {
  AuditLog,
  AuditLogAction,
  CreateAuditLogInput,
} from '@shared/auditLog.contracts';

function mapRow(row: Record<string, unknown>): AuditLog {
  const r = toCamelCase(row);
  return {
    id: r.id as number,
    module: (r.module as string) ?? '',
    recordId: (r.recordId as string | null) ?? null,
    action: (r.action as AuditLogAction) ?? 'created',
    changedBy: (r.changedBy as string | null) ?? null,
    managedBy: (r.managedBy as string | null) ?? null,
    changedByName: (r.changedByName as string | null) ?? null,
    changes: (r.changes as AuditLog['changes']) ?? null,
    snapshot: (r.snapshot as AuditLog['snapshot']) ?? null,
    createdAt: (r.createdAt as string) ?? '',
  };
}

export const auditLogApi = {
  /**
   * Write an immutable audit log entry.
   * Silently ignores errors so that a failed audit log never blocks the main operation.
   */
  async log(input: CreateAuditLogInput): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from(TABLES.AUDIT_LOGS).insert({
      module: input.module,
      record_id: input.recordId ?? null,
      action: input.action,
      changed_by: user?.id ?? null,
      managed_by: input.managedBy ?? null,
      changed_by_name: input.changedByName,
      changes: input.changes ?? null,
      snapshot: input.snapshot ?? null,
    });

    if (error) {
      console.warn('[auditLog] Failed to write audit entry:', error.message);
    }
  },

  /**
   * Fetch a page of audit log entries for a module.
   * If `recordId` is provided, entries are scoped to that record.
   */
  async get(
    module: string,
    options?: {
      recordId?: string | null;
      page?: number;
      pageSize?: number;
    },
  ): Promise<{ data: AuditLog[]; total: number }> {
    const recordId = options?.recordId ?? null;
    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? 5;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from(TABLES.AUDIT_LOGS)
      .select('*', { count: 'exact' })
      .eq('module', module)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (recordId) {
      query = query.eq('record_id', recordId);
    }

    const { data, error, count } = await query;

    if (error) throw new Error(error.message);
    return {
      data: (data as Record<string, unknown>[]).map(mapRow),
      total: count ?? 0,
    };
  },
};

/**
 * Diff two plain objects and return only changed fields.
 * Returns `null` if nothing changed.
 */
export function diffRecord(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): Record<string, { from: unknown; to: unknown }> | null {
  const changes: Record<string, { from: unknown; to: unknown }> = {};

  const SKIP_FIELDS = new Set(['createdAt', 'updatedAt', 'id']);

  for (const key of Object.keys(after)) {
    if (SKIP_FIELDS.has(key)) continue;
    const oldVal = before[key];
    const newVal = after[key];
    if (oldVal !== newVal) {
      changes[key] = { from: oldVal, to: newVal };
    }
  }

  return Object.keys(changes).length > 0 ? changes : null;
}

import {
  AUDIT_ACTIONS,
  AUDIT_EVENTS,
  MODULES,
  PAGE_SIZE,
  TABLES,
} from '@lib/enums';
import {
  CreateTaxRecordInput,
  TaxRecord,
  TaxRecordStatus,
  UpdateTaxRecordInput,
} from '@shared/taxRecord.contracts';
import { toCamelCase, toSnakeCase } from '../lib/caseTransform';
import { supabase } from '../lib/supabase';
import { auditLogApi, diffRecord } from './auditLog.api';

export type PaginatedListParams = {
  page: number;
  pageSize: number;
  sortKey: string;
  sortDirection: 'asc' | 'desc';
  search: string;
  searchField: string;
  referenceFilter: string[];
  statusFilter: string[];
};

export type TaxRecordUniquenessErrors = {
  cnic?: string;
  referenceNumber?: string;
};

const SORT_KEY_MAP: Record<string, string> = {
  referenceNumber: 'reference_number',
  name: 'name',
  cnic: 'cnic',
  email: 'email',
  reference: 'reference',
  status: 'status',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  id: 'id',
};

const SEARCH_FIELD_MAP: Record<string, string> = {
  referenceNumber: 'reference_number',
  name: 'name',
  cnic: 'cnic',
  email: 'email',
  phone: 'phone',
  reference: 'reference',
  status: 'status',
  notes: 'notes',
};

type SupabaseErrorLike = {
  code?: string | null;
  message: string;
  details?: string | null;
  hint?: string | null;
};

function mapSupabaseError(error: SupabaseErrorLike): Error {
  if (error.code === '23505') {
    // Composite unique constraint names contain the field name — match on that.
    const haystack =
      `${error.message} ${error.details ?? ''} ${error.hint ?? ''}`.toLowerCase();

    if (haystack.includes('email')) return new Error('Email already exists.');
    if (haystack.includes('cnic')) return new Error('CNIC already exists.');
    if (haystack.includes('reference_number'))
      return new Error('Reference number already exists.');
  }

  return new Error(error.message);
}

function mapRow(row: Record<string, unknown>): TaxRecord {
  const r = toCamelCase(row);
  return {
    id: r.id as number,
    referenceNumber: r.referenceNumber as string,
    name: r.name as string,
    cnic: r.cnic as string,
    phone: (r.phone as string) || '',
    email: (r.email as string) || '',
    password: (r.password as string) || '',
    reference: r.reference as string,
    status: r.status as TaxRecordStatus,
    notes: (r.notes as string) || '',
    createdAt: r.createdAt as string,
    updatedAt: r.updatedAt as string,
  };
}

/**
 * Returns the effective owner ID for tax records.
 * - Managed users: returns their admin's ID (profile.managed_by)
 * - Admin users:   returns their own ID
 * Records created by managed users are stored under the admin's user_id
 * so the whole team shares one record pool.
 */
async function getEffectiveOwnerId(): Promise<{
  ownerId: string;
  actorName: string;
}> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) {
    await supabase.auth.signOut();
    throw new Error('Not authenticated');
  }
  const user = session.user;

  const { data: profile } = await supabase
    .from(TABLES.PROFILES)
    .select('managed_by, full_name')
    .eq('user_id', user.id)
    .maybeSingle();

  const managedBy = (profile?.managed_by as string | undefined) ?? undefined;
  const ownerId = managedBy ?? user.id;
  const actorName =
    (profile?.full_name as string | undefined) ?? user.email ?? 'Unknown';
  return { ownerId, actorName };
}

function toDeletionChanges(
  record: TaxRecord,
): Record<string, { from: unknown; to: unknown }> {
  return Object.entries(record).reduce<
    Record<string, { from: unknown; to: unknown }>
  >((acc, [field, value]) => {
    acc[field] = { from: value, to: null };
    return acc;
  }, {});
}

function formatIdentity(record: Pick<TaxRecord, 'name' | 'cnic'>): string {
  return `${record.name} (${record.cnic})`;
}

function formatIdentityList(
  records: Array<Pick<TaxRecord, 'name' | 'cnic'>>,
): string {
  if (records.length === 0) return '';
  const MAX_ITEMS = 20;
  const items = records.slice(0, MAX_ITEMS).map(formatIdentity);
  const remaining = records.length - items.length;
  return remaining > 0
    ? `${items.join(', ')}, +${remaining} more`
    : items.join(', ');
}

export const taxRecordApi = {
  async getExistingUniqueValues(): Promise<{
    cnics: Set<string>;
    referenceNumbers: Set<string>;
  }> {
    const { ownerId } = await getEffectiveOwnerId();
    const { data, error } = await supabase
      .from(TABLES.TAX_RECORDS)
      .select('cnic, reference_number')
      .eq('user_id', ownerId);

    if (error) throw mapSupabaseError(error);

    return {
      cnics: new Set((data ?? []).map((r) => r.cnic as string)),
      referenceNumbers: new Set(
        (data ?? []).map((r) => (r.reference_number as string).toLowerCase()),
      ),
    };
  },

  async validateUniqueness(
    payload: Pick<CreateTaxRecordInput, 'referenceNumber' | 'cnic'>,
    excludeId?: number,
  ): Promise<TaxRecordUniquenessErrors> {
    // Uniqueness is scoped per owner (admin's user_id for the whole team)
    const { ownerId } = await getEffectiveOwnerId();

    const checkExists = async (
      column: 'cnic' | 'reference_number',
      value: string,
    ): Promise<boolean> => {
      let query = supabase
        .from(TABLES.TAX_RECORDS)
        .select('id', { head: true, count: 'exact' })
        .eq('user_id', ownerId)
        .eq(column, value);

      if (typeof excludeId === 'number') {
        query = query.neq('id', excludeId);
      }

      const { count, error } = await query;
      if (error) throw mapSupabaseError(error);
      return (count ?? 0) > 0;
    };

    // Run checks in parallel and collect every error at once.
    const [cnicExists, refNumberExists] = await Promise.all([
      checkExists('cnic', payload.cnic.trim()),
      checkExists('reference_number', payload.referenceNumber.trim()),
    ]);

    const errors: TaxRecordUniquenessErrors = {};
    if (cnicExists) errors.cnic = 'CNIC already exists.';
    if (refNumberExists)
      errors.referenceNumber = 'Reference number already exists.';

    return errors;
  },

  async list(): Promise<TaxRecord[]> {
    const { data, error } = await supabase
      .from(TABLES.TAX_RECORDS)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw mapSupabaseError(error);
    return (data as Record<string, unknown>[]).map(mapRow);
  },

  async listForExport(): Promise<TaxRecord[]> {
    const allRows: Record<string, unknown>[] = [];
    let from = 0;

    while (true) {
      const { data, error } = await supabase
        .from(TABLES.TAX_RECORDS)
        .select('*')
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .range(from, from + PAGE_SIZE.BULK_OPERATIONS - 1);

      if (error) throw mapSupabaseError(error);

      const chunk = (data ?? []) as Record<string, unknown>[];
      allRows.push(...chunk);

      if (chunk.length < PAGE_SIZE.BULK_OPERATIONS) break;
      from += PAGE_SIZE.BULK_OPERATIONS;
    }

    return allRows.map(mapRow);
  },

  async getById(id: number): Promise<TaxRecord> {
    // RLS enforces team access — no explicit user_id filter needed
    const { data, error } = await supabase
      .from(TABLES.TAX_RECORDS)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw mapSupabaseError(error);
    if (!data) throw new Error('Record not found');
    return mapRow(data as Record<string, unknown>);
  },

  async create(payload: CreateTaxRecordInput): Promise<TaxRecord> {
    const { ownerId, actorName } = await getEffectiveOwnerId();

    const { data, error } = await supabase
      .from(TABLES.TAX_RECORDS)
      .insert(toSnakeCase({ ...payload, userId: ownerId }))
      .select()
      .single();

    if (error) throw mapSupabaseError(error);
    const created = mapRow(data as Record<string, unknown>);

    await auditLogApi.log({
      module: MODULES.TAX_RECORD,
      recordId: created.referenceNumber,
      action: AUDIT_ACTIONS.CREATE,
      changedByName: actorName,
      managedBy: ownerId,
      snapshot: created as unknown as Record<string, unknown>,
    });

    return created;
  },

  async bulkCreate(payloads: CreateTaxRecordInput[]): Promise<TaxRecord[]> {
    const { ownerId, actorName } = await getEffectiveOwnerId();

    const { data, error } = await supabase
      .from(TABLES.TAX_RECORDS)
      .insert(payloads.map((p) => toSnakeCase({ ...p, userId: ownerId })))
      .select();

    if (error) throw mapSupabaseError(error);
    const created = (data as Record<string, unknown>[]).map(mapRow);

    await Promise.all(
      created.map((record) =>
        auditLogApi.log({
          module: MODULES.TAX_RECORD,
          recordId: record.referenceNumber,
          action: AUDIT_ACTIONS.BULK_CREATE,
          changedByName: actorName,
          managedBy: ownerId,
          snapshot: record as unknown as Record<string, unknown>,
        }),
      ),
    );

    return created;
  },

  async update(id: number, payload: UpdateTaxRecordInput): Promise<TaxRecord> {
    const { ownerId, actorName } = await getEffectiveOwnerId();

    // Fetch the current state for diff (RLS guards access)
    const before = await taxRecordApi.getById(id);

    const { data, error } = await supabase
      .from(TABLES.TAX_RECORDS)
      .update(toSnakeCase({ ...payload, updatedAt: new Date().toISOString() }))
      .eq('id', id)
      .select()
      .single();

    if (error) throw mapSupabaseError(error);
    const updated = mapRow(data as Record<string, unknown>);

    const changes = diffRecord(
      before as unknown as Record<string, unknown>,
      updated as unknown as Record<string, unknown>,
    );

    await auditLogApi.log({
      module: MODULES.TAX_RECORD,
      recordId: updated.referenceNumber,
      action: AUDIT_ACTIONS.UPDATE,
      changedByName: actorName,
      managedBy: ownerId,
      changes: changes ?? undefined,
      snapshot: updated as unknown as Record<string, unknown>,
    });

    return updated;
  },

  async remove(id: number): Promise<void> {
    const { ownerId, actorName } = await getEffectiveOwnerId();

    // Snapshot before delete
    const record = await taxRecordApi.getById(id);
    const changes = toDeletionChanges(record);

    const { error } = await supabase
      .from(TABLES.TAX_RECORDS)
      .delete()
      .eq('id', id);

    if (error) throw mapSupabaseError(error);

    await auditLogApi.log({
      module: MODULES.TAX_RECORD,
      recordId: record.referenceNumber,
      action: AUDIT_ACTIONS.DELETE,
      changedByName: actorName,
      managedBy: ownerId,
      changes,
      snapshot: record as unknown as Record<string, unknown>,
    });
  },

  async getByIds(ids: number[]): Promise<TaxRecord[]> {
    // RLS enforces team access
    const { data, error } = await supabase
      .from(TABLES.TAX_RECORDS)
      .select('*')
      .in('id', ids);

    if (error) throw mapSupabaseError(error);
    return (data as Record<string, unknown>[]).map(mapRow);
  },

  async bulkRemove(ids: number[]): Promise<void> {
    const { ownerId, actorName } = await getEffectiveOwnerId();

    // Snapshot records before deletion
    const records = await taxRecordApi.getByIds(ids);

    const { error } = await supabase
      .from(TABLES.TAX_RECORDS)
      .delete()
      .in('id', ids);

    if (error) throw mapSupabaseError(error);

    await Promise.all(
      records.map((record) =>
        auditLogApi.log({
          module: MODULES.TAX_RECORD,
          recordId: record.referenceNumber,
          action: AUDIT_ACTIONS.BULK_DELETE,
          changedByName: actorName,
          managedBy: ownerId,
          changes: toDeletionChanges(record),
          snapshot: record as unknown as Record<string, unknown>,
        }),
      ),
    );
  },

  async logPdfExport(
    referenceNumber: string,
    details: {
      selectedFields: string[];
      selectedCount: number;
      totalFields: number;
    },
  ): Promise<void> {
    const { ownerId, actorName } = await getEffectiveOwnerId();

    await auditLogApi.log({
      module: MODULES.TAX_RECORD,
      recordId: referenceNumber,
      action: AUDIT_ACTIONS.EXPORT_PDF,
      changedByName: actorName,
      managedBy: ownerId,
      changes: {
        exportedFields: {
          from: null,
          to: details.selectedFields.join(', '),
        },
        exportedFieldCount: {
          from: null,
          to: `${details.selectedCount}/${details.totalFields}`,
        },
      },
      snapshot: {
        event: AUDIT_EVENTS.PDF_EXPORTED,
        referenceNumber,
        ...details,
      },
    });
  },

  async logCsvExport(
    records: TaxRecord[],
    details: {
      scope: 'all' | 'selected';
      selectedCount: number;
      totalFields: number;
      selectedFields: string[];
    },
  ): Promise<void> {
    const { ownerId, actorName } = await getEffectiveOwnerId();

    await auditLogApi.log({
      module: MODULES.TAX_RECORD,
      recordId: null,
      action: AUDIT_ACTIONS.EXPORT_CSV,
      changedByName: actorName,
      managedBy: ownerId,
      changes: {
        exportScope: {
          from: null,
          to: details.scope,
        },
        exportedCount: {
          from: null,
          to: String(records.length),
        },
        exportedFields: {
          from: null,
          to: details.selectedFields.join(', '),
        },
        exportedFieldCount: {
          from: null,
          to: `${details.selectedCount}/${details.totalFields}`,
        },
        exportedNamesAndCnics: {
          from: null,
          to: formatIdentityList(records),
        },
      },
      snapshot: {
        event: AUDIT_EVENTS.CSV_EXPORTED,
        records: records.map((record) => ({
          referenceNumber: record.referenceNumber,
          name: record.name,
          cnic: record.cnic,
        })),
        ...details,
      },
    });
  },

  async listPaginated(
    params: PaginatedListParams,
  ): Promise<{ data: TaxRecord[]; total: number }> {
    const {
      page,
      pageSize,
      sortKey,
      sortDirection,
      search,
      searchField,
      referenceFilter,
      statusFilter,
    } = params;

    let query = supabase
      .from(TABLES.TAX_RECORDS)
      .select('*', { count: 'exact' });

    if (referenceFilter.length > 0) {
      query = query.in('reference', referenceFilter);
    }
    if (statusFilter.length > 0) {
      query = query.in('status', statusFilter);
    }
    if (search.trim()) {
      const term = search.trim();
      if (searchField === 'all') {
        query = query.or(
          `reference_number.ilike.%${term}%,name.ilike.%${term}%,cnic.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%,reference.ilike.%${term}%,status.ilike.%${term}%,notes.ilike.%${term}%`,
        );
      } else {
        const col = SEARCH_FIELD_MAP[searchField] ?? 'name';
        query = query.ilike(col, `%${term}%`);
      }
    }

    const dbSortKey = SORT_KEY_MAP[sortKey] ?? 'created_at';
    query = query.order(dbSortKey, { ascending: sortDirection === 'asc' });

    const from = page * pageSize;
    query = query.range(from, from + pageSize - 1);

    const { data, error, count } = await query;
    if (error) throw mapSupabaseError(error);
    return {
      data: (data as Record<string, unknown>[]).map(mapRow),
      total: count ?? 0,
    };
  },

  async listStatusCounts(): Promise<{
    active: number;
    inactive: number;
    lateFiler: number;
  }> {
    const [activeRes, inactiveRes, lateFilerRes] = await Promise.all([
      supabase
        .from(TABLES.TAX_RECORDS)
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active'),
      supabase
        .from(TABLES.TAX_RECORDS)
        .select('*', { count: 'exact', head: true })
        .eq('status', 'inactive'),
      supabase
        .from(TABLES.TAX_RECORDS)
        .select('*', { count: 'exact', head: true })
        .eq('status', 'late-filer'),
    ]);
    return {
      active: activeRes.count ?? 0,
      inactive: inactiveRes.count ?? 0,
      lateFiler: lateFilerRes.count ?? 0,
    };
  },

  async listDistinctReferences(): Promise<string[]> {
    const references = new Set<string>();
    let from = 0;

    while (true) {
      const { data, error } = await supabase
        .from(TABLES.TAX_RECORDS)
        .select('reference')
        .order('reference')
        .range(from, from + PAGE_SIZE.BULK_OPERATIONS - 1);

      if (error) throw mapSupabaseError(error);

      const chunk = (data ?? []) as { reference: string | null }[];
      chunk.forEach((row) => {
        if (row.reference) references.add(row.reference);
      });

      if (chunk.length < PAGE_SIZE.BULK_OPERATIONS) break;
      from += PAGE_SIZE.BULK_OPERATIONS;
    }

    return Array.from(references).sort((a, b) => a.localeCompare(b));
  },

  async getTotalCount(): Promise<number> {
    const { count, error } = await supabase
      .from(TABLES.TAX_RECORDS)
      .select('*', { count: 'exact', head: true });
    if (error) throw mapSupabaseError(error);
    return count ?? 0;
  },

  async bulkUpdateStatus(
    ids: number[],
    status: TaxRecordStatus,
  ): Promise<void> {
    const { ownerId, actorName } = await getEffectiveOwnerId();

    if (ids.length === 0) return;

    const before = await taxRecordApi.getByIds(ids);

    // Explicit owner filter prevents broad updates and supports safe-update guards.
    const { error } = await supabase
      .from(TABLES.TAX_RECORDS)
      .update({ status, updated_at: new Date().toISOString() })
      .eq('user_id', ownerId)
      .in('id', ids);
    if (error) throw mapSupabaseError(error);

    await auditLogApi.log({
      module: MODULES.TAX_RECORD,
      recordId: null,
      action: AUDIT_ACTIONS.BULK_UPDATE,
      changedByName: actorName,
      managedBy: ownerId,
      changes: {
        updatedCount: {
          from: null,
          to: String(before.length),
        },
        updatedNamesAndCnics: {
          from: null,
          to: formatIdentityList(before),
        },
        targetStatus: {
          from: null,
          to: status,
        },
      },
      snapshot: {
        event: AUDIT_EVENTS.BULK_STATUS_UPDATED_SELECTED,
        status,
        records: before.map((record) => ({
          referenceNumber: record.referenceNumber,
          name: record.name,
          cnic: record.cnic,
          previousStatus: record.status,
        })),
      },
    });
  },

  async bulkUpdateAllStatus(
    status: TaxRecordStatus,
    filters?: {
      search?: string;
      searchField?: string;
      referenceFilter?: string[];
      statusFilter?: string[];
    },
  ): Promise<void> {
    const { ownerId, actorName } = await getEffectiveOwnerId();

    let beforeQuery = supabase
      .from(TABLES.TAX_RECORDS)
      .select('*')
      .eq('user_id', ownerId);

    if (filters) {
      if (filters.referenceFilter && filters.referenceFilter.length > 0) {
        beforeQuery = beforeQuery.in('reference', filters.referenceFilter);
      }
      if (filters.statusFilter && filters.statusFilter.length > 0) {
        beforeQuery = beforeQuery.in('status', filters.statusFilter);
      }
      if (filters.search && filters.search.trim()) {
        const term = filters.search.trim();
        if (filters.searchField === 'all') {
          beforeQuery = beforeQuery.or(
            `reference_number.ilike.%${term}%,name.ilike.%${term}%,cnic.ilike.%${term}%,email.ilike.%${term}%,reference.ilike.%${term}%,status.ilike.%${term}%,notes.ilike.%${term}%`,
          );
        } else if (filters.searchField) {
          const col = SEARCH_FIELD_MAP[filters.searchField] ?? 'name';
          beforeQuery = beforeQuery.ilike(col, `%${term}%`);
        }
      }
    }

    const { data: beforeData, error: beforeError } = await beforeQuery;
    if (beforeError) throw mapSupabaseError(beforeError);
    const before = (beforeData as Record<string, unknown>[]).map(mapRow);

    // Always scope to effective owner (admin id for managed users, self for admins).
    let query = supabase
      .from(TABLES.TAX_RECORDS)
      .update({ status, updated_at: new Date().toISOString() })
      .eq('user_id', ownerId);

    if (filters) {
      if (filters.referenceFilter && filters.referenceFilter.length > 0) {
        query = query.in('reference', filters.referenceFilter);
      }
      if (filters.statusFilter && filters.statusFilter.length > 0) {
        query = query.in('status', filters.statusFilter);
      }
      if (filters.search && filters.search.trim()) {
        const term = filters.search.trim();
        if (filters.searchField === 'all') {
          query = query.or(
            `reference_number.ilike.%${term}%,name.ilike.%${term}%,cnic.ilike.%${term}%,email.ilike.%${term}%,reference.ilike.%${term}%,status.ilike.%${term}%,notes.ilike.%${term}%`,
          );
        } else if (filters.searchField) {
          const col = SEARCH_FIELD_MAP[filters.searchField] ?? 'name';
          query = query.ilike(col, `%${term}%`);
        }
      }
    }

    const { error } = await query;
    if (error) throw mapSupabaseError(error);

    await auditLogApi.log({
      module: MODULES.TAX_RECORD,
      recordId: null,
      action: AUDIT_ACTIONS.BULK_UPDATE,
      changedByName: actorName,
      managedBy: ownerId,
      changes: {
        updatedCount: {
          from: null,
          to: String(before.length),
        },
        updatedNamesAndCnics: {
          from: null,
          to: formatIdentityList(before),
        },
        targetStatus: {
          from: null,
          to: status,
        },
      },
      snapshot: {
        event: AUDIT_EVENTS.BULK_STATUS_UPDATED_ALL,
        status,
        filters: filters ?? null,
        records: before.map((record) => ({
          referenceNumber: record.referenceNumber,
          name: record.name,
          cnic: record.cnic,
          previousStatus: record.status,
        })),
      },
    });
  },
};

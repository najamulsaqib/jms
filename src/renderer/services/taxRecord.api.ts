import { supabase } from '../lib/supabase';
import { toCamelCase, toSnakeCase } from '../lib/caseTransform';
import {
  CreateTaxRecordInput,
  TaxRecord,
  TaxRecordStatus,
  UpdateTaxRecordInput,
} from '@shared/taxRecord.contracts';

export type PaginatedListParams = {
  page: number;
  pageSize: number;
  sortKey: string;
  sortDirection: 'asc' | 'desc';
  search: string;
  searchField: string;
  referenceFilter: string;
  statusFilter: string;
};

export type TaxRecordUniquenessErrors = {
  email?: string;
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
  reference: 'reference',
  status: 'status',
  notes: 'notes',
};

// ─── Supabase SQL ────────────────────────────────────────────────────────────
//
// Initial table creation:
//
//   create table tax_records (
//     id               bigint generated always as identity primary key,
//     reference_number text not null,
//     name             text not null,
//     cnic             text not null,
//     email            text not null,
//     password         text not null,
//     reference        text not null default '',
//     status           text not null check (status in ('active', 'inactive', 'late-filer')),
//     notes            text not null default '',
//     user_id          uuid references auth.users(id) not null,
//     created_at       timestamptz not null default now(),
//     updated_at       timestamptz not null default now()
//   );
//
//   alter table tax_records enable row level security;
//
//   create policy "Users manage own records"
//     on tax_records for all
//     using  (auth.uid() = user_id)
//     with check (auth.uid() = user_id);
//
// Migration — drop global unique constraints, replace with per-user uniques:
//
// alter table tax_records drop constraint if exists tax_records_email_key;
// alter table tax_records drop constraint if exists tax_records_cnic_key;
// alter table tax_records drop constraint if exists tax_records_reference_number_key;
//
// alter table tax_records
//   add constraint tax_records_user_email_unique          unique (user_id, email),
//   add constraint tax_records_user_cnic_unique           unique (user_id, cnic),
//   add constraint tax_records_user_reference_number_unique unique (user_id, reference_number);
//
// ─────────────────────────────────────────────────────────────────────────────

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
    email: r.email as string,
    password: r.password as string,
    reference: r.reference as string,
    status: r.status as TaxRecordStatus,
    notes: (r.notes as string) || '',
    createdAt: r.createdAt as string,
    updatedAt: r.updatedAt as string,
  };
}

async function getCurrentUserId(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) {
    // Logout the user if no session exists
    await supabase.auth.signOut();
    throw new Error('Not authenticated');
  }
  return session.user.id;
}

export const taxRecordApi = {
  async getExistingUniqueValues(): Promise<{
    emails: Set<string>;
    cnics: Set<string>;
    referenceNumbers: Set<string>;
  }> {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('tax_records')
      .select('email, cnic, reference_number')
      .eq('user_id', userId);

    if (error) throw mapSupabaseError(error);

    return {
      emails: new Set(
        (data ?? []).map((r) => (r.email as string).toLowerCase()),
      ),
      cnics: new Set((data ?? []).map((r) => r.cnic as string)),
      referenceNumbers: new Set(
        (data ?? []).map((r) => (r.reference_number as string).toLowerCase()),
      ),
    };
  },

  async validateUniqueness(
    payload: Pick<CreateTaxRecordInput, 'referenceNumber' | 'cnic' | 'email'>,
    excludeId?: number,
  ): Promise<TaxRecordUniquenessErrors> {
    // Uniqueness is scoped per user — RLS handles this automatically,
    // but we also pass user_id explicitly for clarity.
    const userId = await getCurrentUserId();

    const checkExists = async (
      column: 'email' | 'cnic' | 'reference_number',
      value: string,
    ): Promise<boolean> => {
      let query = supabase
        .from('tax_records')
        .select('id', { head: true, count: 'exact' })
        .eq('user_id', userId)
        .eq(column, value);

      if (typeof excludeId === 'number') {
        query = query.neq('id', excludeId);
      }

      const { count, error } = await query;
      if (error) throw mapSupabaseError(error);
      return (count ?? 0) > 0;
    };

    // Run all three checks in parallel and collect every error at once.
    const [emailExists, cnicExists, refNumberExists] = await Promise.all([
      checkExists('email', payload.email.trim()),
      checkExists('cnic', payload.cnic.trim()),
      checkExists('reference_number', payload.referenceNumber.trim()),
    ]);

    const errors: TaxRecordUniquenessErrors = {};
    if (emailExists) errors.email = 'Email already exists.';
    if (cnicExists) errors.cnic = 'CNIC already exists.';
    if (refNumberExists)
      errors.referenceNumber = 'Reference number already exists.';

    return errors;
  },

  async list(): Promise<TaxRecord[]> {
    const { data, error } = await supabase
      .from('tax_records')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw mapSupabaseError(error);
    return (data as Record<string, unknown>[]).map(mapRow);
  },

  async getById(id: number): Promise<TaxRecord> {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('tax_records')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw mapSupabaseError(error);
    if (!data) throw new Error('Record not found');
    return mapRow(data as Record<string, unknown>);
  },

  async create(payload: CreateTaxRecordInput): Promise<TaxRecord> {
    const userId = await getCurrentUserId();

    const { data, error } = await supabase
      .from('tax_records')
      .insert(toSnakeCase({ ...payload, userId }))
      .select()
      .single();

    if (error) throw mapSupabaseError(error);
    return mapRow(data as Record<string, unknown>);
  },

  async bulkCreate(payloads: CreateTaxRecordInput[]): Promise<TaxRecord[]> {
    const userId = await getCurrentUserId();

    const { data, error } = await supabase
      .from('tax_records')
      .insert(payloads.map((p) => toSnakeCase({ ...p, userId })))
      .select();

    if (error) throw mapSupabaseError(error);
    return (data as Record<string, unknown>[]).map(mapRow);
  },

  async update(id: number, payload: UpdateTaxRecordInput): Promise<TaxRecord> {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('tax_records')
      .update(toSnakeCase({ ...payload, updatedAt: new Date().toISOString() }))
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw mapSupabaseError(error);
    return mapRow(data as Record<string, unknown>);
  },

  async remove(id: number): Promise<void> {
    const userId = await getCurrentUserId();
    const { error } = await supabase
      .from('tax_records')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw mapSupabaseError(error);
  },

  async bulkRemove(ids: number[]): Promise<void> {
    const userId = await getCurrentUserId();
    const { error } = await supabase
      .from('tax_records')
      .delete()
      .in('id', ids)
      .eq('user_id', userId);

    if (error) throw mapSupabaseError(error);
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

    let query = supabase.from('tax_records').select('*', { count: 'exact' });

    if (referenceFilter !== 'all') {
      query = query.eq('reference', referenceFilter);
    }
    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }
    if (search.trim()) {
      const term = search.trim();
      if (searchField === 'all') {
        query = query.or(
          `reference_number.ilike.%${term}%,name.ilike.%${term}%,cnic.ilike.%${term}%,email.ilike.%${term}%,reference.ilike.%${term}%,status.ilike.%${term}%,notes.ilike.%${term}%`,
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
        .from('tax_records')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active'),
      supabase
        .from('tax_records')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'inactive'),
      supabase
        .from('tax_records')
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
    const { data, error } = await supabase
      .from('tax_records')
      .select('reference')
      .order('reference');
    if (error) throw mapSupabaseError(error);
    return [
      ...new Set((data as { reference: string }[]).map((r) => r.reference)),
    ];
  },

  async getTotalCount(): Promise<number> {
    const { count, error } = await supabase
      .from('tax_records')
      .select('*', { count: 'exact', head: true });
    if (error) throw mapSupabaseError(error);
    return count ?? 0;
  },

  async bulkUpdateStatus(
    ids: number[],
    status: TaxRecordStatus,
  ): Promise<void> {
    const userId = await getCurrentUserId();
    const { error } = await supabase
      .from('tax_records')
      .update({ status, updated_at: new Date().toISOString() })
      .in('id', ids)
      .eq('user_id', userId);
    if (error) throw mapSupabaseError(error);
  },

  async bulkUpdateAllStatus(
    status: TaxRecordStatus,
    filters?: {
      search?: string;
      searchField?: string;
      referenceFilter?: string;
      statusFilter?: string;
    },
  ): Promise<void> {
    const userId = await getCurrentUserId();

    let query = supabase
      .from('tax_records')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    if (filters) {
      if (filters.referenceFilter && filters.referenceFilter !== 'all') {
        query = query.eq('reference', filters.referenceFilter);
      }
      if (filters.statusFilter && filters.statusFilter !== 'all') {
        query = query.eq('status', filters.statusFilter);
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
  },
};

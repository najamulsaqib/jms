import { supabase } from '../lib/supabase';
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

// Supabase SQL migration — run this in your Supabase SQL editor:
//
// create table tax_records (
//   id bigint generated always as identity primary key,
//   reference_number text not null unique,
//   name text not null,
//   cnic text not null unique,
//   email text not null unique,
//   password text not null,
//   reference text not null default '',
//   status text not null check (status in ('active', 'inactive', 'late-filer')),
//   notes text not null default '',
//   user_id uuid references auth.users(id) not null,
//   created_at timestamptz not null default now(),
//   updated_at timestamptz not null default now()
// );

// alter table tax_records enable row level security;

// create policy "Users manage own records"
//   on tax_records for all
//   using (auth.uid() = user_id)
//   with check (auth.uid() = user_id);

type SupabaseRow = {
  id: number;
  reference_number: string;
  name: string;
  cnic: string;
  email: string;
  password: string;
  reference: string;
  status: string;
  notes: string;
  user_id: string;
  created_at: string;
  updated_at: string;
};

type SupabaseErrorLike = {
  code?: string | null;
  message: string;
  details?: string | null;
  hint?: string | null;
};

function mapSupabaseError(error: SupabaseErrorLike): Error {
  const haystack = `${error.message} ${error.details ?? ''} ${error.hint ?? ''}`
    .toLowerCase()
    .trim();

  if (error.code === '23505' || haystack.includes('duplicate key value')) {
    if (haystack.includes('email')) {
      return new Error('Email already exists.');
    }
    if (haystack.includes('cnic')) {
      return new Error('CNIC already exists.');
    }
    if (
      haystack.includes('reference_number') ||
      haystack.includes('reference')
    ) {
      return new Error('Reference number already exists.');
    }
  }

  return new Error(error.message);
}

function mapRow(row: SupabaseRow): TaxRecord {
  return {
    id: row.id,
    referenceNumber: row.reference_number,
    name: row.name,
    cnic: row.cnic,
    email: row.email,
    password: row.password,
    reference: row.reference,
    status: row.status as TaxRecordStatus,
    notes: row.notes || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getCurrentUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

export const taxRecordApi = {
  async validateUniqueness(
    payload: Pick<CreateTaxRecordInput, 'referenceNumber' | 'cnic' | 'email'>,
    excludeId?: number,
  ): Promise<TaxRecordUniquenessErrors> {
    const runCountQuery = async (
      column: 'email' | 'cnic' | 'reference_number',
      value: string,
    ) => {
      let query = supabase
        .from('tax_records')
        .select('id', { head: true, count: 'exact' })
        .eq(column, value);

      if (typeof excludeId === 'number') {
        query = query.neq('id', excludeId);
      }

      const { count, error } = await query;
      if (error) throw mapSupabaseError(error);
      return (count ?? 0) > 0;
    };

    const [emailExists, cnicExists, referenceNumberExists] = await Promise.all([
      runCountQuery('email', payload.email.trim()),
      runCountQuery('cnic', payload.cnic.trim()),
      runCountQuery('reference_number', payload.referenceNumber.trim()),
    ]);

    const errors: TaxRecordUniquenessErrors = {};

    if (emailExists) {
      errors.email = 'Email already exists.';
    }
    if (cnicExists) {
      errors.cnic = 'CNIC already exists.';
    }
    if (referenceNumberExists) {
      errors.referenceNumber = 'Reference number already exists.';
    }

    return errors;
  },

  async list(): Promise<TaxRecord[]> {
    const { data, error } = await supabase
      .from('tax_records')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw mapSupabaseError(error);
    return (data as SupabaseRow[]).map(mapRow);
  },

  async getById(id: number): Promise<TaxRecord> {
    const { data, error } = await supabase
      .from('tax_records')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw mapSupabaseError(error);
    return mapRow(data as SupabaseRow);
  },

  async create(payload: CreateTaxRecordInput): Promise<TaxRecord> {
    const userId = await getCurrentUserId();

    const { data, error } = await supabase
      .from('tax_records')
      .insert({
        reference_number: payload.referenceNumber,
        name: payload.name,
        cnic: payload.cnic,
        email: payload.email,
        password: payload.password,
        reference: payload.reference,
        status: payload.status,
        notes: payload.notes,
        user_id: userId,
      })
      .select()
      .single();

    if (error) throw mapSupabaseError(error);
    return mapRow(data as SupabaseRow);
  },

  async bulkCreate(payloads: CreateTaxRecordInput[]): Promise<TaxRecord[]> {
    const userId = await getCurrentUserId();

    const { data, error } = await supabase
      .from('tax_records')
      .insert(
        payloads.map((p) => ({
          reference_number: p.referenceNumber,
          name: p.name,
          cnic: p.cnic,
          email: p.email,
          password: p.password,
          reference: p.reference,
          status: p.status,
          notes: p.notes,
          user_id: userId,
        })),
      )
      .select();

    if (error) throw mapSupabaseError(error);
    return (data as SupabaseRow[]).map(mapRow);
  },

  async update(id: number, payload: UpdateTaxRecordInput): Promise<TaxRecord> {
    const { data, error } = await supabase
      .from('tax_records')
      .update({
        reference_number: payload.referenceNumber,
        name: payload.name,
        cnic: payload.cnic,
        email: payload.email,
        password: payload.password,
        reference: payload.reference,
        status: payload.status,
        notes: payload.notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw mapSupabaseError(error);
    return mapRow(data as SupabaseRow);
  },

  async remove(id: number): Promise<void> {
    const { error } = await supabase.from('tax_records').delete().eq('id', id);

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
    return { data: (data as SupabaseRow[]).map(mapRow), total: count ?? 0 };
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
    const { error } = await supabase
      .from('tax_records')
      .update({ status, updated_at: new Date().toISOString() })
      .in('id', ids);
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
    let query = supabase
      .from('tax_records')
      .update({ status, updated_at: new Date().toISOString() });

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

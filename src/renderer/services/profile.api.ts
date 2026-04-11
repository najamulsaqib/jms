import { toCamelCase, toSnakeCase } from '@lib/caseTransform';
import { TABLES } from '@lib/enums/tables';
import { supabase } from '@lib/supabase';

export type ProfileRow = {
  userId: string;
  fullName: string;
  companyName: string;
  address: string;
  phoneNumber: string;
  description: string;
  avatarUrl: string;
  createdAt: string;
  updatedAt: string;
  role: 'admin' | 'user';
  managedBy: string | null;
};

export type UpdateProfileInput = {
  fullName: string;
  companyName: string;
  address: string;
  phoneNumber: string;
  description: string;
  avatarUrl: string;
};

const PROFILE_SELECT =
  'user_id, full_name, company_name, address, phone_number, description, avatar_url, created_at, updated_at, role, managed_by';

type SupabaseErrorLike = {
  code?: string | null;
  message: string;
  details?: string | null;
  hint?: string | null;
};

function mapSupabaseError(error: SupabaseErrorLike): Error {
  return new Error(error.message);
}

function mapRow(row: Record<string, unknown>): ProfileRow {
  const r = toCamelCase(row);
  return {
    userId: (r.userId as string) ?? '',
    fullName: (r.fullName as string) ?? '',
    companyName: (r.companyName as string) ?? '',
    address: (r.address as string) ?? '',
    phoneNumber: (r.phoneNumber as string) ?? '',
    description: (r.description as string) ?? '',
    avatarUrl: (r.avatarUrl as string) ?? '',
    createdAt: (r.createdAt as string) ?? '',
    updatedAt: (r.updatedAt as string) ?? '',
    role: ((r.role as string) ?? 'user') as 'admin' | 'user',
    managedBy: (r.managedBy as string | null) ?? null,
  };
}

async function getCurrentUserId(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    await supabase.auth.signOut();
    throw new Error('Not authenticated');
  }

  return session.user.id;
}

export const profileApi = {
  async getCurrentProfile(): Promise<ProfileRow | null> {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from(TABLES.PROFILES)
      .select(PROFILE_SELECT)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw mapSupabaseError(error);
    if (!data) return null;
    return mapRow(data as Record<string, unknown>);
  },

  async upsertCurrentProfile(payload: UpdateProfileInput): Promise<ProfileRow> {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from(TABLES.PROFILES)
      .upsert(
        toSnakeCase({
          userId,
          ...payload,
          updatedAt: new Date().toISOString(),
        }),
        { onConflict: 'user_id' },
      )
      .select(PROFILE_SELECT)
      .single();

    if (error) throw mapSupabaseError(error);
    return mapRow(data as Record<string, unknown>);
  },
};

import { supabase } from '@lib/supabase';
import { toCamelCase, toSnakeCase } from '@lib/caseTransform';

export type ManagedUser = {
  userId: string;
  email: string;
  fullName: string;
  companyName: string;
  role: 'admin' | 'user';
  createdAt: string;
  updatedAt: string;
};

export type CreateManagedUserInput = {
  email: string;
  password: string;
  fullName: string;
  companyName: string;
};

export type UpdateManagedUserInput = {
  fullName: string;
  companyName: string;
};

type SupabaseErrorLike = {
  code?: string | null;
  message: string;
  details?: string | null;
  hint?: string | null;
};

function mapSupabaseError(error: SupabaseErrorLike): Error {
  return new Error(error.message);
}

async function getCurrentAdminId(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    throw new Error('Not authenticated');
  }

  return session.user.id;
}

function mapUserRow(row: Record<string, unknown>): ManagedUser {
  const r = toCamelCase(row);
  return {
    userId: (r.userId as string) ?? '',
    email: (r.email as string) ?? '',
    fullName: (r.fullName as string) ?? '',
    companyName: (r.companyName as string) ?? '',
    role: ((r.role as string) ?? 'user') as 'admin' | 'user',
    createdAt: (r.createdAt as string) ?? '',
    updatedAt: (r.updatedAt as string) ?? '',
  };
}

export const teamManagementApi = {
  /**
   * List all users managed by the current admin
   */
  async getManagedUsers(): Promise<ManagedUser[]> {
    const adminId = await getCurrentAdminId();

    const { data, error } = await supabase
      .from('profiles')
      .select(
        'user_id, created_at, updated_at, role, full_name, company_name, email',
      )
      .eq('managed_by', adminId)
      .returns<any[]>();

    if (error) throw mapSupabaseError(error);

    return (data || []).map((row) =>
      mapUserRow({
        ...row,
        email: row.email,
        userId: row.user_id,
        fullName: row.full_name,
        companyName: row.company_name,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }),
    );
  },

  /**
   * Create a new user managed by the current admin
   * This requires admin privileges and creates both auth user and profile
   */
  async createManagedUser(
    payload: CreateManagedUserInput,
  ): Promise<ManagedUser> {
    const adminId = await getCurrentAdminId();

    // Call edge function to create user (requires backend implementation)
    const { data, error } = await supabase.functions.invoke(
      'create-managed-user',
      {
        body: {
          email: payload.email,
          password: payload.password,
          fullName: payload.fullName,
          companyName: payload.companyName,
          managedBy: adminId,
        },
      },
    );

    if (error) throw mapSupabaseError(error as SupabaseErrorLike);

    return mapUserRow(data as Record<string, unknown>);
  },

  /**
   * Update a managed user's profile information
   */
  async updateManagedUser(
    userId: string,
    payload: UpdateManagedUserInput,
  ): Promise<ManagedUser> {
    const adminId = await getCurrentAdminId();

    // Verify this user is managed by the current admin
    const { data: existing, error: fetchError } = await supabase
      .from('profiles')
      .select('user_id, managed_by')
      .eq('user_id', userId)
      .single();

    if (fetchError) throw mapSupabaseError(fetchError);
    if (existing?.managed_by !== adminId) {
      throw new Error('You do not have permission to modify this user');
    }

    // Update the profile
    const { data, error } = await supabase
      .from('profiles')
      .update(
        toSnakeCase({
          fullName: payload.fullName,
          companyName: payload.companyName,
          updatedAt: new Date().toISOString(),
        }),
      )
      .eq('user_id', userId)
      .select(
        'user_id, created_at, updated_at, role, full_name, company_name, email',
      )
      .single();

    if (error) throw mapSupabaseError(error);

    return mapUserRow({
      ...data,
      email: data.email,
      userId: data.user_id,
      fullName: data.full_name,
      companyName: data.company_name,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  },

  /**
   * Delete a managed user (mark as deleted or archive)
   * This is a soft delete - the user account is disabled but data is retained
   */
  async deleteManagedUser(userId: string): Promise<void> {
    const adminId = await getCurrentAdminId();

    // Verify this user is managed by the current admin
    const { data: existing, error: fetchError } = await supabase
      .from('profiles')
      .select('user_id, managed_by')
      .eq('user_id', userId)
      .single();

    if (fetchError) throw mapSupabaseError(fetchError);
    if (existing?.managed_by !== adminId) {
      throw new Error('You do not have permission to delete this user');
    }

    // Call edge function to delete user
    const { error } = await supabase.functions.invoke('delete-managed-user', {
      body: { userId },
    });

    if (error) throw mapSupabaseError(error as SupabaseErrorLike);
  },
};

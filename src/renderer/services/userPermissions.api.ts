import { supabase } from '@lib/supabase';
import { toCamelCase, toSnakeCase } from '@lib/caseTransform';
import {
  UpdateUserPermissionsInput,
  UserPermissions,
} from '@shared/userPermissions.contracts';

const COLUMNS =
  'id, user_id, can_create, can_update, can_delete, can_bulk_operations, can_export, created_at, updated_at';

function mapRow(row: Record<string, unknown>): UserPermissions {
  const r = toCamelCase(row);
  return {
    id: (r.id as string) ?? '',
    userId: (r.userId as string) ?? '',
    canCreate: (r.canCreate as boolean) ?? true,
    canUpdate: (r.canUpdate as boolean) ?? true,
    canDelete: (r.canDelete as boolean) ?? false,
    canBulkOperations: (r.canBulkOperations as boolean) ?? false,
    canExport: (r.canExport as boolean) ?? true,
    createdAt: (r.createdAt as string) ?? '',
    updatedAt: (r.updatedAt as string) ?? '',
  };
}

export const userPermissionsApi = {
  /** Get the current user's own permissions row (null if admin — admins don't have a row). */
  async getMyPermissions(): Promise<UserPermissions | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_permissions')
      .select(COLUMNS)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;
    return mapRow(data as Record<string, unknown>);
  },

  /** Admin: get permissions for a specific managed user. Auto-seeds defaults if no row exists. */
  async getForUser(userId: string): Promise<UserPermissions> {
    const { data, error } = await supabase
      .from('user_permissions')
      .select(COLUMNS)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (data) return mapRow(data as Record<string, unknown>);

    // No row yet — seed defaults (handles users created before this feature)
    return userPermissionsApi.createDefaults(userId);
  },

  /** Create a default permissions row for a newly created managed user. */
  async createDefaults(userId: string): Promise<UserPermissions> {
    const { data, error } = await supabase
      .from('user_permissions')
      .insert(
        toSnakeCase({
          userId,
          canCreate: true,
          canUpdate: true,
          canDelete: false,
          canBulkOperations: false,
          canExport: true,
        }),
      )
      .select(COLUMNS)
      .single();

    if (error) throw new Error(error.message);
    return mapRow(data as Record<string, unknown>);
  },

  /** Admin: update permissions for a managed user. Upserts so a missing row is created on first toggle. */
  async update(
    userId: string,
    input: UpdateUserPermissionsInput,
  ): Promise<UserPermissions> {
    const { data, error } = await supabase
      .from('user_permissions')
      .upsert(
        toSnakeCase({
          userId,
          canCreate: true,
          canUpdate: true,
          canDelete: false,
          canBulkOperations: false,
          canExport: true,
          ...input,
          updatedAt: new Date().toISOString(),
        }),
        { onConflict: 'user_id' },
      )
      .select(COLUMNS)
      .single();

    if (error) throw new Error(error.message);
    return mapRow(data as Record<string, unknown>);
  },
};

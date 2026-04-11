import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@contexts/AuthContext';
import { userPermissionsApi } from '@services/userPermissions.api';
import {
  ADMIN_PERMISSIONS,
  UpdateUserPermissionsInput,
  UserPermissions,
} from '@shared/userPermissions.contracts';

/**
 * Returns the effective permissions for the currently logged-in user.
 * - Admins: always get full permissions (no DB call).
 * - Managed users: fetches their permissions row from the DB.
 */
export function useMyPermissions(): {
  permissions: UserPermissions | null;
  loading: boolean;
} {
  const { userInfo } = useAuth();
  const isAdmin = userInfo?.isAdmin ?? false;

  const { data, isLoading } = useQuery({
    queryKey: ['myPermissions'],
    queryFn: () => userPermissionsApi.getMyPermissions(),
    enabled: !isAdmin, // admins skip DB lookup
    staleTime: 30_000,
  });

  if (isAdmin) {
    // Return synthetic full-permission object for admins — no DB lookup needed
    const adminPerms: UserPermissions = {
      id: 'admin',
      userId: '',
      ...ADMIN_PERMISSIONS,
      createdAt: '',
      updatedAt: '',
    };
    return { permissions: adminPerms, loading: false };
  }

  return { permissions: data ?? null, loading: isLoading };
}

/**
 * For admins: load and update permissions for a specific managed user.
 */
export function useTeamPermissions(userId: string | null): {
  permissions: UserPermissions | null; // null only while loading or userId is null
  loading: boolean;
  updatePermissions: (input: UpdateUserPermissionsInput) => Promise<void>;
} {
  const queryClient = useQueryClient();
  const queryKey = ['teamPermissions', userId];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => userPermissionsApi.getForUser(userId!),
    enabled: userId !== null,
    staleTime: 30_000,
  });

  const mutation = useMutation({
    mutationFn: (input: UpdateUserPermissionsInput) =>
      userPermissionsApi.update(userId!, input),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKey, updated);
    },
  });

  const updatePermissions = useCallback(
    async (input: UpdateUserPermissionsInput) => {
      await mutation.mutateAsync(input);
    },
    [mutation],
  );

  return {
    permissions: data ?? null,
    loading: isLoading,
    updatePermissions,
  };
}

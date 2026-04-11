import { refreshAuthSession } from '@lib/authSession';
import { INTERVALS, PAGE_KEYS, PAGE_SIZE } from '@lib/enums';
import {
  teamManagementApi,
  type CreateManagedUserInput,
  type ManagedUsersPaginationInput,
  type UpdateManagedUserInput,
} from '@services/teamManagement.api';
import { profileApi, type ProfileRow } from '@services/profile.api';
import { useAuth, type UserInfo } from '@contexts/AuthContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const MANAGED_USERS_QUERY_KEY_BASE = [
  PAGE_KEYS.TEAM_MANAGEMENT,
  PAGE_KEYS.MANAGED_USERS,
];

export function useTeamManagement(
  pagination: ManagedUsersPaginationInput = {
    page: 0,
    pageSize: PAGE_SIZE.TABLES,
  },
) {
  const queryClient = useQueryClient();
  const managedUsersQueryKey = [
    ...MANAGED_USERS_QUERY_KEY_BASE,
    pagination.page,
    pagination.pageSize,
  ];

  // Fetch managed users
  const { data, isLoading, error } = useQuery({
    queryKey: managedUsersQueryKey,
    queryFn: () => teamManagementApi.getManagedUsers(pagination),
    retry: 1,
    placeholderData: (prev) => prev,
  });

  const { data: summary } = useQuery({
    queryKey: [...MANAGED_USERS_QUERY_KEY_BASE, 'summary'],
    queryFn: () => teamManagementApi.getManagedUsersSummary(),
    retry: 1,
    staleTime: 15_000,
  });

  // Create managed user mutation
  const createUserMutation = useMutation({
    mutationFn: (payload: CreateManagedUserInput) =>
      teamManagementApi.createManagedUser(payload),
    onSuccess: async (newUser) => {
      queryClient.invalidateQueries({ queryKey: MANAGED_USERS_QUERY_KEY_BASE });
      toast.success(`User ${newUser.email} created successfully`);
      await refreshAuthSession();
    },
    onError: (err) => {
      const message =
        err instanceof Error ? err.message : 'Failed to create user';
      toast.error(message);
    },
  });

  // Update managed user mutation
  const updateUserMutation = useMutation({
    mutationFn: ({
      userId,
      payload,
    }: {
      userId: string;
      payload: UpdateManagedUserInput;
    }) => teamManagementApi.updateManagedUser(userId, payload),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: MANAGED_USERS_QUERY_KEY_BASE });
      toast.success('User updated successfully');
    },
    onError: (err) => {
      const message =
        err instanceof Error ? err.message : 'Failed to update user';
      toast.error(message);
    },
  });

  // Ban / unban managed user mutation
  const banUserMutation = useMutation({
    mutationFn: ({ userId, ban }: { userId: string; ban: boolean }) =>
      teamManagementApi.banManagedUser(userId, ban),
    onSuccess: async (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: MANAGED_USERS_QUERY_KEY_BASE });
      toast.success(
        updatedUser.isBanned
          ? `${updatedUser.email} has been banned`
          : `${updatedUser.email} has been unbanned`,
      );
      await refreshAuthSession();
    },
    onError: (err) => {
      const message =
        err instanceof Error ? err.message : 'Failed to update user status';
      toast.error(message);
    },
  });

  // Delete managed user mutation
  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => teamManagementApi.deleteManagedUser(userId),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: MANAGED_USERS_QUERY_KEY_BASE });
      toast.success('User deleted successfully');
      await refreshAuthSession();
    },
    onError: (err) => {
      const message =
        err instanceof Error ? err.message : 'Failed to delete user';
      toast.error(message);
    },
  });

  return {
    managedUsers: data?.data ?? [],
    total: data?.total ?? 0,
    activeCount: summary?.active ?? 0,
    bannedCount: summary?.banned ?? 0,
    isLoading,
    error: error instanceof Error ? error.message : null,
    createUser: createUserMutation.mutate,
    createUserAsync: createUserMutation.mutateAsync,
    isCreatingUser: createUserMutation.isPending,
    updateUser: updateUserMutation.mutate,
    updateUserAsync: updateUserMutation.mutateAsync,
    isUpdatingUser: updateUserMutation.isPending,
    banUser: banUserMutation.mutate,
    isBanningUser: banUserMutation.isPending,
    deleteUser: deleteUserMutation.mutate,
    deleteUserAsync: deleteUserMutation.mutateAsync,
    isDeletingUser: deleteUserMutation.isPending,
  };
}

/**
 * Resolves the admin's profile for the current session.
 * - If the current user is an admin, their own `userInfo` is returned directly.
 * - If the current user is a managed user, the owning admin's profile is fetched
 *   via `managedBy` and returned as a `ProfileRow`.
 */
export function useAdminProfile(): {
  adminProfile: ProfileRow | UserInfo | null;
  isLoading: boolean;
} {
  const { userInfo } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: [PAGE_KEYS.PROFILE, 'admin'],
    queryFn: () => profileApi.getAdminProfile(),
    enabled: !!userInfo && !userInfo.isAdmin,
    staleTime: INTERVALS.FIVE_MINUTES,
  });

  if (userInfo?.isAdmin) {
    return { adminProfile: userInfo, isLoading: false };
  }

  return { adminProfile: data ?? null, isLoading };
}

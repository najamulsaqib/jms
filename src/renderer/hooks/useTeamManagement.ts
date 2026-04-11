import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  teamManagementApi,
  type CreateManagedUserInput,
  type UpdateManagedUserInput,
  type ManagedUser,
} from '@services/teamManagement.api';
import { refreshAuthSession } from '@lib/authSession';
import { toast } from 'sonner';
import { PAGE_KEYS } from '@lib/enums';

const MANAGED_USERS_QUERY_KEY = [
  PAGE_KEYS.TEAM_MANAGEMENT,
  PAGE_KEYS.MANAGED_USERS,
];

export function useTeamManagement() {
  const queryClient = useQueryClient();

  // Fetch managed users
  const {
    data: managedUsers = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: MANAGED_USERS_QUERY_KEY,
    queryFn: () => teamManagementApi.getManagedUsers(),
    retry: 1,
  });

  // Create managed user mutation
  const createUserMutation = useMutation({
    mutationFn: (payload: CreateManagedUserInput) =>
      teamManagementApi.createManagedUser(payload),
    onSuccess: async (newUser) => {
      queryClient.setQueryData(
        MANAGED_USERS_QUERY_KEY,
        (prev: ManagedUser[] = []) => [...prev, newUser],
      );
      toast.success(`User ${newUser.email} created successfully`);
      await refreshAuthSession();
    },
    onError: (err) => {
      const message =
        err instanceof Error ? err.message : 'Failed to create user';
      toast.error(message);
      throw err;
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
    onSuccess: async (updatedUser) => {
      queryClient.setQueryData(
        MANAGED_USERS_QUERY_KEY,
        (prev: ManagedUser[] = []) =>
          prev.map((user) =>
            user.userId === updatedUser.userId ? updatedUser : user,
          ),
      );
      toast.success('User updated successfully');
    },
    onError: (err) => {
      const message =
        err instanceof Error ? err.message : 'Failed to update user';
      toast.error(message);
      throw err;
    },
  });

  // Ban / unban managed user mutation
  const banUserMutation = useMutation({
    mutationFn: ({ userId, ban }: { userId: string; ban: boolean }) =>
      teamManagementApi.banManagedUser(userId, ban),
    onSuccess: async (updatedUser) => {
      queryClient.setQueryData(
        MANAGED_USERS_QUERY_KEY,
        (prev: ManagedUser[] = []) =>
          prev.map((user) =>
            user.userId === updatedUser.userId ? updatedUser : user,
          ),
      );
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
      throw err;
    },
  });

  // Delete managed user mutation
  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => teamManagementApi.deleteManagedUser(userId),
    onSuccess: async (_, userId) => {
      queryClient.setQueryData(
        MANAGED_USERS_QUERY_KEY,
        (prev: ManagedUser[] = []) =>
          prev.filter((user) => user.userId !== userId),
      );
      toast.success('User deleted successfully');
      await refreshAuthSession();
    },
    onError: (err) => {
      const message =
        err instanceof Error ? err.message : 'Failed to delete user';
      toast.error(message);
      throw err;
    },
  });

  return {
    managedUsers,
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

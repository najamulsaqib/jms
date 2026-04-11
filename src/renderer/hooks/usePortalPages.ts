import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { portalPageApi } from '@services/portalPage.api';
import {
  CreatePortalPageInput,
  UpdatePortalPageInput,
} from '@shared/portalPage.contracts';
import { PAGE_KEYS } from '@lib/enums';

const PORTAL_PAGES_KEY = [PAGE_KEYS.PORTAL_PAGES];

export function usePortalPages() {
  const queryClient = useQueryClient();

  const {
    data: portalPages = [],
    isLoading: loading,
    error: queryError,
  } = useQuery({
    queryKey: PORTAL_PAGES_KEY,
    queryFn: () => portalPageApi.list(),
  });

  const error = queryError ? (queryError as Error).message : null;

  const addMutation = useMutation({
    mutationFn: (payload: CreatePortalPageInput) =>
      portalPageApi.create(payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: PORTAL_PAGES_KEY }),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdatePortalPageInput;
    }) => portalPageApi.update(id, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: PORTAL_PAGES_KEY }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => portalPageApi.remove(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: PORTAL_PAGES_KEY }),
  });

  const addPortalPage = async (payload: CreatePortalPageInput) => {
    try {
      await addMutation.mutateAsync(payload);
      return true;
    } catch {
      return false;
    }
  };

  const updatePortalPage = async (
    id: string,
    payload: UpdatePortalPageInput,
  ) => {
    try {
      await updateMutation.mutateAsync({ id, payload });
      return true;
    } catch {
      return false;
    }
  };

  const deletePortalPage = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      return true;
    } catch {
      return false;
    }
  };

  return {
    portalPages,
    loading,
    error,
    addPortalPage,
    updatePortalPage,
    deletePortalPage,
    isSaving: addMutation.isPending || updateMutation.isPending,
    deletingId: deleteMutation.isPending ? deleteMutation.variables : null,
    reload: () => queryClient.invalidateQueries({ queryKey: PORTAL_PAGES_KEY }),
  };
}

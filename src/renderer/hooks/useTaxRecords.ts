import { PAGE_KEYS } from '@lib/enums';
import { PaginatedListParams, taxRecordApi } from '@services/taxRecord.api';
import {
  CreateTaxRecordInput,
  TaxRecord,
  TaxRecordStatus,
  UpdateTaxRecordInput,
} from '@shared/taxRecord.contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const TAX_RECORDS_KEY = [PAGE_KEYS.TAX_RECORDS];

export function useTaxRecords() {
  const queryClient = useQueryClient();

  const {
    data: taxRecords = [],
    isLoading: loading,
    error: queryError,
  } = useQuery({
    queryKey: TAX_RECORDS_KEY,
    queryFn: () => taxRecordApi.list(),
  });

  const addMutation = useMutation({
    mutationFn: (payload: CreateTaxRecordInput) => taxRecordApi.create(payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: TAX_RECORDS_KEY }),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: UpdateTaxRecordInput;
    }) => taxRecordApi.update(id, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: TAX_RECORDS_KEY }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => taxRecordApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAX_RECORDS_KEY });
      queryClient.invalidateQueries({
        queryKey: [PAGE_KEYS.AUDIT_LOGS, PAGE_KEYS.TAX_RECORDS],
      });
    },
  });

  const addTaxRecord = async (payload: CreateTaxRecordInput) => {
    try {
      await addMutation.mutateAsync(payload);
      return true;
    } catch {
      return false;
    }
  };

  const updateTaxRecord = async (id: number, payload: UpdateTaxRecordInput) => {
    try {
      return await updateMutation.mutateAsync({ id, payload });
    } catch {
      return null;
    }
  };

  const deleteTaxRecord = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      return true;
    } catch {
      return false;
    }
  };

  const error =
    (queryError instanceof Error ? queryError.message : null) ||
    (addMutation.error instanceof Error ? addMutation.error.message : null) ||
    (updateMutation.error instanceof Error
      ? updateMutation.error.message
      : null) ||
    (deleteMutation.error instanceof Error
      ? deleteMutation.error.message
      : null) ||
    null;

  return {
    taxRecords,
    loading,
    submitting: addMutation.isPending || updateMutation.isPending,
    deletingId: deleteMutation.isPending
      ? (deleteMutation.variables as number)
      : null,
    error,
    addTaxRecord,
    updateTaxRecord,
    deleteTaxRecord,
    reload: () => queryClient.invalidateQueries({ queryKey: TAX_RECORDS_KEY }),
  };
}

export function usePaginatedTaxRecords(params: PaginatedListParams) {
  const queryClient = useQueryClient();
  const queryKey = [PAGE_KEYS.TAX_RECORDS, 'paginated', params];

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => taxRecordApi.listPaginated(params),
    placeholderData: (prev) => prev,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => taxRecordApi.remove(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: TAX_RECORDS_KEY }),
  });

  const deleteTaxRecord = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      return true;
    } catch {
      return false;
    }
  };

  return {
    records: data?.data ?? [],
    total: data?.total ?? 0,
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    deleteTaxRecord,
    deletingId: deleteMutation.isPending
      ? (deleteMutation.variables as number)
      : null,
    reload: () => queryClient.invalidateQueries({ queryKey: TAX_RECORDS_KEY }),
  };
}

export function useStatusCounts() {
  return useQuery({
    queryKey: [PAGE_KEYS.TAX_RECORDS, 'statusCounts'],
    queryFn: () => taxRecordApi.listStatusCounts(),
    staleTime: 30_000,
  });
}

export function useDistinctReferences() {
  return useQuery({
    queryKey: [PAGE_KEYS.TAX_RECORDS, 'references'],
    queryFn: () => taxRecordApi.listDistinctReferences(),
    staleTime: 60_000,
  });
}

export function useTotalCount() {
  return useQuery({
    queryKey: [PAGE_KEYS.TAX_RECORDS, 'totalCount'],
    queryFn: () => taxRecordApi.getTotalCount(),
    staleTime: 30_000,
  });
}

export function useTaxRecord(id: number | null) {
  const queryClient = useQueryClient();
  const detailKey = [PAGE_KEYS.TAX_RECORDS, 'detail', id];

  const {
    data: record,
    isLoading: loading,
    error: queryError,
  } = useQuery({
    queryKey: detailKey,
    queryFn: () => taxRecordApi.getById(id!),
    enabled: id !== null,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateTaxRecordInput) =>
      taxRecordApi.update(id!, payload),
    onSuccess: (updated: TaxRecord) => {
      queryClient.setQueryData(detailKey, updated);
      queryClient.invalidateQueries({ queryKey: TAX_RECORDS_KEY });
      queryClient.invalidateQueries({
        queryKey: [PAGE_KEYS.AUDIT_LOGS, PAGE_KEYS.TAX_RECORDS],
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => taxRecordApi.remove(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAX_RECORDS_KEY });
      queryClient.invalidateQueries({
        queryKey: [PAGE_KEYS.AUDIT_LOGS, PAGE_KEYS.TAX_RECORDS],
      });
    },
  });

  const updateTaxRecord = async (payload: UpdateTaxRecordInput) => {
    try {
      const updated = await updateMutation.mutateAsync(payload);
      return {
        data: updated,
        error: null as string | null,
      };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Failed to save record.',
      };
    }
  };

  const deleteTaxRecord = async () => {
    try {
      await deleteMutation.mutateAsync();
      return true;
    } catch {
      return false;
    }
  };

  const logPdfExport = async (details: {
    selectedFields: string[];
    selectedCount: number;
    totalFields: number;
  }) => {
    if (id === null || !record?.referenceNumber) return;
    try {
      await taxRecordApi.logPdfExport(record.referenceNumber, details);
      await queryClient.invalidateQueries({
        queryKey: [
          PAGE_KEYS.AUDIT_LOGS,
          PAGE_KEYS.TAX_RECORDS,
          record.referenceNumber,
        ],
      });
      await queryClient.invalidateQueries({
        queryKey: [PAGE_KEYS.AUDIT_LOGS, PAGE_KEYS.TAX_RECORDS],
      });
    } catch {
      // Keep export flow non-blocking if audit logging fails.
    }
  };

  return {
    record,
    loading,
    error: queryError instanceof Error ? queryError.message : null,
    updateTaxRecord,
    deleteTaxRecord,
    logPdfExport,
    saving: updateMutation.isPending,
    deleting: deleteMutation.isPending,
    updateError:
      updateMutation.error instanceof Error
        ? updateMutation.error.message
        : null,
    deleteError:
      deleteMutation.error instanceof Error
        ? deleteMutation.error.message
        : null,
  };
}

export function useBulkDeleteRecords() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (ids: number[]) => taxRecordApi.bulkRemove(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAX_RECORDS_KEY });
      queryClient.invalidateQueries({
        queryKey: [PAGE_KEYS.AUDIT_LOGS, PAGE_KEYS.TAX_RECORDS],
      });
    },
  });

  const bulkDelete = async (ids: number[]) => {
    try {
      await mutation.mutateAsync(ids);
      return true;
    } catch {
      return false;
    }
  };

  return {
    bulkDelete,
    isDeleting: mutation.isPending,
  };
}

export function useBulkUpdateStatus() {
  const queryClient = useQueryClient();

  const bulkUpdateMutation = useMutation({
    mutationFn: ({ ids, status }: { ids: number[]; status: TaxRecordStatus }) =>
      taxRecordApi.bulkUpdateStatus(ids, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAX_RECORDS_KEY });
      queryClient.invalidateQueries({
        queryKey: [PAGE_KEYS.AUDIT_LOGS, PAGE_KEYS.TAX_RECORDS],
      });
    },
  });

  const bulkUpdateAllMutation = useMutation({
    mutationFn: ({
      status,
      filters,
    }: {
      status: TaxRecordStatus;
      filters?: {
        search?: string;
        searchField?: string;
        referenceFilter?: string[];
        statusFilter?: string[];
      };
    }) => taxRecordApi.bulkUpdateAllStatus(status, filters),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAX_RECORDS_KEY });
      queryClient.invalidateQueries({
        queryKey: [PAGE_KEYS.AUDIT_LOGS, PAGE_KEYS.TAX_RECORDS],
      });
    },
  });

  const bulkUpdateStatus = async (ids: number[], status: TaxRecordStatus) => {
    try {
      await bulkUpdateMutation.mutateAsync({ ids, status });
      return true;
    } catch {
      return false;
    }
  };

  const bulkUpdateAllStatus = async (
    status: TaxRecordStatus,
    filters?: {
      search?: string;
      searchField?: string;
      referenceFilter?: string[];
      statusFilter?: string[];
    },
  ) => {
    try {
      await bulkUpdateAllMutation.mutateAsync({ status, filters });
      return true;
    } catch {
      return false;
    }
  };

  return {
    bulkUpdateStatus,
    bulkUpdateAllStatus,
    isUpdating: bulkUpdateMutation.isPending || bulkUpdateAllMutation.isPending,
    error:
      (bulkUpdateMutation.error instanceof Error
        ? bulkUpdateMutation.error.message
        : null) ||
      (bulkUpdateAllMutation.error instanceof Error
        ? bulkUpdateAllMutation.error.message
        : null),
  };
}

export function useExportRecords() {
  const mutation = useMutation({
    mutationFn: async (ids: number[]) =>
      ids.length > 0
        ? await taxRecordApi.getByIds(ids)
        : await taxRecordApi.listForExport(),
  });

  return {
    exportRecords: mutation.mutate,
    isExporting: mutation.isPending,
  };
}

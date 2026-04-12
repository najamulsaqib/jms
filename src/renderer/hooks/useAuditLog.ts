import { MODULE_TO_PAGE_KEY, PAGE_KEYS, PAGE_SIZE } from '@lib/enums';
import { auditLogApi } from '@services/auditLog.api';
import { AuditLog } from '@shared/auditLog.contracts';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

export function useAuditLog(
  module: string,
  recordId?: string | number | null,
  perPage = PAGE_SIZE.AUDIT_LOGS,
) {
  const id =
    recordId !== null && recordId !== undefined ? String(recordId) : null;
  const [page, setPage] = useState(1);
  const pageKey = MODULE_TO_PAGE_KEY[module] || module;

  const { data, isLoading, error } = useQuery({
    queryKey: [PAGE_KEYS.AUDIT_LOGS, pageKey, id ?? 'all', page, perPage],
    queryFn: () =>
      auditLogApi.get(module, {
        recordId: id,
        page,
        pageSize: perPage,
      }),
    enabled: Boolean(module),
    staleTime: 0,
    placeholderData: (prev) => prev,
  });

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return {
    logs: (data?.data ?? []) as AuditLog[],
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    page,
    totalPages,
    total,
    setPage,
  };
}

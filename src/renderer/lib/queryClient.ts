import { QueryClient } from '@tanstack/react-query';
import { INTERVALS } from './enums';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: INTERVALS.QUERY_STALE, // 5 minutes
      retry: 1,
    },
  },
});

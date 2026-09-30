import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './client';

/**
 * Defaults tuned for the backend's global 70 req/min/IP limit: data stays fresh for
 * 30 s, no refetch on window focus, and client errors (4xx) are never retried —
 * except 429, which backs off.
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (error instanceof ApiError) {
            if (error.status === 429) return failureCount < 2;
            if (error.status < 500) return false;
          }
          return failureCount < 2;
        },
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
      },
      mutations: { retry: false },
    },
  });
}

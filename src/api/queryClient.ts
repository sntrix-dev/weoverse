import { QueryCache, QueryClient } from '@tanstack/react-query';
import { toast } from '@/stores/ui';
import { ApiError } from './client';

const BUSY_EVERY_MS = 20_000;
let lastBusy = 0;

/** A read still refused after its backoff (429): said once in a while, not per screen (M12). */
function sayBusy(error: unknown) {
  if (!(error instanceof ApiError) || error.status !== 429) return;
  const now = Date.now();
  if (now - lastBusy < BUSY_EVERY_MS) return;
  lastBusy = now;
  toast('A lot is happening at once — give it a moment and try again');
}

/**
 * Defaults tuned for the backend's global 70 req/min/IP limit: data stays fresh for
 * 30 s, no refetch on window focus, and client errors (4xx) are never retried —
 * except 429, which backs off. Server errors: only a 502/503 is retried, once.
 */
export function createQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({ onError: sayBusy }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (error instanceof ApiError) {
            if (error.status === 429) return failureCount < 2;
            if (error.status < 500) return false;
            // live pass: a 500 answers the same way again and a 504 already waited its full deadline —
            // retrying them kept a spinner up for ~10 s before the error state; a gateway blip gets one more try
            return (error.status === 502 || error.status === 503) && failureCount < 1;
          }
          return failureCount < 2;
        },
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
      },
      mutations: { retry: false },
    },
  });
}

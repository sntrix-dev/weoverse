import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { components } from '@/api/generated/schema';
import { qk } from '@/api/queryKeys';

type S = components['schemas'];
export type GlobalSearchDto = S['GlobalSearchResult'] & { requests?: S['SearchRequestHit'][] };

/** The server refuses one character (it would scan the corpus for noise); so does the field. */
export const SEARCH_MIN = 2;

/**
 * `GET /frontend/search` — the top bar's live suggestions (v4 D1): WeOs, requests, circles,
 * creators, each ranked on its own index. `q` should already be debounced.
 */
export function useGlobalSearch(q: string) {
  const term = q.trim();
  return useQuery({
    queryKey: qk.search.global(term.toLowerCase()),
    queryFn: ({ signal }) =>
      api.get<GlobalSearchDto>('/frontend/search', { query: { q: term, limit: 4 }, signal }),
    enabled: term.length >= SEARCH_MIN,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
}

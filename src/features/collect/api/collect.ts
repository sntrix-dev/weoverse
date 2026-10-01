import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { components } from '@/api/generated/schema';
import { qk } from '@/api/queryKeys';

type S = components['schemas'];
export type CollectQuote = S['CollectQuote'];
export type CollectionDto = S['WeoCollectionCardView'];

/**
 * `GET /frontend/weos/:id/collect/quote?amount=&bundle=` — every figure the sheet shows comes
 * from here, priced by the code that will run on Confirm. `amount` is the dial (Os), `bundle`
 * the hunt's entry count.
 */
export function useCollectQuote(weoId: string | null, amount?: number, bundle?: number) {
  return useQuery({
    queryKey: qk.weos.quote(weoId ?? '', amount, bundle),
    queryFn: () =>
      api.get<CollectQuote>(`/frontend/weos/${encodeURIComponent(weoId ?? '')}/collect/quote`, {
        query: { amount, bundle },
      }),
    enabled: !!weoId,
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
}

/**
 * `POST /frontend/weos/:id/collect` with the body the quote stated (`quote.payload`) — the
 * kinds take different inputs in different units, and the client never converts them.
 * On success the balance, the WeO and every list that shows it are re-read.
 */
export function useCollect(weoId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CollectQuote['payload']) =>
      api.post<CollectionDto>(`/frontend/weos/${encodeURIComponent(weoId)}/collect`, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.me.all });
      void qc.invalidateQueries({ queryKey: qk.weos.all });
      void qc.invalidateQueries({ queryKey: qk.discover.all });
    },
  });
}

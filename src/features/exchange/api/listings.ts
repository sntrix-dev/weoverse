import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { components } from '@/api/generated/schema';
import { qk } from '@/api/queryKeys';
import type { CreatorRowDto } from '@/features/discover/api/discover';

type S = components['schemas'];
export type ListingsSnapshotDto = S['ListingsSnapshot'];
export type ListingRowDto = S['ListingSnapshotRow'];

/** `GET /frontend/me/listings/snapshot` — your storefront, measured in Os, with the boards and pulse. */
export function useListingsSnapshot(window: '7d' | '30d' = '7d') {
  return useQuery({
    queryKey: qk.listings.snapshot(window),
    queryFn: () => api.get<ListingsSnapshotDto>('/frontend/me/listings/snapshot', { query: { window } }),
    staleTime: 30_000,
  });
}

/**
 * `PATCH /frontend/weos/:id/status` — Inactivate / Activate, in place (a paused WeO keeps its stock
 * and cannot be collected). The row flips at once and rolls back if the server refuses.
 */
export function useSetListingStatus() {
  const qc = useQueryClient();
  const flip = (id: string, status: 'active' | 'inactive') =>
    qc.setQueriesData<ListingsSnapshotDto>({ queryKey: qk.listings.all }, (d) =>
      d
        ? {
            ...d,
            rows: d.rows.map((r) =>
              r.id === id
                ? { ...r, status, paused: status === 'inactive', state: status === 'inactive' ? 'draft' : 'live' }
                : r,
            ),
          }
        : d,
    );
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'inactive'; was: 'active' | 'inactive' }) =>
      api.patch<{ _id: string; status: string; changed: boolean }>(`/frontend/weos/${encodeURIComponent(id)}/status`, {
        status,
      }),
    onMutate: ({ id, status }) => flip(id, status),
    onError: (_e, { id, was }) => flip(id, was),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: qk.listings.all });
      void qc.invalidateQueries({ queryKey: qk.weos.all });
      void qc.invalidateQueries({ queryKey: qk.discover.all });
    },
  });
}

/**
 * `GET /frontend/creators?circle=joined` — creators who share one of your Circles. With none
 * joined (or none sharing) the orbit falls back to the leaders by standing, as the design does.
 */
export function useCircleCreators(limit = 6) {
  return useQuery({
    queryKey: qk.creators.list({ circle: 'joined', limit }),
    queryFn: async () => {
      type Page = { items: CreatorRowDto[] };
      const mine = await api.get<Page>('/frontend/creators', { query: { circle: 'joined', sort: 'isr', limit } });
      if (mine.items.length) return { items: mine.items, shared: true };
      const top = await api.get<Page>('/frontend/creators', { query: { sort: 'isr', limit } });
      return { items: top.items, shared: false };
    },
    staleTime: 5 * 60_000,
  });
}

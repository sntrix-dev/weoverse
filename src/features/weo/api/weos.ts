import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { components } from '@/api/generated/schema';
import { qk } from '@/api/queryKeys';
import type { WeoCardDto } from '@/lib/cardModel';

type S = components['schemas'];

/** `GET /frontend/weos` query. `status=active` is what a live floor wants (the default only hides blocked). */
export interface WeoListParams {
  sort?: 'recent' | 'trending' | 'ending_soon';
  status?: string;
  search?: string;
  feed?: 'following';
  weoType?: 'regular' | 'crowdfund' | 'lottery';
  limit?: number;
  page?: number;
}

export interface WeoPage {
  items: WeoCardDto[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

const clean = (p: WeoListParams) =>
  Object.fromEntries(Object.entries(p).filter(([, v]) => v !== undefined && v !== '')) as Record<
    string,
    string | number
  >;

export const fetchWeos = (params: WeoListParams) =>
  api.get<WeoPage>('/frontend/weos', { query: clean(params) });

export function useWeos(params: WeoListParams, enabled = true) {
  const p = clean(params);
  return useQuery({
    queryKey: qk.weos.list(p),
    queryFn: () => fetchWeos(params),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

/** `GET /frontend/weos/:id` — the card view, with `negotiation` on a negotiable WeO. */
export type WeoDetailDto = WeoCardDto & { negotiation?: S['WeoDetailView']['negotiation'] };

export function useWeo(id: string | undefined) {
  return useQuery({
    queryKey: qk.weos.detail(id ?? ''),
    queryFn: () => api.get<WeoDetailDto>(`/frontend/weos/${encodeURIComponent(id ?? '')}`),
    enabled: !!id,
    staleTime: 15_000,
  });
}

/** Like / unlike — optimistic on the detail read; the server answers `{ liked }` only. */
export function useLikeWeo(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (like: boolean) =>
      like
        ? api.post<{ liked: boolean }>(`/frontend/weos/${encodeURIComponent(id)}/like`)
        : api.delete<{ liked: boolean }>(`/frontend/weos/${encodeURIComponent(id)}/like`),
    onMutate: async (like) => {
      const key = qk.weos.detail(id);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<WeoDetailDto>(key);
      if (prev) {
        qc.setQueryData<WeoDetailDto>(key, {
          ...prev,
          isLiked: like,
          favoritesCount: Math.max(0, (prev.favoritesCount ?? 0) + (like ? 1 : -1)),
        });
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk.weos.detail(id), ctx.prev);
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: qk.weos.all }),
  });
}

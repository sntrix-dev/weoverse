import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { components } from '@/api/generated/schema';
import { qk } from '@/api/queryKeys';

type S = components['schemas'];
/** One brief as the list and detail return it (stored fields + the M08 additions). */
export type BriefDto = S['RequestOffer'];

export interface BriefsPageDto {
  requestOffers: BriefDto[];
  total: number;
  page: number;
  totalPages: number;
}

/** A WeO made in answer to your brief — the raw stored document (`accepted-weos`). */
export interface OfferDocDto {
  _id: string;
  title?: string;
  creatorName?: string;
  userId?: string;
  media?: { url?: string; type?: string }[];
  price?: { amount?: number };
  status?: string;
  createdAt?: string;
}

const enc = encodeURIComponent;

/** `GET /frontend/request-weos?status=open` — the briefs still taking offers. */
export function useBriefs(limit = 48) {
  const params = { status: 'open', limit };
  return useQuery({
    queryKey: qk.requests.list(params),
    queryFn: () => api.get<BriefsPageDto>('/frontend/request-weos', { query: params }),
    staleTime: 30_000,
  });
}

/** `GET /frontend/request-weos/:id` — one brief (a closed one, or your own, still opens). */
export function useBrief(id: string | null | undefined) {
  return useQuery({
    queryKey: qk.requests.detail(id ?? ''),
    queryFn: () => api.get<BriefDto>(`/frontend/request-weos/${enc(id ?? '')}`),
    enabled: !!id,
    staleTime: 30_000,
  });
}

/** `GET /frontend/request-weos/:id/accepted-weos` — the requester's offers. */
export function useBriefOffers(id: string | null | undefined, enabled: boolean) {
  return useQuery({
    queryKey: [...qk.requests.detail(id ?? ''), 'offers'] as const,
    queryFn: () =>
      api.get<{ offers: OfferDocDto[]; total: number }>(
        `/frontend/request-weos/${enc(id ?? '')}/accepted-weos`,
        {
          query: { limit: 24 },
        },
      ),
    enabled: !!id && enabled,
    staleTime: 30_000,
  });
}

const settle = (qc: ReturnType<typeof useQueryClient>) => {
  void qc.invalidateQueries({ queryKey: qk.requests.all });
  void qc.invalidateQueries({ queryKey: qk.create.asks() });
};

/** "Offer one you hold" — a requested WeO at your figure, made from one of yours (D-061). */
export function useOfferOnBrief(requestId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api.post<{ _id: string }>(`/frontend/request-weos/${enc(requestId)}/accept`, body),
    onSuccess: () => {
      settle(qc);
      void qc.invalidateQueries({ queryKey: qk.listings.all });
    },
  });
}

/** The requester stops taking offers. */
export function useCloseBrief() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post<{ id: string; status: 'closed' }>(`/frontend/request-weos/${enc(id)}/close`),
    onSuccess: () => settle(qc),
  });
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { components } from '@/api/generated/schema';
import { qk } from '@/api/queryKeys';

type S = components['schemas'];
export type WalletViewDto = S['WalletView'];
type CollectionRow = S['WeoCollectionCardView'];

/** `GET /frontend/wallet/overview` — the whole O-Wallet in one read (buckets, power, holdings). */
export function useWalletView() {
  return useQuery({
    queryKey: qk.wallet.overview(),
    queryFn: () => api.get<WalletViewDto>('/frontend/wallet/overview'),
    staleTime: 30_000,
  });
}

/** The first few things you hold — the wallet's Collect row shows their faces. */
export function useHoldingFaces(limit = 3) {
  return useQuery({
    queryKey: ['wallet', 'faces', limit],
    queryFn: () =>
      api.get<{ items: CollectionRow[] }>('/frontend/me/collections', { query: { limit } }),
    select: (d) =>
      d.items
        .map((c) => ({ id: c._id, img: c.weo?.media?.find((m) => m.url)?.url ?? null }))
        .filter((c): c is { id: string; img: string } => !!c.img),
    staleTime: 60_000,
  });
}

/** `POST /frontend/wallet/transfer` — move earned Os to another passport. */
export function useMoveOs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { toUserId: string; amount: number; note?: string }) =>
      api.post<unknown>('/frontend/wallet/transfer', body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.wallet.overview() });
      void qc.invalidateQueries({ queryKey: qk.me.all });
    },
  });
}

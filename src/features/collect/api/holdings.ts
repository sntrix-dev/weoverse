import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { components, operations } from '@/api/generated/schema';
import { qk } from '@/api/queryKeys';

type S = components['schemas'];
export type CollectionsSnapshotDto = S['CollectionsSnapshot'];
export type HoldingRowDto = S['HoldingSnapshotRow'];
export type HoldingGroupDto = S['HoldingGroupRow'];
export type HoldingStateDto = S['HoldingStateView'];
export type ResellQuoteDto =
  operations['resellQuote']['responses']['200']['content']['application/json']['data'];
export type DisputeReason = 'not_received' | 'not_as_described' | 'other';

/** `GET /frontend/me/collections/snapshot` — every holding, measured in Os, with the boards and pulse. */
export function useCollectionsSnapshot(window: '7d' | '30d' = '7d') {
  return useQuery({
    queryKey: qk.holdings.snapshot(window),
    queryFn: () => api.get<CollectionsSnapshotDto>('/frontend/me/collections/snapshot', { query: { window } }),
    staleTime: 30_000,
  });
}

/** After a holding changes: the snapshot, the wallet and every list that shows it re-read. */
function useHoldingsInvalidate() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: qk.holdings.all });
    void qc.invalidateQueries({ queryKey: qk.listings.all });
    void qc.invalidateQueries({ queryKey: qk.wallet.overview() });
    void qc.invalidateQueries({ queryKey: qk.weos.all });
  };
}

/** `POST /frontend/me/collections/:id/redeem` — you confirm it arrived (D-044). No money moves. */
export function useRedeem() {
  const refresh = useHoldingsInvalidate();
  return useMutation({
    mutationFn: (collectionId: string) =>
      api.post<HoldingStateDto>(`/frontend/me/collections/${encodeURIComponent(collectionId)}/redeem`, {}),
    onSuccess: refresh,
  });
}

/** `POST /frontend/me/collections/:id/dispute` — a report on the WeO and the holding marked disputed (D-045). */
export function useDispute() {
  const refresh = useHoldingsInvalidate();
  return useMutation({
    mutationFn: (v: { collectionId: string; reason?: DisputeReason; description?: string }) =>
      api.post<HoldingStateDto>(`/frontend/me/collections/${encodeURIComponent(v.collectionId)}/dispute`, {
        reason: v.reason ?? 'other',
        ...(v.description ? { description: v.description } : {}),
      }),
    onSuccess: refresh,
  });
}

/** `GET /frontend/weos/:id/resell/quote` — what the relist sheet may say: paid, value, the dial, blockers. */
export function useResellQuote(weoId: string | null, collectionId?: string) {
  return useQuery({
    queryKey: qk.holdings.resellQuote(weoId ?? '', collectionId),
    queryFn: () =>
      api.get<ResellQuoteDto>(`/frontend/weos/${encodeURIComponent(weoId ?? '')}/resell/quote`, {
        query: { collectionId },
      }),
    enabled: !!weoId,
    staleTime: 0,
  });
}

export interface ResellBody {
  title: string;
  description: string;
  amountOs: number;
  quantity: number;
  tags?: string[];
  collectionId?: string;
}

/** `POST /frontend/weos/:id/resell` with the ask in Os. */
export function useResell(weoId: string) {
  const refresh = useHoldingsInvalidate();
  return useMutation({
    mutationFn: (body: ResellBody) =>
      api.post<{ resold: { _id: string }; resellAudit: { _id: string } }>(
        `/frontend/weos/${encodeURIComponent(weoId)}/resell`,
        body,
      ),
    onSuccess: refresh,
  });
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { components } from '@/api/generated/schema';
import { qk } from '@/api/queryKeys';

type S = components['schemas'];
export type SettleRehearsalBody = S['SettleRehearsalBody'];
export type RehearseDraftBody = S['RehearseDraftBody'];
export type DraftVettingMine = S['DraftVettingMine'];
export type VettingCardDto = S['VettingCard'];
export type RehearsalDto = S['Rehearsal'];

const enc = encodeURIComponent;

/** After any lifecycle move: In flight (drafts), the card, the circle's waiting list. */
function settleLifecycle(qc: ReturnType<typeof useQueryClient>, id?: string) {
  void qc.invalidateQueries({ queryKey: qk.community.drafts() });
  void qc.invalidateQueries({ queryKey: qk.community.myWeos() });
  void qc.invalidateQueries({ queryKey: qk.vetting.all });
  if (id) void qc.invalidateQueries({ queryKey: qk.vetting.detail(id) });
}

/** `POST /frontend/weos/:id/rehearsals` — settle a live WeO's rehearsal to the ledger. */
export function useSettleRehearsal() {
  return useMutation({
    mutationFn: ({ weoId, body }: { weoId: string; body: SettleRehearsalBody }) =>
      api.post<RehearsalDto>(`/frontend/weos/${enc(weoId)}/rehearsals`, body),
  });
}

/** `POST /frontend/me/drafts/:id/rehearsal` — keep a draft's rehearsed terms (stage Rehearsed). */
export function useRehearseDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ draftId, body }: { draftId: string; body: RehearseDraftBody }) =>
      api.post<DraftVettingMine>(`/frontend/me/drafts/${enc(draftId)}/rehearsal`, body),
    onSettled: (_d, _e, v) => settleLifecycle(qc, v.draftId),
  });
}

/**
 * `POST /frontend/me/drafts/:id/open-reactions` — the create body is validated now and kept;
 * the audience chosen in the studio is told (D-091).
 */
export function useOpenReactions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ draftId, post }: { draftId: string; post: Record<string, unknown> }) =>
      api.post<DraftVettingMine & { notified: number }>(
        `/frontend/me/drafts/${enc(draftId)}/open-reactions`,
        { post },
      ),
    onSettled: (_d, _e, v) => settleLifecycle(qc, v.draftId),
  });
}

/** `POST /frontend/me/drafts/:id/open-pledges` — after twelve reactions. */
export function useOpenPledges() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (draftId: string) =>
      api.post<DraftVettingMine>(`/frontend/me/drafts/${enc(draftId)}/open-pledges`),
    onSettled: (_d, _e, id) => settleLifecycle(qc, id),
  });
}

/** `GET /frontend/vetting/:id` — the vetting card. */
export function useVetting(id: string | null) {
  return useQuery({
    queryKey: qk.vetting.detail(id ?? ''),
    queryFn: () => api.get<VettingCardDto>(`/frontend/vetting/${enc(id ?? '')}`),
    enabled: !!id,
    staleTime: 15_000,
  });
}

/** `GET /frontend/vetting?circleId=` — what is waiting on this Circle. */
export function useCircleVetting(circleId: string | null) {
  return useQuery({
    queryKey: qk.vetting.circle(circleId ?? ''),
    queryFn: () =>
      api.get<{ items: VettingCardDto[]; total: number }>('/frontend/vetting', {
        query: { circleId: circleId ?? '' },
      }),
    enabled: !!circleId,
    staleTime: 30_000,
  });
}

/** `POST /frontend/vetting/:id/reactions` — what you would pay, and why. */
export function useReact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, os, note }: { id: string; os: number | null; note: string }) =>
      api.post<VettingCardDto>(`/frontend/vetting/${enc(id)}/reactions`, { ...(os ? { os } : {}), note }),
    onSuccess: (card) => qc.setQueryData(qk.vetting.detail(card.id), card),
    onSettled: (_d, _e, v) => settleLifecycle(qc, v.id),
  });
}

/** `POST /frontend/vetting/:id/pledges` — a promise at its price; nothing is held (D-086). */
export function usePledge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, os }: { id: string; os?: number }) =>
      api.post<VettingCardDto>(`/frontend/vetting/${enc(id)}/pledges`, os ? { os } : {}),
    onSuccess: (card) => qc.setQueryData(qk.vetting.detail(card.id), card),
    onSettled: (_d, _e, v) => settleLifecycle(qc, v.id),
  });
}

/** `DELETE /frontend/vetting/:id/pledges` — take the promise back. */
export function useUnpledge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<VettingCardDto>(`/frontend/vetting/${enc(id)}/pledges`),
    onSuccess: (card) => qc.setQueryData(qk.vetting.detail(card.id), card),
    onSettled: (_d, _e, id) => settleLifecycle(qc, id),
  });
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { components } from '@/api/generated/schema';
import { qk } from '@/api/queryKeys';

type S = components['schemas'];
export type TrackingDto = S['TrackingList'];

const enc = encodeURIComponent;

/** `GET /frontend/me/tracking` — the WeOs and creators you watch, with what changed. */
export function useTracking() {
  return useQuery({
    queryKey: qk.tracking.all,
    queryFn: () => api.get<TrackingDto>('/frontend/me/tracking'),
    staleTime: 30_000,
  });
}

/** Whether a WeO is on your watchlist (read from the list you already hold). */
export function useIsTrackingWeo(weoId: string | undefined) {
  const q = useTracking();
  return { tracked: !!weoId && !!q.data?.weos.some((t) => String(t.weo._id) === weoId), ready: q.isSuccess };
}

/** Track / untrack a WeO — optimistic on the list held, then re-read (the note needs the server). */
export function useTrackWeo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, on }: { id: string; on: boolean }) =>
      on
        ? api.post<{ tracked: boolean }>(`/frontend/me/tracking/weos/${enc(id)}`)
        : api.delete<{ tracked: boolean }>(`/frontend/me/tracking/weos/${enc(id)}`),
    onMutate: ({ id, on }) => {
      if (!on)
        qc.setQueryData<TrackingDto>(qk.tracking.all, (d) =>
          d
            ? {
                ...d,
                weos: d.weos.filter((t) => String(t.weo._id) !== id),
                counts: { ...d.counts, weos: Math.max(0, d.counts.weos - 1) },
              }
            : d,
        );
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: qk.tracking.all }),
  });
}

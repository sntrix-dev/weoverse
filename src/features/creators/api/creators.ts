import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { components } from '@/api/generated/schema';
import { qk } from '@/api/queryKeys';

type S = components['schemas'];
export type CreatorRowDto = S['CreatorListRow'];
export type CreatorViewDto = S['CreatorView'];
export interface CreatorsPageDto {
  items: CreatorRowDto[];
  total: number;
  page: number;
  pages: number;
}

const enc = encodeURIComponent;

/** `GET /frontend/creators?sort=isr&limit=48` — the directory the grid and the boards read. */
export function useCreatorDirectory(limit = 48) {
  return useQuery({
    queryKey: qk.creators.list({ sort: 'isr', limit }),
    queryFn: () => api.get<CreatorsPageDto>('/frontend/creators', { query: { sort: 'isr', limit } }),
    staleTime: 60_000,
  });
}

/** `GET /frontend/creators/:id` — their public profile, with their permissions applied. */
export function useCreator(id: string | null | undefined) {
  return useQuery({
    queryKey: qk.creators.detail(id ?? ''),
    queryFn: () => api.get<CreatorViewDto>(`/frontend/creators/${enc(id ?? '')}`),
    enabled: !!id,
    staleTime: 30_000,
  });
}

/** Optimistic on every directory page and the profile held, then re-read. */
function useCreatorFlip() {
  const qc = useQueryClient();
  return (id: string, patch: { circled?: boolean; tracked?: boolean }) => {
    if (patch.circled !== undefined) {
      qc.setQueriesData<CreatorsPageDto>({ queryKey: ['creators', 'list'] }, (d) =>
        d
          ? {
              ...d,
              items: d.items.map((c) =>
                c.id === id
                  ? {
                      ...c,
                      circled: !!patch.circled,
                      circledBy: Math.max(0, c.circledBy + (patch.circled ? 1 : -1)),
                    }
                  : c,
              ),
            }
          : d,
      );
    }
    qc.setQueryData<CreatorViewDto>(qk.creators.detail(id), (d) =>
      d ? { ...d, viewer: { ...d.viewer, ...patch } } : d,
    );
  };
}

/** "Circle them" — a follow (D-059). */
export function useCircleThem() {
  const qc = useQueryClient();
  const flip = useCreatorFlip();
  return useMutation({
    mutationFn: ({ id, on }: { id: string; on: boolean }) =>
      on
        ? api.post<null>(`/frontend/users/${enc(id)}/follow`)
        : api.delete<null>(`/frontend/users/${enc(id)}/unfollow`),
    onMutate: ({ id, on }) => flip(id, { circled: on }),
    onError: (_e, { id, on }) => flip(id, { circled: !on }),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: qk.creators.all });
      void qc.invalidateQueries({ queryKey: qk.me.all });
      void qc.invalidateQueries({
        queryKey: qk.weos.list({ feed: 'following', status: 'active', limit: 24 }),
      });
    },
  });
}

/** "Track drops" — the tracking watchlist (D-059); trackers hear when they list. */
export function useTrackCreator() {
  const qc = useQueryClient();
  const flip = useCreatorFlip();
  return useMutation({
    mutationFn: ({ id, on }: { id: string; on: boolean }) =>
      on
        ? api.post<{ tracked: boolean }>(`/frontend/me/tracking/creators/${enc(id)}`)
        : api.delete<{ tracked: boolean }>(`/frontend/me/tracking/creators/${enc(id)}`),
    onMutate: ({ id, on }) => flip(id, { tracked: on }),
    onError: (_e, { id, on }) => flip(id, { tracked: !on }),
    onSettled: () => void qc.invalidateQueries({ queryKey: qk.tracking.all }),
  });
}

/** Invite them into a community circle you are in. */
export function useInviteToCircle() {
  return useMutation({
    mutationFn: ({ circleId, userId }: { circleId: string; userId: string }) =>
      api.post<{ invited: boolean }>(`/frontend/community/circles/${enc(circleId)}/invite`, { userId }),
  });
}

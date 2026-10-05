import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { components } from '@/api/generated/schema';
import { qk } from '@/api/queryKeys';

type S = components['schemas'];
export type PassportDto = S['Passport'];
export type GraphDto = S['GraphView'];
export type PublicProfileDto = S['PublicProfileView'];

/** `GET /frontend/users/me/passport` — who you are, where you stand, what it is worth. */
export function usePassport() {
  return useQuery({
    queryKey: qk.me.passport(),
    queryFn: () => api.get<PassportDto>('/frontend/users/me/passport'),
    staleTime: 30_000,
  });
}

/** `GET /frontend/users/me/graph` — who circles you, who you back. */
export function useGraph() {
  return useQuery({
    queryKey: qk.me.graph(),
    queryFn: () => api.get<GraphDto>('/frontend/users/me/graph'),
    staleTime: 60_000,
  });
}

export interface ProfilePatch {
  name?: string;
  handle?: string;
  bio?: string;
  avatarUrl?: string;
}

/** `PATCH /frontend/users/me/profile` — answers with the whole passport. */
export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: ProfilePatch) => api.patch<PassportDto>('/frontend/users/me/profile', patch),
    onSuccess: (p) => {
      qc.setQueryData(qk.me.passport(), p);
      void qc.invalidateQueries({ queryKey: qk.me.navSummary() });
      void qc.invalidateQueries({ queryKey: qk.me.settings() });
      void qc.invalidateQueries({ queryKey: qk.creators.all });
    },
  });
}

/** `PATCH /frontend/users/me/public-profile` — optimistic on the passport held. */
export function useUpdatePublicProfile() {
  const qc = useQueryClient();
  const put = (pp: Partial<PublicProfileDto>) =>
    qc.setQueryData<PassportDto>(qk.me.passport(), (d) =>
      d ? { ...d, publicProfile: { ...d.publicProfile, ...pp } } : d,
    );
  return useMutation({
    mutationFn: (patch: Partial<PublicProfileDto>) =>
      api.patch<PublicProfileDto>('/frontend/users/me/public-profile', patch),
    onMutate: (patch) => {
      const prev = qc.getQueryData<PassportDto>(qk.me.passport())?.publicProfile;
      put(patch);
      return { prev };
    },
    onError: (_e, _p, ctx) => {
      if (ctx?.prev) put(ctx.prev);
    },
    onSuccess: (pp) => put(pp),
    onSettled: () => void qc.invalidateQueries({ queryKey: qk.creators.all }),
  });
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { components } from '@/api/generated/schema';
import { qk } from '@/api/queryKeys';
import type { WeoCardDto } from '@/lib/cardModel';

type S = components['schemas'];
export type CircleCardDto = S['CommunityCircleCardView'];
export type CircleDetailDto = S['CommunityCircleDetailView'];
export type CircleMemberDto = S['CommunityCircleMemberView'];
export type ThreadDto = S['CommunityThreadSummary'];
export type ThreadDetailDto = S['CommunityThreadDetail'];
export type AnswerDto = S['CommunityAnswerView'];
export type ReplyDto = S['CommunityReplyView'];
export type AuthorDto = S['CommunityAuthorView'];
export type StoryDto = S['CommunityStoryView'];
export type ContributorDto = S['CommunityContributor'];
export type PulseDto = S['CommunityPulse'];
export type MyWeoDto = S['CommunityMyWeoCardView'];
export type ReportType = S['ReportCreateRequest']['reportType'];
export type DiscussionFilter = 'all' | 'open' | 'resolved' | 'mine';
export type NotificationPref = 'off' | 'weekly' | 'all';

/** `GET /frontend/me/drafts` returns the stored rows as they are (no projection). */
export interface DraftDto {
  _id: string;
  title?: string;
  coverUrl?: string | null;
  weoType?: 'regular' | 'crowdfund' | 'lottery' | null;
  format?: string;
  ready?: number;
  updatedAt?: string;
}

export interface CircleWeoRow {
  weo: WeoCardDto;
  latestPushedAt: string | null;
  latestThreadId: string | null;
  pushCount: number;
}

interface Paged<T> {
  items: T[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

const enc = encodeURIComponent;
const C = '/frontend/community';

// ─── circles ────────────────────────────────────────────────────────────────

/** `GET /community/circles?filter=all` — `{ joined, suggested }` (suggested can repeat a joined one). */
export function useCommunityCircles() {
  return useQuery({
    queryKey: qk.circles.list('all'),
    queryFn: () =>
      api.get<{ joined: CircleCardDto[]; suggested: CircleCardDto[] }>(`${C}/circles`, {
        query: { filter: 'all' },
      }),
    staleTime: 60_000,
  });
}

export function useCircle(id: string | undefined) {
  return useQuery({
    queryKey: qk.circles.detail(id ?? ''),
    queryFn: () => api.get<CircleDetailDto>(`${C}/circles/${enc(id ?? '')}`),
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useCircleMembers(id: string | undefined, limit = 24) {
  return useQuery({
    queryKey: qk.circles.members(id ?? '', limit),
    queryFn: () => api.get<Paged<CircleMemberDto>>(`${C}/circles/${enc(id ?? '')}/members`, { query: { limit } }),
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useCircleWeos(id: string | undefined) {
  return useQuery({
    queryKey: qk.circles.weos(id ?? ''),
    // every WeO the circle holds — its format, its category, what was posted in — the set its count counts
    queryFn: () =>
      api.get<Paged<CircleWeoRow>>(`${C}/circles/${enc(id ?? '')}/weos`, { query: { limit: 24, scope: 'all' } }),
    enabled: !!id,
    staleTime: 60_000,
  });
}

/** Join / leave — the circle lists, the circle and the shell's circle count all move. */
export function useMembership() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, join }: { id: string; join: boolean }) =>
      join
        ? api.post<{ isJoined: boolean }>(`${C}/circles/${enc(id)}/join`)
        : api.delete<{ isJoined: boolean }>(`${C}/circles/${enc(id)}/leave`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.circles.all });
      void qc.invalidateQueries({ queryKey: qk.me.all });
    },
  });
}

export function useCircleNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notification }: { id: string; notification: NotificationPref }) =>
      api.patch<{ notification: NotificationPref }>(`${C}/circles/${enc(id)}/notification`, { notification }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.circles.all }),
  });
}

// ─── discussions ────────────────────────────────────────────────────────────

export function useDiscussions(filter: DiscussionFilter, limit = 20) {
  return useQuery({
    queryKey: qk.community.discussions(`${filter}:${limit}`),
    queryFn: () =>
      api.get<{ items: ThreadDto[]; nextBefore: string | null }>(`${C}/discussions`, {
        query: { filter, limit },
      }),
    staleTime: 30_000,
  });
}

export function useThread(id: string | undefined) {
  return useQuery({
    queryKey: qk.community.thread(id ?? ''),
    queryFn: () => api.get<ThreadDetailDto>(`${C}/threads/${enc(id ?? '')}`),
    enabled: !!id,
    // every read counts a view (G-43): don't refetch on focus
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

/** Anything that adds a thread: the feed, the circle, the in-flight push state. */
const invalidateThreads = (qc: ReturnType<typeof useQueryClient>) => {
  void qc.invalidateQueries({ queryKey: qk.community.all });
  void qc.invalidateQueries({ queryKey: qk.circles.all });
};

export interface NewThread {
  question: string;
  detail?: string;
  circleId: string;
  attachedWeoId?: string;
  tags: string[];
}

export function useCreateThread() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: NewThread) => api.post<ThreadDto>(`${C}/threads`, body),
    onSuccess: () => invalidateThreads(qc),
  });
}

export function usePush() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { weoId: string; question: string; description?: string; circleId: string }) =>
      api.post<ThreadDto>(`${C}/push`, body),
    onSuccess: () => invalidateThreads(qc),
  });
}

/** Answer, reply, accept: the thread re-reads (one GET) and the feed's counts follow. */
function useThreadWrite<V, R>(threadId: string, fn: (v: V) => Promise<R>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.community.thread(threadId) });
      void qc.invalidateQueries({ queryKey: ['community', 'discussions'] });
    },
  });
}

export const usePostAnswer = (threadId: string) =>
  useThreadWrite(threadId, (body: string) => api.post<AnswerDto>(`${C}/threads/${enc(threadId)}/answers`, { body }));

export const usePostReply = (threadId: string) =>
  useThreadWrite(threadId, ({ answerId, body }: { answerId: string; body: string }) =>
    api.post<ReplyDto>(`${C}/answers/${enc(answerId)}/replies`, { body }),
  );

export const useAccept = (threadId: string) =>
  useThreadWrite(threadId, (answerId: string) =>
    api.post<{ accepted: boolean; threadStatus: 'open' | 'resolved' }>(`${C}/answers/${enc(answerId)}/accept`),
  );

/** ± vote, optimistic on the thread read; the server's `{ voteScore, userVote }` settles it. */
export function useVote(threadId: string) {
  const qc = useQueryClient();
  const key = qk.community.thread(threadId);
  const patch = (answerId: string, f: (a: AnswerDto) => AnswerDto) => {
    const prev = qc.getQueryData<ThreadDetailDto>(key);
    if (prev) qc.setQueryData<ThreadDetailDto>(key, { ...prev, answers: prev.answers.map((a) => (a.id === answerId ? f(a) : a)) });
    return prev;
  };
  return useMutation({
    mutationFn: ({ answerId, value }: { answerId: string; value: -1 | 0 | 1 }) =>
      api.post<{ voteScore: number; userVote: -1 | 0 | 1 }>(`${C}/answers/${enc(answerId)}/vote`, { value }),
    onMutate: async ({ answerId, value }) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = patch(answerId, (a) => ({ ...a, userVote: value, voteScore: a.voteScore - a.userVote + value }));
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
    },
    onSuccess: (r, { answerId }) => void patch(answerId, (a) => ({ ...a, ...r })),
  });
}

export function useReport() {
  return useMutation({
    mutationFn: (body: { threadId?: string; answerId?: string; weoId?: string; reportType: ReportType; description?: string }) =>
      api.post<unknown>('/frontend/report', body),
  });
}

// ─── stories, stewards, pulse ───────────────────────────────────────────────

export function useStories() {
  return useQuery({
    queryKey: qk.community.stories(),
    queryFn: () => api.get<{ items: StoryDto[]; nextBefore: string | null; total: number }>(`${C}/stories`, { query: { limit: 24 } }),
    staleTime: 5 * 60_000,
  });
}

/** Stewards are the all-time top contributors by helpfulness (Q-2 → D-036). */
export function useContributors(limit = 24) {
  return useQuery({
    queryKey: qk.community.contributors(limit),
    queryFn: () =>
      api.get<S['CommunityContributors']>(`${C}/snapshot/contributors`, {
        query: { window: 'all', metric: 'helpful', limit },
      }),
    staleTime: 60_000,
  });
}

export function usePulse() {
  return useQuery({
    queryKey: qk.community.pulse(),
    queryFn: () => api.get<PulseDto>(`${C}/snapshot/pulse`, { query: { window: '7d' } }),
    staleTime: 5 * 60_000,
  });
}

/** Follow / unfollow a steward — optimistic on every contributors page held. */
export function useFollow() {
  const qc = useQueryClient();
  const flip = (userId: string, on: boolean) =>
    qc.setQueriesData<S['CommunityContributors']>({ queryKey: ['community', 'contributors'] }, (d) =>
      d ? { ...d, contributors: d.contributors.map((c) => (c.userId === userId ? { ...c, isFollowing: on } : c)) } : d,
    );
  return useMutation({
    mutationFn: ({ userId, follow }: { userId: string; follow: boolean }) =>
      follow
        ? api.post<null>(`/frontend/users/${enc(userId)}/follow`)
        : api.delete<null>(`/frontend/users/${enc(userId)}/unfollow`),
    onMutate: ({ userId, follow }) => flip(userId, follow),
    onError: (_e, { userId, follow }) => flip(userId, !follow),
    onSettled: () => void qc.invalidateQueries({ queryKey: qk.me.all }),
  });
}

// ─── yours: in flight ───────────────────────────────────────────────────────

export function useMyWeos() {
  return useQuery({
    queryKey: qk.community.myWeos(),
    queryFn: () => api.get<{ items: MyWeoDto[]; nextBefore: string | null }>(`${C}/my-weos`, { query: { limit: 50 } }),
    staleTime: 60_000,
  });
}

export function useDrafts() {
  return useQuery({
    queryKey: qk.community.drafts(),
    queryFn: () => api.get<{ items: DraftDto[]; total: number }>('/frontend/me/drafts'),
    staleTime: 60_000,
  });
}

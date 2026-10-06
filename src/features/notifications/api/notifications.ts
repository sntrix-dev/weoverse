import { useInfiniteQuery, useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { components } from '@/api/generated/schema';
import { qk } from '@/api/queryKeys';

type S = components['schemas'];
export type NotificationPageDto = S['NotificationListData'];
export type NotificationRowDto = S['NotificationListRow'];

export const PAGE = 50;

/** `GET /frontend/notifications` — newest first, fifty a page (D-084); `unreadOnly` asks for `read=false`. */
export function useNotifications(category: string, unreadOnly: boolean) {
  return useInfiniteQuery({
    queryKey: qk.notifications.list(category, unreadOnly),
    queryFn: ({ pageParam }) =>
      api.get<NotificationPageDto>('/frontend/notifications', {
        query: {
          page: pageParam,
          limit: PAGE,
          category: category === 'all' ? undefined : category,
          read: unreadOnly ? 'false' : undefined,
        },
      }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    staleTime: 15_000,
  });
}

type Pages = InfiniteData<NotificationPageDto>;

/** Mark rows read in every list held, and recount the chips' unread. */
function markHeld(qc: ReturnType<typeof useQueryClient>, ids: Set<string> | 'all') {
  qc.setQueriesData<Pages>({ queryKey: qk.notifications.all }, (d) => {
    if (!d) return d;
    return {
      ...d,
      pages: d.pages.map((p) => ({
        ...p,
        notifications: p.notifications.map((n) =>
          ids === 'all' || ids.has(String(n._id)) ? { ...n, read: true } : n,
        ),
      })),
    };
  });
}

const settle = (qc: ReturnType<typeof useQueryClient>) => {
  void qc.invalidateQueries({ queryKey: qk.notifications.all });
  // the bell reads the nav summary's unread count
  void qc.invalidateQueries({ queryKey: qk.me.navSummary() });
};

/** `PATCH /frontend/notifications/:id/read` — optimistic. */
export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch<unknown>(`/frontend/notifications/${encodeURIComponent(id)}/read`),
    onMutate: (id) => markHeld(qc, new Set([id])),
    onSettled: () => settle(qc),
  });
}

/** `PATCH /frontend/notifications/read-all` — optimistic. */
export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.patch<number>('/frontend/notifications/read-all'),
    onMutate: () => markHeld(qc, 'all'),
    onSettled: () => settle(qc),
  });
}

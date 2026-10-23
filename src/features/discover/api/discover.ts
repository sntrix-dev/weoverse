import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { components } from '@/api/generated/schema';
import { qk } from '@/api/queryKeys';

type S = components['schemas'];
export type DiscoverySnapshotDto = S['DiscoverySnapshot'];
export type FeedItemDto = S['FeedItem'];
export type InterestDto = S['InterestRow'];
export type CreatorRowDto = S['CreatorListRow'];
export type CircleCardDto = S['CommunityCircleCardView'];

/** `GET /frontend/weos/discovery-snapshot` — the hero's figures. */
export function useDiscoverySnapshot() {
  return useQuery({
    queryKey: qk.discover.snapshot(),
    queryFn: () => api.get<DiscoverySnapshotDto>('/frontend/weos/discovery-snapshot'),
    staleTime: 60_000,
  });
}

/** `GET /frontend/feed` — one ranked, interleaved page (the board filters by kind on what it holds). */
export function useFeed() {
  return useQuery({
    queryKey: qk.discover.feed(),
    queryFn: () =>
      api.get<{ items: FeedItemDto[]; total: number; page: number; totalPages: number }>('/frontend/feed', {
        query: { limit: 24 },
      }),
    staleTime: 60_000,
  });
}

/** v4: the feed comes in pages of nine ("Showing 1–9 of N", numbered pages). */
export const FEED_PER = 9;

type FeedPageDto = { items: FeedItemDto[]; total: number; page: number; totalPages: number };

/**
 * `GET /frontend/feed?kind=&page=&limit=9` — one page of the board. The server filters by kind
 * so a page is always nine (or the last few), never a client filter over one page.
 */
export function useFeedPage(kind: 'all' | FeedItemDto['kind'], page: number, enabled = true) {
  return useQuery({
    queryKey: qk.discover.feedPage(kind, page),
    queryFn: () =>
      api.get<FeedPageDto>('/frontend/feed', {
        query: { ...(kind === 'all' ? {} : { kind }), page, limit: FEED_PER },
      }),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

/** `GET /frontend/weos/interests` */
export function useInterests() {
  return useQuery({
    queryKey: qk.discover.interests(),
    queryFn: () => api.get<InterestDto[]>('/frontend/weos/interests', { query: { limit: 12 } }),
    staleTime: 5 * 60_000,
  });
}

/** `GET /frontend/creators` — the directory, leaders by standing. */
export function useCreators(limit = 12) {
  return useQuery({
    queryKey: qk.creators.list({ sort: 'isr', limit }),
    queryFn: () =>
      api.get<{ items: CreatorRowDto[]; total: number; page: number; pages: number }>('/frontend/creators', {
        query: { sort: 'isr', limit },
      }),
    staleTime: 5 * 60_000,
  });
}

/** `GET /frontend/community/circles?filter=all` — `suggested` mislabels joined circles (api-gaps). */
export function useCircles() {
  return useQuery({
    queryKey: qk.circles.list('all'),
    queryFn: () =>
      api.get<{ joined: CircleCardDto[]; suggested: CircleCardDto[] }>('/frontend/community/circles', {
        query: { filter: 'all' },
      }),
    staleTime: 5 * 60_000,
  });
}

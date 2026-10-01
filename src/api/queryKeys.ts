/**
 * One factory for every TanStack Query key. Features add their keys here so
 * invalidation stays discoverable: `queryClient.invalidateQueries({ queryKey: qk.me.all })`.
 */
export const qk = {
  me: {
    all: ['me'] as const,
    navSummary: () => ['me', 'nav-summary'] as const,
    preferences: () => ['me', 'preferences'] as const,
  },
  weos: {
    all: ['weos'] as const,
    list: (params: Record<string, string | number | undefined>) => ['weos', 'list', params] as const,
    detail: (id: string) => ['weos', 'detail', id] as const,
    quote: (id: string, amount?: number, bundle?: number) =>
      ['weos', 'quote', id, amount ?? null, bundle ?? null] as const,
  },
  discover: {
    all: ['discover'] as const,
    snapshot: () => ['discover', 'snapshot'] as const,
    feed: () => ['discover', 'feed'] as const,
    interests: () => ['discover', 'interests'] as const,
  },
  creators: {
    list: (params: Record<string, string | number | undefined>) => ['creators', 'list', params] as const,
  },
  circles: {
    list: (filter: string) => ['circles', 'list', filter] as const,
  },
} as const;

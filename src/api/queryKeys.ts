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
} as const;

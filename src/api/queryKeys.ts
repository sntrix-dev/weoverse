/**
 * One factory for every TanStack Query key. Features add their keys here so
 * invalidation stays discoverable: `queryClient.invalidateQueries({ queryKey: qk.me.all })`.
 */
export const qk = {
  me: {
    all: ['me'] as const,
    passport: () => ['me', 'passport'] as const,
    graph: () => ['me', 'graph'] as const,
    settings: () => ['me', 'settings'] as const,
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
    all: ['creators'] as const,
    list: (params: Record<string, string | number | undefined>) => ['creators', 'list', params] as const,
    detail: (id: string) => ['creators', 'detail', id] as const,
  },
  requests: {
    all: ['requests'] as const,
    list: (params: Record<string, string | number | undefined>) => ['requests', 'list', params] as const,
    detail: (id: string) => ['requests', 'detail', id] as const,
  },
  tracking: {
    all: ['tracking'] as const,
  },
  circles: {
    all: ['circles'] as const,
    list: (filter: string) => ['circles', 'list', filter] as const,
    detail: (id: string) => ['circles', 'detail', id] as const,
    members: (id: string, limit: number) => ['circles', 'members', id, limit] as const,
    weos: (id: string) => ['circles', 'weos', id] as const,
  },
  community: {
    all: ['community'] as const,
    discussions: (filter: string) => ['community', 'discussions', filter] as const,
    thread: (id: string) => ['community', 'thread', id] as const,
    stories: () => ['community', 'stories'] as const,
    contributors: (limit: number) => ['community', 'contributors', limit] as const,
    pulse: () => ['community', 'pulse'] as const,
    myWeos: () => ['community', 'my-weos'] as const,
    drafts: () => ['community', 'drafts'] as const,
  },
  wallet: {
    overview: () => ['wallet', 'overview'] as const,
  },
  holdings: {
    all: ['holdings'] as const,
    snapshot: (window: string) => ['holdings', 'snapshot', window] as const,
    resellQuote: (weoId: string, collectionId?: string) =>
      ['holdings', 'resell-quote', weoId, collectionId ?? null] as const,
  },
  create: {
    peg: () => ['create', 'peg'] as const,
    templates: () => ['create', 'templates'] as const,
    categories: () => ['create', 'categories'] as const,
    asks: () => ['create', 'asks'] as const,
    draft: (id: string) => ['create', 'draft', id] as const,
  },
  listings: {
    all: ['listings'] as const,
    snapshot: (window: string) => ['listings', 'snapshot', window] as const,
  },
} as const;

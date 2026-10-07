import type { components } from '@/api/generated/schema';

type S = components['schemas'];

const now = Date.now();
const daysAgo = (d: number) => new Date(now - d * 864e5).toISOString();
const trend = (current: number, previous = 0): S['TrendValue'] => ({
  current,
  previous,
  delta: current - previous,
  changePct: previous ? (current - previous) / previous : null,
});
const meta = (): S['SnapshotWindowMeta'] => ({
  window: '7d',
  start: daysAgo(7),
  end: daysAgo(0),
  previousStart: daysAgo(14),
});
const pulse = (
  label: string,
  headline: number,
  unit: 'count' | 'os' | 'ratio' = 'count',
): S['SnapshotPulse'] => ({
  label,
  note: '7d',
  headline,
  unit,
  trend: trend(headline, Math.max(1, headline - 1)),
  series: [1, 2, 3, 4, 5, 6, headline],
});

export const holdingRow = (over: Partial<S['HoldingSnapshotRow']> = {}): S['HoldingSnapshotRow'] => ({
  id: 'col-1',
  weoId: 'w-1',
  title: 'Sunrise Loop',
  weoType: 'regular',
  format: 'Drop',
  kind: 'collected',
  img: null,
  createdAt: daysAgo(3),
  paid: 1900,
  valueNow: 2280,
  resellable: true,
  isResold: false,
  isNegotiable: false,
  isLimitedDrop: true,
  circle: { id: 'circ-1', name: 'Digital Arts', slug: 'digital-arts' },
  status: 'delivered',
  note: 'Delivered',
  sellerId: 'u-lena',
  sellerName: 'Lena V',
  sellerAvatar: null,
  redeemedAt: null,
  disputedAt: null,
  ...over,
});

/** Four holdings: a fresh regular one (needs confirming), an old riser (resell), a pool, entries. */
export const collectionsSnapshotFixture = (): S['CollectionsSnapshot'] => {
  const rows = [
    holdingRow(),
    holdingRow({
      id: 'col-2',
      weoId: 'w-2',
      title: 'Hand-Thrown Mug',
      format: 'Listing',
      createdAt: daysAgo(40),
      paid: 4200,
      valueNow: 4640,
      isLimitedDrop: false,
      sellerName: 'Mira K',
      sellerId: 'u-mira',
    }),
    holdingRow({
      id: 'col-3',
      weoId: 'w-3',
      title: 'Block Party Fund',
      weoType: 'crowdfund',
      format: 'Pool',
      kind: 'backed',
      paid: 2400,
      valueNow: 2400,
      resellable: false,
      note: '60% funded · held until the goal decides',
      status: 'confirmed',
      createdAt: daysAgo(9),
    }),
    holdingRow({
      id: 'col-4',
      weoId: 'w-4',
      title: 'Studio Gear Hunt',
      weoType: 'lottery',
      format: 'Hunt',
      kind: 'entered',
      paid: 1200,
      valueNow: 1200,
      resellable: false,
      note: '2 entries · draw runs at close',
      status: 'active',
      circle: null,
    }),
  ];
  return {
    meta: meta(),
    totals: {
      holdings: 4,
      spent: 9700,
      valueNow: 10520,
      upliftIfResold: 820,
      collected: trend(2, 1),
      spend: trend(3100, 1000),
      creators: trend(2, 1),
    },
    osPlacement: { available: 6920, protected: 2400, pending: 1200, locked: 0 },
    rows,
    groups: [
      { id: 'format:Drop', label: 'Drop', count: 1, value: 2280, share: 0.22, img: null },
      { id: 'format:Pool', label: 'Pool', count: 1, value: 2400, share: 0.23, img: null },
      { id: 'creator:u-lena', label: 'Lena V', count: 3, value: 5880, share: 0.56, img: null },
    ],
    boards: {
      movers: { label: 'Biggest movers', metric: 'resale delta · 7d', rowIds: ['col-2', 'col-1'] },
      formats: {
        label: 'WeO kinds you engage with most',
        metric: 'Os held by format',
        rowIds: ['format:Pool', 'format:Drop'],
      },
      creators: { label: 'Creators you circle', metric: 'Os flowed with them', rowIds: ['creator:u-lena'] },
      pending: {
        label: 'Awaiting an outcome',
        metric: 'Os you cannot spend yet',
        rowIds: ['col-3', 'col-4'],
      },
    },
    pulse: {
      movers: pulse('Movers', 820, 'os'),
      formats: pulse('Formats', 4),
      creators: pulse('Creators', 2),
      pending: pulse('Awaiting', 3600, 'os'),
    },
  };
};

export const listingRow = (over: Partial<S['ListingSnapshotRow']> = {}): S['ListingSnapshotRow'] => ({
  id: 'l-1',
  title: 'Tide Pool',
  weoType: 'regular',
  state: 'live',
  status: 'active',
  paused: false,
  isResellable: true,
  format: 'Listing',
  img: null,
  createdAt: daysAgo(3),
  endsAt: null,
  ask: 1881,
  lifetimeViews: 1840,
  lifetimeSaves: 96,
  collects: 12,
  settled: 22572,
  saves: 4,
  collectThrough: 0.82,
  stockLeft: 9,
  stockTotal: 50,
  isNegotiable: false,
  isLimitedDrop: false,
  circle: { id: 'circ-1', name: 'Digital Arts', slug: 'digital-arts' },
  preflight: [
    { label: 'Media · orb preview', ok: true },
    { label: 'Price & peg', ok: true },
    { label: "Terms & what's included", ok: true },
    { label: 'Fulfilment window', ok: true },
    { label: 'Category & discovery', ok: true },
  ],
  readyRate: 1,
  ...over,
});

/** A live listing close to selling out, a paused one, a closed one. Drafts come from `/me/drafts`. */
export const listingsSnapshotFixture = (): S['ListingsSnapshot'] => {
  const rows = [
    listingRow(),
    listingRow({
      id: 'l-2',
      title: 'Studio Hour',
      state: 'draft',
      status: 'inactive',
      paused: true,
      ask: 3366,
      collects: 2,
      collectThrough: 0.1,
      stockLeft: 27,
      stockTotal: 30,
      readyRate: 0.8,
      preflight: [
        { label: 'Media · orb preview', ok: false },
        { label: 'Price & peg', ok: true },
        { label: "Terms & what's included", ok: true },
        { label: 'Fulfilment window', ok: true },
        { label: 'Category & discovery', ok: true },
      ],
    }),
    listingRow({
      id: 'l-3',
      title: 'Ceramics Workshop',
      state: 'closed',
      status: 'active',
      stockLeft: 0,
      stockTotal: 60,
      collectThrough: 1,
      isResellable: false,
    }),
  ];
  return {
    meta: meta(),
    totals: {
      live: 1,
      listings: 3,
      lifetimeViews: 5520,
      collects: trend(14, 10),
      settled: trend(22572, 15000),
      saves: trend(4, 2),
    },
    collectThrough: 0.82,
    rows,
    boards: {
      performing: {
        label: 'Best performing listings',
        metric: 'collect-through · 7d',
        rowIds: ['l-3', 'l-1'],
      },
      views: { label: 'Most viewed', metric: 'views · lifetime', rowIds: ['l-1'] },
      earning: { label: 'Earning most', metric: 'settled Os · 7d', rowIds: ['l-1'] },
      ready: { label: 'Needs attention', metric: 'preflight complete', rowIds: ['l-2'] },
    },
    pulse: {
      performing: pulse('Collects', 14),
      views: { ...pulse('Views', 5520), trend: null, series: null },
      earning: pulse('Settled', 22572, 'os'),
      ready: pulse('Preflight', 1),
    },
  };
};

export const resellQuoteFixture = (over: Record<string, unknown> = {}) => ({
  weoId: 'w-1',
  collectionId: 'col-1',
  resellable: true,
  blockers: [] as { code: string; message: string }[],
  title: 'Sunrise Loop',
  description: 'Seed 14 of 50 · remix stems included',
  img: null,
  format: 'Drop',
  tags: ['generative'],
  quantity: 1,
  unitName: 'units',
  paidOs: 1900,
  valueOs: 2280,
  dial: { start: 2510, min: 1140, max: 5470, lo: 2170, hi: 3420, step: 50 },
  usdAgainstO: 99,
  fees: [],
  ...over,
});

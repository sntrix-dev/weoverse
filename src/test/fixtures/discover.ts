import type { components } from '@/api/generated/schema';
import type { WeoCardDto } from '@/lib/cardModel';
import { ALL_FIXTURE_WEOS, FIXTURE_NOW } from './weos';

type S = components['schemas'];

/** The fixture WeOs with their clocks moved to "now", so they read as open in a live test. */
export const liveWeos = (now: number = Date.now()): WeoCardDto[] =>
  ALL_FIXTURE_WEOS().map((w) => {
    const shift = (iso: string | null | undefined) =>
      iso ? new Date(new Date(iso).getTime() - FIXTURE_NOW + now).toISOString() : iso;
    return { ...w, closesAt: shift(w.closesAt) ?? null } as WeoCardDto;
  });

export const snapshotFixture: S['DiscoverySnapshot'] = {
  liveCount: 5,
  closingTodayCount: 2,
  followingNewCount: 1,
  followsAnyone: true,
  settledOs7d: 31980,
};

const author = { id: 'c-1', name: 'lenav', avatarUrl: 'https://cdn.test/avatars/lenav.jpg', isr: 89 };

export const feedFixture = (now: number = Date.now()): S['FeedItem'][] => [
  {
    id: 'weo-1',
    kind: 'weo',
    title: 'Sunrise Loop',
    blurb: '50 unique seeds',
    imageUrl: 'https://cdn.test/weos/loop.jpg',
    author,
    readout: 'O 1,900',
    sub: 'regular · Digital arts',
    os: 1900,
    closesAt: new Date(now + 6 * 36e5).toISOString(),
    format: 'Drop',
    weight: 4,
    urgency: 'Closing soon',
    metrics: [
      { value: '41', label: 'collectors' },
      { value: '232', label: 'watching' },
      { value: '31', label: 'here now' },
    ],
    href: '/weo/weo-1',
    createdAt: new Date(now - 864e5).toISOString(),
  },
  {
    id: 'th-1',
    kind: 'question',
    title: 'Is a pool the right format for a zine?',
    blurb: 'Thinking about 40 copies.',
    imageUrl: null,
    author: { ...author, id: 'c-2', name: 'mira' },
    readout: '3 answers',
    sub: 'Digital Arts',
    os: null,
    closesAt: null,
    format: null,
    weight: 2,
    urgency: null,
    metrics: [
      { value: '12', label: 'votes' },
      { value: '3', label: 'answers' },
      { value: '90', label: 'reads' },
    ],
    href: '/community-hub/thread/th-1',
    createdAt: new Date(now - 2 * 864e5).toISOString(),
  },
  {
    id: 'rq-1',
    kind: 'request',
    title: 'Forty mugs for a café opening',
    blurb: 'One glaze, our mark on the base.',
    imageUrl: null,
    author: { ...author, id: 'c-3', name: 'bo' },
    readout: 'O 96,000',
    sub: 'closes 5d',
    os: 96000,
    closesAt: new Date(now + 5 * 864e5).toISOString(),
    format: null,
    weight: 1,
    urgency: null,
    metrics: [
      { value: '7', label: 'offers' },
      { value: '20', label: 'reads' },
      { value: 'Ceramics', label: 'category' },
    ],
    href: '/request/rq-1',
    createdAt: new Date(now - 3 * 864e5).toISOString(),
  },
];

export const creatorsFixture: S['CreatorListRow'][] = [
  {
    id: 'c-1',
    name: 'Lena V',
    handle: '@lenav',
    avatarUrl: null,
    bio: 'Capped editions, generative stems.',
    isr: 89,
    formats: ['regular'],
    format: 'Drop',
    tone: '#D946EF',
    settled7d: 1980,
    trace7d: [0, 1, 0, 2, 0, 0, 1],
    collectors: 12,
    circledBy: 40,
    circled: false,
    weos: 6,
    weeksLive: 14,
    circlesLed: 2,
  },
];

export const circleFixture = (
  over: Partial<S['CommunityCircleCardView']> = {},
): S['CommunityCircleCardView'] => ({
  id: 'circ-1',
  slug: 'digital-arts',
  name: 'Digital Arts',
  axis: 'By Category',
  axisLabel: 'Category',
  description: '',
  coverColor: '#D946EF',
  coverImage: '',
  tags: [],
  weoTypeKey: null,
  categoryId: null,
  isGeneral: false,
  isPlatform: false,
  memberCount: 3200,
  threadCount: 88,
  weoCount: 402,
  activeNow: 4,
  resolvedRate7d: 0.62,
  newWeosThisWeek: 3,
  isOpen: true,
  avgFundTime: null,
  isJoined: true,
  notification: 'all',
  createdAt: null,
  updatedAt: null,
  ...over,
});

export const interestsFixture: S['InterestRow'][] = [
  { categoryId: 'cat-1', category: 'Digital arts', liveCount: 4, topFormat: 'crowdfund', clearRate: 0.64 },
];

/** A quote the way the backend states it for a fixture WeO. */
export const quoteFor = (
  w: WeoCardDto,
  opts: { amount?: number; bundle?: number; oBalance?: number } = {},
): S['CollectQuote'] => {
  const priceOs = w.weoverse?.priceOs ?? 0;
  const bundles = w.weoType === 'lottery' ? w.ticket.bundles : null;
  const bundle = w.weoType === 'lottery' ? (opts.bundle ?? bundles?.[0] ?? 1) : null;
  const pool = w.weoType === 'crowdfund';
  const bid = w.weoType === 'regular' && w.isNegotiable;
  const amount =
    w.weoType === 'lottery'
      ? priceOs * (bundle ?? 1)
      : pool || bid
        ? Math.max(
            pool ? priceOs : Math.round(priceOs / 2),
            Math.min(pool ? priceOs * 10 : priceOs, opts.amount ?? priceOs),
          )
        : priceOs;
  const oBalance = opts.oBalance ?? 100_000;
  const sufficient = oBalance >= amount;
  return {
    weoId: w._id,
    weoType: w.weoType,
    format: w.weoType === 'crowdfund' ? 'Pool' : w.weoType === 'lottery' ? 'Hunt' : bid ? 'Bid' : 'Listing',
    title: w.title,
    ask: priceOs,
    amount,
    amountLabel: pool ? 'Your pledge' : w.weoType === 'lottery' ? 'Your entry' : bid ? 'Your bid' : 'Ask',
    bounds: pool
      ? { min: priceOs, max: priceOs * 10, step: 50, fixed: false }
      : bid
        ? { min: Math.round(priceOs / 2), max: priceOs, step: 10, fixed: false }
        : { min: amount, max: amount, step: 1, fixed: true },
    fees: [],
    feeTotal: 0,
    net: amount,
    standing: { tier: 'member', label: 'Member', advantagePct: 4, advantageOff: 0, applied: false, note: '' },
    wallet: { oBalance, sufficient },
    negotiation: bid
      ? { freeAttempts: 3, attemptCount: 0, attemptsLeft: 3, nextAttemptCost: 0, floorDisclosed: false }
      : null,
    bundles,
    bundle,
    closesAt: w.closesAt ?? null,
    blockers: sufficient
      ? []
      : [{ code: 'insufficient_balance', message: `You hold ${oBalance} O and this asks ${amount} O.` }],
    collectable: sufficient,
    payload:
      w.weoType === 'lottery'
        ? { bundle: bundle ?? 1 }
        : pool
          ? { amount }
          : { amount: amount / 99, isFullyPaid: true },
  };
};

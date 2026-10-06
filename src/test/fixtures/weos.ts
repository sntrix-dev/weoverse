import type { CrowdfundWeoDto, LotteryWeoDto, RegularWeoDto, WeoCardDto } from '@/lib/cardModel';

/**
 * `GET /frontend/weos` rows shaped exactly like weo-3.0's `projectWeoToCardView` (test data —
 * never imported by product code; the dev-only `/dev/ds` gallery shows them). The clock is pinned: pass `FIXTURE_NOW` to `cardModel`.
 */
export const FIXTURE_NOW = new Date('2026-07-28T12:00:00Z').getTime();
const at = (ms: number) => new Date(FIXTURE_NOW + ms).toISOString();
const H = 36e5;
const D = 864e5;

const creator = (over: Partial<WeoCardDto['creator']> = {}): WeoCardDto['creator'] => ({
  _id: 'c-1',
  handle: 'lenav',
  avatarUrl: 'https://cdn.test/avatars/lenav.jpg',
  followersCount: 6240,
  tier: 'player',
  isr: 89,
  bio: 'Generative artist.',
  tradeCount: 51,
  joinedSince: '2024-02-12T08:31:00.000Z',
  ...over,
});

const weoverse = (
  over: Partial<NonNullable<WeoCardDto['weoverse']>> = {},
): NonNullable<WeoCardDto['weoverse']> => ({
  publicId: 'WEO-77CA10',
  points: ['50 unique seeds', 'Remixable stems included'],
  rarityNote: '',
  activeNow: 31,
  editionSize: 50,
  isCollected: false,
  circles: [{ id: 'circ-1', name: 'Digital Arts', slug: 'digital-arts' }],
  trendPct: 21,
  priceOs: 1900,
  priceUsd: 19.19,
  validated: null,
  ...over,
});

const common = (over: Partial<RegularWeoDto> = {}) => ({
  _id: 'weo-1',
  title: 'Sunrise Loop',
  slug: 'sunrise-loop',
  description: '',
  media: [{ url: 'https://cdn.test/weos/loop.jpg', type: 'image' as const }],
  categoryName: 'Digital arts',
  status: 'active',
  currency: 'O' as const,
  isResellable: true,
  creator: creator(),
  favoritesCount: 232,
  isLiked: false,
  viewsCount: 690,
  participantsCount: 41,
  activeNow: 31,
  avgWeoRating: 0,
  avgExperienceRating: 0,
  reviewsCount: 0,
  isNegotiable: false,
  closesAt: at(12 * H + 4 * 60000 + 10000),
  weoverse: weoverse(),
  createdAt: at(-30 * D),
  updatedAt: at(-D),
  ...over,
});

/** regular, capped at 50 → Drop */
export const dropWeo = (over: Partial<RegularWeoDto> = {}): RegularWeoDto => ({
  ...common(),
  weoType: 'regular',
  type: 'normal',
  price: { amount: 19.19, priceSplit: 0.05 },
  quantity: { amount: 50, unitName: 'edition' },
  soldCount: 41,
  totalWeoInCirculation: 50,
  inventoryLeft: 9,
  isLimitedDrop: true,
  isAlmostGone: false,
  duration: 1,
  availabilityTill: at(12 * H + 4 * 60000 + 10000),
  paymentType: 'full',
  noOfInstallments: 1,
  parentOfferId: null,
  rootOfferId: 'weo-1',
  lineage: [],
  ...over,
});

/** regular, open supply → Listing */
export const listingWeo = (over: Partial<RegularWeoDto> = {}): RegularWeoDto =>
  dropWeo({
    _id: 'weo-2',
    title: 'Hand-Thrown Mug',
    quantity: { amount: 160, unitName: 'edition' },
    totalWeoInCirculation: 160,
    soldCount: 60,
    inventoryLeft: 100,
    isLimitedDrop: false,
    price: { amount: 42.42, priceSplit: 0.02 },
    closesAt: null,
    availabilityTill: null,
    weoverse: weoverse({ publicId: 'WEO-1290EE', priceOs: 4200, priceUsd: 42.42, trendPct: null }),
    ...over,
  });

/** regular + negotiable → Bid */
export const bidWeo = (over: Partial<RegularWeoDto> = {}): RegularWeoDto =>
  listingWeo({ _id: 'weo-3', title: 'Kiln Study No. 4', isNegotiable: true, closesAt: at(2 * D), ...over });

export const poolWeo = (over: Partial<CrowdfundWeoDto> = {}): CrowdfundWeoDto => ({
  ...common({
    _id: 'weo-4',
    title: 'Block Party Fund',
    categoryName: 'Community',
    isResellable: false,
    closesAt: at(6 * H + 14 * 60000 + 22000),
    weoverse: weoverse({
      publicId: 'WEO-4417AC',
      editionSize: 200,
      priceOs: 2400,
      priceUsd: 24.24,
      isCollected: true,
    }),
  }),
  weoType: 'crowdfund',
  goal: { amount: 12000, currency: 'O' },
  raised: 9360,
  percentFunded: 0.78,
  deadline: at(6 * H + 14 * 60000 + 22000),
  daysLeft: 1,
  isAlmostFunded: true,
  isClosingSoon: true,
  contribution: { minimum: 2400, maximum: null },
  ...over,
});

export const huntWeo = (over: Partial<LotteryWeoDto> = {}): LotteryWeoDto => ({
  ...common({
    _id: 'weo-5',
    title: 'Studio Gear Hunt',
    categoryName: 'Creating',
    isResellable: false,
    closesAt: at(41 * H + 59 * 60000 + 54000),
    weoverse: weoverse({
      publicId: 'WEO-88B21D',
      editionSize: 100,
      priceOs: 600,
      priceUsd: 6.06,
      trendPct: 14,
    }),
  }),
  weoType: 'lottery',
  ticket: { price: 600, totalTickets: 100, bundles: [1, 5, 10], perUserLimit: 10 },
  ticketsSold: 80,
  ticketsLeft: 20,
  percentSold: 0.8,
  currentOdds: 0.01,
  prizes: [],
  topPrize: null,
  draw: { drawAt: at(41 * H + 59 * 60000 + 54000), mechanism: 'provably_fair_rng' },
  daysLeft: 2,
  isAlmostSoldOut: true,
  ...over,
});

export const ALL_FIXTURE_WEOS = (): WeoCardDto[] => [poolWeo(), huntWeo(), listingWeo(), dropWeo(), bidWeo()];

import type { components } from '@/api/generated/schema';
import type { WeoCardDto } from '@/lib/cardModel';
import { liveWeos } from './discover';

type S = components['schemas'];

/** `GET /frontend/creators/:id` — Lena's public profile (test data). */
export const creatorViewFixture = (over: Partial<S['CreatorView']> = {}): S['CreatorView'] => ({
  id: 'c-1',
  name: 'Lena V',
  handle: '@lenav',
  avatarUrl: null,
  bio: 'Capped editions, generative stems.',
  formats: ['regular'],
  isr: 89,
  tier: { key: 'player', label: 'Player', tone: '#3A95F2' },
  joinedAt: '2024-02-12T08:31:00.000Z',
  shows: { collections: true, activity: true, invites: true, contact: 'anyone' },
  stats: { settled7d: 1980, collectors: 12, weos: 6, acceptRate: 0.74, circlesLed: 2, circledBy: 40 },
  weos: [
    {
      id: 'weo-1',
      title: 'Sunrise Loop',
      weoType: 'regular',
      format: 'Drop',
      img: 'https://cdn.test/weos/loop.jpg',
      os: 1900,
    },
  ],
  activity: [
    { kind: 'weo', id: 'weo-1', label: 'Sunrise Loop', note: 'Drop · live', when: '', tone: '#D946EF' },
    {
      kind: 'thread',
      id: 't-1',
      label: 'Which seed reads best?',
      note: 'Asked · 4 replies',
      when: '2026-07-27T12:00:00.000Z',
      tone: '#3A95F2',
    },
  ],
  viewer: { circled: false, tracked: false, sharedCircles: [], canContact: true, isSelf: false },
  ...over,
});

const D = 864e5;

/** `GET /frontend/request-weos?status=open` rows with the M08 fields (test data). */
export const briefsFixture = (now: number = Date.now()): S['RequestOffer'][] => [
  {
    _id: '651f8c2a3b9c0d12e45678a1',
    title: 'a hand-bound sketchbook',
    description: 'Cotton paper, a linen spine, a hundred pages.',
    userId: 'someone-else',
    creatorName: 'ada',
    categoryId: 'cat-1',
    categoryName: 'creating',
    price: { min: 500, max: 1200 },
    tags: [],
    deadline: new Date(now + 5 * D).toISOString(),
    viewsCount: 3,
    status: 'active',
    updateCount: 1,
    acceptedCount: 1,
    by: { id: 'someone-else', name: 'Ada', avatarUrl: null },
    offerers: [{ id: 'u-bo', name: 'Bo', avatarUrl: null }],
    circle: { id: 'circ-1', name: 'Digital Arts', image: null, coverColor: '#D946EF' },
    open: true,
    mine: false,
    offered: false,
    // the pre-M08 fields older callers read
    creator: { _id: 'someone-else', name: 'Ada', profileImage: null },
  },
  {
    _id: '651f8c2a3b9c0d12e45678a2',
    title: 'a cover for my zine',
    description: 'Two colours, risograph-ready.',
    userId: 'me-1',
    creatorName: 'me',
    categoryId: 'cat-1',
    categoryName: 'creating',
    price: { min: 300, max: 300 },
    tags: [],
    deadline: new Date(now + 20 * 36e5).toISOString(),
    viewsCount: 0,
    status: 'active',
    updateCount: 0,
    acceptedCount: 1,
    by: { id: 'me-1', name: 'You', avatarUrl: null },
    offerers: [{ id: 'c-1', name: 'Lena V', avatarUrl: null }],
    circle: null,
    open: true,
    mine: true,
    offered: false,
  },
];

/** `GET /frontend/request-weos/:id/accepted-weos` — one offer on your brief. */
export const briefOffersFixture = {
  offers: [
    {
      _id: 'weo-offer-1',
      title: 'Zine cover, two colours',
      creatorName: 'lenav',
      media: [{ url: 'https://cdn.test/weos/cover.jpg', type: 'image' }],
      price: { amount: 3 },
      status: 'active',
    },
  ],
  total: 1,
  page: 1,
  totalPages: 1,
};

/** `GET /frontend/me/tracking` — one tracked WeO, one tracked creator. */
export const trackingFixture = (): S['TrackingList'] => {
  const weo = liveWeos()[0] as WeoCardDto;
  return {
    weos: [
      {
        weo: weo as unknown as S['WeoCardView'],
        trackedAt: '2026-07-27T12:00:00.000Z',
        note: 'Ask moved O 2,000 → O 1,900',
      },
    ],
    creators: [
      {
        creator: {
          id: 'c-1',
          name: 'Lena V',
          handle: '@lenav',
          avatarUrl: null,
          bio: null,
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
        trackedAt: '2026-07-26T12:00:00.000Z',
        openWeos: 4,
        note: '1 new WeO since you started tracking',
      },
    ],
    counts: { weos: 1, creators: 1 },
  };
};

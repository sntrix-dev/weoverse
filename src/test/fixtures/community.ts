import type { DraftDto } from '@/features/community/api/community';
import type { components } from '@/api/generated/schema';
import { circleFixture, liveWeos } from './discover';

type S = components['schemas'];

/** The signed-in member in every fixture (navSummary.ts `id`). */
export const ME = '69808052344eb80305da8e6d';
const T0 = '2026-09-28T10:00:00.000Z';

export const author = (over: Partial<S['CommunityAuthorView']> = {}): S['CommunityAuthorView'] => ({
  id: 'u-ada',
  fullName: 'Ada Obi',
  creatorName: 'ada',
  profileImage: null,
  isr: 82,
  ...over,
});

export const circleDetailFixture = (over: Partial<S['CommunityCircleDetailView']> = {}): S['CommunityCircleDetailView'] => ({
  ...circleFixture({ description: 'Edition strategy, generative work and first drops.', tags: ['editions'] }),
  trendingTags: [
    { tag: 'pricing', count: 3 },
    { tag: 'editions', count: 1 },
  ],
  threads: [threadFixture(), threadFixture({ id: 't-2', title: 'Cap the edition?', tags: ['editions'], status: 'resolved', acceptedAnswerId: 'a-1' })],
  threadsNextBefore: null,
  collectThrough7d: 0.4,
  ...over,
});

export const threadFixture = (over: Partial<S['CommunityThreadSummary']> = {}): S['CommunityThreadSummary'] => ({
  id: 't-1',
  circleId: 'circ-1',
  circleSlug: 'digital-arts',
  circleName: 'Digital Arts',
  authorId: 'u-ada',
  author: author(),
  title: 'How do I price a first edition?',
  snippet: 'Twelve pieces, no audience yet.',
  tags: ['pricing'],
  status: 'open',
  attachedWeoId: null,
  answerCount: 2,
  replyCount: 1,
  reactionCount: 3,
  viewCount: 40,
  voteScore: 5,
  isPinned: false,
  acceptedAnswerId: null,
  createdAt: T0,
  ...over,
});

export const answerFixture = (over: Partial<S['CommunityAnswerView']> = {}): S['CommunityAnswerView'] => ({
  id: 'a-1',
  threadId: 't-1',
  authorId: 'u-bo',
  author: author({ id: 'u-bo', fullName: 'Bo Lin', creatorName: 'bo', isr: 64 }),
  body: 'Start low and cap it.',
  voteScore: 4,
  userVote: 0,
  isAccepted: false,
  reactionCount: 0,
  replyCount: 1,
  replies: [
    {
      id: 'r-1',
      answerId: 'a-1',
      threadId: 't-1',
      authorId: 'u-ada',
      author: author(),
      body: 'That worked.',
      mention: '@bo',
      createdAt: T0,
    },
  ],
  createdAt: T0,
  updatedAt: T0,
  ...over,
});

export const threadDetailFixture = (over: Partial<S['CommunityThreadDetail']> = {}): S['CommunityThreadDetail'] => ({
  ...threadFixture(),
  body: 'Twelve pieces, no audience yet. Where do I start?',
  attachedWeo: null,
  answers: [answerFixture(), answerFixture({ id: 'a-2', authorId: ME, author: author({ id: ME }), body: 'Mine.', voteScore: 9, replies: [], replyCount: 0 })],
  updatedAt: T0,
  ...over,
});

export const membersFixture: S['CommunityCircleMemberView'][] = [
  { id: 'u-ada', fullName: 'Ada Obi', creatorName: 'ada', profileImage: null, isr: 82, joinedAt: T0 },
  { id: 'u-bo', fullName: 'Bo Lin', creatorName: 'bo', profileImage: null, isr: 64, joinedAt: T0 },
];

export const storiesFixture: S['CommunityStoryView'][] = [
  {
    id: 's-1',
    weoId: 'weo-1',
    threadId: 't-1',
    title: 'Forty backers in a week',
    cover: '',
    authorName: 'Ada Obi',
    type: 'crowdfund',
    duration: '7 days',
    blurb: 'Rehearsed first, then posted.',
    description: '',
    category: 'Digital arts',
    fundedStatus: 'Fully backed',
    backerCount: 40,
    isPublished: true,
    createdAt: T0,
    updatedAt: T0,
  },
  {
    id: 's-2',
    weoId: 'weo-2',
    threadId: null,
    title: 'A hunt that sold out',
    cover: '',
    authorName: 'Bo Lin',
    type: 'lottery',
    duration: '3 days',
    blurb: 'Entries closed early.',
    description: '',
    category: 'Music',
    fundedStatus: 'Sold out',
    backerCount: 120,
    isPublished: true,
    createdAt: T0,
    updatedAt: T0,
  },
];

export const contributor = (over: Partial<S['CommunityContributor']> = {}): S['CommunityContributor'] => ({
  rank: 1,
  contributionScore: 27,
  userId: 'u-ada',
  fullName: 'Ada Obi',
  creatorName: 'ada',
  profileImage: null,
  isr: 90,
  threadsOpened: 2,
  answersWritten: 12,
  answersAccepted: 8,
  acceptedRate: 0.667,
  votesReceived: 20,
  isYou: false,
  bio: 'Pools for makers.',
  weoCount: 5,
  focus: 'Pool',
  circleCount: 3,
  isFollowing: false,
  ...over,
});

export const contributorsFixture: S['CommunityContributors'] = {
  meta: { window: 'all', start: T0, end: T0, previousStart: T0 },
  metric: 'helpful',
  contributors: [
    contributor(),
    contributor({ rank: 2, userId: 'u-bo', fullName: 'Bo Lin', isr: 70, focus: 'Hunt', isFollowing: true, acceptedRate: null }),
  ],
  you: null,
};

const trend = (current: number): S['TrendValue'] => ({ current, previous: 0, delta: current, changePct: null });
export const pulseFixture: S['CommunityPulse'] = {
  meta: { window: '7d', start: T0, end: T0, previousStart: T0 },
  totals: {
    collected: trend(4),
    creators: trend(2),
    circles: trend(0),
    campaigns: trend(1),
    threads: trend(6),
    answers: trend(9),
    joins: trend(3),
  },
  resolveRate: 0.5,
  unansweredCount: 1,
};

export const myWeosFixture: S['CommunityMyWeoCardView'][] = [
  {
    id: 'weo-mine',
    weoType: 'crowdfund',
    title: 'Tide Pool',
    description: '',
    cover: '',
    categoryId: 'cat-1',
    categoryName: 'Digital arts',
    status: 'active',
    pushedToHubAt: null,
    favoritesCount: 0,
    viewsCount: 0,
    participantsCount: 0,
    createdAt: T0,
    updatedAt: T0,
  },
];

export const draftsFixture: DraftDto[] = [
  { _id: 'd-1', title: 'Night Market Print', coverUrl: null, weoType: 'regular', ready: 0.4, updatedAt: T0 },
];

/** Only what the wallet panel reads; the rest of the O-Wallet screen is M09's. */
export const walletFixture = {
  balance: { available: 1700, protected: 200, pending: 50, locked: 50, total: 2000, heldReason: '' },
  power: null,
  holdings: { collected: 3, listed: 1 },
} as unknown as S['WalletView'];

/** The fixture WeOs pushed into the circle. */
export const circleWeosFixture = () =>
  liveWeos()
    .slice(0, 2)
    .map((weo) => ({ weo, latestPushedAt: T0, latestThreadId: 't-1', pushCount: 1 }));

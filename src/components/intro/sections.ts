// design: v3-spine.jsx V3_SECTIONS, V3_SPINE, CHROME_STEPS, V3_WALK.
import type { PortalEdge } from '@/design-system';

export type IntroKey = 'discover' | 'collected' | 'create' | 'hub' | 'listed';

export interface IntroSection {
  n: string | null;
  title: string;
  tone: string;
  clip: string;
  line: string;
  why: string;
  edge: PortalEdge;
}

/** First visit to a section: the whole frame in its colour, the word, the invitation, the O. */
export const INTRO_SECTIONS: Record<IntroKey, IntroSection> = {
  discover: {
    n: '01',
    title: 'Discover',
    tone: '#3A95F2',
    clip: '/media/DiscoverWeO.mp4',
    line: 'Find what’s happening now',
    why: 'WeOs still in the open — whatever closes first takes the big frame.',
    edge: 'top',
  },
  collected: {
    n: '02',
    title: 'Collect',
    tone: '#D946EF',
    clip: '/media/CollectionsWeO.mp4',
    line: 'Get it. Use it. Resell it. Remix it.',
    why: 'What you hold, what it is worth today, and which ones can travel again.',
    edge: 'right',
  },
  create: {
    n: '03',
    title: 'Create',
    tone: '#22C55E',
    clip: '/media/CreationWeO.mp4',
    line: 'Make your offer. Make it live.',
    why: 'Pick a format on the ring or start from a template. Post it today, or let your circle vet it first.',
    edge: 'bottom',
  },
  hub: {
    n: null,
    title: 'Community',
    tone: '#D946EF',
    clip: '/media/CreationWeO.mp4',
    line: 'Your WeOs in flight, and the Circles around them.',
    why: 'Post it — to the network, a Circle, or one person — or let your circle vet it first: tested, reacted to, pre-sold.',
    edge: 'bottom',
  },
  listed: {
    n: '04',
    title: 'Exchange',
    tone: '#F7C62B',
    clip: '/media/ListingsWeO.mp4',
    line: 'Move with the market',
    why: 'Where a WeO earns: live on the floor, with the market moving around it.',
    edge: 'left',
  },
};
export const isIntroKey = (k: string | null | undefined): k is IntroKey => !!k && k in INTRO_SECTIONS;

/** In Create and Community the O is ringed by the five steps of the spine. */
export const SPINE: readonly [string, string][] = [
  ['Make', '#22C55E'],
  ['Rehearse', '#22C55E'],
  ['Reactions', '#D946EF'],
  ['Pledges', '#F7C62B'],
  ['Live', '#F7C62B'],
];

export interface WalkStep {
  sel: string;
  title: string;
  body: string;
}

/** The first tour (Create) covers the chrome once; every later section covers only what is new there. */
const CHROME_STEPS: WalkStep[] = [
  {
    sel: '.weo-nav',
    title: 'Where you are',
    body: 'One pill names the section you are in. Press it for the rest — Create · Community · Exchange · Ask · Discover · Collect · You.',
  },
  {
    sel: '[aria-label="Search the WeOverse"]',
    title: 'Search',
    body: 'WeOs, circles, creators. Results land on the Discover floor.',
  },
  {
    sel: '[aria-label="Notifications"]',
    title: 'What moved',
    body: 'Reactions, pledges and posts on your WeOs arrive here.',
  },
  {
    sel: '.weo-flowbar',
    title: 'The flow bar',
    body: 'The way back, and the one next step. Nothing else. The – folds it to just the verb; the ? brings me back.',
  },
];

export const WALK: Record<IntroKey, WalkStep[]> = {
  create: [
    {
      sel: '.weo-create-ring',
      title: 'The O is the way in',
      body: 'Eight formats ride the ring — Sell · Pool · Bid · Request are open; Hunt, Drop, Gift and Subscription are on their way. Hover any orb to name it; pick one and the composer opens from the same O.',
    },
    ...CHROME_STEPS,
  ],
  hub: [
    {
      sel: '[data-walk="flight"]',
      title: 'Your WeOs in flight',
      body: 'Each O is one WeO. The ring is where it stands in its life; the verb beneath is the one thing it needs from you next.',
    },
    {
      sel: '[data-walk="new"]',
      title: 'New WeO',
      body: 'Make one. Preflight shows the fees, then you choose where it goes — the network, a Circle, or one person. Or let your circle vet it first and it posts itself, validated.',
    },
    {
      sel: '#h-rooms',
      title: 'Everything else',
      body: 'Circles, community and your wallet fold here, one word each. Open what you need.',
    },
    {
      sel: '[data-hero="hub"] [aria-label^="Replay"]',
      title: 'Intro, again',
      body: 'Every section keeps its intro behind this. Tap it any time.',
    },
  ],
  discover: [
    {
      sel: '[data-hero="discover"]',
      title: 'The stage',
      body: 'Whatever closes first takes the big frame. One filter, all formats.',
    },
    { sel: '#floor', title: 'The whole floor', body: 'Every WeO in the open. Search lands here.' },
    {
      sel: '#d-more',
      title: 'More of the floor',
      body: 'Your feed, who is trading, circles and interests fold here — one word each.',
    },
  ],
  listed: [
    {
      sel: '[data-hero="listed"] [data-hero-stats]',
      title: 'The pulse',
      body: 'Seven days of what you flow — live, views, settled. Hover the hero and the figures come up to full.',
    },
    {
      sel: '#l-listed',
      title: 'WeOs you flow',
      body: 'Your listings and what each is doing on the floor. The state tabs filter the list.',
    },
    {
      sel: '#l-more',
      title: 'Snapshot and creators',
      body: 'The 7-day boards and the creators in your circles fold here.',
    },
  ],
  collected: [
    {
      sel: '[data-hero="collected"]',
      title: 'What you hold',
      body: 'What you put in, what it would fetch today, and which ones can travel again.',
    },
    {
      sel: '#c-held',
      title: 'WeOs you hold',
      body: 'Filter by format. Resell what can travel again; open any WeO for its passport.',
    },
    {
      sel: '#c-more',
      title: 'Snapshot and wallet',
      body: 'Movers, formats and where your Os sit fold here.',
    },
  ],
};

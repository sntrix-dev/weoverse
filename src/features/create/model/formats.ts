// design: screens-create.jsx CREATE_TEMPLATES / CREATE_SOON / CREATE_TONE / CREATE_MEDIA, create.jsx MAKE_EDGES
import { formatHex } from '@/lib/cardModel';

/** Every format on the ring. Four can be made today; four are "coming soon" (CRE-12). */
export type CreateKind = 'Listing' | 'Pool' | 'Bid' | 'Hunt' | 'Drop' | 'Request' | 'Gift' | 'Subscription';
/** The formats the composer opens for (D-051). */
export type LiveKind = 'Listing' | 'Pool' | 'Bid' | 'Request';

export interface CreateFormatDef {
  key: CreateKind;
  label: string;
  blurb: string;
  mode: 'sell' | 'buy';
  soon?: boolean;
}

export const CREATE_SOON: ReadonlySet<CreateKind> = new Set<CreateKind>([
  'Hunt',
  'Drop',
  'Gift',
  'Subscription',
]);

export const CREATE_TEMPLATES: readonly CreateFormatDef[] = [
  { key: 'Listing', label: 'Sell', blurb: 'Post value at a set O price', mode: 'sell' },
  { key: 'Pool', label: 'Pool', blurb: 'Pool pledges to a goal', mode: 'sell' },
  { key: 'Bid', label: 'Bid', blurb: 'Highest offer clears', mode: 'sell' },
  { key: 'Hunt', label: 'Hunt', blurb: 'Ticketed prize draw, rules published', mode: 'sell', soon: true },
  { key: 'Drop', label: 'Drop', blurb: 'A capped edition, minted', mode: 'sell', soon: true },
  { key: 'Request', label: 'Request', blurb: 'Buy — post what you want made', mode: 'buy' },
  { key: 'Gift', label: 'Gift', blurb: 'Given, provenance kept, no price', mode: 'sell', soon: true },
  {
    key: 'Subscription',
    label: 'Subscription',
    blurb: 'Recurring access over time',
    mode: 'sell',
    soon: true,
  },
];

export const isLive = (k: string | null | undefined): k is LiveKind =>
  k === 'Listing' || k === 'Pool' || k === 'Bid' || k === 'Request';

export const labelOf = (k: string | null | undefined) =>
  CREATE_TEMPLATES.find((t) => t.key === k)?.label ?? k ?? '';

/** design CREATE_TONE */
export const createTone = (k: string | null | undefined): string =>
  k === 'Request'
    ? '#D946EF'
    : k === 'Gift'
      ? '#F7C62B'
      : k === 'Subscription'
        ? '#FF5A2C'
        : k === 'Bid' || k === 'Pool' || k === 'Hunt' || k === 'Drop' || k === 'Listing'
          ? formatHex(k)
          : '#D946EF';

/** The composer's Button tone name for a format. */
export const toneNameOf = (k: string | null | undefined) =>
  k === 'Bid' ? 'blue' : k === 'Request' || k === 'Drop' ? 'violet' : k === 'Hunt' ? 'gold' : 'green';

/** The imagery that drifts through the O's well at rest (design assets, not WeO data). */
export const CREATE_MEDIA = [
  { label: 'Market', src: '/brand/orb-market.png' },
  { label: 'Coffee', src: '/brand/orb-coffee.png' },
  { label: 'Wellness', src: '/media/weo-wellness.jpg' },
  { label: 'Fitness', src: '/media/weo-fitness.jpg' },
  { label: 'Nutrition', src: '/media/weo-nutrition.jpg' },
] as const;

export type EdgeDir = 'top' | 'right' | 'bottom' | 'left';
export interface MakeEdge {
  dir: EdgeDir;
  key: 'create' | 'collect' | 'discover' | 'listed';
  label: string;
  tone: string;
  src: string;
}

/** The four edges of the O, each playing its section's stage in the hole. */
export const MAKE_EDGES: Record<EdgeDir, MakeEdge> = {
  bottom: { dir: 'bottom', key: 'create', label: 'Create', tone: '#22C55E', src: '/media/CreationWeO.mp4' },
  right: {
    dir: 'right',
    key: 'collect',
    label: 'Collect',
    tone: '#D946EF',
    src: '/media/CollectionsWeO.mp4',
  },
  top: { dir: 'top', key: 'discover', label: 'Discover', tone: '#3A95F2', src: '/media/DiscoverWeO.mp4' },
  left: { dir: 'left', key: 'listed', label: 'Exchange', tone: '#F7C62B', src: '/media/ListingsWeO.mp4' },
};

export const MAKE_LOGO = '/media/WEO_Logo.webm';
/** the rest layer under the logo loop, and the clip the centre plays the first time it is approached */
export const MAKE_INTRO_CLIP = '/mya/clip-intro.mp4';

export const MAKE_MANTRAS = [
  'Make your offer. Make it live.',
  'Own the value you create.',
  'Connect direct. Owe no one rent.',
  'Move with the market.',
  'Prosperity, shared.',
] as const;

/** The design's suggested tags; your own are added beside them. */
export const TAG_LIST = ['collectors', 'editions', 'local', 'handmade', 'generative', 'first-time'] as const;

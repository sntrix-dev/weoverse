// design: src/components/chrome.jsx MARKET + JUMP
import type { ReactNode } from 'react';
import { ICO, O_SECTION_ICONS } from '@/design-system';
import type { SectionKey } from '@/app/useShellRoute';

export interface MarketItem {
  key: SectionKey;
  label: string;
  long: string;
  color: string;
  icon: ReactNode;
}

/** one WeO, four stages of its life — Discover, Collect, Create, Exchange. Creators fold into Exchange. */
export const MARKET: readonly MarketItem[] = [
  {
    key: 'create',
    label: 'Create',
    long: 'Make your offer. Make it live.',
    color: '#22C55E',
    icon: O_SECTION_ICONS.bottom,
  },
  { key: 'hub', label: 'Community', long: 'Circles and threads', color: '#D946EF', icon: ICO.hub },
  {
    key: 'earn',
    label: 'Exchange',
    long: 'Move with the market',
    color: '#F7C62B',
    icon: O_SECTION_ICONS.left,
  },
  { key: 'requests', label: 'Ask', long: 'Ask · Offer', color: '#3A95F2', icon: ICO.requests },
  {
    key: 'discover',
    label: 'Discover',
    long: 'Find what’s happening now',
    color: '#3A95F2',
    icon: O_SECTION_ICONS.top,
  },
  {
    key: 'collect',
    label: 'Collect',
    long: 'Get it. Use it. Resell it. Remix it.',
    color: '#D946EF',
    icon: O_SECTION_ICONS.right,
  },
  { key: 'passport', label: 'You', long: 'You and your standing', color: '#3A95F2', icon: ICO.passport },
];

export interface JumpItem {
  key: SectionKey | 'mya';
  label: string;
  color: string;
  icon: ReactNode;
}

/**
 * The O nav's jumps: every section but the hub, then Mya. The design also lists Worlds;
 * worlds arrive in M11, so the jump is hidden until then (M02 spec).
 */
export const JUMP: readonly JumpItem[] = [
  ...MARKET.filter((m) => m.key !== 'hub'),
  { key: 'mya', label: 'Mya', color: '#D946EF', icon: ICO.chat },
];

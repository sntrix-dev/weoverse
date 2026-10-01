import type { components } from '@/api/generated/schema';
import { isrStage } from '@/design-system';

export type NavSummaryDto = components['schemas']['NavSummary'];

/**
 * The signed-in person as the shell draws them (design `HUB.ME` + `HUB.WALLET` + `WV.MY_TIER`).
 * Built only from `GET /users/me/nav-summary`; fields the backend doesn't have yet stay
 * `null` and the UI leaves that piece out (see M02 spec "Gaps").
 */
export interface ShellTier {
  /** 1–3 */
  rank: number;
  /** e.g. "Player" */
  label: string;
  /** backend badge, e.g. "L2" */
  badge: string | null;
  /** design WV.TIERS tones by rank */
  tone: string;
}

export interface ShellMe {
  id: string;
  name: string;
  handle: string;
  avatarUrl: string | null;
  initials: string;
  weoId: string;
  isr: number;
  isrLabel: string;
  isrColor: string;
  /** "Feb 2024" */
  joined: string;
  /** spendable Os */
  available: number;
  tier: ShellTier | null;
  counts: { collected: number; created: number; circles: number; campaigns: number };
  unread: number;
  /** gaps — no backend source yet */
  power: number | null;
  verified: boolean | null;
}

// design: src/data/wv-data.js TIERS[].tone (Member blue, Contributor green, Steward gold)
const TIER_TONE = ['', '#3A95F2', '#22C55E', '#F7C62B'] as const;

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('') || 'O';

export const joinedLabel = (iso: string | undefined) => {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

export function toShellMe(dto: NavSummaryDto): ShellMe {
  const id = dto.identity;
  const isr = Math.max(0, Math.min(100, Math.round(id.isr ?? 0)));
  const stage = isrStage(isr);
  const rank = dto.wallet.tierRank ?? 0;
  const tierName = dto.wallet.tier;
  const name = id.name || id.handle?.replace(/^@/, '') || '';
  return {
    id: id.id ?? '',
    name,
    handle: id.handle ?? '',
    avatarUrl: id.avatarUrl ?? null,
    initials: initialsOf(name),
    weoId: id.weoId ?? '',
    isr,
    isrLabel: stage.label,
    isrColor: stage.color,
    joined: joinedLabel(id.joinedAt),
    available: dto.wallet.available ?? 0,
    tier:
      rank > 0 && tierName && tierName !== 'not applicable'
        ? {
            rank,
            label: cap(tierName),
            badge: dto.wallet.tierLabel ?? null,
            tone: TIER_TONE[rank] ?? TIER_TONE[1],
          }
        : null,
    counts: {
      collected: dto.counts.collected ?? 0,
      created: dto.counts.created ?? 0,
      circles: dto.counts.circles ?? 0,
      campaigns: dto.counts.campaigns ?? 0,
    },
    unread: dto.notifications.unread ?? 0,
    power: null,
    verified: null,
  };
}

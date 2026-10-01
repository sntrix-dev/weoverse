import type { components } from '@/api/generated/schema';
import type { CircleCardModel } from '@/components/circle/Circle';
import { formatHex, type WeoFormat } from './cardModel';

type S = components['schemas'];
type CircleCardDto = S['CommunityCircleCardView'];
type CircleDetailDto = S['CommunityCircleDetailView'];

/** A WeO's kind as the design names its format. */
export const KIND_FORMAT: Record<string, WeoFormat> = { regular: 'Listing', crowdfund: 'Pool', lottery: 'Hunt' };
const KIND_ICON: Record<string, string> = { regular: 'assets', crowdfund: 'pool', lottery: 'hunt' };

export const formatOfKind = (kind: string | null | undefined): WeoFormat | null =>
  kind ? (KIND_FORMAT[kind] ?? null) : null;

const unit = (n: number | null | undefined) => Math.max(0, Math.min(1, n ?? 0));

/**
 * A community circle as the kit's CircleRecord reads it. The design's "desire" band has no
 * backend figure; the circle's 7-day resolved rate (questions answered) fills it — the share
 * of what the room asked that it answered (M04 gaps, D-039).
 */
export function circleCard(c: CircleCardDto): CircleCardModel & { slug: string; joined: boolean } {
  const kind = c.weoTypeKey ?? null;
  const format = formatOfKind(kind);
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    members: c.memberCount,
    toneHex: format ? formatHex(format) : /^#[0-9a-f]{6}$/i.test(c.coverColor) ? c.coverColor : null,
    icon: kind ? KIND_ICON[kind] : c.isPlatform || c.isGeneral ? 'ask' : 'arts',
    desire: Math.round(unit(c.resolvedRate7d) * 100),
    img: c.coverImage || null,
    bestType: format ?? c.axisLabel,
    joined: c.isJoined,
  };
}

/** design `HUB.CIRCLES` row, everything the circle pages draw. */
export interface CircleView extends ReturnType<typeof circleCard> {
  toneHex: string;
  axis: string;
  description: string;
  weos: number;
  threads: number;
  /** "here now" */
  active: number;
  /** 0..1 — share of the week's questions resolved */
  resolved: number;
  /** 0..1 — the circle's collect-through this week; null when nothing was posted here */
  winRate: number | null;
  tags: string[];
  open: boolean;
  muted: boolean;
}

export function circleView(c: CircleCardDto | CircleDetailDto): CircleView {
  const card = circleCard(c);
  const detail = 'trendingTags' in c ? c : null;
  return {
    ...card,
    toneHex: card.toneHex ?? '#D946EF',
    axis: c.axisLabel,
    description: c.description,
    weos: c.weoCount,
    threads: c.threadCount,
    active: c.activeNow,
    resolved: unit(c.resolvedRate7d),
    winRate: detail ? (detail.collectThrough7d ?? null) : null,
    // what the room is actually talking about, else the circle's own tags
    tags: detail && detail.trendingTags.length ? detail.trendingTags.map((t) => t.tag) : c.tags,
    open: c.isOpen,
    muted: c.notification === 'off',
  };
}

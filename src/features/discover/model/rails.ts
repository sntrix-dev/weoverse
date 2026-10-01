import type { CircleCardModel } from '@/components/circle/Circle';
import { formatHex, type WeoFormat } from '@/lib/cardModel';
import type { CircleCardDto, CreatorRowDto, InterestDto } from '../api/discover';

/** design `WV.CREATORS` row as the CreatorStall draws it. */
export interface CreatorStallModel {
  id: string;
  name: string;
  handle: string;
  avatar: string | null;
  isr: number;
  format: string;
  tone: string;
  trace: number[];
}

export const creatorStall = (c: CreatorRowDto): CreatorStallModel => ({
  id: c.id,
  name: c.name,
  handle: c.handle,
  avatar: c.avatarUrl,
  isr: Math.max(0, Math.min(100, Math.round(c.isr))),
  format: c.format,
  tone: c.tone,
  trace: c.trace7d,
});

const KIND_FORMAT: Record<string, WeoFormat> = { regular: 'Listing', crowdfund: 'Pool', lottery: 'Hunt' };
const KIND_ICON: Record<string, string> = { regular: 'assets', crowdfund: 'pool', lottery: 'hunt' };

/**
 * A community circle as the kit's CircleRecord reads it. The design's "desire" band has no
 * backend figure; the circle's 7-day resolved rate (questions answered) fills it — the share
 * of what the room asked that it answered (spec: M04 gaps).
 */
export function circleCard(c: CircleCardDto): CircleCardModel & { slug: string; joined: boolean } {
  const kind = c.weoTypeKey ?? null;
  const format = kind ? KIND_FORMAT[kind] : null;
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    members: c.memberCount,
    toneHex: format ? formatHex(format) : /^#[0-9a-f]{6}$/i.test(c.coverColor) ? c.coverColor : null,
    icon: kind ? KIND_ICON[kind] : c.isPlatform || c.isGeneral ? 'ask' : 'arts',
    desire: Math.round(Math.max(0, Math.min(1, c.resolvedRate7d)) * 100),
    img: c.coverImage || null,
    bestType: format ?? c.axisLabel,
    joined: c.isJoined,
  };
}

/** design `HUB.CONTEXTS` row: the context, the format that wins there, and how often. */
export interface InterestModel {
  context: string;
  type: WeoFormat;
  rate: number;
  tone: string;
  live: number;
}

export const interest = (r: InterestDto): InterestModel => {
  const type = KIND_FORMAT[r.topFormat] ?? 'Listing';
  return { context: r.category, type, rate: r.clearRate, tone: formatHex(type), live: r.liveCount };
};

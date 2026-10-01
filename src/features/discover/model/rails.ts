import { formatHex, type WeoFormat } from '@/lib/cardModel';
import { KIND_FORMAT } from '@/lib/circleModel';
import type { CreatorRowDto, InterestDto } from '../api/discover';

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

// moved to lib (the community module reads circles too)
export { circleCard } from '@/lib/circleModel';

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

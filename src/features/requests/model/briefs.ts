import type { BriefDto } from '../api/requests';

export interface BriefPersonModel {
  id: string;
  name: string;
  avatar: string | null;
}

/** design `FEED.REQUESTS` row — what the card, the record, the panel and the offer sheet draw. */
export interface BriefModel {
  id: string;
  title: string;
  brief: string;
  by: BriefPersonModel;
  /** the most they will pay, Os */
  budget: number;
  budgetMin: number;
  offers: number;
  /** "5d", "12h", or "closed" */
  closes: string;
  open: boolean;
  mine: boolean;
  offered: boolean;
  category: string;
  circle: { id: string; name: string; img: string | null; tone: string } | null;
  offerers: BriefPersonModel[];
}

/** Titles and categories are stored lower-case; they read in sentence case. */
export const sentence = (s: string | null | undefined) => {
  const t = (s ?? '').trim();
  return t ? t[0]!.toUpperCase() + t.slice(1) : '';
};

/** How long a brief still takes offers. */
export function closesIn(deadline: string | null | undefined, now: number): string {
  const end = deadline ? Date.parse(deadline) : NaN;
  if (Number.isNaN(end) || end <= now) return 'closed';
  const h = (end - now) / 3_600_000;
  if (h < 24) return `${Math.max(1, Math.ceil(h))}h`;
  return `${Math.ceil(h / 24)}d`;
}

const person = (
  p: { id: string; name: string; avatarUrl: string | null } | null | undefined,
): BriefPersonModel =>
  p ? { id: p.id, name: p.name, avatar: p.avatarUrl } : { id: '', name: 'Someone', avatar: null };

export function briefModel(r: BriefDto, now: number = Date.now()): BriefModel {
  const max = Number(r.price?.max ?? 0);
  const min = Number(r.price?.min ?? 0);
  const open = r.open ?? (r.status === 'active' && Date.parse(r.deadline) > now);
  return {
    id: String(r._id),
    title: sentence(r.title),
    brief: r.description ?? '',
    by: person(r.by),
    budget: max || min,
    budgetMin: min,
    offers: Number(r.acceptedCount ?? 0),
    closes: open ? closesIn(r.deadline, now) : 'closed',
    open,
    mine: !!r.mine,
    offered: !!r.offered,
    category: sentence(r.categoryName),
    circle: r.circle
      ? { id: r.circle.id, name: r.circle.name, img: r.circle.image, tone: r.circle.coverColor }
      : null,
    offerers: (r.offerers ?? []).map(person),
  };
}

/**
 * "Circles asking" — the category circles with an open brief (D-063).
 */
export const circlesAsking = (list: BriefModel[]) =>
  new Set(list.flatMap((r) => (r.circle ? [r.circle.id] : []))).size;

/** design OfferSheet dial: 40%–160% of the budget, the sweet spot 75%–105%, a step that fits the size. */
export function offerRange(budget: number) {
  const b = Math.max(1, Math.round(budget));
  const step = b >= 20_000 ? 1000 : b >= 2_000 ? 100 : b >= 200 ? 10 : 1;
  const snap = (n: number) => Math.max(step, Math.round(n / step) * step);
  return {
    start: snap(b),
    min: snap(b * 0.4),
    max: snap(b * 1.6),
    lo: snap(b * 0.75),
    hi: snap(b * 1.05),
    step,
  };
}

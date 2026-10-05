import type { components } from '@/api/generated/schema';

/**
 * design: src/data/weo-model.js `cardModel(w, ctx)` — the ONE bridge from the backend's
 * WeO projection (`GET /frontend/weos`, `WeoCardView`) to every card, row, rail and board.
 * No component reads a raw WeO field; they all read a `WeoCardModel`.
 *
 * Differences from the design's port contract (it was written against a fixture shape):
 * - the price is `weoverse.priceOs` / `priceUsd` — the backend states the one O figure per
 *   kind, because the kinds store theirs in different units (M03 backend, G-29);
 * - circles arrive with names (`weoverse.circles`), so cards can label the chips;
 * - the close time is the kind-agnostic `closesAt`.
 */
type S = components['schemas'];
type Common = Omit<S['WeoCardCommon'], 'weoType'>;
export type RegularWeoDto = Common & S['RegularCardData'];
export type CrowdfundWeoDto = Common & S['CrowdfundCardData'];
export type LotteryWeoDto = Common & S['LotteryCardData'];
/** `WeoCardView`, as a union the compiler can narrow on `weoType`. */
export type WeoCardDto = RegularWeoDto | CrowdfundWeoDto | LotteryWeoDto;

/** Bid · Pool · Hunt · Drop · Listing — a display projection of the three `weoType`s. */
export type WeoFormat = 'Bid' | 'Pool' | 'Hunt' | 'Drop' | 'Listing';
export const FORMATS: readonly WeoFormat[] = ['Bid', 'Pool', 'Hunt', 'Drop', 'Listing'];

/** The four WeOCardX contexts decide the actions, never the format. */
export type CardContext = 'discover' | 'collected' | 'listed' | 'create';
const ACTIONS: Record<CardContext, string[]> = {
  discover: ['collect', 'watch', 'ask'],
  collected: ['resell', 'transfer', 'passport'],
  listed: ['edit', 'pause', 'share'],
  create: ['preview', 'publish'],
};

// design: weo-model.js TONE / CTA / PRICE_LABEL, data.js HEX
export const FORMAT_TONE: Record<WeoFormat, string> = {
  Bid: 'var(--o-blue)',
  Pool: 'var(--o-green)',
  Hunt: 'var(--o-gold)',
  Drop: 'var(--o-violet)',
  Listing: 'var(--o-green)',
};
export const TONE_HEX: Record<string, string> = {
  'var(--o-blue)': '#3A95F2',
  'var(--o-violet)': '#D946EF',
  'var(--o-gold)': '#F7C62B',
  'var(--o-green)': '#22C55E',
};
/** design `HUB.HEX[HUB.TONE[format]]` */
export const formatHex = (f: WeoFormat): string => TONE_HEX[FORMAT_TONE[f]] ?? '#D946EF';
export const FORMAT_CTA: Record<WeoFormat, string> = {
  Bid: 'Raise',
  Pool: 'Chip in',
  Hunt: 'Join the hunt',
  Drop: 'Get it',
  Listing: 'Collect',
};
export const PRICE_LABEL: Record<WeoFormat, string> = {
  Bid: 'Current bid',
  Pool: 'Pledge',
  Hunt: 'Entry',
  Drop: 'Mint',
  Listing: 'Ask',
};

export interface WeoTerm {
  k: string;
  v: string;
}

export interface WeoCreatorModel {
  id: string;
  handle: string;
  avatarUrl: string | null;
  isr: number;
  bio: string;
  tradeCount: number;
  followersCount: number;
  tier: S['WeoCreatorView']['tier'];
  /** "Feb 2024", or '' */
  joined: string;
}

export interface WeoCardModel {
  id: string;
  /** passport number, e.g. "WEO-4417AC" — null before the backend backfill */
  weoId: string | null;
  name: string;
  slug: string;
  type: WeoFormat;
  format: WeoFormat;
  context: CardContext;
  tone: string;
  hex: string;
  cta: string;
  actions: string[];
  os: number;
  priceOs: number;
  priceUsd: number;
  priceLabel: string;
  category: string;
  img: string | null;
  media: S['WeoCardCommon']['media'];
  creatorId: string;
  creator: WeoCreatorModel;
  isr: number;
  edition: string;
  rarity: string;
  fundPct: number;
  left: number;
  total: number;
  /** "06:14:22" while under the clock, else null */
  timer: string | null;
  /** "6h" · "2d" · "closed" */
  endsIn: string;
  live: boolean;
  urgent: boolean;
  collectors: number;
  watchers: number;
  likes: number;
  liked: boolean;
  activeNow: number;
  /** "+8%" — null when there is no prior week (not "flat") */
  trend: string | null;
  circleIds: string[];
  circles: { id: string; name: string; slug: string }[];
  collected: boolean;
  resellable: boolean;
  /** creator's resale split as a whole percent (regular only), else null */
  resalePct: number | null;
  terms: WeoTerm[];
  points: string[];
}

/* ---------- derivations: every display value has exactly one source ---------- */

export function formatOf(w: WeoCardDto): WeoFormat {
  // the backend's reading (the creator's choice when stored, M07) wins over the flags
  if (w.format && (FORMATS as readonly string[]).includes(w.format)) return w.format as WeoFormat;
  if (w.weoType === 'crowdfund') return 'Pool';
  if (w.weoType === 'lottery') return 'Hunt';
  if (w.isNegotiable) return 'Bid';
  if (w.isLimitedDrop) return 'Drop';
  return 'Listing';
}

export interface Progress {
  pct: number;
  total: number;
  left: number;
  edition: string;
}

export function progressOf(w: WeoCardDto): Progress {
  if (w.weoType === 'crowdfund') {
    const t = w.weoverse?.editionSize ?? 0;
    return {
      pct: w.percentFunded,
      total: t,
      left: Math.max(0, Math.round(t * (1 - w.percentFunded))),
      edition: t ? `Edition of ${t}` : '',
    };
  }
  if (w.weoType === 'lottery') {
    return {
      pct: w.percentSold,
      total: w.ticket.totalTickets,
      left: w.ticketsLeft,
      edition: `${w.ticket.totalTickets} entries`,
    };
  }
  const total = w.quantity.amount;
  return {
    pct: total ? w.soldCount / total : 0,
    total,
    left: w.inventoryLeft,
    edition: `Edition of ${total}`,
  };
}

const pad = (n: number) => String(n).padStart(2, '0');
const H = 36e5;

/** ms → "hh:mm:ss"; null when there is no clock or it has run out */
export function hhmmss(ms: number | null): string | null {
  if (ms == null || ms <= 0) return null;
  const s = Math.floor(ms / 1000);
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

/**
 * ms → "6h" / "2d" / "closed"; no close time at all → "open". (design weo-model printed
 * "closed" for a WeO without a clock — design-port guide §5 #12.)
 */
export function shortLeft(ms: number | null): string {
  if (ms == null) return 'open';
  if (ms <= 0) return 'closed';
  const h = ms / H;
  return h < 24 ? `${Math.round(h)}h` : `${Math.round(h / 24)}d`;
}

function rarityOf(w: WeoCardDto, prog: Progress): string {
  const note = w.weoverse?.rarityNote;
  if (note) return note;
  if (w.weoType === 'crowdfund') return `${Math.round(prog.pct * 100)}% funded`;
  if (w.weoType === 'lottery')
    return w.draw.mechanism === 'provably_fair_rng' ? 'Rules published' : 'Draw pending';
  return w.status === 'sold_out' || prog.left === 0
    ? 'Sold out'
    : w.isAlmostGone
      ? 'Almost gone'
      : 'Available';
}

const osFmt = (n: number) => n.toLocaleString('en-US');

function termsOf(w: WeoCardDto, f: WeoFormat, os: number, prog: Progress, ms: number | null): WeoTerm[] {
  const closes = { k: f === 'Hunt' ? 'Ends in' : 'Closes', v: shortLeft(ms) };
  const price = { k: PRICE_LABEL[f], v: `O ${osFmt(os)}` };
  if (f === 'Hunt') return [price, { k: 'Entries', v: `${prog.left} left` }, closes];
  if (f === 'Pool')
    return [
      price,
      // a pool without an edition size has nothing "left" to count — say how funded it is
      prog.total > 0
        ? { k: 'Left', v: `${prog.left} of ${prog.total}` }
        : { k: 'Funded', v: `${Math.round(prog.pct * 100)}%` },
      closes,
    ];
  if (f === 'Listing' && w.weoType === 'regular')
    return [
      price,
      { k: 'Edition', v: `${prog.total - prog.left} of ${prog.total}` },
      { k: 'Resale', v: `${Math.round((w.price.priceSplit || 0) * 100)}%` },
    ];
  if (f === 'Bid') return [price, { k: 'Negotiable', v: 'Yes' }, closes];
  return [price, { k: 'Left', v: `${prog.left} of ${prog.total}` }, closes];
}

const monthYear = (iso: string | null | undefined) => {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

/* ============ cardModel — the only bridge from API to interface ============ */

export function cardModel(
  w: WeoCardDto,
  context: CardContext = 'discover',
  now: number = Date.now(),
): WeoCardModel {
  const ctx: CardContext = ACTIONS[context] ? context : 'discover';
  const f = formatOf(w);
  const x = w.weoverse;
  const prog = progressOf(w);
  const ends = w.closesAt ? new Date(w.closesAt).getTime() : null;
  const ms = ends == null || Number.isNaN(ends) ? null : ends - now;
  const os = x?.priceOs ?? 0;
  const tone = FORMAT_TONE[f];
  const circles = (x?.circles ?? []).map((c) => ({ id: String(c.id), name: c.name, slug: c.slug }));
  const urgent =
    w.weoType === 'crowdfund'
      ? w.isClosingSoon
      : w.weoType === 'lottery'
        ? w.isAlmostSoldOut
        : w.isAlmostGone;
  return {
    id: String(w._id),
    weoId: x?.publicId ?? null,
    name: w.title,
    slug: w.slug,
    type: f,
    format: f,
    context: ctx,
    tone,
    hex: formatHex(f),
    cta: FORMAT_CTA[f],
    actions: ACTIONS[ctx],
    os,
    priceOs: os,
    priceUsd: x?.priceUsd ?? 0,
    priceLabel: PRICE_LABEL[f],
    category: w.categoryName,
    img: w.media[0]?.url ?? null,
    media: w.media,
    creatorId: String(w.creator._id),
    creator: {
      id: String(w.creator._id),
      handle: w.creator.handle,
      avatarUrl: w.creator.avatarUrl ?? null,
      isr: w.creator.isr,
      bio: w.creator.bio,
      tradeCount: w.creator.tradeCount,
      followersCount: w.creator.followersCount,
      tier: w.creator.tier,
      joined: monthYear(w.creator.joinedSince),
    },
    isr: w.creator.isr,
    edition: prog.edition,
    rarity: rarityOf(w, prog),
    fundPct: Math.round(prog.pct * 100),
    left: prog.left,
    total: prog.total,
    timer: hhmmss(ms),
    endsIn: shortLeft(ms),
    // open = active AND not past its own close time (a lapsed clock is closed even before a job flips status)
    live: w.status === 'active' && (ms == null || ms > 0),
    urgent: !!urgent,
    collectors: w.participantsCount,
    watchers: w.viewsCount,
    likes: w.favoritesCount,
    liked: !!w.isLiked,
    activeNow: x?.activeNow ?? w.activeNow ?? 0,
    trend: x?.trendPct == null ? null : `${x.trendPct > 0 ? '+' : ''}${x.trendPct}%`,
    circleIds: circles.map((c) => c.id),
    circles,
    collected: !!x?.isCollected,
    resellable: w.isResellable,
    resalePct: w.weoType === 'regular' ? Math.round((w.price.priceSplit || 0) * 100) : null,
    terms: termsOf(w, f, os, prog, ms),
    points: x?.points ?? [],
  };
}

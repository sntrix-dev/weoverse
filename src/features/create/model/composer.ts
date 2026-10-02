/**
 * The composer's state and what it becomes (D-051).
 *
 * Prices are entered in Os everywhere. A regular WeO (Listing, Bid) stores US dollars and is
 * charged `price.amount × usdAgainstO`, so the payload divides by the backend's peg
 * (`GET /frontend/config/o`) — never a number of our own. A Pool's goal and pledge and a
 * Request's budget are Os on the backend already.
 */
import type { TemplateDto } from '../api/create';
import { isLive, type LiveKind } from './formats';

export type MediaKind = 'image' | 'video';
export interface MediaItem {
  kind: MediaKind;
  /** the uploaded URL */
  src: string;
  name?: string;
}

export interface ComposerForm {
  kind: LiveKind | null;
  catId: string;
  cat: string;
  title: string;
  desc: string;
  /** the cover (an uploaded image URL) */
  media: string | null;
  /** up to two more; at most one video in the WeO */
  gallery: MediaItem[];
  tags: string[];
  tagDraft: string;
  price: number;
  priceMax: number;
  qty: number;
  unit: string;
  circ: number;
  days: number;
  resell: boolean;
  goal: number;
  minPledge: number;
  /** Bid: hold a floor (never shown to bidders) */
  reserve: boolean;
  /** Listing: accept offers below the ask */
  negotiable: boolean;
  /** % below the figure an offer may go (Listing offers, Bid reserve) */
  negotiateOff: number;
}

/** CRE-05: nothing is priced or counted until you say so. */
export const EMPTY_FORM: ComposerForm = {
  kind: null,
  catId: '',
  cat: '',
  title: '',
  desc: '',
  media: null,
  gallery: [],
  tags: [],
  tagDraft: '',
  price: 0,
  priceMax: 0,
  qty: 0,
  unit: 'piece',
  circ: 0,
  days: 7,
  resell: true,
  goal: 0,
  minPledge: 0,
  reserve: false,
  negotiable: false,
  negotiateOff: 10,
};

export const MEDIA_MAX = 3;
export const MEDIA_LIMIT: Record<MediaKind, number> = { image: 10 * 1024 * 1024, video: 100 * 1024 * 1024 };
/** The most a creator can mark negotiable; 100% would be "free if you ask". */
export const NEGOTIABLE_MAX = 90;
/** A Bid's floor when a reserve is held and none was set. */
export const BID_RESERVE_DEFAULT = 20;

export const floorPrice = (price: number, off: number) => Math.max(0, Math.round(price * (1 - off / 100)));

/** A format pick opens a clean composer: the format, nothing priced, nothing counted, no media (D-053). */
export const pickForm = (kind: LiveKind): ComposerForm => ({
  ...EMPTY_FORM,
  kind,
  reserve: kind === 'Bid',
  negotiateOff: kind === 'Bid' ? BID_RESERVE_DEFAULT : EMPTY_FORM.negotiateOff,
});

/** A template fills every module its format asks for, so preflight is one press away. */
export function templateForm(tp: TemplateDto, prev: ComposerForm): ComposerForm | null {
  if (!isLive(tp.format)) return null;
  const qty = tp.qty || 1;
  const os = tp.os || 0;
  const tags = [
    String(tp.sector || tp.category.name || '')
      .toLowerCase()
      .split(' ')[0],
    tp.type === 'Product' ? 'editions' : 'local',
    qty > 1 ? 'collectors' : 'handmade',
  ].filter((t, i, a): t is string => !!t && a.indexOf(t) === i);
  const kind = tp.format;
  return {
    ...prev,
    kind,
    title: tp.name,
    desc: tp.line,
    catId: tp.category.id ?? '',
    cat: tp.category.id ? tp.category.name : '',
    media: tp.image,
    gallery: [],
    tags,
    price: os,
    priceMax: Math.round(os * 1.5) || 0,
    qty,
    unit: tp.type === 'Service' || tp.type === 'Service-Sub' ? 'seat' : 'piece',
    circ: Math.max(qty, 1),
    days: kind === 'Bid' ? 5 : kind === 'Pool' ? 21 : 14,
    resell: tp.type === 'Product',
    goal: kind === 'Pool' ? os * qty : 0,
    minPledge: kind === 'Pool' ? os : 0,
    reserve: kind === 'Bid',
    negotiable: false,
    negotiateOff: kind === 'Bid' ? BID_RESERVE_DEFAULT : 10,
  };
}

/* ---------- what is still needed ---------- */

/** The figure that makes a WeO real: the goal for a Pool, the price otherwise. */
export const hasFigure = (f: ComposerForm) => (f.kind === 'Pool' ? f.goal > 0 : f.price > 0);

/**
 * Enough to post (D-052): a name, a line, a category, a figure — and a cover for anything but a
 * Request (the backend refuses a WeO without media). The rest can follow.
 */
export function missingOf(f: ComposerForm): string[] {
  return [
    f.title.trim().length > 2 ? null : 'a name',
    f.desc.trim().length > 0 ? null : 'a line',
    f.catId ? null : 'a category',
    hasFigure(f) ? null : 'a figure',
    f.kind === 'Request' && f.priceMax < f.price ? 'a budget that ends above where it starts' : null,
    f.kind !== 'Request' && !f.media ? 'a cover' : null,
  ].filter((x): x is string => !!x);
}
export const canPost = (f: ComposerForm) => missingOf(f).length === 0;

/** The five checks a draft records as `ready` (Exchange shows "N open", D-047). */
export function readiness(f: ComposerForm): number {
  const checks = [f.title.trim().length > 2, f.desc.trim().length > 4, !!f.media, !!f.catId, hasFigure(f)];
  return checks.filter(Boolean).length / checks.length;
}

/** Nothing is saved until the composer holds something a person typed or chose. */
export const worthSaving = (f: ComposerForm) =>
  f.title.trim().length > 0 || f.desc.trim().length > 0 || !!f.media || f.tags.length > 0 || !!f.catId;

/* ---------- media rules (design MediaUploader) ---------- */

/** Why this file cannot go in slot `i`, or null when it can. */
export function mediaRefusal(
  f: ComposerForm,
  i: number,
  kind: MediaKind | null,
  size: number,
): string | null {
  if (!kind) return 'That file is not an image or a video';
  if (i === 0 && kind !== 'image') return 'The cover has to be an image';
  if (kind === 'video' && f.gallery.some((g, n) => g.kind === 'video' && n !== i - 1))
    return 'One video per WeO — this one already has it';
  if (size > MEDIA_LIMIT[kind]) return kind === 'image' ? 'Images up to 10 MB' : 'Videos up to 100 MB';
  return null;
}

/** Put an uploaded item in slot `i` (0 = the cover). */
export function placeMedia(
  f: ComposerForm,
  i: number,
  item: MediaItem,
): Pick<ComposerForm, 'media' | 'gallery'> {
  if (i === 0) return { media: item.src, gallery: f.gallery };
  const g = f.gallery.slice();
  if (i - 1 < g.length) g[i - 1] = item;
  else g.push(item);
  return { media: f.media, gallery: g };
}

/** Take one away; when the cover goes, the next image in line becomes the cover. */
export function removeMedia(f: ComposerForm, i: number): Pick<ComposerForm, 'media' | 'gallery'> {
  if (i === 0) {
    const n = f.gallery.findIndex((g) => g.kind === 'image');
    if (n < 0) return { media: null, gallery: f.gallery };
    return { media: f.gallery[n]!.src, gallery: f.gallery.filter((_, k) => k !== n) };
  }
  return { media: f.media, gallery: f.gallery.filter((_, k) => k !== i - 1) };
}

/* ---------- the payload ---------- */

/** ISO for `days` from now — the deadline every timed format needs. */
export const inDays = (days: number, now = Date.now()) =>
  new Date(now + Math.max(1, Math.round(days || 1)) * 86_400_000).toISOString();

const clampOff = (v: number) => Math.max(1, Math.min(NEGOTIABLE_MAX, Math.round(v)));

export interface BuiltPayload {
  /** a Request is not a WeO: it goes to `/request-weos` */
  endpoint: 'weo' | 'request';
  body: Record<string, unknown>;
}

const mediaOf = (f: ComposerForm) => [
  ...(f.media ? [{ url: f.media, type: 'image' as const }] : []),
  ...f.gallery.map((g) => ({ url: g.src, type: g.kind })),
];

/**
 * The body each endpoint accepts. `usdAgainstO` is the backend's peg; `creatorName` is the
 * Request endpoint's required display name; `requestedId` answers someone's ask (regular only).
 */
export function buildPayload(
  f: ComposerForm,
  opts: { usdAgainstO: number; creatorName?: string; requestedId?: string; now?: number },
): BuiltPayload {
  const now = opts.now ?? Date.now();
  const days = Math.max(1, Math.round(f.days || 1));
  const shared = {
    title: f.title.trim(),
    description: f.desc.trim(),
    categoryId: f.catId,
    tags: f.tags,
    media: mediaOf(f),
  };
  if (f.kind === 'Request') {
    return {
      endpoint: 'request',
      body: {
        title: shared.title,
        description: shared.description,
        categoryId: f.catId,
        categoryName: f.cat,
        creatorName: opts.creatorName || 'creator',
        price: { min: f.price, max: f.priceMax },
        deadline: Date.parse(inDays(days, now)),
        tags: f.tags,
      },
    };
  }
  if (f.kind === 'Pool') {
    return {
      endpoint: 'weo',
      body: {
        ...shared,
        weoType: 'crowdfund',
        goal: { amount: f.goal },
        contribution: { minimum: Math.max(1, Math.round(f.minPledge || 1)) },
        deadline: inDays(days, now),
        duration: days,
      },
    };
  }
  if (f.kind !== 'Listing' && f.kind !== 'Bid') throw new Error(`No composer for ${String(f.kind)}`);
  const peg = opts.usdAgainstO > 0 ? opts.usdAgainstO : 1;
  // a Listing that takes offers, and a Bid with a reserve, carry their floor as a PERCENT;
  // a Bid without a reserve takes any offer down to the cap
  const negotiableUpTo =
    f.kind === 'Bid'
      ? f.reserve
        ? clampOff(f.negotiateOff)
        : NEGOTIABLE_MAX
      : f.negotiable
        ? clampOff(f.negotiateOff)
        : 0;
  const circulation = Math.max(1, Math.round(f.circ || f.qty || 1));
  return {
    endpoint: 'weo',
    body: {
      ...shared,
      weoType: 'regular',
      price: { amount: f.price / peg, priceSplit: 0, negotiableUpTo },
      quantity: {
        amount: Math.max(1, Math.round(f.qty || 1)),
        unitName: f.unit.trim() || 'piece',
        negotiableUpTo: 0,
      },
      customerLimit: circulation,
      totalWeoInCirculation: circulation,
      duration: days,
      availabilityTill: inDays(days, now),
      isResellable: f.resell,
      ...(opts.requestedId ? { requestedId: opts.requestedId } : {}),
    },
  };
}

/** What a draft stores: the form verbatim, plus the fields a "Carry on" row draws. */
export const draftBody = (f: ComposerForm) => ({
  weoType: f.kind === 'Pool' ? 'crowdfund' : f.kind ? 'regular' : null,
  format: f.kind ?? undefined,
  title: f.title.trim(),
  coverUrl: f.media,
  ready: readiness(f),
  payload: { form: { ...f, tagDraft: '' } },
});

/** A saved draft back into the composer (unknown keys dropped, missing ones defaulted). */
export function formFromDraft(d: {
  format?: string;
  title?: string;
  coverUrl?: string | null;
  payload?: unknown;
}): ComposerForm {
  const raw = (d.payload as { form?: Partial<ComposerForm> } | undefined)?.form ?? {};
  const out: ComposerForm = { ...EMPTY_FORM };
  for (const k of Object.keys(EMPTY_FORM) as (keyof ComposerForm)[]) {
    const v = raw[k];
    const ok =
      k === 'kind' || k === 'media' ? v === null || typeof v === 'string' : typeof v === typeof EMPTY_FORM[k];
    if (v !== undefined && ok) (out as unknown as Record<string, unknown>)[k] = v;
  }
  if (!isLive(out.kind)) out.kind = isLive(d.format) ? d.format : null;
  if (!out.title && d.title) out.title = d.title;
  if (!out.media && d.coverUrl) out.media = d.coverUrl;
  if (!Array.isArray(out.gallery)) out.gallery = [];
  if (!Array.isArray(out.tags)) out.tags = [];
  return out;
}

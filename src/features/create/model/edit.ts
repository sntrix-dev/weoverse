/**
 * `?edit=:id` — a live WeO of yours back into the composer. The card read carries what the
 * composer shows; anything it does not carry keeps the composer's default.
 */
import type { WeoDetailDto } from '@/features/weo/api/weos';
import { EMPTY_FORM, type ComposerForm, type MediaItem } from './composer';
import type { CategoryDto } from '../api/create';

type Loose = Record<string, unknown>;
const obj = (v: unknown): Loose => (v && typeof v === 'object' ? (v as Loose) : {});
const num = (v: unknown, d = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const str = (v: unknown, d = '') => (typeof v === 'string' ? v : d);

export function formFromWeo(w: WeoDetailDto, categories: readonly CategoryDto[]): ComposerForm {
  const raw = w as unknown as Loose;
  const wv = obj(raw.weoverse);
  const media = (Array.isArray(raw.media) ? raw.media : []).map(obj).filter((m) => str(m.url));
  const coverAt = media.findIndex((m) => m.type !== 'video');
  const gallery: MediaItem[] = media
    .filter((_, i) => i !== coverAt)
    .slice(0, 2)
    .map((m) => ({ kind: m.type === 'video' ? 'video' : 'image', src: str(m.url) }));
  const catName = str(raw.categoryName);
  const cat = categories.find((c) => c.name.toLowerCase() === catName.toLowerCase());
  const base: ComposerForm = {
    ...EMPTY_FORM,
    title: str(raw.title),
    desc: str(raw.description),
    catId: cat?._id ?? '',
    cat: cat?.name ?? '',
    media: coverAt >= 0 ? str(media[coverAt]!.url) : null,
    gallery,
    tags: Array.isArray(raw.tags) ? raw.tags.filter((t): t is string => typeof t === 'string') : [],
    resell: !!raw.isResellable,
  };
  if (raw.weoType === 'crowdfund') {
    return {
      ...base,
      kind: 'Pool',
      goal: num(obj(raw.goal).amount),
      minPledge: num(obj(raw.contribution).minimum, 1),
      days: Math.max(1, num(raw.daysLeft, 7)),
    };
  }
  const off = num(obj(raw.negotiation).negotiableUpTo, num(obj(raw.price).negotiableUpTo));
  const fmt = str(raw.format) || str(wv.format);
  // the stored format decides; an older negotiable WeO reads as a Bid
  const isBid = fmt ? fmt === 'Bid' : off > 0;
  const qty = obj(raw.quantity);
  const circ = num(raw.totalWeoInCirculation) + num(raw.soldCount);
  return {
    ...base,
    kind: isBid ? 'Bid' : 'Listing',
    keepFormat: fmt === 'Drop' ? 'Drop' : '',
    negotiable: !isBid && off > 0,
    price: num(wv.priceOs),
    qty: Math.max(1, num(qty.amount, 1)),
    unit: str(qty.unitName, 'piece'),
    circ: Math.max(1, circ),
    days: Math.max(1, num(raw.duration, 7)),
    reserve: isBid && off > 0 && off < 90,
    negotiateOff: off > 0 && off < 90 ? off : isBid ? 20 : 10,
  };
}

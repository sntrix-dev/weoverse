import { routes } from '@/app/routes';
import { formatHex, hhmmss, type WeoFormat } from '@/lib/cardModel';
import { FEED_KIND, type FeedKind } from '@/lib/feedKinds';
import type { FeedItemDto } from '../api/discover';

/** What a feed card draws. design: feed-data.js items (minus the embedded mock objects). */
export interface FeedItemModel {
  id: string;
  kind: FeedKind;
  title: string;
  blurb: string;
  img: string | null;
  byName: string;
  byAvatar: string | null;
  sub: string;
  readout: string;
  /** Os when the item has a price, else null */
  os: number | null;
  /** "06:14:22" for a WeO under the clock, else null */
  timer: string | null;
  tone: string;
  /** 1–5, ranked by the backend */
  weight: number;
  metrics: [string, string][];
  /** in-app route the card opens */
  to: string;
  /** the WeO behind a `weo` item — its collect flow opens from the card */
  weoId: string | null;
}

/** The backend's legacy hrefs (`/weo/:id`, `/community-hub/thread/:id`, …) → this app's routes. */
export function feedRoute(href: string): string {
  const m = (re: RegExp) => href.match(re)?.[1];
  const weo = m(/^\/weo\/([^/?#]+)/);
  if (weo) return routes.weo(weo);
  const thread = m(/^\/community-hub\/thread\/([^/?#]+)/);
  if (thread) return routes.thread(thread);
  const request = m(/^\/request\/([^/?#]+)/);
  if (request) return routes.requests(request);
  if (href.startsWith('/community-hub/stories')) return routes.stories();
  return routes.discover();
}

export function feedItemModel(it: FeedItemDto, now: number = Date.now()): FeedItemModel {
  const kind = it.kind as FeedKind;
  const format = (it.format ?? null) as WeoFormat | null;
  const ends = it.closesAt ? new Date(it.closesAt).getTime() : null;
  const weoId = kind === 'weo' ? (it.href.match(/^\/weo\/([^/?#]+)/)?.[1] ?? it.id) : null;
  // the backend's sub leads with the stored kind ("regular · Arts"); the card names the format
  const rawSub = it.sub ?? '';
  const sub = kind === 'weo' && format ? [format, ...rawSub.split(' · ').slice(1)].join(' · ') : rawSub;
  return {
    id: it.id,
    kind,
    title: it.title,
    blurb: it.blurb ?? '',
    img: it.imageUrl ?? null,
    byName: it.author?.name ?? '',
    byAvatar: it.author?.avatarUrl ?? null,
    sub,
    readout: it.readout ?? '',
    os: it.os ?? null,
    timer: kind === 'weo' && ends != null && !Number.isNaN(ends) ? hhmmss(ends - now) : null,
    tone: kind === 'weo' && format ? formatHex(format) : FEED_KIND[kind].hex,
    weight: it.weight,
    metrics: it.metrics.map((x) => [x.value, x.label]),
    to: feedRoute(it.href),
    weoId,
  };
}

/** design `hoursLeft` — hours left from a hh:mm:ss timer. */
export function hoursLeft(t: string | null): number | null {
  if (!t) return null;
  const p = t.split(':').map(Number);
  if (!p.length || Number.isNaN(p[0])) return null;
  return (p[0] ?? 0) + (p[1] ?? 0) / 60;
}

/** design URGENCY — the chip a card carries at its drawn weight. */
export const URGENCY: Record<number, string> = { 5: 'Closing now', 4: 'Closing soon', 3: 'Moving' };

/** design `coverLine` */
export function coverLine(it: FeedItemModel): string {
  return it.kind === 'weo'
    ? it.timer
      ? `Closes ${it.timer}`
      : 'In motion'
    : it.kind === 'request'
      ? 'Open brief'
      : it.kind === 'question'
        ? 'Open question'
        : 'Story';
}

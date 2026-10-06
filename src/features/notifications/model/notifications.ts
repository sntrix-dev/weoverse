import { routes } from '@/app/routes';
import type { NotificationRowDto } from '../api/notifications';

export type Tone = 'info' | 'success' | 'warning' | 'error';

/** design: TONE_STATUS — the bar down a row's edge */
export const TONE_STATUS: Record<Tone, string> = {
  info: 'var(--status-info)',
  success: 'var(--status-success)',
  warning: 'var(--status-warning)',
  error: 'var(--status-error)',
};

export interface NotifCat {
  /** `all`, or the backend `category` */
  k: string;
  label: string;
  /** shown only when it holds something (not one of the design's chips) */
  optional?: boolean;
}

/** design: NOTIF_CATS, on the backend's own axis — Community and System when they hold something */
export const NOTIF_CATS: NotifCat[] = [
  { k: 'all', label: 'Everything' },
  { k: 'weo', label: 'WeOs' },
  { k: 'weo-request', label: 'Requests' },
  { k: 'collection', label: 'Collections' },
  { k: 'payment', label: 'Payments' },
  { k: 'resell', label: 'Resell' },
  { k: 'wallet', label: 'Wallet' },
  { k: 'general', label: 'General' },
  { k: 'community', label: 'Community', optional: true },
  { k: 'system', label: 'System', optional: true },
];

export type Day = 'Today' | 'Yesterday' | 'This week' | 'Earlier';

const startOfDay = (t: number) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

/** Which group a moment falls in, in your local time (D-084). */
export function dayOf(iso: string | undefined, now = Date.now()): Day {
  if (!iso) return 'Earlier';
  const t = new Date(iso).getTime();
  const today = startOfDay(now);
  if (t >= today) return 'Today';
  if (t >= today - 864e5) return 'Yesterday';
  if (t >= today - 6 * 864e5) return 'This week';
  return 'Earlier';
}

/** design `at`: "2h ago" today, "Yesterday", a weekday this week, a date before that. */
export function atLabel(iso: string | undefined, now = Date.now()): string {
  if (!iso) return '';
  const day = dayOf(iso, now);
  const d = new Date(iso);
  if (day === 'Today') {
    const m = Math.max(0, Math.floor((now - d.getTime()) / 6e4));
    if (m < 1) return 'just now';
    return m < 60 ? `${m}m ago` : `${Math.floor(m / 60)}h ago`;
  }
  if (day === 'Yesterday') return 'Yesterday';
  if (day === 'This week') return d.toLocaleDateString('en-US', { weekday: 'short' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** The rows grouped by day, in order, empty groups left out. */
export function byDay<T extends { createdAt?: string }>(rows: T[], now = Date.now()): [Day, T[]][] {
  const order: Day[] = ['Today', 'Yesterday', 'This week', 'Earlier'];
  const m = new Map<Day, T[]>();
  for (const r of rows) {
    const d = dayOf(r.createdAt, now);
    m.set(d, [...(m.get(d) ?? []), r]);
  }
  return order.filter((d) => m.has(d)).map((d) => [d, m.get(d)!]);
}

/** Where a row opens (D-082), or `null` — it is marked read and stays. */
export function routeOf(t: NotificationRowDto['target']): string | null {
  if (!t) return null;
  const id = t.id ?? '';
  switch (t.kind) {
    case 'weo':
      return id ? routes.weo(id) : null;
    case 'request':
      return id ? routes.requests(id) : routes.requests();
    case 'collected':
      return routes.collected();
    case 'listed':
      return routes.listed();
    case 'wallet':
      return routes.wallet();
    case 'creator':
      return id ? routes.creators(id) : null;
    case 'passport':
      return routes.passport();
    case 'thread':
      return id ? routes.thread(id) : null;
    case 'circle':
      return id ? routes.circle(id) : null;
    default:
      return null;
  }
}

/** The picture a row shows: its own image, else the sender's face, else none (the O mark). */
export function pictureOf(n: NotificationRowDto): string | null {
  if (n.image) return n.image;
  const s = n.sender;
  return s && typeof s === 'object' && s.profileImage ? s.profileImage : null;
}

export const toneOf = (n: NotificationRowDto): Tone => (n.type as Tone | undefined) ?? 'info';

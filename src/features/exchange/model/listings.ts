import type { Board, BoardRow } from '@/components/snapshot/Snapshot';
import type { DraftDto } from '@/features/community/api/community';
import { FORMATS, formatHex, type WeoFormat } from '@/lib/cardModel';
import { compact, oStr } from '@/lib/format';
import { age } from '@/lib/time';
import type { ListingRowDto, ListingsSnapshotDto } from '../api/listings';

/** The pill a row wears (design STATE_TONE, plus a scheduled listing). */
export type ListingStateLabel = 'Live' | 'Paused' | 'Scheduled' | 'Draft' | 'Closed';
/** The tab a row files under (design Tabs All / Live / Draft / Closed) — a paused listing is still yours in flow (D-047). */
export type ListingTab = 'Live' | 'Draft' | 'Closed';

export interface ListingModel {
  /** the WeO id, or the draft id for a draft */
  id: string;
  kind: 'listing' | 'draft';
  name: string;
  img: string | null;
  format: WeoFormat;
  state: ListingStateLabel;
  tab: ListingTab;
  ask: number | null;
  views: number;
  saves: number;
  collects: number;
  /** 0..1, null when the kind has no unit stock */
  through: number | null;
  since: string;
  /** "9 of 50", "Sold out", "4d left" … */
  left: string;
  circle: { id: string; name: string } | null;
  resellable: boolean;
  /** design `l.preflight` — [label, passed] */
  preflight: [string, boolean][];
  ready: number;
  /** open checks — named in `preflight` for a listing; a draft records only the share (D-047) */
  open: number;
  /** only `active` ↔ `inactive` can be switched by you */
  pausable: boolean;
  paused: boolean;
  stockLeft: number | null;
  stockTotal: number | null;
}

const asFormat = (f: string | undefined | null): WeoFormat =>
  (FORMATS as readonly string[]).includes(f ?? '') ? (f as WeoFormat) : 'Listing';

const STATE: Record<ListingRowDto['state'], ListingStateLabel> = {
  live: 'Live',
  scheduled: 'Scheduled',
  draft: 'Draft',
  closed: 'Closed',
};

function untilStr(iso: string | null | undefined, now: number): string | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - now;
  if (!Number.isFinite(ms) || ms <= 0) return null;
  const h = Math.floor(ms / 36e5);
  return h < 24 ? `${Math.max(1, h)}h left` : `${Math.floor(h / 24)}d left`;
}

export function listingModel(r: ListingRowDto, now = Date.now()): ListingModel {
  const paused = !!r.paused;
  const state: ListingStateLabel = paused ? 'Paused' : STATE[r.state];
  const tab: ListingTab = state === 'Closed' ? 'Closed' : 'Live';
  const left =
    r.stockTotal != null && r.stockLeft != null
      ? r.stockLeft <= 0
        ? 'Sold out'
        : `${compact(r.stockLeft)} of ${compact(r.stockTotal)}`
      : (untilStr(r.endsAt, now) ?? (state === 'Closed' ? 'Closed' : 'Open'));
  return {
    id: r.id,
    kind: 'listing',
    name: r.title || 'Untitled',
    img: r.img ?? null,
    format: asFormat(r.format),
    state,
    tab,
    ask: r.ask ?? null,
    views: r.lifetimeViews,
    saves: r.lifetimeSaves,
    collects: r.collects,
    through: r.collectThrough ?? null,
    since: age(r.createdAt, now),
    left,
    circle: r.circle ? { id: r.circle.id, name: r.circle.name } : null,
    resellable: !!r.isResellable,
    preflight: r.preflight.map((p) => [p.label, p.ok]),
    ready: r.readyRate,
    open: r.preflight.filter((p) => !p.ok).length,
    pausable: r.status === 'active' || r.status === 'inactive',
    paused,
    stockLeft: r.stockLeft ?? null,
    stockTotal: r.stockTotal ?? null,
  };
}

/** A draft from `/me/drafts`: unfinished, never posted. `ready` is the share of the five checks (D-047). */
export function draftModel(d: DraftDto): ListingModel {
  const ready = Math.max(0, Math.min(1, d.ready ?? 0));
  return {
    id: d._id,
    kind: 'draft',
    name: d.title?.trim() || 'Untitled draft',
    img: d.coverUrl ?? null,
    format: asFormat(d.format),
    state: 'Draft',
    tab: 'Draft',
    ask: null,
    views: 0,
    saves: 0,
    collects: 0,
    through: null,
    since: 'never posted',
    left: d.updatedAt ? `edited ${age(d.updatedAt)} ago` : 'unfinished',
    circle: null,
    resellable: false,
    preflight: [],
    ready,
    open: Math.round((1 - ready) * 5),
    pausable: false,
    paused: false,
    stockLeft: null,
    stockTotal: null,
  };
}

/** design LST_STATS — counts you act on. */
export function exchangeStats(s: ListingsSnapshotDto | undefined, rows: ListingModel[]) {
  return [
    { value: compact(s?.totals.collects.current ?? 0), label: 'Collects · 7d' },
    { value: s?.collectThrough != null ? `${Math.round(s.collectThrough * 100)}%` : '—', label: 'Collect-through' },
    { value: String(rows.filter((r) => r.kind === 'draft').length), label: 'Drafts' },
    { value: String(rows.filter((r) => r.resellable).length), label: 'Resellable' },
  ];
}

export interface AttentionItem {
  l: ListingModel;
  why: string;
  act: 'Restock' | 'Fix' | 'Finish';
  tone: string;
  urgency: number;
}

const checks = (n: number) => `${n} check${n === 1 ? '' : 's'} open`;

/**
 * design LST-07 ATTENTION — what you can act on: live WeOs close to selling out, live WeOs with
 * an open preflight check, drafts to finish. The design's "offers waiting" has no source (G-50).
 */
export function attention(rows: ListingModel[]): AttentionItem[] {
  const out: AttentionItem[] = [];
  for (const l of rows) {
    const open = l.open;
    if (l.kind === 'draft') {
      if (l.ready < 1) out.push({ l, why: checks(open), act: 'Finish', tone: '#F7C62B', urgency: 1 });
      continue;
    }
    if (l.state !== 'Live') continue;
    if (l.stockLeft != null && l.stockTotal && l.stockLeft > 0 && l.stockLeft / l.stockTotal <= 0.25)
      out.push({ l, why: `${l.stockLeft} left of ${l.stockTotal}`, act: 'Restock', tone: '#22C55E', urgency: 2 });
    else if (open) out.push({ l, why: checks(open), act: 'Fix', tone: '#D946EF', urgency: 1.5 });
  }
  return out.sort((a, b) => b.urgency - a.urgency);
}

/** The four boards: three measured by the backend, joined by id; the fourth is what needs you. */
export function exchangeBoards(
  s: ListingsSnapshotDto | undefined,
  byId: Map<string, ListingModel>,
  att: AttentionItem[],
): Record<string, Board> {
  if (!s) return {};
  const row = (id: string, extra: (l: ListingModel) => Partial<BoardRow>): BoardRow[] => {
    const l = byId.get(id);
    return l
      ? [{ id: l.id, name: l.name, img: l.img, tone: formatHex(l.format), sub: `${l.format} · ${l.state}`, value: '', ...extra(l) }]
      : [];
  };
  const b = s.boards;
  return {
    performing: {
      label: b.performing.label,
      metric: b.performing.metric,
      rows: b.performing.rowIds.flatMap((id) =>
        row(id, (l) => ({ value: `${Math.round((l.through ?? 0) * 100)}%`, delta: `${l.collects} collects` })),
      ),
    },
    views: {
      label: b.views.label,
      metric: b.views.metric,
      rows: b.views.rowIds.flatMap((id) =>
        row(id, (l) => ({ sub: `${l.format} · ${l.since}`, value: compact(l.views), delta: `${l.saves} saves` })),
      ),
    },
    earning: {
      label: b.earning.label,
      metric: b.earning.metric,
      rows: b.earning.rowIds.flatMap((id) =>
        row(id, (l) => {
          const settled = s.rows.find((r) => r.id === id)?.settled ?? 0;
          return { sub: `${l.collects} collects`, value: oStr(Math.round(settled)), delta: l.state };
        }),
      ),
    },
    ready: {
      label: 'Needs attention',
      metric: 'what you can act on',
      rows: att.map((a) => ({
        id: a.l.id,
        name: a.l.name,
        sub: `${a.l.state} · ${a.l.format}`,
        value: a.act,
        delta: a.why,
        tone: a.tone,
        img: a.l.img,
      })),
    },
  };
}

export const EXCHANGE_PULSE_TONES = {
  performing: '#22C55E',
  views: '#3A95F2',
  earning: '#F7C62B',
  ready: '#D946EF',
} as const;

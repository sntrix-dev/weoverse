import type { Board, BoardRow } from '@/components/snapshot/Snapshot';
import { FORMATS, formatHex, type WeoFormat } from '@/lib/cardModel';
import { oStr } from '@/lib/format';
import { age } from '@/lib/time';
import type { CollectionsSnapshotDto, HoldingGroupDto, HoldingRowDto } from '../api/holdings';

/** design `h.kind` — the backend's holding kinds in the design's words. */
export type HoldingKindLabel = 'Collected' | 'Backed' | 'Entries' | 'Won' | 'Closed';

const KIND_LABEL: Record<HoldingRowDto['kind'], HoldingKindLabel> = {
  collected: 'Collected',
  backed: 'Backed',
  entered: 'Entries',
  won: 'Won',
  closed: 'Closed',
};

/** One holding, in what HoldingRow and NeedsYou show. Figures are Os. */
export interface HoldingModel {
  /** the collection row — what redeem / dispute / resell take */
  id: string;
  weoId: string;
  name: string;
  img: string | null;
  format: WeoFormat;
  kind: HoldingKindLabel;
  note: string;
  paid: number;
  /** today's value; the paid figure when the WeO no longer carries a price */
  current: number;
  resellable: boolean;
  since: string;
  createdAt: string;
  regular: boolean;
  redeemed: boolean;
  disputed: boolean;
  circleId: string | null;
  seller: { id: string; name: string; avatar: string | null };
}

const asFormat = (f: string | undefined): WeoFormat =>
  (FORMATS as readonly string[]).includes(f ?? '') ? (f as WeoFormat) : 'Listing';

export function holdingModel(r: HoldingRowDto, now = Date.now()): HoldingModel {
  const disputed = !!r.disputedAt;
  const redeemed = !!r.redeemedAt;
  const note = disputed ? 'Dispute open · a steward is looking' : redeemed ? `Received · ${r.note}` : r.note;
  return {
    id: r.id,
    weoId: r.weoId,
    name: r.title || 'Untitled',
    img: r.img ?? null,
    format: asFormat(r.format),
    kind: KIND_LABEL[r.kind] ?? 'Collected',
    note,
    paid: Math.round(r.paid),
    current: Math.round(r.valueNow ?? r.paid),
    resellable: r.resellable,
    since: age(r.createdAt, now),
    createdAt: r.createdAt,
    regular: r.weoType === 'regular',
    redeemed,
    disputed,
    circleId: r.circle?.id ?? null,
    seller: { id: r.sellerId, name: r.sellerName ?? 'the creator', avatar: r.sellerAvatar ?? null },
  };
}

/** design: the four stat cards over the collection. */
export function collectStats(s: CollectionsSnapshotDto | undefined) {
  const t = s?.totals;
  const uplift = t?.upliftIfResold ?? null;
  return [
    { value: String(t?.holdings ?? 0), label: 'Holdings' },
    { value: oStr(Math.round(t?.spent ?? 0)), label: 'You put in' },
    { value: t?.valueNow != null ? oStr(Math.round(t.valueNow)) : '—', label: 'Value now' },
    {
      value: uplift == null ? '—' : `${uplift >= 0 ? '+' : '−'} ${oStr(Math.abs(Math.round(uplift)))}`,
      label: 'If you resold today',
      os: uplift != null,
    },
  ];
}

/** A holding is waiting on you to confirm it arrived: a regular collection in the last 30 days. */
const RECENT = 30 * 864e5;

export interface NeedsYouItem {
  h: HoldingModel;
  tone: string;
  kind: 'receive' | 'resell' | 'report';
  headline: string;
  sub: string;
}

/**
 * design: v3-screens.jsx NeedsYou — what each holding still needs from you, one verb each.
 * Settlement here is immediate, so "redeem" is confirming receipt (D-044); nothing is held.
 */
export function needsYou(list: HoldingModel[], now = Date.now()): NeedsYouItem[] {
  return list.flatMap((h): NeedsYouItem[] => {
    if (
      h.kind === 'Collected' &&
      h.regular &&
      !h.redeemed &&
      !h.disputed &&
      now - new Date(h.createdAt).getTime() < RECENT
    )
      return [
        {
          h,
          tone: '#F7C62B',
          kind: 'receive',
          headline: `Did ${h.name} arrive?`,
          sub: `You paid ${oStr(h.paid)} · confirming tells ${h.seller.name} it reached you`,
        },
      ];
    if (h.kind === 'Collected' && h.resellable && h.current > h.paid)
      return [
        {
          h,
          tone: '#D946EF',
          kind: 'resell',
          headline: `${h.name} would fetch more today`,
          sub: `Paid ${oStr(h.paid)} · worth ${oStr(h.current)} now · resellable`,
        },
      ];
    if (h.kind === 'Backed')
      return [
        {
          h,
          tone: '#22C55E',
          kind: 'report',
          headline: `${h.name} · ${h.note}`,
          sub: `Where your ${oStr(h.paid)} went, posted to the Circle`,
        },
      ];
    return [];
  });
}

const signed = (n: number) => `${n >= 0 ? '+' : '−'}${oStr(Math.abs(n)).slice(2)}`;

/** The four boards, joined to their rows and groups by id. */
export function collectBoards(
  s: CollectionsSnapshotDto | undefined,
  rows: Map<string, HoldingModel>,
): Record<string, Board> {
  if (!s) return {};
  const groups = new Map<string, HoldingGroupDto>((s.groups ?? []).map((g) => [g.id, g]));
  const share = (g: HoldingGroupDto) => (g.share != null ? `${Math.round(g.share * 100)}% of value` : '—');

  const holdingRow = (id: string, value: (h: HoldingModel) => Partial<BoardRow>): BoardRow[] => {
    const h = rows.get(id);
    return h
      ? [{ id: h.id, name: h.name, img: h.img, tone: formatHex(h.format), value: oStr(h.current), ...value(h) }]
      : [];
  };

  const groupRow = (id: string): BoardRow[] => {
    const g = groups.get(id);
    if (!g) return [];
    const fmt = id.startsWith('format:') ? asFormat(g.label) : null;
    return [
      {
        id,
        name: g.label,
        sub: `${g.count} WeO${g.count === 1 ? '' : 's'} held`,
        value: oStr(Math.round(g.value)),
        delta: share(g),
        tone: fmt ? formatHex(fmt) : '#D946EF',
        ...(fmt ? { initial: g.label.charAt(0) } : g.img ? { avatar: g.img } : { initial: g.label.charAt(0) }),
      },
    ];
  };

  const b = s.boards;
  return {
    movers: {
      label: b.movers.label,
      metric: b.movers.metric,
      rows: b.movers.rowIds.flatMap((id) =>
        holdingRow(id, (h) => ({ sub: `${h.format} · paid ${oStr(h.paid)}`, delta: signed(h.current - h.paid) })),
      ),
    },
    formats: { label: b.formats.label, metric: b.formats.metric, rows: b.formats.rowIds.flatMap(groupRow) },
    creators: { label: b.creators.label, metric: b.creators.metric, rows: b.creators.rowIds.flatMap(groupRow) },
    pending: {
      label: b.pending.label,
      metric: b.pending.metric,
      rows: b.pending.rowIds.flatMap((id) => holdingRow(id, (h) => ({ sub: h.note, delta: h.kind }))),
    },
  };
}

export const COLLECT_PULSE_TONES = {
  movers: '#22C55E',
  formats: '#D946EF',
  creators: '#3A95F2',
  pending: '#F7C62B',
} as const;

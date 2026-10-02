// design: create.jsx draftCardProps, circleLine; screens-create.jsx typeCircle / catCircle / circlesFor
import type { WeOCardProps } from '@/design-system';
import type { CircleCardDto } from '@/features/community/api/community';
import type { ShellMe } from '@/features/shell/model/me';
import { oStr } from '@/lib/format';
import type { ComposerForm } from './composer';
import { createTone } from './formats';

const weoTypeOf = (k: ComposerForm['kind']) =>
  k === 'Pool' ? 'crowdfund' : k === 'Request' || !k ? null : 'regular';

/**
 * Where a WeO lands: the backend joins its creator to the circle of its type and the circle of
 * its category, when one exists (`autoJoinForWeoCreate`); with neither, the general circle.
 */
export function circlesFor(f: ComposerForm, all: readonly CircleCardDto[]): CircleCardDto[] {
  const wt = weoTypeOf(f.kind);
  const t = wt ? all.find((c) => c.weoTypeKey === wt) : undefined;
  const c = f.catId ? all.find((x) => x.categoryId === f.catId) : undefined;
  const out = [t, c && c.id !== t?.id ? c : undefined].filter((x): x is CircleCardDto => !!x);
  if (out.length) return out;
  const general = all.find((x) => x.isGeneral);
  return general ? [general] : [];
}

/** the sentence has to agree with how many circles are actually named */
export function circleLine(f: ComposerForm, all: readonly CircleCardDto[]): string {
  const list = circlesFor(f, all);
  if (!list.length) return 'It is live in Exchange.';
  const names = list.map((c) => c.name).join(' and ');
  const wt = weoTypeOf(f.kind);
  const t = wt ? all.find((c) => c.weoTypeKey === wt) : undefined;
  const c = f.catId ? all.find((x) => x.categoryId === f.catId) : undefined;
  if (t && c && c.id !== t.id)
    return `It posted to ${names} — a WeO posts by its type and its category, and you are added to both when it does.`;
  if (t)
    return `It posted to ${names} — its type Circle. Pick a category with a Circle of its own and it posts there too.`;
  if (c) return `It posted to ${names} — its category Circle, and you are added when it does.`;
  return `It posted to ${names} — the general Circle, until this format and category have one of their own.`;
}

const PRICE_LABEL: Record<string, string> = {
  Bid: 'Current bid',
  Pool: 'Pledge',
  Listing: 'Ask',
  Request: 'Budget',
};
export const priceLabelOf = (k: ComposerForm['kind']) => PRICE_LABEL[k ?? 'Listing'] ?? 'Ask';

/** The draft as the WeO card it will become — your preview, never a collectable. */
export function draftCardProps(
  f: ComposerForm,
  me: ShellMe | undefined,
  circles: readonly CircleCardDto[],
  onEngage: () => void,
): WeOCardProps {
  const tone = createTone(f.kind ?? 'Listing');
  const terms =
    f.kind === 'Pool'
      ? [
          { k: 'Goal', v: oStr(f.goal) },
          { k: 'Min pledge', v: oStr(f.minPledge) },
          { k: 'Closes', v: `${f.days}d` },
        ]
      : f.kind === 'Bid'
        ? [
            { k: 'Opening bid', v: oStr(f.price) },
            { k: 'Closes', v: `${f.days}d` },
            { k: 'Reserve', v: f.reserve ? 'held' : 'none' },
          ]
        : f.kind === 'Request'
          ? [
              { k: 'Budget', v: `${oStr(f.price)}–${oStr(f.priceMax)}` },
              { k: 'Closes', v: `${f.days}d` },
              { k: 'Offers', v: 'open to all' },
            ]
          : [
              { k: 'Ask', v: oStr(f.price) },
              { k: 'Edition', v: `${f.qty} of ${f.circ}` },
              { k: 'Resale', v: f.resell ? 'resellable' : 'not resellable' },
            ];
  return {
    name: f.title || 'Untitled WeO',
    typeLabel: `${f.kind ?? 'Listing'} · ${f.cat || 'No category'}`,
    id: '# draft',
    tone,
    fill: 'image',
    src: f.media,
    rarity: 'Draft',
    edition: `${f.qty} × ${f.unit}`,
    timer: f.days ? `${String(f.days * 24).padStart(2, '0')}:00:00` : null,
    creator: me
      ? {
          name: me.name,
          avatar: me.avatarUrl,
          initials: me.initials,
          isr: me.isr,
          summary: 'You',
          trades: me.counts.created,
          joined: `ISR ${me.isr}`,
        }
      : null,
    price: null,
    terms,
    points: [
      f.desc || 'Add a description and it appears here',
      ...(f.tags.length ? [`Tags · ${f.tags.join(' · ')}`] : []),
    ],
    watchers: '0',
    likes: '0',
    activeNow: 0,
    collectorCount: 0,
    trend: 'new',
    collected: false,
    qrData: 'draft',
    passport: { label: 'Verified original', resale: f.resell ? 'yes' : '—' },
    backTitle: f.title || 'Untitled WeO',
    backFacts: [
      { k: 'Format', v: f.kind ?? '—' },
      { k: 'Context', v: f.cat || '—' },
      {
        k: 'Circles',
        v:
          circlesFor(f, circles)
            .map((c) => c.name)
            .join(' · ') || '—',
      },
    ],
    engageLabel: 'Preview',
    onEngage,
  };
}

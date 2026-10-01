import { useState, type ReactNode } from 'react';
import { IconSegs, type SegItem } from '@/components/layout/SectionMark';
import { Rail } from '@/components/layout/Rail';
import type { WeoCardModel } from '@/lib/cardModel';
import { usePrefs } from '@/stores/prefs';
import { StallTile } from './WeoBits';
import { MyWeoCard, WeoCarousel, WeoList, WeoOrbitView, type OrbitCentre } from './WeoCards';
import type { WeoHandlers } from './weoCardProps';

export type WeoViewKind = 'cards' | 'carousel' | 'orbit' | 'list' | 'rail';

// design: screens-hub.jsx WEO_VIEWS / RAIL_VIEW
export const WEO_VIEWS: SegItem<WeoViewKind>[] = [
  { value: 'cards', label: 'Cards' },
  { value: 'carousel', label: 'Carousel' },
  { value: 'orbit', label: 'Orbit' },
  { value: 'list', label: 'List' },
];
export const RAIL_VIEW: SegItem<WeoViewKind> = { value: 'rail', label: 'Rail' };

/**
 * design: screens-hub.jsx useWeoView — one view control for every group of WeOs; each group
 * remembers its own choice on this device. Its first default is the user's `weoView` pref.
 */
export function useWeoView<V extends string = WeoViewKind>(
  id: string,
  opts: readonly SegItem<V>[],
  initial?: V,
): [V, (v: V) => void] {
  const key = `weo.view.${id}`;
  const [v, setV] = useState<V>(() => {
    try {
      const p = localStorage.getItem(key);
      if (p && opts.some((o) => o.value === p)) return p as V;
    } catch {
      /* ignore */
    }
    const pref = usePrefs.getState().prefs.weoView as string;
    const fromPref = opts.find((o) => o.value === pref);
    if (!initial && fromPref) return fromPref.value;
    return (initial || opts[0]?.value || 'cards') as V;
  });
  return [
    v,
    (nv) => {
      setV(nv);
      try {
        localStorage.setItem(key, nv);
      } catch {
        /* ignore */
      }
    },
  ];
}

export interface WeoViewProps {
  id: string;
  list: WeoCardModel[];
  h: WeoHandlers;
  options?: readonly SegItem<WeoViewKind>[];
  initial?: WeoViewKind;
  tone?: string;
  tile?: 'card' | 'stall';
  /** renders the head; receives the view switch to place in it */
  head?: (segs: ReactNode) => ReactNode;
  empty?: ReactNode;
  me?: OrbitCentre;
  advPct?: number;
}

/** design: screens-hub.jsx WeoView — the group itself: switch + body, one grammar wherever WeOs are shown. */
export function WeoView({
  id,
  list,
  h,
  options,
  initial,
  tone,
  tile,
  head,
  empty,
  me,
  advPct,
}: WeoViewProps) {
  const opts = options || WEO_VIEWS;
  const [view, setView] = useWeoView(id, opts, initial);
  const segs = <IconSegs items={opts} value={view} onChange={setView} tone={tone} />;
  const renderTile = (w: WeoCardModel, i: number) =>
    tile === 'stall' ? (
      <StallTile key={w.id} w={w} onOpen={h.onOpen} />
    ) : (
      <MyWeoCard key={w.id} w={w} h={h} i={i} advPct={advPct} />
    );
  const body = !list.length ? (
    empty || (
      <p
        style={{
          margin: 0,
          padding: 36,
          textAlign: 'center',
          fontSize: 13.5,
          color: 'var(--text-dim)',
          borderRadius: 26,
          background: 'var(--surface-2)',
          boxShadow: 'var(--nm-inset)',
        }}
      >
        Nothing here yet.
      </p>
    )
  ) : view === 'rail' ? (
    <Rail w={260}>{list.map(renderTile)}</Rail>
  ) : view === 'cards' ? (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns:
          tile === 'stall' ? 'repeat(auto-fill,minmax(250px,1fr))' : 'repeat(auto-fit, 272px)',
        justifyContent: 'center',
        gap: '18px 16px',
      }}
    >
      {list.map(renderTile)}
    </div>
  ) : view === 'carousel' ? (
    <WeoCarousel list={list} h={h} />
  ) : view === 'orbit' ? (
    <WeoOrbitView list={list} h={h} me={me} />
  ) : (
    <WeoList list={list} h={h} />
  );
  return (
    <>
      {head ? head(segs) : null}
      <div key={view} style={{ animation: 'weo-cardin .42s var(--ease-settle) both' }}>
        {body}
      </div>
    </>
  );
}

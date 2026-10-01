import { useState, type CSSProperties } from 'react';
import { StageRing } from '@/components/weo/StageRing';
import { Orb, svg } from '@/design-system';
import type { FlightItem } from '../model/community';

/** design: v3-spine.jsx V3.RING / V3_WORD — the five rings and the word for each stage. */
const RING = ['Draft', 'Rehearsed', 'Reacted', 'Pledged', 'Live'];
const WORD: Record<FlightItem['stage'], string> = { draft: 'Draft', live: 'Live' };
const TONE: Record<FlightItem['stage'], string> = { draft: '#22C55E', live: '#F7C62B' };

export interface FlightAct {
  stage: FlightItem['stage'];
  index: number;
  tone: string;
  fill: number;
  verb: string;
  note: string;
  get: string | null;
  act: () => void;
}

export interface FlightHandlers {
  /** a draft: the composer, with the draft (M07) */
  onPost: (it: FlightItem) => void;
  /** a live WeO: the floor */
  onMarket: (it: FlightItem) => void;
  onOpen: (it: FlightItem) => void;
  onCreate: () => void;
}

/**
 * design: v3-spine.jsx nextAct — the one derivation of what a WeO needs next. Until worlds,
 * reactions and pledges exist (M11) there are two stages (D-037): a draft's step is "Post it"
 * (the design's always-there direct path; Rehearse arrives with worlds), a live WeO's is
 * "Move with the market".
 */
export function nextAct(it: FlightItem, h: FlightHandlers): FlightAct {
  if (it.stage === 'draft') {
    return { stage: 'draft', index: 0, tone: TONE.draft, fill: 0, verb: 'Post it', note: 'Draft', get: null, act: () => h.onPost(it) };
  }
  return {
    stage: 'live',
    index: 4,
    tone: TONE.live,
    fill: 1,
    verb: 'Move with the market',
    note: 'Live in Exchange',
    get: 'On the floor, earning',
    act: () => h.onMarket(it),
  };
}

/** design: v3-spine.jsx NextO — the WeO's orb in its stage ring, the one verb beneath. */
export function NextO({ item, h, size, dense }: { item: FlightItem; h: FlightHandlers; size?: number; dense?: boolean }) {
  const S = size || 148;
  const [hov, setHov] = useState(false);
  const n = nextAct(item, h);
  const tone = n.tone;
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: dense ? 8 : 12, minWidth: 0 }}
    >
      <span style={{ position: 'relative', display: 'grid', placeItems: 'center', padding: 14 }}>
        <button
          onClick={n.act}
          aria-label={`${item.name} — ${n.verb}`}
          title={n.note}
          style={{
            display: 'grid',
            placeItems: 'center',
            border: 'none',
            background: 'transparent',
            padding: 0,
            cursor: 'pointer',
            borderRadius: '50%',
            transform: hov ? 'scale(1.03)' : 'none',
            transition: 'transform .3s var(--ease-portal)',
          }}
        >
          <StageRing size={S} index={n.index} fill={n.fill} tone={tone}>
            <Orb size={Math.round(S * 0.66)} fill={item.img ? 'image' : tone} src={item.img} matcap breathe />
          </StageRing>
        </button>
      </span>
      <button
        onClick={n.act}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          border: 'none',
          cursor: 'pointer',
          borderRadius: 999,
          minHeight: dense ? 36 : 42,
          padding: dense ? '0 14px' : '0 18px',
          font: 'inherit',
          fontSize: dense ? 12.5 : 13.5,
          fontWeight: 700,
          color: '#fff',
          background: tone,
          boxShadow: `0 12px 26px -10px color-mix(in srgb, ${tone} 85%, transparent)`,
          whiteSpace: 'nowrap',
        }}
      >
        {n.verb}
        {svg(<polyline points="9 6 15 12 9 18" />, 14, 'currentColor', 2.4)}
      </button>
    </div>
  );
}

export const FLIGHT_VIEWS = [
  { value: 'cards', label: 'Cards' },
  { value: 'carousel', label: 'Rail' },
  { value: 'list', label: 'List' },
] as const;
export type FlightView = (typeof FLIGHT_VIEWS)[number]['value'];

const stageLine: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '.1em',
  textTransform: 'uppercase',
  color: 'var(--text-faint)',
};

const plus = svg(<path d="M12 6v12M6 12h12" />, 18, 'currentColor', 2);

/** design: v3-screens.jsx InFlightGrid — every WeO in flight as a Next-O, and a "New WeO" slot. */
export function InFlightGrid({ items, view, h }: { items: FlightItem[]; view: FlightView; h: FlightHandlers }) {
  const name = (it: FlightItem) => (
    <button
      onClick={() => h.onOpen(it)}
      style={{
        border: 'none',
        background: 'transparent',
        padding: 0,
        cursor: 'pointer',
        font: 'inherit',
        fontSize: 15,
        fontWeight: 600,
        letterSpacing: '-.018em',
        color: 'var(--text)',
        maxWidth: '100%',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {it.name}
    </button>
  );
  if (view === 'list') {
    return (
      <div
        data-walk="flight"
        style={{
          display: 'grid',
          gap: 1,
          borderRadius: 26,
          overflow: 'hidden',
          background: 'var(--border)',
          boxShadow: 'var(--nm-raised), inset 0 0 0 1px var(--border)',
        }}
      >
        {items.map((it) => {
          const n = nextAct(it, h);
          return (
            <div
              key={it.id}
              style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 18px 10px 8px', background: 'var(--surface)' }}
            >
              <NextO item={it} h={h} size={64} dense />
              <div style={{ flex: 1, minWidth: 0 }}>
                {name(it)}
                <div style={{ ...stageLine, marginTop: 2 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: n.tone }} />
                  {WORD[n.stage] || RING[n.index]}
                </div>
              </div>
              <span
                style={{
                  flex: '1 1 260px',
                  minWidth: 0,
                  fontSize: 12.5,
                  lineHeight: 1.45,
                  color: 'var(--text-dim)',
                  textWrap: 'pretty',
                }}
              >
                {n.get}
              </span>
            </div>
          );
        })}
        <button
          data-walk="new"
          onClick={h.onCreate}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '14px 18px',
            border: 'none',
            cursor: 'pointer',
            font: 'inherit',
            background: 'var(--surface-2)',
            color: 'var(--text)',
            textAlign: 'left',
          }}
        >
          <span
            style={{
              display: 'grid',
              placeItems: 'center',
              width: 40,
              height: 40,
              borderRadius: '50%',
              boxShadow: 'inset 0 0 0 2px var(--o-green)',
              color: 'var(--o-green)',
            }}
          >
            {plus}
          </span>
          <span style={{ fontSize: 13.5, fontWeight: 700 }}>New WeO</span>
        </button>
      </div>
    );
  }
  const rail = view === 'carousel';
  return (
    <div
      data-walk="flight"
      className={rail ? 'weo-rail' : undefined}
      style={
        rail
          ? ({ '--rail-w': '236px' } as CSSProperties)
          : { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,228px),1fr))', gap: 14 }
      }
    >
      {items.map((it, i) => {
        const n = nextAct(it, h);
        return (
          <div
            key={it.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 10,
              padding: '22px 14px 18px',
              borderRadius: 28,
              background: 'var(--surface)',
              boxShadow: 'var(--nm-raised), inset 0 0 0 1px var(--border)',
              animation: `weo-cardin .5s var(--ease-portal) ${i * 60}ms both`,
            }}
          >
            <NextO item={it} h={h} size={150} />
            <div style={{ textAlign: 'center', minWidth: 0, width: '100%' }}>
              {name(it)}
              <div style={{ ...stageLine, display: 'inline-flex', gap: 7, marginTop: 4 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: n.tone }} />
                {WORD[n.stage] || RING[n.index]}
              </div>
              {/* what you get for taking the step — the reason, at rest */}
              {n.get && (
                <div style={{ marginTop: 7, fontSize: 12.5, lineHeight: 1.45, color: 'var(--text-dim)', textWrap: 'pretty' }}>
                  {n.get}
                </div>
              )}
            </div>
          </div>
        );
      })}
      {/* the empty slot is the way in: a new WeO */}
      <button
        data-walk="new"
        onClick={h.onCreate}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          minHeight: 240,
          padding: 18,
          borderRadius: 28,
          border: 'none',
          cursor: 'pointer',
          font: 'inherit',
          background: 'var(--surface-2)',
          boxShadow: 'var(--nm-inset)',
          color: 'var(--text-dim)',
        }}
      >
        <span
          style={{
            display: 'grid',
            placeItems: 'center',
            width: 76,
            height: 76,
            borderRadius: '50%',
            boxShadow: 'inset 0 0 0 2px var(--o-green)',
            color: 'var(--o-green)',
          }}
        >
          {svg(<path d="M12 6v12M6 12h12" />, 26, 'currentColor', 2)}
        </span>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>New WeO</span>
      </button>
    </div>
  );
}

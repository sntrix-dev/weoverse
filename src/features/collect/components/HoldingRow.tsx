import { useState } from 'react';
import { Pip } from '@/components/layout/Pip';
import { OsRun } from '@/components/text/OsRun';
import { ICO, OButton, OMark, Orb, svg } from '@/design-system';
import { formatHex } from '@/lib/cardModel';
import { osFmt, oStr } from '@/lib/format';
import type { HoldingKindLabel, HoldingModel } from '../model/holdings';

/** design: screens-holdings.jsx KIND_TONE (+ the two kinds the backend adds: a won entry, a closed row) */
export const KIND_TONE: Record<HoldingKindLabel, string> = {
  Collected: '#3A95F2',
  Backed: '#22C55E',
  Entries: '#D946EF',
  Won: '#F7C62B',
  Closed: 'var(--text-dim)',
};

const ROW_ICO = {
  resell: (
    <>
      <path d="M7 17L17 7" />
      <path d="M9.5 7H17v7.5" />
    </>
  ),
  track: (
    <>
      <circle cx="12" cy="12" r="7.8" />
      <path d="M12 7.8V12l2.7 1.6" />
    </>
  ),
};

export interface HoldingRowHandlers {
  onResell: (h: HoldingModel) => void;
  onTrack: (h: HoldingModel) => void;
  onCircle: (h: HoldingModel) => void;
  onOpen: (h: HoldingModel) => void;
}

/** design: screens-holdings.jsx HoldingRow — what you put in, what it would fetch, and where it can go. */
export function HoldingRow({ h, i, act }: { h: HoldingModel; i: number; act: HoldingRowHandlers }) {
  const [hov, setHov] = useState(false);
  const [focus, setFocus] = useState(false);
  const tone = formatHex(h.format);
  const delta = h.current - h.paid;
  // no hover on a touch screen: the row's two actions stay visible there
  const touch = typeof window !== 'undefined' && !!window.matchMedia?.('(hover: none)').matches;
  const show = hov || focus || touch;
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onFocus={() => setFocus(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocus(false);
      }}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        borderRadius: 24,
        padding: '14px 74px 14px 14px',
        minWidth: 0,
        background: show ? `color-mix(in srgb, ${tone} 5%, var(--surface))` : 'var(--surface)',
        boxShadow: `var(--nm-raised), inset 0 0 0 1px ${show ? `color-mix(in srgb, ${tone} 32%, transparent)` : 'var(--border)'}`,
        transform: show ? 'translateY(-2px)' : 'none',
        transition: 'transform .3s var(--ease-portal), background .3s, box-shadow .3s',
        animation: `weo-cardin .44s var(--ease-settle) ${i * 0.05}s both`,
      }}
    >
      <button
        type="button"
        onClick={() => act.onOpen(h)}
        aria-label={`Open ${h.name}`}
        style={{
          border: 'none',
          background: 'transparent',
          padding: 0,
          cursor: 'pointer',
          borderRadius: '50%',
          flex: '0 0 auto',
        }}
      >
        <Orb
          size={72}
          fill={h.img ? 'image' : tone}
          src={h.img ?? undefined}
          ring
          ringColor={tone}
          matcap
          breathe={show}
        />
      </button>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <h3
            style={{
              margin: 0,
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: '-.015em',
              color: 'var(--text)',
            }}
          >
            {h.name}
          </h3>
          <Pip tone={KIND_TONE[h.kind] || tone}>{h.kind}</Pip>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: 11.5, color: 'var(--text-dim)' }}>
          {h.format} · {h.note}
        </p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 15,
              fontWeight: 700,
              color: 'var(--text)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <OMark size={12} />
            {osFmt(h.current)}
          </span>
          <span style={{ fontSize: 10.5, color: 'var(--text-faint)' }}>
            paid <OsRun text={oStr(h.paid)} size="0.9em" /> · {h.since}
          </span>
          {h.resellable && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: delta > 0 ? 'var(--o-green)' : delta < 0 ? 'var(--status-error)' : 'var(--text-faint)',
              }}
            >
              {delta === 0
                ? 'settling'
                : `${delta > 0 ? '+' : '−'}${oStr(Math.abs(delta)).slice(2)} if resold`}
            </span>
          )}
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          right: 12,
          top: '50%',
          transform: `translateY(-50%) translateX(${show ? 0 : 6}px)`,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          opacity: show ? 1 : 0,
          transition: 'opacity .24s, transform .32s var(--ease-portal)',
        }}
      >
        {h.resellable ? (
          <OButton
            variant="raised"
            size={38}
            tone="green"
            aria-label={`Resell ${h.name}`}
            title="Resell"
            onClick={() => act.onResell(h)}
          >
            {svg(ROW_ICO.resell, 17, 'currentColor', 1.7)}
          </OButton>
        ) : (
          <OButton
            variant="raised"
            size={38}
            tone="blue"
            aria-label={`Track ${h.name}`}
            title="Track"
            onClick={() => act.onTrack(h)}
          >
            {svg(ROW_ICO.track, 17, 'currentColor', 1.7)}
          </OButton>
        )}
        <OButton
          variant="raised"
          size={38}
          tone="violet"
          aria-label="Open its circle"
          title="Its circle"
          onClick={() => act.onCircle(h)}
        >
          {svg(ICO.hub, 17, 'currentColor', 1.7)}
        </OButton>
      </div>
    </div>
  );
}

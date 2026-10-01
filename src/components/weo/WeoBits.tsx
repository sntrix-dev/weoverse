import { useState } from 'react';
import { OMark } from '@/design-system';
import type { WeoCardModel } from '@/lib/cardModel';
import { osFmt } from '@/lib/format';

/** design: screens-discover.jsx WeoTimer — the countdown is the WeO's own close time, at rest. */
export function WeoTimer({ t, tone }: { t: string | null | undefined; tone?: string }) {
  if (!t) return null;
  const h = parseInt(String(t).split(':')[0] ?? '0', 10) || 0;
  const hot = h < 12;
  const c = hot ? '#F7C62B' : tone || 'var(--text-dim)';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        borderRadius: 999,
        padding: '3px 9px',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '.02em',
        color: c,
        background: `color-mix(in srgb, ${c} 12%, var(--surface))`,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: '50%',
          background: c,
          animation: hot ? 'weo-breathe-sm 2.2s var(--ease-standard) infinite' : 'none',
        }}
      />
      {t}
    </span>
  );
}

/**
 * design: section-hero.jsx WeoPriceAtRest — one unit, on the card's own row, never behind a
 * flip; the tier advantage rides beside it as a percentage (hidden until G-23 gives one).
 */
export function WeoPriceAtRest({
  os,
  label,
  advPct,
  align,
}: {
  os: number;
  label?: string;
  advPct?: number;
  align?: 'center' | 'flex-start' | 'flex-end';
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: align || 'center', gap: 9 }}>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'baseline',
          gap: 5,
          fontSize: 19,
          fontWeight: 700,
          letterSpacing: '-.025em',
          color: 'var(--text)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        <OMark size="0.66em" />
        {osFmt(os || 0)}
      </span>
      {label && (
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '.13em',
            textTransform: 'uppercase',
            color: 'var(--text-faint)',
          }}
        >
          {label}
        </span>
      )}
      {advPct ? (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            borderRadius: 999,
            padding: '3px 9px',
            fontSize: 10,
            fontWeight: 600,
            color: 'var(--o-green)',
            boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--o-green) 34%, var(--border))',
          }}
        >
          <OMark size={9} />
          {advPct}% off for you
        </span>
      ) : null}
    </div>
  );
}

/** design: screens-discover.jsx StallTile — image first, one price at rest, everything else on the record. */
export function StallTile({ w, onOpen }: { w: WeoCardModel; onOpen: (w: WeoCardModel) => void }) {
  const [hov, setHov] = useState(false);
  const tone = w.hex;
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => onOpen(w)}
      role="button"
      tabIndex={0}
      aria-label={`${w.name} · ${w.type}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onOpen(w);
      }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        cursor: 'pointer',
        borderRadius: 24,
        overflow: 'hidden',
        background: 'var(--surface)',
        boxShadow: hov
          ? `var(--shadow-card), inset 0 0 0 1px color-mix(in srgb, ${tone} 44%, transparent)`
          : 'var(--nm-raised), inset 0 0 0 1px var(--border)',
        transform: hov ? 'translateY(-2px)' : 'none',
        transition: 'transform .24s var(--ease-portal), box-shadow .28s',
      }}
    >
      <span style={{ position: 'relative', display: 'block', height: 146, background: 'var(--surface-2)', overflow: 'hidden' }}>
        {w.img && (
          <img
            src={w.img}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: hov ? 'scale(1.05)' : 'none',
              transition: 'transform .6s var(--ease-portal)',
            }}
          />
        )}
        <span
          style={{
            position: 'absolute',
            left: 11,
            top: 11,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            borderRadius: 999,
            padding: '3px 10px',
            fontSize: 10.5,
            fontWeight: 600,
            letterSpacing: '.08em',
            textTransform: 'uppercase',
            color: hov ? '#fff' : 'var(--text)',
            background: hov ? `color-mix(in srgb, ${tone} 82%, #000)` : 'color-mix(in srgb, var(--surface) 82%, transparent)',
            backdropFilter: 'blur(8px)',
            transition: 'background .28s, color .28s',
          }}
        >
          {w.type}
        </span>
        {w.timer && (
          <span style={{ position: 'absolute', right: 10, top: 10 }}>
            <WeoTimer t={w.timer} />
          </span>
        )}
      </span>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '13px 15px 15px' }}>
        <span
          style={{
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: '-.022em',
            lineHeight: 1.2,
            color: hov ? 'var(--text)' : 'var(--text-dim)',
            transition: 'color .24s',
            textWrap: 'pretty',
          }}
        >
          {w.name}
        </span>
        <span style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'baseline',
              gap: 5,
              fontSize: 15,
              fontWeight: 700,
              color: 'var(--text)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <OMark size={12} /> {osFmt(w.os)}
          </span>
          <span style={{ fontSize: 10, fontWeight: 400, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-faint)' }}>
            {w.priceLabel}
          </span>
        </span>
        <span
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 10,
            fontSize: 11.5,
            color: 'var(--text-dim)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          <span>{w.rarity}</span>
          {w.activeNow > 0 && (
            <span style={{ color: hov ? tone : 'var(--text-faint)', fontWeight: 500, transition: 'color .24s' }}>
              {w.activeNow} here now
            </span>
          )}
        </span>
      </span>
    </div>
  );
}

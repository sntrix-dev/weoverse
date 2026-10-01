import { useState } from 'react';
import { ISRRing, OMark } from '@/design-system';

/** design: screens-network.jsx Spark — a filled sparkline ending in a dot. */
export function Spark({ values, tone, h, w }: { values: number[]; tone: string; h?: number; w?: number }) {
  const H = h || 34;
  const W = w || 100;
  if (values.length < 2) return <svg viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', width: '100%', height: H }} aria-hidden="true" />;
  const min = Math.min(...values) - 2;
  const max = Math.max(...values) + 2;
  const pts = values.map((v, i) => ({ x: (i / (values.length - 1)) * W, y: H - ((v - min) / (max - min)) * H }));
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const lastY = pts[pts.length - 1]?.y ?? H;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      style={{ display: 'block', width: '100%', height: H, overflow: 'visible' }}
    >
      <path d={`${d} L${W},${H} L0,${H} Z`} fill={tone} opacity=".1" />
      <path d={d} fill="none" stroke={tone} strokeWidth="1.6" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <circle cx={W} cy={lastY} r="2.2" fill={tone} />
    </svg>
  );
}

/** design: screens-network.jsx PersonOi — a person as an O: the ISR band is the ring, the face the core. */
export function PersonOi({ p, size, hot }: { p: { isr: number; avatar?: string | null }; size?: number; hot?: boolean }) {
  const S = size || 104;
  return (
    <span style={{ position: 'relative', display: 'block', width: S, height: S, flex: '0 0 auto' }}>
      <ISRRing value={p.isr} size={S} showStage={false} showValue={false} />
      <span
        style={{
          position: 'absolute',
          inset: Math.round(S * 0.135),
          borderRadius: '50%',
          overflow: 'hidden',
          background: p.avatar ? `url('${p.avatar}') center/cover, var(--surface)` : 'var(--surface)',
          boxShadow: hot ? 'var(--nm-hero)' : 'inset 0 0 0 1px var(--border)',
          transition: 'box-shadow .32s var(--ease-settle)',
        }}
      />
    </span>
  );
}

/** design: screens-network.jsx StandChip — "ISR 82 · Pool". */
export function StandChip({ c }: { c: { tone: string; isr: number; format: string } }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        borderRadius: 999,
        padding: '4px 11px',
        fontSize: 10.5,
        fontWeight: 700,
        letterSpacing: '.08em',
        textTransform: 'uppercase',
        color: c.tone,
        background: `color-mix(in srgb, ${c.tone} 12%, var(--surface))`,
      }}
    >
      ISR {c.isr} · {c.format}
    </span>
  );
}

export interface OrbTier {
  n: number;
  /** 0–1. The backend has no advantage figure yet (G-23): leave it out and the hover chip stays hidden. */
  adv?: number | null;
}

/**
 * design: section-hero.jsx OAvatarOrb — you at the centre of your own standing.
 * The design falls back to the global `WV.MY_TIER`; here the tier is a prop.
 */
export function OAvatarOrb({
  src,
  isr,
  size,
  label,
  onOpen,
  tier,
}: {
  src?: string | null;
  isr: number;
  size?: number;
  label?: string;
  onOpen?: () => void;
  tier?: OrbTier | null;
}) {
  const d = size || 168;
  const [hov, setHov] = useState(false);
  const adv = tier?.adv;
  const body = (
    <span style={{ position: 'relative', display: 'grid', placeItems: 'center', width: d, height: d }}>
      <ISRRing value={isr} size={d} showStage={false} showValue={false} />
      <span
        style={{
          position: 'absolute',
          width: d * 0.66,
          height: d * 0.66,
          borderRadius: '50%',
          overflow: 'hidden',
          background: src ? `url('${src}') center/cover, var(--surface-2)` : 'var(--surface-2)',
          boxShadow: 'var(--nm-sm), inset 0 0 0 1px var(--border)',
        }}
      />
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          width: d * 0.66,
          height: d * 0.66,
          borderRadius: '50%',
          background: 'radial-gradient(58% 52% at 30% 24%, rgba(255,255,255,.34), transparent 62%)',
        }}
      />
      <span
        style={{
          position: 'absolute',
          bottom: -2,
          display: 'inline-flex',
          alignItems: 'baseline',
          gap: 5,
          borderRadius: 999,
          padding: '3px 11px',
          background: 'var(--surface)',
          boxShadow: hov ? 'var(--nm-raised)' : 'var(--nm-sm)',
          transition: 'box-shadow .2s',
        }}
      >
        <b style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{isr}</b>
        <span
          style={{
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: '.13em',
            textTransform: 'uppercase',
            color: 'var(--text-faint)',
          }}
        >
          {label || 'ISR'}
        </span>
      </span>
      {adv != null && (
        <span
          style={{
            position: 'absolute',
            top: -6,
            right: -6,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            borderRadius: 999,
            padding: '3px 9px',
            background: 'var(--surface)',
            boxShadow: 'var(--nm-sm)',
            opacity: hov ? 1 : 0,
            transform: hov ? 'none' : 'translateY(4px)',
            transition: 'opacity .24s, transform .24s var(--ease-portal)',
            pointerEvents: 'none',
          }}
        >
          <OMark size={10} />
          <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--o-green)', whiteSpace: 'nowrap' }}>
            {Math.round(adv * 100)}% advantage
          </span>
        </span>
      )}
    </span>
  );
  if (!onOpen) return body;
  const tierNote = tier ? ` · Tier ${tier.n}${adv != null ? ` · ${Math.round(adv * 100)}% advantage` : ''}` : '';
  return (
    <button
      type="button"
      onClick={onOpen}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onFocus={() => setHov(true)}
      onBlur={() => setHov(false)}
      title={`ISR ${isr}${tierNote} — how it is built and how to move it`}
      aria-label="Your standing — how it is built and how to move it"
      style={{
        display: 'grid',
        placeItems: 'center',
        border: 'none',
        background: 'transparent',
        padding: 0,
        cursor: 'pointer',
        borderRadius: '50%',
      }}
    >
      {body}
    </button>
  );
}

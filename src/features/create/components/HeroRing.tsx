// design: create.jsx CreateHero — the format orbs on the ring, and the centre's readout for a format
import type { CSSProperties } from 'react';
import { Orb, svg } from '@/design-system';
import { createTone, type CreateFormatDef } from '../model/formats';
import { CFORMAT_ICO } from './icons';

/** One format riding the ring. The visual scales; the hit area stays put. */
export function FormatOrb({
  tp,
  i,
  count,
  cx,
  cy,
  R,
  orb,
  on,
  orbsGo,
  settled,
  glimpse,
  notified,
  onEnter,
  onLeave,
  onFocus,
  onBlur,
  onClick,
}: {
  tp: CreateFormatDef;
  i: number;
  count: number;
  cx: number;
  cy: number;
  R: number;
  orb: number;
  on: boolean;
  orbsGo: boolean;
  settled: boolean;
  glimpse: boolean;
  notified: boolean;
  onEnter: () => void;
  onLeave: () => void;
  onFocus: () => void;
  onBlur: () => void;
  onClick: () => void;
}) {
  const deg = -90 + i * (360 / count);
  const a = (deg * Math.PI) / 180;
  const tt = createTone(tp.key);
  // labels sit radially OUTWARD from the orb so none crosses the tube
  const cs = Math.cos(a);
  const sn = Math.sin(a);
  const side = Math.abs(cs) < 0.35 ? (sn > 0 ? 'below' : 'above') : cs < 0 ? 'left' : 'right';
  const pos =
    side === 'below'
      ? { left: '50%', top: '100%', transform: 'translate(-50%, 8px)' }
      : side === 'above'
        ? { left: '50%', bottom: '100%', transform: 'translate(-50%, -8px)' }
        : side === 'left'
          ? { right: '100%', top: '50%', transform: 'translate(-8px, -50%)' }
          : { left: '100%', top: '50%', transform: 'translate(8px, -50%)' };
  return (
    <button
      type="button"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onFocus={onFocus}
      onBlur={onBlur}
      onClick={onClick}
      aria-disabled={tp.soon ? true : undefined}
      aria-label={
        tp.soon
          ? `${tp.label} — coming soon${notified ? ', you will be told' : ', press to be told'}`
          : `${tp.label} — ${tp.blurb}`
      }
      style={
        {
          position: 'absolute',
          left: cx + Math.cos(a) * R - orb / 2,
          top: cy + Math.sin(a) * R - orb / 2,
          width: orb,
          height: orb,
          padding: 0,
          border: 'none',
          borderRadius: '50%',
          '--a': `${deg}deg`,
          '--r': `${R}px`,
          opacity: !orbsGo ? 0 : tp.soon ? 0.6 : 1,
          animation: settled
            ? 'none'
            : orbsGo
              ? `weo-orb-settle 2.2s var(--ease-portal) ${0.2 + i * 0.1}s both`
              : 'none',
          cursor: 'pointer',
          background: 'transparent',
          transition: 'opacity .4s',
          zIndex: on ? 3 : 1,
        } as CSSProperties
      }
    >
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          transform: on ? 'scale(1.12)' : 'none',
          transition: 'transform .45s var(--ease-portal)',
        }}
      >
        <Orb
          size={orb}
          fill={on ? tt : 'var(--surface)'}
          matcap
          ring
          ringColor={on ? tt : 'var(--border)'}
          breathe={on}
        />
      </span>
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          pointerEvents: 'none',
          color: on ? '#fff' : 'var(--text-faint)',
          transition: 'color .4s',
        }}
      >
        <span
          style={{
            display: 'grid',
            placeItems: 'center',
            width: on ? orb * 0.42 : orb * 0.5,
            height: on ? orb * 0.42 : orb * 0.5,
            borderRadius: '50%',
            background: on ? tt : 'transparent',
            boxShadow: on ? '0 6px 14px -6px rgba(8,10,18,.6), inset 0 0 0 1px rgba(255,255,255,.4)' : 'none',
            transition:
              'background .4s var(--ease-settle), width .4s var(--ease-portal), height .4s var(--ease-portal)',
          }}
        >
          {svg(CFORMAT_ICO[tp.key] ?? CFORMAT_ICO.Listing, on ? orb * 0.26 : orb * 0.4, 'currentColor', 1.8)}
        </span>
      </span>
      {/* the names show once, at the onset, then on hover */}
      {settled && (on || glimpse) && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            zIndex: 4,
            pointerEvents: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            whiteSpace: 'nowrap',
            padding: '3px 9px',
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '-.01em',
            color: on ? '#fff' : tp.soon ? 'var(--text-faint)' : 'var(--text-dim)',
            background: on ? tt : 'color-mix(in srgb, var(--surface) 88%, transparent)',
            boxShadow: on ? `0 8px 18px -8px ${tt}` : 'inset 0 0 0 1px var(--border)',
            transition: 'background .3s, color .3s, box-shadow .3s',
            animation: 'weo-fadein .4s var(--ease-portal) both',
            ...pos,
          }}
        >
          {tp.label}
          {tp.soon && (
            <span
              style={{
                fontSize: 8.5,
                fontWeight: 700,
                letterSpacing: '.1em',
                textTransform: 'uppercase',
                opacity: 0.85,
              }}
            >
              {notified ? '✓' : 'soon'}
            </span>
          )}
        </span>
      )}
    </button>
  );
}

/** The centre, when a format is pointed at: its icon in its own colour on white, and its name. */
export function FormatReadout({
  t,
  hole,
  tone,
  notified,
}: {
  t: CreateFormatDef;
  hole: number;
  tone: string;
  notified: boolean;
}) {
  return (
    <span
      key={t.key}
      style={{
        position: 'relative',
        display: 'grid',
        gap: 4,
        placeItems: 'center',
        width: Math.round(hole * 0.7),
        padding: '0 clamp(10px,4%,18px)',
        boxSizing: 'border-box',
        animation: 'weo-fadein .55s var(--ease-settle) both',
      }}
    >
      <span
        style={{
          display: 'grid',
          placeItems: 'center',
          width: Math.round(hole * 0.26),
          height: Math.round(hole * 0.26),
          borderRadius: 999,
          color: tone,
          background: '#fff',
          boxShadow: `0 10px 24px -10px rgba(8,10,18,.7), 0 0 0 3px color-mix(in srgb, ${tone} 55%, transparent)`,
        }}
      >
        {svg(CFORMAT_ICO[t.key] ?? CFORMAT_ICO.Listing, Math.round(hole * 0.14), 'currentColor', 2)}
      </span>
      <span
        style={{
          marginTop: 4,
          fontSize: Math.round(hole * 0.115),
          fontWeight: 700,
          letterSpacing: '-.03em',
          color: '#fff',
          textShadow: '0 2px 16px rgba(8,10,18,.7)',
        }}
      >
        {t.label}
      </span>
      {t.soon && (
        <span
          style={{
            fontSize: 9.5,
            fontWeight: 700,
            letterSpacing: '.12em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,.85)',
          }}
        >
          Coming soon
        </span>
      )}
      {t.soon && (
        <span
          style={{
            marginTop: 6,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '5px 11px',
            borderRadius: 999,
            fontSize: 10.5,
            fontWeight: 700,
            color: notified ? tone : '#fff',
            background: notified ? '#fff' : 'rgba(255,255,255,.22)',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.5)',
          }}
        >
          {notified ? svg(<path d="M5 12.5l4.2 4.2L19 7" />, 10, 'currentColor', 2.6) : null}
          {notified ? 'You’ll be told' : 'Notify me'}
        </span>
      )}
    </span>
  );
}

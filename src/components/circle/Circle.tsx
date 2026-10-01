import { useState, type ReactElement } from 'react';
import { Orb, svg } from '@/design-system';
import { compact } from '@/lib/format';

/**
 * design: screens-hub.jsx CIRCLE_ICONS, CircleChip, CircleOi, CircleRecord.
 * The view model a circle needs; the circle module (M05) adapts the API into it.
 */
export interface CircleCardModel {
  id: string;
  name: string;
  members: number;
  /** the circle's colour — its best-performing format's tone */
  toneHex?: string | null;
  /** a CIRCLE_ICONS key */
  icon?: string | null;
  /** 0–100 — how far the band fills */
  desire: number;
  img?: string | null;
  /** the format that wins here ("Pool") */
  bestType?: string | null;
}

export const CIRCLE_ICONS: Record<string, ReactElement> = {
  pool: (
    <>
      <circle cx="6" cy="16.5" r="2.3" />
      <circle cx="12" cy="12.5" r="2.3" />
      <circle cx="18" cy="8" r="2.3" />
      <path d="M7.8 15.2l2.5-1.6M13.8 11.2l2.4-1.6" />
    </>
  ),
  hunt: (
    <>
      <circle cx="12" cy="12" r="7.6" />
      <circle cx="12" cy="12" r="2.3" />
      <path d="M12 4.4v2.2M12 17.4v2.2M4.4 12h2.2M17.4 12h2.2" />
    </>
  ),
  arts: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 4a8 8 0 0 0 0 16 4 4 0 0 0 0-8 4 4 0 0 1 0-8z" />
    </>
  ),
  assets: (
    <>
      <path d="M12 4l8 4-8 4-8-4z" />
      <path d="M4 12.4l8 4 8-4M4 16.6l8 4 8-4" />
    </>
  ),
  generative: (
    <>
      <circle cx="7.5" cy="7.5" r="1.5" />
      <circle cx="16.5" cy="7.5" r="1.5" />
      <circle cx="7.5" cy="16.5" r="1.5" />
      <circle cx="16.5" cy="16.5" r="1.5" />
      <circle cx="12" cy="12" r="3.2" />
    </>
  ),
  sports: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 4c2.8 3 2.8 13 0 16M4.6 9.4c4.8 1.9 9.9 1.9 14.8 0M4.6 14.6c4.8-1.9 9.9-1.9 14.8 0" />
    </>
  ),
  sprout: (
    <>
      <path d="M12 20.5v-7.2" />
      <path d="M12 13.3c0-3-2.4-5-5.4-5 0 3 2.4 5 5.4 5z" />
      <path d="M12 13.3c0-3 2.4-5 5.4-5 0 3-2.4 5-5.4 5z" />
    </>
  ),
  ask: (
    <>
      <circle cx="12" cy="11" r="7.4" />
      <path d="M8.6 20.2l1.5-2.9" />
      <path d="M9.8 9.3a2.4 2.4 0 1 1 3.2 2.2v1.1" />
    </>
  ),
};

const VIOLET = '#D946EF';

export function CircleChip({ c, size }: { c: Pick<CircleCardModel, 'toneHex' | 'icon' | 'bestType'>; size?: number }) {
  const tone = c.toneHex || VIOLET;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        borderRadius: 999,
        padding: '4px 11px',
        fontSize: size || 10.5,
        fontWeight: 700,
        letterSpacing: '.08em',
        textTransform: 'uppercase',
        color: tone,
        background: `color-mix(in srgb, ${tone} 12%, var(--surface))`,
      }}
    >
      {svg(CIRCLE_ICONS[c.icon ?? ''] || CIRCLE_ICONS.ask, 13, 'currentColor', 1.8)}
      {c.bestType}
    </span>
  );
}

/** A circle as an O: the desire band is the ring, its image (or tone) the core. */
export function CircleOi({
  c,
  size,
  hot,
  coded,
}: {
  c: Pick<CircleCardModel, 'toneHex' | 'desire' | 'img'>;
  size?: number;
  hot?: boolean;
  coded?: boolean;
}) {
  const S = size || 108;
  const R = S / 2;
  const band = Math.round(S * 0.1);
  const ro = R - 1;
  const ri = ro - band;
  const coreR = ri - 5;
  const tone = coded === false ? VIOLET : c.toneHex || VIOLET;
  const bandMask = `radial-gradient(circle closest-side at 50% 50%, transparent ${(ri / R) * 100}%, #000 ${(ri / R) * 100 + 0.5}%, #000 ${(ro / R) * 100}%, transparent ${(ro / R) * 100 + 0.5}%)`;
  const deg = Math.max(8, (c.desire / 100) * 360);
  return (
    <span style={{ position: 'relative', display: 'block', width: S, height: S, flex: '0 0 auto' }}>
      <span
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: ro * 2,
          height: ro * 2,
          marginLeft: -ro,
          marginTop: -ro,
          boxSizing: 'border-box',
          borderRadius: '50%',
          border: `${band}px solid var(--surface-2)`,
          boxShadow:
            'inset 3px 3px 7px rgba(22,38,80,.13), inset -3px -3px 7px rgba(255,255,255,.85), 3px 4px 9px -4px rgba(22,38,80,.16), -2px -2px 6px -2px rgba(255,255,255,.7)',
          pointerEvents: 'none',
        }}
      />
      <span
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          WebkitMaskImage: bandMask,
          maskImage: bandMask,
          background: `conic-gradient(from 0deg, ${tone} 0deg ${deg}deg, transparent ${deg}deg)`,
          opacity: hot ? 1 : 0.62,
          filter: hot ? `drop-shadow(2px 3px 8px color-mix(in srgb, ${tone} 40%, transparent))` : 'none',
          transition: 'opacity .34s var(--ease-settle)',
          pointerEvents: 'none',
        }}
      />
      <span style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }}>
        <Orb size={coreR * 2} fill={c.img ? 'image' : tone} src={c.img} matcap breathe={hot} />
      </span>
    </span>
  );
}

/**
 * One circle as a record. design: `app.joined[c.id]` → `joined`; the Tweaks switch
 * `typeColorCircles` → `coded` (default on, as the design ships).
 */
export function CircleRecord({
  c,
  joined,
  coded = true,
  onOpen,
}: {
  c: CircleCardModel;
  joined?: boolean;
  coded?: boolean;
  onOpen: () => void;
}) {
  const [hov, setHov] = useState(false);
  const tone = coded ? c.toneHex || VIOLET : VIOLET;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onOpen();
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        cursor: 'pointer',
        borderRadius: 26,
        padding: 14,
        background: hov ? `color-mix(in srgb, ${tone} 5%, var(--surface))` : 'var(--surface)',
        boxShadow: `var(--nm-raised), inset 0 0 0 1px ${hov ? `color-mix(in srgb, ${tone} 34%, transparent)` : 'var(--border)'}`,
        transform: hov ? 'translateY(-2px)' : 'none',
        transition: 'transform .3s var(--ease-portal), background .3s, box-shadow .3s',
      }}
    >
      <CircleOi c={c} hot={hov} coded={coded} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 700, letterSpacing: '-.015em', color: 'var(--text)' }}>
          {c.name}
        </h3>
        <p style={{ margin: '3px 0 0', fontSize: 11.5, color: 'var(--text-faint)', fontVariantNumeric: 'tabular-nums' }}>
          {compact(c.members)} members
        </p>
      </div>
      {joined && (
        <span
          title="Joined"
          style={{ alignSelf: 'flex-start', flex: '0 0 auto', width: 8, height: 8, borderRadius: '50%', background: tone }}
        />
      )}
    </div>
  );
}

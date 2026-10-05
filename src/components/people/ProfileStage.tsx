// design: screens-hub.jsx OProfileStage · screens-network.jsx ActionTile
import { useState, type ReactNode } from 'react';
import { Orb, svg } from '@/design-system';
import { OAvatarOrb } from './People';

export interface StageItem {
  id: string;
  name: string;
  type?: string;
  img: string | null;
  tone?: string;
  onClick: () => void;
}

/**
 * design: screens-hub.jsx OProfileStage — a face at the centre of its standing, with what they
 * have made in orbit around it. Only the parts the creator sheet uses are ported (no rim
 * utilities, no collapse); the passport (M09) extends it.
 */
export function OProfileStage({
  size,
  isr,
  avatar,
  items,
  tone,
  center,
}: {
  size?: number;
  isr: number;
  avatar: string | null;
  items: StageItem[];
  tone?: string;
  center?: boolean;
}) {
  const S = size || 320;
  const list = items.slice(0, 7);
  const R = S / 2 - 34;
  const dot = Math.round(S * 0.2);
  const t = tone || 'var(--o-blue)';
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        flex: '0 0 auto',
        margin: center ? '0 auto' : undefined,
      }}
    >
      <div
        className="orbit-ring"
        style={{ position: 'relative', width: S, height: S, display: 'grid', placeItems: 'center' }}
      >
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: -S * 0.1,
            borderRadius: '50%',
            background: `radial-gradient(circle, color-mix(in srgb, ${t} 16%, transparent), transparent 66%)`,
            filter: 'blur(18px)',
          }}
        />
        <div style={{ position: 'absolute', inset: 0 }}>
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 18,
              borderRadius: '50%',
              border: '1px dashed var(--border)',
            }}
          />
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: S * 0.26,
              borderRadius: '50%',
              border: '1px solid var(--border)',
            }}
          />
          <div style={{ position: 'absolute', inset: 0, animation: 'weo-orbit 42s linear infinite' }}>
            {list.map((w, i) => (
              <div
                key={w.id || i}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: `rotate(${(i / list.length) * 360}deg) translateY(-${R}px)`,
                }}
              >
                <div
                  style={{
                    animation: 'weo-orbit-rev 42s linear infinite',
                    marginLeft: -dot / 2,
                    marginTop: -dot / 2,
                  }}
                >
                  <button
                    type="button"
                    onClick={w.onClick}
                    title={w.name + (w.type ? ` · ${w.type}` : '')}
                    aria-label={w.name + (w.type ? ` · ${w.type}` : '')}
                    style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}
                  >
                    <Orb size={dot} fill="image" src={w.img} ring ringColor={w.tone || t} matcap />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <OAvatarOrb src={avatar} isr={isr} size={Math.round(S * 0.46)} />
      </div>
    </div>
  );
}

export interface ActionTileItem {
  k: string;
  label: string;
  note: string;
  tone: string;
  on?: boolean;
  off?: boolean;
  go: () => void;
}

/**
 * design: screens-network.jsx ActionTile — neutral at rest, the tone arrives on approach: filled,
 * with the label and the glyph reversed out of it. Selected states hold that same treatment.
 */
export function ActionTile({ a, icon }: { a: ActionTileItem; icon: ReactNode }) {
  const [hov, setHov] = useState(false);
  const lit = (hov && !a.off) || !!a.on;
  return (
    <button
      type="button"
      onClick={a.off ? undefined : a.go}
      disabled={!!a.off}
      title={a.note}
      aria-pressed={a.on ? true : undefined}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onFocus={() => setHov(true)}
      onBlur={() => setHov(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        padding: '12px 10px',
        borderRadius: 20,
        border: 'none',
        cursor: a.off ? 'not-allowed' : 'pointer',
        font: 'inherit',
        textAlign: 'center',
        opacity: a.off ? 0.5 : 1,
        color: lit ? '#fff' : 'var(--text)',
        background: lit ? a.tone : 'var(--surface)',
        boxShadow: lit ? `0 14px 26px -12px color-mix(in srgb, ${a.tone} 85%, transparent)` : 'var(--nm-sm)',
        transform: lit ? 'translateY(-2px)' : 'none',
        transition: 'background .22s, color .2s, box-shadow .24s, transform .24s var(--ease-portal)',
      }}
    >
      <span
        style={{
          display: 'grid',
          placeItems: 'center',
          width: 30,
          height: 30,
          borderRadius: '50%',
          color: lit ? a.tone : 'var(--text-dim)',
          background: lit ? '#fff' : 'var(--surface-2)',
          boxShadow: lit ? 'none' : 'var(--nm-inset)',
          transition: 'background .22s, color .2s',
        }}
      >
        {svg(icon, 16, 'currentColor', 1.8)}
      </span>
      <span style={{ fontSize: 12, fontWeight: lit ? 700 : 600, letterSpacing: '-.01em' }}>{a.label}</span>
    </button>
  );
}

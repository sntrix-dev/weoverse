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

export interface StageUtility {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  on?: boolean;
  tone?: string;
}

/**
 * design: screens-hub.jsx OProfileStage — a face at the centre of its standing, with what they
 * have made in orbit around it. The orbit collapses to the centre when you want the room; the
 * ring's own controls (`utility`) sit on its rim as small orbs.
 */
export function OProfileStage({
  size,
  isr,
  avatar,
  items,
  tone,
  center,
  onOpen,
  collapsible,
  utility,
}: {
  size?: number;
  isr: number;
  avatar: string | null;
  items: StageItem[];
  tone?: string;
  center?: boolean;
  /** the face itself opens something (your standing) */
  onOpen?: () => void;
  collapsible?: boolean;
  utility?: StageUtility;
}) {
  const [open, setOpen] = useState(true);
  const shown = !collapsible || open;
  const S = size || 320;
  const box = shown ? S : Math.round(S * 0.52);
  const list = items.slice(0, 7);
  const R = S / 2 - 34;
  const dot = Math.round(S * 0.2);
  const t = tone || 'var(--o-blue)';
  const ut = utility?.tone || t;
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
        style={{
          position: 'relative',
          width: box,
          height: box,
          maxWidth: '100%',
          display: 'grid',
          placeItems: 'center',
          transition: 'width .5s var(--ease-portal), height .5s var(--ease-portal)',
        }}
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
        {/* the orbit is depth, not decoration — it collapses to the centre when you want the room */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: shown ? 'auto' : 'none' }}>
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 18,
              borderRadius: '50%',
              border: '1px dashed var(--border)',
              opacity: shown ? 1 : 0,
              transform: `scale(${shown ? 1 : 0.72})`,
              transition: 'opacity .42s, transform .6s var(--ease-portal)',
            }}
          />
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: S * 0.26,
              borderRadius: '50%',
              border: '1px solid var(--border)',
              opacity: shown ? 1 : 0,
              transform: `scale(${shown ? 1 : 0.8})`,
              transition: 'opacity .36s, transform .55s var(--ease-portal)',
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
                  transform: `rotate(${(i / list.length) * 360}deg) translateY(-${shown ? R : 0}px)`,
                  transition: `transform .62s var(--ease-portal) ${(shown ? i : list.length - 1 - i) * 45}ms`,
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
                    tabIndex={shown ? 0 : -1}
                    title={w.name + (w.type ? ` · ${w.type}` : '')}
                    aria-label={w.name + (w.type ? ` · ${w.type}` : '')}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      padding: 0,
                      cursor: 'pointer',
                      opacity: shown ? 1 : 0,
                      transform: `scale(${shown ? 1 : 0.4})`,
                      transition: `opacity .4s ${(shown ? i : 0) * 40}ms, transform .55s var(--ease-portal) ${(shown ? i : 0) * 40}ms`,
                    }}
                  >
                    <Orb size={dot} fill="image" src={w.img} ring ringColor={w.tone || t} matcap />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <OAvatarOrb src={avatar} isr={isr} size={Math.round(S * 0.46)} onOpen={onOpen} />
        {/* the ring's own control: one small orb on the rim — never a row of labelled buttons */}
        {utility && (
          <button
            type="button"
            onClick={utility.onClick}
            aria-label={utility.label}
            title={utility.label}
            aria-pressed={utility.on ? true : undefined}
            style={{
              position: 'absolute',
              right: 4,
              top: 4,
              width: 34,
              height: 34,
              borderRadius: '50%',
              border: 'none',
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
              color: utility.on ? '#fff' : 'var(--text-dim)',
              background: utility.on ? ut : 'var(--surface)',
              boxShadow: utility.on
                ? `0 10px 20px -10px ${ut}`
                : 'var(--nm-raised), inset 0 0 0 1px var(--border)',
              transition: 'color .2s, box-shadow .2s, background .2s',
            }}
          >
            {svg(utility.icon, 16, 'currentColor', 1.8)}
          </button>
        )}
        {/* the affordance is the ring — one glyph on its rim, no caption explaining it */}
        {collapsible && list.length > 0 && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={shown}
            aria-label={shown ? 'Collapse the orbit' : `Show ${list.length} WeOs in orbit`}
            title={shown ? 'Collapse the orbit' : `${list.length} WeOs in orbit`}
            style={{
              position: 'absolute',
              right: shown ? 4 : -6,
              bottom: shown ? 4 : -6,
              width: 30,
              height: 30,
              borderRadius: '50%',
              border: 'none',
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
              color: 'var(--text-dim)',
              background: 'var(--surface)',
              boxShadow: 'var(--nm-raised), inset 0 0 0 1px var(--border)',
              transition: 'right .5s var(--ease-portal), bottom .5s var(--ease-portal)',
            }}
          >
            {svg(shown ? <path d="M8 12h8" /> : <path d="M12 8v8M8 12h8" />, 15, 'currentColor', 2.2)}
          </button>
        )}
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

import { useLayoutEffect, useRef, useState } from 'react';
import { PersonOi, StandChip } from '@/components/people/People';
import { Button } from '@/design-system';

export interface OrbitPerson {
  id: string;
  name: string;
  handle: string;
  avatar: string | null;
  isr: number;
  bio: string | null;
  format: string;
  tone: string;
  circled: boolean;
}

export interface OrbitMe {
  avatar: string | null;
  isr: number;
  tier: string | null;
}

/**
 * design: exchange.jsx CircleCreatorsOrbit — the people in your Circles, orbiting your own
 * standing: the same orbit grammar a creator's WeOs use around theirs. Neutral at rest; approach
 * one and their name and ISR arrive.
 */
export function CircleCreatorsOrbit({
  list,
  me,
  shared,
  onOpen,
  onCircle,
  onStanding,
  onCircles,
}: {
  list: OrbitPerson[];
  me: OrbitMe;
  /** false when the orbit fell back to the leaders (you share no Circle with anyone yet) */
  shared: boolean;
  onOpen: (p: OrbitPerson) => void;
  onCircle: (p: OrbitPerson) => void;
  onStanding: () => void;
  onCircles: () => void;
}) {
  const [hov, setHov] = useState<string | null>(null);
  // the design's 360px orbit, scaled down to fit a phone (radius and faces with it)
  const box = useRef<HTMLDivElement>(null);
  const [S, setS] = useState(360);
  useLayoutEffect(() => {
    const el = box.current?.parentElement;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      const cs = getComputedStyle(el);
      const room = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      setS(Math.max(220, Math.min(360, Math.floor(room))));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const k = S / 360;
  const R = Math.round(150 * k);
  const face = Math.round(60 * k);
  const inset = Math.round(30 * k);
  const c = hov ? list.find((x) => x.id === hov) : null;
  return (
    // the last face you approached stays lit while you are in the card, so its buttons are reachable
    <div
      onMouseLeave={() => setHov(null)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHov(null);
      }}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 'clamp(18px,3vw,38px)',
        borderRadius: 30,
        padding: 'clamp(18px,2.4vw,28px)',
        background: 'color-mix(in srgb, var(--o-gold) 5%, var(--surface))',
        boxShadow: 'var(--nm-hero), inset 0 0 0 1px var(--border)',
      }}
    >
      <div
        ref={box}
        style={{
          flex: '0 0 auto',
          width: S,
          height: S,
          position: 'relative',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <div style={{ position: 'absolute', inset, borderRadius: '50%', border: '1px dashed var(--border)' }} />
        <div style={{ position: 'absolute', inset, animation: 'weo-orbit 40s linear infinite' }}>
          {list.map((p, i) => (
            <div
              key={p.id}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: `rotate(${(i / list.length) * 360}deg) translateY(-${R}px)`,
              }}
            >
              <div style={{ animation: 'weo-orbit-rev 40s linear infinite', marginLeft: -face / 2, marginTop: -face / 2 }}>
                <button
                  type="button"
                  onClick={() => onOpen(p)}
                  onMouseEnter={() => setHov(p.id)}
                  onFocus={() => setHov(p.id)}
                  title={`${p.name} · ISR ${p.isr}`}
                  aria-label={`Open ${p.name}`}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    padding: 0,
                    cursor: 'pointer',
                    borderRadius: '50%',
                    transform: hov === p.id ? 'scale(1.14)' : 'none',
                    transition: 'transform .28s var(--ease-portal)',
                  }}
                >
                  <PersonOi p={p} size={face} hot={hov === p.id} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <PersonOi p={me} size={Math.round(132 * k)} hot />
      </div>
      <div style={{ flex: '1 1 300px', minWidth: 260 }}>
        <p
          style={{
            margin: 0,
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: '.14em',
            textTransform: 'uppercase',
            color: c ? 'var(--o-gold-ink, #8a6a06)' : 'var(--text-faint)',
            transition: 'color .2s',
          }}
        >
          {c ? c.handle || c.name : 'Your standing'}
        </p>
        <h3 style={{ margin: '7px 0 0', fontSize: 'clamp(21px,2.4vw,27px)', fontWeight: 700, letterSpacing: '-.03em', color: 'var(--text)' }}>
          {c ? c.name : `ISR ${me.isr} · ${me.tier ?? 'your tier'}`}
        </h3>
        <p style={{ margin: '8px 0 0', maxWidth: '46ch', fontSize: 13.5, lineHeight: 1.55, color: 'var(--text-dim)' }}>
          {c
            ? (c.bio ?? `${c.format} creator · ISR ${c.isr}.`)
            : shared
              ? `${list.length} ${list.length === 1 ? 'creator shares' : 'creators share'} your Circles. Their standing is the ring, their face is the core — the same O you are.`
              : 'Join a Circle and the creators in it gather here. Until then, the leaders by standing — the ring is their standing, the face is the core.'}
        </p>
        {c && (
          <div style={{ marginTop: 12 }}>
            <StandChip c={c} />
          </div>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 18 }}>
          {c ? (
            <>
              <Button size="sm" variant="primary" tone="gold" onClick={() => onOpen(c)}>
                Open {c.name.split(' ')[0]}
              </Button>
              <Button size="sm" variant="ghost" tone="blue" onClick={() => onCircle(c)}>
                {c.circled ? 'Circled' : 'Circle them'}
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="primary" tone="gold" onClick={onStanding}>
                Your standing
              </Button>
              <Button size="sm" variant="ghost" tone="violet" onClick={onCircles}>
                Your Circles
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

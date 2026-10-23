import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { OsRun } from '@/components/text/OsRun';
import { Avatar, OMark, Orb } from '@/design-system';
import type { WeoCardModel } from '@/lib/cardModel';
import { osFmt } from '@/lib/format';
import { askAbout, openCollect, openCreator, openWorld } from '@/stores/flow';
import s from './Stage.module.css';

/** the current card's width; its neighbours peek at the sides (design `cw`) */
const CW = 'min(70vw, 1080px)';
const AUTO_MS = 4000;

/**
 * design: discover.jsx StageDeck (v4) — a full-width carousel: the live WeO on stage up to
 * 1080px wide, its neighbours peeking at half opacity. It moves on its own every 4s and holds
 * still while the pointer is over it; swipe, drag, a sideways wheel, the dots and a click on
 * a neighbour move it too. (v4 drops the header row of orbs and its arrows; the export defines
 * card-edge arrows but never draws them.)
 */
export function StageDeck({ list }: { list: WeoCardModel[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const n = list.length;
  const calm = useRef(
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    if (paused || calm.current || n < 2) return;
    const id = setInterval(() => setI((x) => x + 1), AUTO_MS);
    return () => clearInterval(id);
  }, [paused, n, i]);

  // design: swipe / drag past 50px, or a sideways wheel past 40px, moves one card
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let lock = 0;
    let acc = 0;
    let sx: number | null = null;
    let moved = false;
    const wheel = (e: WheelEvent) => {
      const dx = e.shiftKey && !e.deltaX ? e.deltaY : e.deltaX;
      if (Math.abs(dx) <= Math.abs(e.shiftKey ? 0 : e.deltaY)) return;
      e.preventDefault();
      const now = Date.now();
      if (now < lock) return;
      acc += dx;
      if (Math.abs(acc) > 40) {
        const step = acc > 0 ? 1 : -1;
        setI((x) => x + step);
        acc = 0;
        lock = now + 650;
      }
    };
    const down = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      sx = e.clientX;
      moved = false;
    };
    const move = (e: PointerEvent) => {
      if (sx != null && Math.abs(e.clientX - sx) > 8) moved = true;
    };
    const up = (e: PointerEvent) => {
      if (sx == null) return;
      const d = e.clientX - sx;
      sx = null;
      if (Math.abs(d) > 50) setI((x) => x + (d < 0 ? 1 : -1));
    };
    // a drag is not a click on the card under it
    const click = (e: MouseEvent) => {
      if (moved) {
        e.stopPropagation();
        e.preventDefault();
        moved = false;
      }
    };
    el.addEventListener('wheel', wheel, { passive: false });
    el.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    el.addEventListener('click', click, true);
    return () => {
      el.removeEventListener('wheel', wheel);
      el.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      el.removeEventListener('click', click, true);
    };
  }, []);

  if (!n) return null;
  const at = ((i % n) + n) % n;
  const w = list[at] as WeoCardModel;
  const go = (d: number) => setI((x) => x + d);
  const side = (dir: 1 | -1) => {
    if (n < 2) return null;
    const it = list[(((at + dir) % n) + n) % n] as WeoCardModel;
    return (
      <div
        key={`side${dir}${it.id}`}
        aria-hidden="true"
        className={s.side}
        data-dir={dir > 0 ? 'next' : 'prev'}
        style={{ '--cw': CW } as CSSProperties}
      >
        <div style={{ height: '100%' }}>
          <StageWeo w={it} />
        </div>
        <button type="button" tabIndex={-1} className={s.sideHit} onClick={() => go(dir)} />
      </div>
    );
  };
  return (
    <div
      id="d-stage"
      ref={ref}
      role="region"
      aria-roledescription="carousel"
      aria-label="On the stage"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className={`weo-stage-track ${s.track}`} style={{ '--cw': CW } as CSSProperties}>
        {side(-1)}
        <div key={w.id} className={s.current} aria-live="polite" aria-label={`${at + 1} of ${n} · ${w.name}`}>
          <StageWeo w={w} />
        </div>
        {side(1)}
      </div>
      {n > 1 && (
        <div role="tablist" aria-label="Stage cards" className={s.dots}>
          {list.map((it, k) => {
            const on = k === at;
            return (
              <button
                key={it.id}
                type="button"
                role="tab"
                aria-selected={on}
                aria-label={`${k + 1} of ${n} · ${it.name}`}
                onClick={() => setI(k)}
                className={s.dot}
                data-on={on || undefined}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * design: discover.jsx StageWeo — the loudest thing on the floor: the WeO's own photograph is the
 * poster. Rehearse it opens the World Studio (M11); Ask about it, the push sheet (M05).
 */
export function StageWeo({ w }: { w: WeoCardModel }) {
  const [hov, setHov] = useState(false);
  const tone = w.hex;
  const cr = w.creator;
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 'clamp(20px,3vw,44px)',
        borderRadius: 34,
        padding: 'clamp(20px,2.8vw,34px)',
        color: '#fff',
        background: '#0b0e18',
        boxShadow: hov
          ? `0 28px 60px -26px color-mix(in srgb, ${tone} 85%, transparent), inset 0 0 0 1.5px ${tone}`
          : `var(--nm-hero), inset 0 0 0 1px color-mix(in srgb, ${tone} 40%, transparent)`,
        transition: 'box-shadow .34s',
      }}
    >
      <span aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {w.img && (
          <img
            src={w.img}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: hov ? 0.58 : 0.44,
              filter: 'saturate(1.18)',
              transition: 'opacity .4s',
            }}
          />
        )}
        <span
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(100deg, rgba(8,10,18,.9) 0%, rgba(8,10,18,.66) 46%, rgba(8,10,18,.34) 100%)',
          }}
        />
        <span
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(180deg, transparent 40%, color-mix(in srgb, ${tone} 34%, transparent) 100%)`,
          }}
        />
      </span>

      <div
        style={{
          position: 'relative',
          flex: '0 0 auto',
          margin: '0 auto',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: `radial-gradient(circle, color-mix(in srgb, ${tone} 46%, transparent), transparent 66%)`,
            filter: 'blur(28px)',
            opacity: hov ? 1 : 0.7,
            transition: 'opacity .4s',
          }}
        />
        <button
          type="button"
          onClick={() => openCollect(w.id)}
          title={w.name}
          aria-label={`${w.cta} · ${w.name}`}
          className="weo-req-orb"
          style={{
            position: 'relative',
            border: 'none',
            background: 'transparent',
            padding: 0,
            cursor: 'pointer',
          }}
        >
          <Orb size={236} fill="image" src={w.img} ring ringColor={tone} matcap breathe />
        </button>
      </div>

      <div style={{ position: 'relative', flex: '1 1 320px', minWidth: 280 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              borderRadius: 999,
              padding: '4px 11px',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '.14em',
              textTransform: 'uppercase',
              color: '#fff',
              background: tone,
            }}
          >
            {w.live && (
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#fff',
                  animation: 'weo-breathe 2.2s ease-in-out infinite',
                }}
              />
            )}
            {w.type}
          </span>
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 600,
              letterSpacing: '.14em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,.86)',
              textShadow: '0 1px 8px rgba(8,10,18,.7)',
            }}
          >
            {w.category}
          </span>
          {w.timer && (
            <span
              style={{ fontSize: 12, fontWeight: 700, color: '#fff', fontVariantNumeric: 'tabular-nums' }}
            >
              {w.timer}
            </span>
          )}
        </span>
        <h2
          style={{
            margin: '11px 0 0',
            fontSize: 'clamp(26px,3.2vw,40px)',
            fontWeight: 700,
            letterSpacing: '-.038em',
            lineHeight: 1.02,
            textWrap: 'pretty',
            textShadow: '0 3px 22px rgba(8,10,18,.5)',
          }}
        >
          {w.name}
        </h2>
        {w.points[0] && (
          <p
            style={{
              margin: '11px 0 0',
              maxWidth: '46ch',
              fontSize: 13.5,
              lineHeight: 1.55,
              color: 'rgba(255,255,255,.9)',
              textShadow: '0 1px 10px rgba(8,10,18,.6)',
            }}
          >
            {w.points[0]}
          </p>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(110px,1fr))',
            gap: 10,
            marginTop: 18,
          }}
        >
          {w.terms.map((t) => (
            <div
              key={t.k}
              style={{
                borderRadius: 16,
                padding: '11px 13px',
                background: 'rgba(255,255,255,.1)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.18)',
              }}
            >
              <span
                style={{
                  display: 'block',
                  fontSize: 14.5,
                  fontWeight: 700,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                <OsRun text={t.v} />
              </span>
              <span
                style={{
                  display: 'block',
                  marginTop: 2,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '.1em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,.62)',
                }}
              >
                {t.k}
              </span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 18 }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openCreator(cr.id);
            }}
            title={`Open ${cr.handle}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              border: 'none',
              background: 'transparent',
              padding: 0,
              cursor: 'pointer',
              font: 'inherit',
            }}
          >
            <Avatar src={cr.avatarUrl ?? undefined} isr={cr.isr} size={30} />
            <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,.8)' }}>
              {cr.handle} · ISR {cr.isr}
            </span>
          </button>
          <span
            style={{
              marginLeft: 'auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 21,
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <OMark size={16} />
            {osFmt(w.os)}
          </span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginTop: 18 }}>
          <button
            type="button"
            onClick={() => openCollect(w.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              border: 'none',
              cursor: 'pointer',
              borderRadius: 999,
              padding: '12px 20px',
              font: 'inherit',
              fontSize: 13.5,
              fontWeight: 700,
              color: '#0b0e18',
              background: '#fff',
              boxShadow: '0 10px 26px -10px rgba(8,10,18,.6)',
            }}
          >
            {w.cta}
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: tone }} />
          </button>
          {(
            [
              ['Rehearse it', () => openWorld({ weoId: w.id })],
              ['Ask about it', () => askAbout(w)],
            ] as const
          ).map(([label, go]) => (
            <button
              key={label}
              type="button"
              onClick={go}
              style={{
                border: 'none',
                cursor: 'pointer',
                borderRadius: 999,
                padding: '12px 18px',
                font: 'inherit',
                fontSize: 13,
                fontWeight: 600,
                color: '#fff',
                background: 'rgba(255,255,255,.12)',
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.24)',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

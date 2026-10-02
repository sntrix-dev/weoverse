// design: create.jsx edgeAt, Headline, MakeDonut, useLook, MakeWell (from make-media.jsx)
import { useEffect, useRef, useState, type MouseEvent, type RefObject } from 'react';
import { O_SECTION_ICONS, svg } from '@/design-system';
import {
  CREATE_MEDIA,
  MAKE_EDGES,
  MAKE_INTRO_CLIP,
  MAKE_LOGO,
  MAKE_MANTRAS,
  type EdgeDir,
  type MakeEdge,
} from '../model/formats';

const calm = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** which edge the pointer is over: inside the hole is the centre, past the rim is nothing */
export function edgeAt(e: MouseEvent<HTMLElement>, el: HTMLElement, holeR: number): EdgeDir | null {
  const r = el.getBoundingClientRect();
  const dx = e.clientX - (r.left + r.width / 2);
  const dy = e.clientY - (r.top + r.height / 2);
  const d = Math.sqrt(dx * dx + dy * dy);
  if (d < holeR || d > r.width / 2) return null;
  return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'bottom' : 'top';
}

/**
 * The headline above the O is always on screen. The lines rotate in a loop; with reduced motion
 * the first line simply stands. It never collapses into a button.
 */
export function Headline({ pace = 4000 }: { pace?: number }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (calm()) return;
    const t = setInterval(() => setI((n) => (n + 1) % MAKE_MANTRAS.length), pace);
    return () => clearInterval(t);
  }, [pace]);
  return (
    <header
      aria-live="polite"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 'clamp(12px,3vh,32px)',
        display: 'grid',
        placeItems: 'center',
        minHeight: 'clamp(64px,8vw,104px)',
        padding: '0 20px',
        pointerEvents: 'none',
        zIndex: 3,
      }}
    >
      <h1
        key={i}
        style={{
          margin: 0,
          textAlign: 'center',
          fontSize: 'clamp(34px,5vw,60px)',
          lineHeight: 1.04,
          letterSpacing: '-.035em',
          fontWeight: 700,
          color: 'var(--text)',
          textWrap: 'pretty',
          animation: 'weo-cardin .56s var(--ease-portal) both',
        }}
      >
        {MAKE_MANTRAS[i]}
      </h1>
    </header>
  );
}

/**
 * The donut, as the O portal draws it: a dimensional torus, neutral at rest, the four-colour
 * wash breathing in when looked at, and the hovered edge's colour confined to its own arc.
 */
export function MakeDonut({
  size,
  hole,
  live,
  looking,
}: {
  size: number;
  hole: number;
  live: MakeEdge | null;
  looking: boolean;
}) {
  const ray = (size / 2) * Math.SQRT2;
  const h = (hole / 2 / ray) * 100;
  const o = (size / 2 / ray) * 100;
  const mask = `radial-gradient(circle at 50% 50%, transparent ${h.toFixed(2)}%, #000 ${(h + 0.05).toFixed(2)}%, #000 100%)`;
  const quad: Record<EdgeDir, number> = { top: 0, right: 90, bottom: 180, left: 270 };
  const tone = live ? live.tone : null;
  const mid = (h + o) / 2;
  const tubeHi = h + (o - h) * 0.18;
  const tubeLo = h + (o - h) * 0.82;
  const at: Record<EdgeDir, string> = {
    top: '50% 0%',
    right: '100% 50%',
    bottom: '50% 100%',
    left: '0% 50%',
  };
  const E = MAKE_EDGES;
  return (
    <span
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, borderRadius: '50%', pointerEvents: 'none' }}
    >
      <span
        style={{
          position: 'absolute',
          inset: '-4%',
          borderRadius: '50%',
          background:
            'radial-gradient(ellipse 70% 60% at 50% 56%, transparent 40%, rgba(0,0,0,.14) 56%, transparent 80%)',
          filter: 'blur(10px)',
        }}
      />
      {/* the tube itself: light at the inner lip, shade toward the outer rim */}
      <span
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          boxShadow: live || looking ? 'var(--nm-hero)' : 'var(--nm-raised)',
          transition: 'box-shadow .3s',
          background: `radial-gradient(circle at 50% 50%, transparent ${h.toFixed(2)}%, rgba(255,255,255,.95) ${(h + 0.6).toFixed(2)}%, var(--surface) ${tubeHi.toFixed(2)}%, var(--surface-2) ${mid.toFixed(2)}%, color-mix(in srgb, var(--surface-2) 74%, #8595b8) ${tubeLo.toFixed(2)}%, var(--surface-2) ${(o - 1.2).toFixed(2)}%, var(--surface-3) 100%)`,
        }}
      />
      <span
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          WebkitMask: mask,
          mask,
          background:
            'linear-gradient(180deg, rgba(255,255,255,.6) 0%, transparent 40%, transparent 60%, rgba(64,84,132,.24) 100%)',
        }}
      />
      {/* the four-colour wash, only when looked at */}
      <span
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          WebkitMask: mask,
          mask,
          mixBlendMode: 'overlay',
          opacity: live || looking ? 1 : 0,
          transition: 'opacity .3s ease-out',
          background: `conic-gradient(from 270deg, ${E.top.tone}2e, ${E.right.tone}2e 90deg, ${E.bottom.tone}2e 180deg, ${E.left.tone}2e 270deg, ${E.top.tone}2e 360deg)`,
        }}
      />
      {/* the hovered edge's colour, confined to its arc */}
      <span
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          WebkitMask: mask,
          mask,
          opacity: tone ? 0.95 : 0,
          transition: 'opacity .25s ease-out',
          background:
            tone && live
              ? `conic-gradient(from ${quad[live.dir] - 60}deg, transparent 0deg, color-mix(in srgb, ${tone} 55%, transparent) 40deg, ${tone} 60deg, color-mix(in srgb, ${tone} 55%, transparent) 80deg, transparent 120deg)`
              : 'none',
        }}
      />
      <span
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          WebkitMask: mask,
          mask,
          boxShadow: 'inset 0 0 0 1px var(--border)',
        }}
      />
      {/* the colour bleeds off the ring into the frame */}
      <span
        style={{
          position: 'absolute',
          inset: '-34%',
          borderRadius: '50%',
          filter: 'blur(34px)',
          opacity: tone ? 0.55 : 0,
          transition: 'opacity .32s ease-out',
          background:
            tone && live
              ? `radial-gradient(circle at ${at[live.dir]}, color-mix(in srgb, ${tone} 60%, transparent), transparent 56%)`
              : 'none',
        }}
      />
    </span>
  );
}

/** the look: before the pointer touches it, the whole O leans toward the cursor within reach */
export function useLook(ref: RefObject<HTMLElement | null>, held: boolean) {
  const [look, setLook] = useState({ active: false, rx: 0, ry: 0 });
  useEffect(() => {
    const RANGE = 380;
    const rest = { active: false, rx: 0, ry: 0 };
    const onMove = (e: globalThis.MouseEvent) => {
      const el = ref.current;
      if (!el || held) {
        setLook((l) => (l.active ? rest : l));
        return;
      }
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < RANGE)
        setLook({
          active: true,
          rx: Math.max(-14, Math.min(14, (-dy / RANGE) * 16)),
          ry: Math.max(-14, Math.min(14, (dx / RANGE) * 16)),
        });
      else setLook((l) => (l.active ? rest : l));
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [ref, held]);
  return look;
}

const muteVideo = (el: HTMLVideoElement | null) => {
  if (!el) return;
  el.muted = true;
  el.defaultMuted = true;
  el.volume = 0;
};

/**
 * The hole: every clip mounted once and cross-faded, so moving edge to edge never restarts a
 * download; the logo loop and drifting imagery are the rest layer underneath.
 */
export function MakeWell({
  size,
  live,
  voiced,
  onVoice,
  onGo,
  peek,
  dark,
  intro,
}: {
  size: number;
  live: MakeEdge | null;
  voiced: boolean;
  onVoice: () => void;
  onGo: () => void;
  peek: number;
  dark: boolean;
  intro: boolean;
}) {
  const refs = useRef<Partial<Record<EdgeDir, HTMLVideoElement | null>>>({});
  const introRef = useRef<HTMLVideoElement>(null);
  const active = live ? live.dir : null;
  useEffect(() => {
    for (const k of Object.keys(refs.current) as EdgeDir[]) {
      const v = refs.current[k];
      if (!v) continue;
      const on = k === active;
      const voice = on && voiced;
      v.muted = !voice;
      v.volume = voice ? 1 : 0;
      if (on) void v.play?.()?.catch(() => {});
      else v.pause?.();
    }
  }, [active, voiced]);
  useEffect(() => {
    if (intro) void introRef.current?.play?.()?.catch(() => {});
  }, [intro]);
  const tone = live ? live.tone : 'var(--o-green)';
  const fill = {
    position: 'absolute' as const,
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
  };
  return (
    <span
      style={{
        position: 'relative',
        display: 'block',
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        background: dark ? 'var(--surface-2)' : 'var(--surface)',
        boxShadow: 'var(--nm-inset)',
      }}
    >
      {CREATE_MEDIA.map((m, n) => (
        <img
          key={m.label}
          src={m.src}
          alt=""
          aria-hidden="true"
          style={{
            ...fill,
            zIndex: 0,
            opacity: !active && n === peek ? 0.26 : 0,
            transition: 'opacity 1.1s var(--ease-standard)',
          }}
        />
      ))}
      <video
        src={MAKE_INTRO_CLIP}
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
        ref={muteVideo}
        style={{
          ...fill,
          zIndex: 1,
          opacity: active ? 0 : 0.55,
          transition: 'opacity .6s var(--ease-standard)',
        }}
      />
      <video
        src={MAKE_LOGO}
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
        ref={muteVideo}
        style={{
          ...fill,
          zIndex: 2,
          opacity: active ? 0 : 1,
          transition: 'opacity .5s var(--ease-standard)',
        }}
      />
      {/* the first time the centre is approached, the intro plays in the window */}
      <video
        src={MAKE_INTRO_CLIP}
        muted
        loop
        playsInline
        preload="none"
        aria-hidden="true"
        ref={(el) => {
          muteVideo(el);
          introRef.current = el;
        }}
        style={{
          ...fill,
          zIndex: 3,
          opacity: intro && !active ? 1 : 0,
          transform: intro ? 'scale(1)' : 'scale(1.06)',
          transition: 'opacity .5s var(--ease-standard), transform .8s var(--ease-settle)',
        }}
      />
      {(Object.keys(MAKE_EDGES) as EdgeDir[]).map((k) => (
        <video
          key={k}
          ref={(el) => {
            refs.current[k] = el;
          }}
          src={MAKE_EDGES[k].src}
          loop
          muted
          playsInline
          preload="none"
          aria-hidden={active !== k}
          style={{
            ...fill,
            zIndex: 3,
            opacity: active === k ? 1 : 0,
            transform: active === k ? 'scale(1)' : 'scale(1.04)',
            transition: 'opacity .5s var(--ease-standard), transform .7s var(--ease-settle)',
          }}
        />
      ))}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 4,
          pointerEvents: 'none',
          borderRadius: '50%',
          background: active
            ? 'linear-gradient(180deg, rgba(8,10,18,0) 40%, rgba(8,10,18,.62) 100%), radial-gradient(58% 52% at 30% 24%, rgba(255,255,255,.16), transparent 58%)'
            : 'radial-gradient(58% 52% at 30% 24%, rgba(255,255,255,.16), transparent 58%)',
          transition: 'background .4s',
        }}
      />
      {live && (
        <span
          key={live.dir}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: Math.round(size * 0.13),
            zIndex: 5,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            animation: 'weo-cardin .34s var(--ease-portal) both',
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px 6px 8px',
              borderRadius: 999,
              color: '#fff',
              background: 'rgba(8,10,18,.34)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${tone} 60%, transparent)`,
            }}
          >
            <span
              style={{
                display: 'grid',
                placeItems: 'center',
                width: 24,
                height: 24,
                borderRadius: 999,
                background: tone,
              }}
            >
              {svg(O_SECTION_ICONS[live.dir], 14, '#fff', 2)}
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-.01em' }}>{live.label}</span>
          </span>
          <span style={{ display: 'flex', gap: 8 }}>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onVoice();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  onVoice();
                }
              }}
              aria-pressed={voiced}
              title={voiced ? 'Mute' : 'Press to voice it'}
              aria-label={voiced ? 'Mute the clip' : 'Voice the clip'}
              style={{
                display: 'grid',
                placeItems: 'center',
                width: 36,
                height: 36,
                border: 'none',
                borderRadius: 999,
                cursor: 'pointer',
                color: voiced ? tone : '#fff',
                background: voiced ? '#fff' : 'rgba(8,10,18,.34)',
                backdropFilter: 'blur(10px)',
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.34)',
                transition: 'background .24s, color .24s',
              }}
            >
              {svg(
                voiced ? (
                  <>
                    <path d="M4 9.6v4.8h3.4L12 18.6V5.4L7.4 9.6z" />
                    <path d="M15.4 9.2a4 4 0 0 1 0 5.6M17.8 6.8a7.2 7.2 0 0 1 0 10.4" />
                  </>
                ) : (
                  <>
                    <path d="M4 9.6v4.8h3.4L12 18.6V5.4L7.4 9.6z" />
                    <path d="M16 9.6l4.4 4.8M20.4 9.6L16 14.4" />
                  </>
                ),
                16,
                'currentColor',
                1.8,
              )}
            </span>
            {voiced && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onGo();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    onGo();
                  }
                }}
                title={`Enter ${live.label}`}
                aria-label={`Enter ${live.label}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  height: 36,
                  padding: '0 14px 0 12px',
                  border: 'none',
                  borderRadius: 999,
                  cursor: 'pointer',
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: '#fff',
                  background: tone,
                  boxShadow: `0 10px 22px -10px ${tone}`,
                  animation: 'weo-cardin .3s var(--ease-portal) both',
                }}
              >
                Enter{svg(<polyline points="9 6 15 12 9 18" />, 14, 'currentColor', 2.4)}
              </span>
            )}
          </span>
        </span>
      )}
    </span>
  );
}

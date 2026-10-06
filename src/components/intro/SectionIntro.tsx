import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useShellRoute } from '@/app/useShellRoute';
import { O_SECTION_ICONS, svg } from '@/design-system';
import { usePrefs } from '@/stores/prefs';
import { endRecall, markSeen, seenKey, useIntro } from '@/stores/intro';
import { INTRO_SECTIONS, isIntroKey, SPINE, WALK, type IntroKey } from './sections';

/**
 * design: v3-spine.jsx V3Arrival + V3Walk. The first visit to a section raises its curtain —
 * the frame in the section's colour, the word, the invitation and the O; it holds until you go
 * in (the O, the button, Enter or Escape). Then two or three coach marks name what is on the
 * screen, one at a time. Both once per account (D-088); the hero's mark brings them back.
 */
export function SectionIntro() {
  const { route } = useShellRoute();
  const ready = usePrefs((s) => s.server != null);
  const seen = usePrefs((s) => s.prefs.seen) ?? [];
  const recall = useIntro((s) => s.recall);
  const section = isIntroKey(route) ? route : null;
  const curtain: IntroKey | null =
    recall && isIntroKey(recall)
      ? recall
      : section && ready && !seen.includes(seenKey('intro', section))
        ? section
        : null;

  return (
    <>
      {curtain && <Curtain key={curtain} k={curtain} recall={!!recall} />}
      {!curtain && section && ready && !seen.includes(seenKey('walk', section)) && (
        <Walk key={section} k={section} />
      )}
    </>
  );
}

function Curtain({ k, recall }: { k: IntroKey; recall: boolean }) {
  const sec = INTRO_SECTIONS[k];
  const [hov, setHov] = useState(false);
  const ring = k === 'hub' || k === 'create';
  const [ringS] = useState(() => Math.min(340, Math.round(window.innerHeight * 0.44)));
  const leave = () => {
    markSeen(seenKey('intro', k));
    endRecall();
  };
  const leaveRef = useRef(leave);
  useEffect(() => {
    leaveRef.current = leave;
  });
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        leaveRef.current();
      }
    };
    window.addEventListener('keydown', f);
    document.documentElement.setAttribute('data-weo-intro', '');
    return () => {
      window.removeEventListener('keydown', f);
      document.documentElement.removeAttribute('data-weo-intro');
    };
  }, []);

  return createPortal(
    <div
      data-weo-intro-screen="1"
      role="dialog"
      aria-modal="true"
      aria-label={sec.title}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'grid',
        placeItems: 'center',
        overflow: 'hidden',
        color: '#fff',
        background: `radial-gradient(circle at 50% 44%, color-mix(in srgb, ${sec.tone} 62%, #0b0e18) 0%, color-mix(in srgb, ${sec.tone} 84%, #0b0e18) 46%, ${sec.tone} 100%)`,
        animation: 'weo-cardin .6s var(--ease-settle) both',
      }}
    >
      <video
        key={sec.clip}
        src={sec.clip}
        autoPlay
        muted
        loop
        playsInline
        // React does not reflect `muted` to the DOM, and an unmuted video may not autoplay
        ref={(el) => {
          if (!el) return;
          el.muted = true;
          const playing = el.play() as Promise<void> | undefined;
          playing?.catch(() => undefined);
        }}
        preload="auto"
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: hov ? 0.92 : 0.58,
          filter: hov ? 'none' : 'saturate(.7)',
          transition: 'opacity .7s var(--ease-settle), filter .7s var(--ease-settle)',
        }}
      />
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(80% 70% at 50% 42%, color-mix(in srgb, ${sec.tone} 26%, transparent), rgba(11,14,24,.74) 100%)`,
          opacity: hov ? 0.55 : 1,
          transition: 'opacity .7s var(--ease-settle)',
        }}
      />
      {recall && (
        <button
          onClick={leave}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: 18,
            right: 18,
            display: 'grid',
            placeItems: 'center',
            width: 42,
            height: 42,
            borderRadius: '50%',
            border: 'none',
            cursor: 'pointer',
            color: '#fff',
            background: 'rgba(255,255,255,.14)',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.35)',
          }}
        >
          {svg(<path d="M6 6l12 12M18 6L6 18" />, 16, 'currentColor', 2)}
        </button>
      )}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'clamp(12px,2.2vh,26px)',
          textAlign: 'center',
          padding: '18px 24px',
          maxWidth: 720,
          maxHeight: '100vh',
          textShadow: '0 2px 18px rgba(8,22,55,.45)',
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '.18em',
            textTransform: 'uppercase',
            opacity: 0.8,
            whiteSpace: 'nowrap',
          }}
        >
          {sec.n ? `${sec.n} of 04` : 'WeOverse'}
        </span>
        <div
          style={{
            fontSize: 'clamp(44px,min(7.6vw,10vh),92px)',
            fontWeight: 700,
            letterSpacing: '-.05em',
            lineHeight: 0.96,
          }}
        >
          {sec.title}
        </div>
        <p
          style={{
            margin: 0,
            fontSize: 'clamp(16px,1.6vw,21px)',
            fontWeight: 400,
            lineHeight: 1.45,
            textWrap: 'pretty',
            maxWidth: '46ch',
            opacity: 0.94,
          }}
        >
          <b style={{ fontWeight: 600 }}>{sec.line}</b> {sec.why}
        </p>
        <span
          style={{
            position: 'relative',
            display: 'grid',
            placeItems: 'center',
            width: ring ? ringS : 'min(150px, 22vh)',
            height: ring ? ringS : 'min(150px, 22vh)',
            marginTop: ring ? 22 : 0,
          }}
        >
          {ring &&
            SPINE.map(([w, t], i) => {
              const ang = (i / 5) * Math.PI * 2 - Math.PI / 2;
              const R = Math.round(ringS / 2) - 20;
              const dx = Math.cos(ang);
              const dy = Math.sin(ang);
              // the dot sits ON the orbit; the label hangs off it away from the centre
              const lx =
                dx > 0.3
                  ? 'translate(0,-50%)'
                  : dx < -0.3
                    ? 'translate(-100%,-50%)'
                    : dy < 0
                      ? 'translate(-50%,-100%)'
                      : 'translate(-50%,0)';
              return (
                <span
                  key={w}
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    marginLeft: Math.round(dx * R),
                    marginTop: Math.round(dy * R),
                    width: 0,
                    height: 0,
                    animation: `weo-cardin .7s var(--ease-portal) ${0.5 + i * 0.12}s both`,
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      left: -17,
                      top: -17,
                      display: 'grid',
                      placeItems: 'center',
                      width: 34,
                      height: 34,
                      borderRadius: '50%',
                      background: '#fff',
                      color: t,
                      fontSize: 12,
                      fontWeight: 700,
                      boxShadow: `0 8px 20px -8px rgba(8,22,55,.5), 0 0 0 2px color-mix(in srgb, ${t} 70%, transparent)`,
                    }}
                  >
                    {i + 1}
                  </span>
                  <span
                    style={{
                      position: 'absolute',
                      left: Math.round(dx * 26),
                      top: Math.round(dy * 26),
                      transform: lx,
                      fontSize: 11.5,
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      textShadow: '0 1px 10px rgba(8,22,55,.5)',
                    }}
                  >
                    {w}
                  </span>
                </span>
              );
            })}
          <button
            onClick={leave}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            aria-label={`Enter ${sec.title}`}
            style={{
              position: 'relative',
              display: 'grid',
              placeItems: 'center',
              width: 132,
              height: 132,
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              borderRadius: '50%',
              background: 'transparent',
              outline: 'none',
              transform: hov ? 'scale(1.04)' : 'none',
              transition: 'transform .34s var(--ease-portal)',
            }}
          >
            <span
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                boxShadow: `inset 0 0 0 ${hov ? 8 : 12}px rgba(255,255,255,.92), 0 30px 70px -24px rgba(6,18,46,.7)`,
                transition: 'box-shadow .4s var(--ease-portal)',
                animation: 'weo3-pulse-hi 3.4s ease-in-out infinite',
              }}
            />
            <span
              style={{
                display: 'grid',
                placeItems: 'center',
                width: hov ? 80 : 64,
                height: hov ? 80 : 64,
                borderRadius: '50%',
                background: `radial-gradient(58% 52% at 32% 26%, #fff, ${sec.tone} 62%)`,
                boxShadow: '0 0 0 1.5px rgba(255,255,255,.6)',
                transition: 'width .4s var(--ease-portal), height .4s var(--ease-portal)',
              }}
            >
              {svg(O_SECTION_ICONS[sec.edge], hov ? 34 : 26, '#fff', 1.5)}
            </span>
          </button>
        </span>
        <button
          onClick={leave}
          onMouseEnter={() => setHov(true)}
          onMouseLeave={() => setHov(false)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            minWidth: 220,
            minHeight: 58,
            padding: '0 30px',
            border: 'none',
            borderRadius: 999,
            cursor: 'pointer',
            font: 'inherit',
            fontSize: 17.5,
            fontWeight: 700,
            letterSpacing: '-.015em',
            color: hov ? '#fff' : 'var(--text)',
            background: hov ? sec.tone : 'var(--surface)',
            boxShadow: hov
              ? `0 18px 40px -14px ${sec.tone}, inset 0 0 0 2px rgba(255,255,255,.5)`
              : 'var(--nm-raised), inset 0 1px 0 rgba(255,255,255,.5)',
            transform: hov ? 'translateY(-2px)' : 'none',
            transition: 'background .26s, color .24s, box-shadow .3s, transform .3s var(--ease-portal)',
          }}
        >
          {sec.title}
          {svg(<polyline points="9 6 15 12 9 18" />, 16, 'currentColor', 2.4)}
        </button>
      </div>
    </div>,
    // inside #root: the global intro rule hides everything else there and outside it
    document.getElementById('root') ?? document.body,
  );
}

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** design: V3Walk — coach marks anchored to the thing itself; steps whose anchor is missing are skipped. */
function Walk({ k }: { k: IntroKey }) {
  const kick = useIntro((s) => s.walkKick);
  const [i, setI] = useState(-1);
  const [steps, setSteps] = useState(WALK[k]);
  const [box, setBox] = useState<Box | null>(null);
  const card = useRef<HTMLDivElement>(null);
  const [ch, setCh] = useState(210);
  useLayoutEffect(() => {
    if (!card.current) return;
    const hh = card.current.getBoundingClientRect().height;
    if (Math.abs(hh - ch) > 2) setCh(hh);
  }, [ch, i, box]);

  // a beat for the screen to settle (its data may still be arriving), then the steps whose anchors are there
  useEffect(() => {
    let tries = 0;
    let t = 0;
    const look = () => {
      const lead = document.querySelector(WALK[k][0]!.sel);
      if (!lead && ++tries < 12) {
        t = window.setTimeout(look, 300);
        return;
      }
      const present = WALK[k].filter((s) => document.querySelector(s.sel));
      setSteps(present);
      setI(present.length ? 0 : -1);
    };
    t = window.setTimeout(look, 900);
    return () => window.clearTimeout(t);
  }, [k, kick]);

  const step = i >= 0 ? steps[i] : undefined;
  useEffect(() => {
    if (!step) return;
    const read = () => {
      const el = document.querySelector(step.sel);
      // a screen re-rendering its anchor keeps the mark where it was
      if (!el) return;
      const r = el.getBoundingClientRect();
      setBox({ x: r.left, y: r.top, w: r.width, h: r.height });
    };
    const el = document.querySelector(step.sel);
    if (el) {
      const r = el.getBoundingClientRect();
      if (r.top < 80 || r.bottom > window.innerHeight - 40)
        window.scrollTo({ top: window.scrollY + r.top - 120, behavior: 'smooth' });
    }
    const t = window.setTimeout(read, 420);
    read();
    window.addEventListener('scroll', read, { passive: true });
    window.addEventListener('resize', read);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('scroll', read);
      window.removeEventListener('resize', read);
    };
  }, [step]);

  const end = () => {
    markSeen(seenKey('walk', k));
    setI(-1);
  };
  if (!step || !box) return null;
  const tone = INTRO_SECTIONS[k].tone;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const tall = box.h > 260 && box.x + box.w + 340 < vw;
  const below = !tall && box.y + box.h + ch + 24 < vh;
  const above = !tall && !below && box.y - 12 - ch >= 12;
  // above or below, never over the thing being pointed at; if neither fits, beside it
  const top = tall
    ? Math.max(12, Math.min(box.y + 24, vh - ch - 12))
    : below
      ? box.y + box.h + 12
      : above
        ? box.y - 12 - ch
        : Math.max(12, vh - ch - 12);
  const side = !tall && !below && !above;
  const width = Math.min(320, vw - 24);
  const left = tall
    ? box.x + box.w + 18
    : side
      ? box.x + box.w + 340 < vw
        ? box.x + box.w + 18
        : Math.max(12, box.x - 338)
      : Math.max(12, Math.min(vw - width - 12, box.x + Math.min(box.w / 2, 240) - 160));
  const next = () => {
    let n = i + 1;
    while (n < steps.length && !document.querySelector(steps[n]!.sel)) n++;
    if (n < steps.length) setI(n);
    else end();
  };
  return createPortal(
    <>
      <span
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: box.x - 6,
          top: box.y - 6,
          width: box.w + 12,
          height: box.h + 12,
          borderRadius: 30,
          pointerEvents: 'none',
          zIndex: 2590,
          boxShadow: `0 0 0 2px ${tone}, 0 0 0 9999px rgba(11,14,24,.28)`,
          transition: 'all .4s var(--ease-portal)',
        }}
      />
      <div
        ref={card}
        role="dialog"
        data-weo-tour="1"
        aria-label={step.title}
        style={{
          position: 'fixed',
          left,
          top,
          zIndex: 2595,
          width,
          boxSizing: 'border-box',
          padding: '14px 16px 14px',
          borderRadius: 22,
          background: 'var(--surface)',
          boxShadow: 'var(--shadow-pop), inset 0 0 0 1px var(--border)',
          animation: 'weo-cardin .4s var(--ease-portal) both',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            aria-hidden="true"
            style={{
              width: 34,
              height: 34,
              flex: '0 0 auto',
              borderRadius: '50%',
              background: "url('/mya/mya-face.png') center/cover, var(--surface-2)",
              boxShadow: `0 0 0 2px var(--surface), 0 0 0 3.5px ${tone}`,
            }}
          />
          <span style={{ minWidth: 0, flex: 1 }}>
            <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--text)' }}>
              Mya
            </span>
            <span
              style={{
                display: 'block',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '.15em',
                textTransform: 'uppercase',
                color: tone,
              }}
            >
              Showing you around · {i + 1} of {steps.length}
            </span>
          </span>
        </span>
        <h4 style={{ margin: '10px 0 0', fontSize: 15.5, color: 'var(--text)' }}>{step.title}</h4>
        <p style={{ margin: '6px 0 0', fontSize: 13, lineHeight: 1.5, color: 'var(--text-dim)' }}>
          {step.body}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14 }}>
          <button
            onClick={end}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              font: 'inherit',
              fontSize: 12.5,
              fontWeight: 600,
              color: 'var(--text-dim)',
              padding: '6px 10px',
              borderRadius: 999,
            }}
          >
            Skip
          </button>
          <span style={{ flex: 1 }} />
          <button
            onClick={next}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              border: 'none',
              cursor: 'pointer',
              borderRadius: 999,
              minHeight: 38,
              padding: '0 16px',
              font: 'inherit',
              fontSize: 13,
              fontWeight: 700,
              color: '#fff',
              background: tone,
            }}
          >
            {i + 1 < steps.length ? 'Next' : 'Got it'}
            {svg(<polyline points="9 6 15 12 9 18" />, 13, 'currentColor', 2.4)}
          </button>
        </div>
      </div>
    </>,
    document.body,
  );
}

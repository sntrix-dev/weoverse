// design: js/ds/_ds_bundle.js components/core/OPortal.jsx — converted from the compiled bundle (scripts/ds2tsx.mjs), then typed by hand.
import { useEffect, useRef, useState } from 'react';
import type {
  CSSProperties,
  HTMLAttributes,
  MouseEvent as ReactMouseEvent,
  ReactNode,
  TouchEvent as ReactTouchEvent,
} from 'react';

export type PortalEdge = 'top' | 'right' | 'bottom' | 'left';
export type PortalDirection = PortalEdge | 'center';
export type PortalPhase = 'rest' | 'interest' | 'intent' | 'passage' | 'arrival';

export interface PortalSection {
  key: string;
  label: string;
  color: string;
  icon: ReactNode;
}

export interface OPortalProps extends Omit<HTMLAttributes<HTMLDivElement>, 'style'> {
  size?: number;
  sections?: Record<PortalEdge, PortalSection>;
  logoSrc?: string;
  logoVideoSrc?: string;
  onNavigate?: (key: string, section: PortalSection) => void;
  onCenter?: () => void;
  onStateChange?: (phase: PortalPhase, detail?: { key: string }) => void;
  onEvent?: (event: string, detail?: { key: string }) => void;
  /** section key the parent just landed on — plays the arrival ripple */
  arrivalKey?: PortalEdge | null;
  showCaption?: boolean;
  style?: CSSProperties;
}

/**
 * Canonical section-icon set — ONE source of truth so every quadrant reads the
 * same across every consumer (app, web, cards). All are pure white strokes
 * (no fills) so they render identically reversed on the color-coded orb.
 *   top = Discover (overlapping lens) · right = Collection (concentric target)
 *   bottom = Create (plus) · left = Listed (three-orb shelf)
 */
export const O_SECTION_ICONS: Record<PortalEdge, ReactNode> = {
  top: (
    <>
      <circle cx="9.3" cy="12" r="5" />
      <circle cx="14.7" cy="12" r="5" />
    </>
  ),
  right: (
    <>
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="2.6" />
    </>
  ),
  bottom: (
    <>
      <circle cx="12" cy="12" r="8" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </>
  ),
  left: (
    <>
      <circle cx="9" cy="9.5" r="3.1" />
      <circle cx="15.5" cy="9.5" r="3.1" />
      <circle cx="12.25" cy="15.5" r="3.1" />
    </>
  ),
};
const DEFAULT_SECTIONS: Record<PortalEdge, PortalSection> = {
  top: {
    key: 'top',
    label: 'Discover',
    color: '#3A95F2',
    icon: O_SECTION_ICONS.top,
  },
  right: {
    key: 'right',
    label: 'Collections',
    color: '#D946EF',
    icon: O_SECTION_ICONS.right,
  },
  bottom: {
    key: 'bottom',
    label: 'Create',
    color: '#22C55E',
    icon: O_SECTION_ICONS.bottom,
  },
  left: {
    key: 'left',
    label: 'Listed',
    color: '#F7C62B',
    icon: O_SECTION_ICONS.left,
  },
};

/**
 * OPortal — the O toggle. A single donut-shaped control whose four edges are
 * live hover targets, each carrying a section color (top=Discover/blue,
 * right=Collect/violet, bottom=Create/green, left=List-Earn/gold). Those are the
 * canonical edge labels; WeOverse and WeOnomics are ecosystem PROPERTIES that
 * inherit those edges' colours, not the edges' names. The
 * center is a separate "media" hole (the WeO mark). Hovering a quadrant
 * tints that edge; clicking one calls onNavigate(key). Hovering/clicking the
 * center calls onCenter() instead — center and edges are different actions.
 */
export function OPortal({
  size = 280,
  sections = DEFAULT_SECTIONS,
  logoSrc = '/brand/weo-logo-light.png', // design default 'assets/weo-logo-dark.png' does not exist in the design assets
  logoVideoSrc,
  onNavigate,
  onCenter,
  onStateChange,
  onEvent,
  arrivalKey,
  showCaption = true,
  style,
  ...rest
}: OPortalProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);
  const [direction, setDirection] = useState<PortalDirection>('center');
  const [look, setLook] = useState<{
    active: boolean;
    rx: number;
    ry: number;
    ix: number;
    iy: number;
    dir: PortalDirection;
  }>({
    active: false,
    rx: 0,
    ry: 0,
    ix: 0,
    iy: 0,
    dir: 'center',
  });
  const [videoOk, setVideoOk] = useState(false);
  const [jump, setJump] = useState<{ color: string | undefined; id: number } | null>(null); // { color, id } while the jump-burst plays
  const [arrival, setArrival] = useState<{ color: string; id: number } | null>(null); // { color, id } arrival-inheritance ripple

  // Reduced-motion: honor the OS setting (protocol §4 — reduced-motion equivalent required).
  const reduceMotion =
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  // ---- formal state machine (protocol §4): rest → interest → intent → passage → arrival ----
  const stateRef = useRef<PortalPhase>('rest');
  const emit = (evt: string, detail?: { key: string }) => {
    if (onEvent) onEvent(evt, detail);
  };
  const setPhase = (phase: PortalPhase, detail?: { key: string }) => {
    if (stateRef.current === phase) return;
    stateRef.current = phase;
    if (onStateChange) onStateChange(phase, detail);
    if (phase === 'interest') emit('o_interest', detail);
    else if (phase === 'intent') emit('o_preview', detail);
    else if (phase === 'passage') emit('o_passage', detail);
  };
  const RING_COUNT = 5;

  // arrival: when the parent reports the landed section, inherit its signal (protocol §4 arrival).
  useEffect(() => {
    if (!arrivalKey || !sections[arrivalKey]) return;
    setArrival({
      color: sections[arrivalKey].color,
      id: Date.now(),
    });
    setPhase('arrival', {
      key: arrivalKey,
    });
    emit('portal_complete', {
      key: arrivalKey,
    });
    const t = window.setTimeout(
      () => {
        setArrival(null);
        stateRef.current = 'rest';
      },
      reduceMotion ? 300 : 900,
    );
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arrivalKey]);
  const measure = (clientX: number, clientY: number) => {
    const el = ref.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return {
      rect,
      dx,
      dy,
      dist,
    };
  };
  const computeDirection = (clientX: number, clientY: number): PortalDirection => {
    const m = measure(clientX, clientY);
    if (!m) return 'center';
    const threshold = m.rect.width * 0.36;
    if (m.dist < threshold) return 'center';
    return Math.abs(m.dx) > Math.abs(m.dy) ? (m.dx > 0 ? 'right' : 'left') : m.dy > 0 ? 'bottom' : 'top';
  };

  // "Look animation" — a liquid-eye effect: even before the pointer directly
  // hovers, the whole O tilts/gazes toward the cursor within a proximity
  // range, exactly like the source portal's ambient direction detection.
  useEffect(() => {
    const LOOK_RANGE = 380;
    const onMove = (e: MouseEvent) => {
      if (window.__weoTouch) return; // touch-sim: no cursor-proximity gaze on a phone
      if (hover) return; // direct hover takes over below
      const m = measure(e.clientX, e.clientY);
      if (!m) return;
      if (m.dist < LOOK_RANGE) {
        const norm = Math.min(m.dist / LOOK_RANGE, 1);
        // Dramatic gaze — the whole O leans hard toward the cursor.
        const rx = Math.max(-18, Math.min(18, (-m.dy / LOOK_RANGE) * 20));
        const ry = Math.max(-18, Math.min(18, (m.dx / LOOK_RANGE) * 20));
        const ix = Math.max(-20, Math.min(20, (m.dx / LOOK_RANGE) * 22 * norm));
        const iy = Math.max(-20, Math.min(20, (m.dy / LOOK_RANGE) * 22 * norm));
        setLook({
          active: true,
          rx,
          ry,
          ix,
          iy,
          dir: computeDirection(e.clientX, e.clientY),
        });
      } else if (look.active) {
        setLook({
          active: false,
          rx: 0,
          ry: 0,
          ix: 0,
          iy: 0,
          dir: 'center',
        });
      }
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [hover, look.active]);
  const handleMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    const d = computeDirection(e.clientX, e.clientY);
    setDirection(d);
    setPhase(d === 'center' ? 'interest' : 'intent', {
      key: d,
    });
  };
  const handleTouch = (e: ReactTouchEvent<HTMLDivElement>) => {
    const t = e.touches[0];
    if (t) {
      setHover(true);
      const d = computeDirection(t.clientX, t.clientY);
      setDirection(d);
      setPhase(d === 'center' ? 'interest' : 'intent', {
        key: d,
      });
    }
  };
  const handleClick = () => {
    // Signature portal JUMP — passage state; burst of concentric section rings.
    const jumpColor = direction === 'center' ? '#8fb8f6' : sections[direction]?.color;
    setPhase('passage', {
      key: direction,
    });
    if (!reduceMotion) {
      setJump({
        color: jumpColor,
        id: Date.now(),
      });
      window.setTimeout(() => setJump(null), 900);
    }
    if (direction === 'center') {
      onCenter?.();
      return;
    }
    const s = sections[direction];
    if (s && onNavigate) onNavigate(s.key, s);
  };
  const edgeSection = (d: PortalDirection) => (d === 'center' ? undefined : sections[d]);
  const active = hover ? edgeSection(direction) : look.active ? edgeSection(look.dir) : null;
  const activeColor = active ? active.color : null;
  const edgePos: Record<string, string> = {
    top: '50% 0%',
    right: '100% 50%',
    bottom: '50% 100%',
    left: '0% 50%',
  };
  // Angular centre (deg, clockwise from 12 o'clock) of each quadrant, so the
  // ring tint is confined to that quadrant's arc rather than the whole donut.
  const quadAngle: Record<string, number> = {
    top: 0,
    right: 90,
    bottom: 180,
    left: 270,
    center: 0,
  };
  const gazeDir = hover ? direction : look.dir;
  const centerHover = hover && direction === 'center';
  // Hard-stop donut mask (helloweo geometry): 36% hole, expands to 42% on
  // center-hover so the media well blooms open like an aperture.
  const holeR = centerHover ? 42 : 36;
  const donutMask = `radial-gradient(circle at 50% 50%, transparent ${holeR}%, black ${holeR + 0.001}%, black 100%)`;

  // orb → outer-ring motion: the whole disc tilts/translates toward the
  // cursor (gaze), and scales up very slightly on direct hover — the ring
  // stays put while the "eye" underneath it leans and looks.
  const tiltX = hover ? 0 : look.rx;
  const tiltY = hover ? 0 : look.ry;
  // The media well stays concentric — only the donut around it leans toward the
  // cursor. The mark inside the aperture is never pushed off centre.
  const irisX = 0;
  const irisY = 0;
  // The destination preview only takes the aperture over on DIRECT hover of an
  // edge; ambient gaze tints the ring alone, so the living mark stays full
  // fidelity at rest.
  const takeover = hover && direction !== 'center' && activeColor;
  return (
    <div
      ref={ref}
      role="button"
      aria-label="O portal — hover an edge to preview a section, tap to jump"
      onMouseEnter={() => {
        setHover(true);
        setPhase('interest');
      }}
      onMouseLeave={() => {
        setHover(false);
        setDirection('center');
        setPhase('rest');
      }}
      onMouseMove={handleMove}
      onTouchStart={handleTouch}
      onTouchMove={handleTouch}
      onTouchEnd={() => {
        setHover(false);
        setDirection('center');
      }}
      onClick={handleClick}
      style={{
        position: 'relative',
        width: size,
        height: size,
        cursor: 'pointer',
        flex: 'none',
        perspective: 700,
        ...style,
      }}
      {...rest}
    >
      <div
        style={{
          position: 'absolute',
          inset: '-6%',
          borderRadius: '50%',
          background:
            'radial-gradient(ellipse 70% 60% at 50% 55%, transparent 40%, rgba(0,0,0,.14) 55%, transparent 80%)',
          filter: 'blur(10px)',
          zIndex: -1,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: '-34%',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: -1,
          background: activeColor
            ? `radial-gradient(circle at ${edgePos[gazeDir]}, color-mix(in srgb, ${activeColor} 60%, transparent), transparent 56%)`
            : 'none',
          filter: 'blur(34px)',
          opacity: activeColor ? (hover ? 0.6 : 0.34) : 0,
          transition: 'opacity .32s ease-out',
        }}
      />
      {jump &&
        Array.from({
          length: RING_COUNT,
        }).map((_, i) => (
          <div
            key={jump.id + '-' + i}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              border: `2px solid ${jump.color}`,
              boxShadow: `0 0 18px ${jump.color}`,
              zIndex: 6,
              pointerEvents: 'none',
              transform: 'translate(-50%,-50%) scale(.42)',
              opacity: 0,
              animation: `weo-ring-burst .8s ${(i * 0.06).toFixed(2)}s cubic-bezier(0,0,.2,1) forwards`,
            }}
          />
        ))}
      {arrival && (
        <div
          key={arrival.id}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            border: `2px solid ${arrival.color}`,
            boxShadow: `0 0 26px ${arrival.color}`,
            zIndex: 6,
            pointerEvents: 'none',
            transform: 'translate(-50%,-50%) scale(1.85)',
            opacity: 0,
            animation: reduceMotion ? 'none' : 'weo-portal-wipe-out .85s cubic-bezier(.22,1,.36,1) forwards',
          }}
        />
      )}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          transformStyle: 'preserve-3d',
          transform: `rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(${jump ? 0.9 : hover ? 1.03 : 1})`,
          transition: jump
            ? 'transform .18s cubic-bezier(.4,0,.2,1)'
            : 'transform .25s cubic-bezier(.25,.6,.3,1)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background:
              'radial-gradient(circle at 50% 50%, transparent 36%, rgba(255,255,255,.95) 38.6%, var(--surface) 47%, var(--surface-2) 60%, color-mix(in srgb, var(--surface-2) 74%, #8595b8) 70%, var(--surface-2) 81%, var(--surface-3) 100%)',
            boxShadow: hover ? 'var(--nm-hero)' : 'var(--nm-raised)',
            transition: 'box-shadow .3s',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background:
              'linear-gradient(180deg, rgba(255,255,255,.6) 0%, transparent 40%, transparent 60%, rgba(64,84,132,.24) 100%)',
            WebkitMask: donutMask,
            mask: donutMask,
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: `conic-gradient(from 270deg, ${sections.top.color}2e, ${sections.right.color}2e 90deg, ${sections.bottom.color}2e 180deg, ${sections.left.color}2e 270deg, ${sections.top.color}2e 360deg)`,
            WebkitMask: donutMask,
            mask: donutMask,
            mixBlendMode: 'overlay',
            opacity: hover || look.active ? 1 : 0,
            transition: 'opacity .3s ease-out',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: activeColor
              ? `conic-gradient(from ${(quadAngle[gazeDir] ?? 0) - 60}deg, transparent 0deg, color-mix(in srgb, ${activeColor} 55%, transparent) 40deg, ${activeColor} 60deg, color-mix(in srgb, ${activeColor} 55%, transparent) 80deg, transparent 120deg)`
              : 'none',
            WebkitMask: donutMask,
            mask: donutMask,
            opacity: activeColor ? (hover ? 0.95 : 0.55) : 0,
            transition: 'opacity .25s ease-out',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            boxShadow: 'inset 0 0 0 1px var(--border)',
            WebkitMask: donutMask,
            mask: donutMask,
          }}
        />
        <div
          onClick={(e) => {
            e.stopPropagation();
            const jc = '#8fb8f6';
            setPhase('passage', {
              key: 'center',
            });
            if (!reduceMotion) {
              setJump({
                color: jc,
                id: Date.now(),
              });
              window.setTimeout(() => setJump(null), 900);
            }
            onCenter?.();
          }}
          style={{
            position: 'absolute',
            inset: '26.5%',
            borderRadius: '50%',
            overflow: 'hidden',
            cursor: 'pointer',
            background: 'radial-gradient(circle at 37% 28%, #ffffff, #cfe0fb 42%, #8fb8f6 78%, #5f97ef)',
            boxShadow:
              '0 14px 30px -10px rgba(58,120,240,.5), inset 0 -10px 20px rgba(58,110,230,.35), inset 5px 6px 11px rgba(255,255,255,.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'weo-breathe-sm 5s ease-in-out infinite',
            transform: `translate(${irisX}px, ${irisY}px) scale(${hover && direction === 'center' ? 1.06 : 1})`,
            transition: 'transform .2s ease-out',
          }}
        >
          {logoVideoSrc && (
            <video
              src={logoVideoSrc}
              autoPlay
              loop
              muted
              playsInline
              onCanPlay={() => setVideoOk(true)}
              onError={() => setVideoOk(false)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: videoOk ? 1 : 0,
                position: 'absolute',
                inset: 0,
                zIndex: 1,
                transition: 'opacity .3s',
              }}
            />
          )}
          {logoSrc && (
            <img
              src={logoSrc}
              alt="WeO"
              style={{
                width: '56%',
                filter: 'drop-shadow(0 2px 5px rgba(10,30,80,.4))',
                opacity: videoOk ? 0 : 1,
                transition: 'opacity .3s',
                position: 'relative',
                zIndex: 2,
              }}
            />
          )}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
              zIndex: 2,
              pointerEvents: 'none',
              background: takeover
                ? `radial-gradient(circle at 37% 28%, color-mix(in srgb, #fff 60%, ${activeColor}), ${activeColor} 70%, color-mix(in srgb, ${activeColor} 55%, #000))`
                : 'transparent',
              boxShadow: takeover
                ? `inset 0 -8px 16px color-mix(in srgb, ${activeColor} 60%, #000), inset 4px 5px 10px rgba(255,255,255,.55)`
                : 'none',
              opacity: takeover ? 1 : 0,
              transition: 'opacity .24s ease-out',
            }}
          >
            {takeover && active && active.icon && (
              <svg
                width="42%"
                height="42%"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fff"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,.25))',
                }}
              >
                {active.icon}
              </svg>
            )}
          </div>
        </div>
      </div>
      {showCaption && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: -34,
            transform: 'translateX(-50%)',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '.12em',
            textTransform: 'uppercase',
            color: activeColor || 'var(--text-faint)',
            whiteSpace: 'nowrap',
            transition: 'color .2s',
          }}
        >
          {hover && active
            ? active.label
            : look.active && active
              ? `looking \u00b7 ${active.label}`
              : typeof window !== 'undefined' && window.__weoTouch
                ? 'Press an edge to preview \u00b7 tap to jump'
                : 'Move nearby to look \u00b7 hover an edge \u00b7 tap to jump'}
        </div>
      )}
    </div>
  );
}

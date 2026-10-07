// design: js/ds/_ds_bundle.js components/navigation/RingNav.jsx — converted from the compiled bundle (scripts/ds2tsx.mjs), then typed by hand.
import { useEffect, useState } from 'react';
import type { CSSProperties, KeyboardEvent, MouseEvent, ReactNode } from 'react';
import { createPortal } from 'react-dom';

export interface RingNavItem {
  key: string;
  label: ReactNode;
  color?: string;
  icon?: ReactNode;
  destructive?: boolean;
}

export interface RingNavProps {
  items?: RingNavItem[];
  /** active item key */
  active?: string | null;
  onSelect?: (key: string) => void;
  /** the center O */
  onHome?: () => void;
  /** mobile = larger targets, tap-only, docked in place */
  device?: 'desktop' | 'mobile';
  homeLabel?: ReactNode;
  style?: CSSProperties;
}

// annular-sector path (screen coords, y-down). Angles in degrees.
function sector(cx: number, cy: number, ri: number, ro: number, a0: number, a1: number) {
  const P = (r: number, a: number): [number, number] => [
    cx + r * Math.cos((a * Math.PI) / 180),
    cy + r * Math.sin((a * Math.PI) / 180),
  ];
  const [x0o, y0o] = P(ro, a0),
    [x1o, y1o] = P(ro, a1),
    [x1i, y1i] = P(ri, a1),
    [x0i, y0i] = P(ri, a0);
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  return `M${x0o},${y0o} A${ro},${ro} 0 ${large} 1 ${x1o},${y1o} L${x1i},${y1i} A${ri},${ri} 0 ${large} 0 ${x0i},${y0i} Z`;
}

/**
 * RingNav — the universal floating O nav. A COMPLETE, soft-edged translucent
 * donut ring with the O in an inset well (an O-toggle echo). The center O is the
 * PORTAL/home trigger (never the fan toggle); revealing the item fan is a
 * separate managed gesture — a ▲ handle (tap) plus hover on desktop. Items rest
 * on neutral surfaces and take their color only on hover/active, flowing into one
 * another over a continuous gradient band. Docks bottom-centre so ~half peeks in.
 *
 * One component drives every floating nav in the system — section switches AND
 * in-section lens/view fans — so the language is identical everywhere.
 */
export function RingNav({
  items = [],
  // [{ key, label, color, icon, destructive }]
  active,
  // active item key
  onSelect,
  // (key) => void
  onHome,
  // () => void  — the center O
  device = 'desktop',
  // 'desktop' | 'mobile' — mobile = larger targets, tap-only
  homeLabel = 'O = home',
  style,
}: RingNavProps) {
  const [open, setOpen] = useState(false);
  const [hoverSeg, setHoverSeg] = useState<string | null>(null);
  const [home, setHome] = useState(false);
  const [focusIdx, setFocusIdx] = useState(-1); // keyboard roving focus
  const [confirmKey, setConfirmKey] = useState<string | null>(null); // destructive 2nd-confirm
  const [seenLabels, setSeenLabels] = useState(false); // labels-on-first-use
  const isMobile = device === 'mobile';
  // Protocol §5: the fan is the FEW next actions — hard cap at 7.
  items = items.slice(0, 7);
  const act: Partial<RingNavItem> = items.find((s) => s.key === active) ?? items[0] ?? {};

  // On first reveal, show every label once (icon + label on first use); after
  // the user has seen them, labels return to hover/focus-only to reduce debris.
  useEffect(() => {
    if (open && !seenLabels) {
      const t = setTimeout(() => setSeenLabels(true), 2600);
      return () => clearTimeout(t);
    }
  }, [open, seenLabels]);

  // A destructive item requires a SECOND explicit confirmation (protocol §5).
  const choose = (key: string) => {
    const it = items.find((s) => s.key === key);
    if (it && it.destructive && confirmKey !== key) {
      setConfirmKey(key);
      return;
    }
    setConfirmKey(null);
    if (onSelect) onSelect(key);
    setOpen(false);
  };
  const ob = isMobile ? 60 : 64;
  const ri = isMobile ? 58 : 72;
  const ro = isMobile ? 140 : 178;
  const D = ro * 2,
    cx = ro,
    cy = ro,
    rMid = (ri + ro) / 2;
  const n = items.length || 1;
  // The fan is a COMPLETE circle centred on the O — never a chord-cut half-moon.
  // Items fan across a generous arc centred on top (270°); the ring surface &
  // colour band are full 360° so the sides melt into the ring instead of ending
  // in an abrupt edge. The lower arc simply runs off the bottom of the viewport.
  const SPREAD = Math.min(232, Math.max(184, n * 46));
  const A0 = 270 - SPREAD / 2,
    step = SPREAD / n;
  // dock so the O sits a fixed gap above the bottom edge; the circle's lower
  // sliver hangs off-canvas (we render the full circle, just don't see all of it).
  const dock = isMobile ? -(ro - 74) : -(ro - 92);
  const goHome = (e?: MouseEvent) => {
    if (e) e.stopPropagation();
    setOpen(false);
    setHome(true);
    if (onHome) onHome();
    setTimeout(() => setHome(false), 650);
  };

  // Portal the overlay to <body> on desktop so a transformed ancestor (scroll
  // parallax, scaled stages) can never clip it — the fan then uses the WHOLE
  // canvas as a lightbox. Mobile stays docked inside its phone frame.
  const portal = !isMobile && typeof document !== 'undefined';
  const inner = (
    <>
      <ul
        role="menu"
        aria-label="Navigation options"
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: 'hidden',
          clip: 'rect(0 0 0 0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      >
        <li role="none">
          <button role="menuitem" onClick={goHome}>
            Return home — the O toggle
          </button>
        </li>
        {items.map((s) => (
          <li role="none" key={s.key}>
            <button
              role="menuitem"
              aria-current={s.key === active ? 'true' : undefined}
              onClick={() => choose(s.key)}
            >
              {typeof s.label === 'string' ? s.label : s.key}
              {s.destructive ? ' (needs confirm)' : ''}
            </button>
          </li>
        ))}
      </ul>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: D,
          height: D,
          borderRadius: '50%',
          background: 'var(--glass)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          boxShadow: 'var(--nm-sm)',
          border: '1px solid var(--border)',
          transformOrigin: 'center center',
          transform: `scale(${open ? 1 : 0.4})`,
          opacity: open ? 1 : 0,
          transition: 'transform .42s cubic-bezier(.34,1.3,.5,1), opacity .3s',
        }}
      />
      <svg
        width={D}
        height={D}
        viewBox={`0 0 ${D} ${D}`}
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'visible',
          pointerEvents: open ? 'auto' : 'none',
        }}
      >
        <defs>
          <linearGradient id="rn-flow" x1="0" y1="0" x2="1" y2="0">
            {items.map((s, i) => (
              <stop key={s.key} offset={`${(i / Math.max(1, n - 1)) * 100}%`} stopColor={s.color} />
            ))}
          </linearGradient>
        </defs>
        <circle
          cx={cx}
          cy={cy}
          r={rMid}
          fill="none"
          stroke="url(#rn-flow)"
          strokeWidth={Math.max(10, ro - ri - 8)}
          style={{
            opacity: open ? 0.15 : 0,
            transition: 'opacity .4s',
          }}
        />
        {items.map((s, i) => {
          const a0 = A0 + step * i,
            a1 = a0 + step,
            on = s.key === active,
            hv = hoverSeg === s.key;
          return (
            <path
              key={s.key}
              d={sector(cx, cy, ri + 4, ro - 4, a0 + 0.5, a1 - 0.5)}
              fill={
                on
                  ? s.color
                  : hv
                    ? `color-mix(in srgb, ${s.color} 50%, var(--surface))`
                    : confirmKey === s.key
                      ? 'color-mix(in srgb, var(--zone-low) 55%, var(--surface))'
                      : 'transparent'
              }
              onClick={() => choose(s.key)}
              onMouseEnter={() => setHoverSeg(s.key)}
              onMouseLeave={() => setHoverSeg(null)}
              style={{
                cursor: 'pointer',
                opacity: open ? 1 : 0,
                transition: `opacity .3s ${0.05 * i}s, fill .25s`,
                filter:
                  on || hv
                    ? `drop-shadow(0 4px 10px color-mix(in srgb, ${s.color} 45%, transparent))`
                    : 'none',
              }}
            >
              <title>{s.label}</title>
            </path>
          );
        })}
        {open &&
          items.slice(1).map((_s, i) => {
            const a = ((A0 + step * (i + 1)) * Math.PI) / 180;
            return (
              <line
                key={i}
                x1={cx + (ri + 8) * Math.cos(a)}
                y1={cy + (ri + 8) * Math.sin(a)}
                x2={cx + (ro - 8) * Math.cos(a)}
                y2={cy + (ro - 8) * Math.sin(a)}
                stroke="var(--border)"
                strokeWidth="1"
                opacity="0.4"
              />
            );
          })}
      </svg>
      {items.map((s, i) => {
        const mid = A0 + step * i + step / 2;
        const x = cx + rMid * Math.cos((mid * Math.PI) / 180);
        const y = cy + rMid * Math.sin((mid * Math.PI) / 180);
        const on = s.key === active,
          hv = hoverSeg === s.key;
        return (
          // the visible fan is the pointer surface; keyboard and screen readers use the
          // menubar's arrow keys and the menu above, so the segment itself is presentational
          <div
            key={s.key}
            role="presentation"
            onClick={() => choose(s.key)}
            onMouseEnter={() => setHoverSeg(s.key)}
            onMouseLeave={() => setHoverSeg(null)}
            title={typeof s.label === 'string' ? s.label : s.key}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              transform: 'translate(-50%,-50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              cursor: 'pointer',
              opacity: open ? 1 : 0,
              transition: `opacity .3s ${0.05 * i}s`,
              pointerEvents: open ? 'auto' : 'none',
            }}
          >
            <svg
              width={isMobile ? 22 : 19}
              height={isMobile ? 22 : 19}
              viewBox="0 0 24 24"
              fill="none"
              stroke={on ? '#fff' : hv ? s.color : focusIdx === i ? s.color : 'var(--text-dim)'}
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transition: 'stroke .2s',
                filter: focusIdx === i ? `drop-shadow(0 0 4px ${s.color})` : 'none',
              }}
            >
              {s.icon}
            </svg>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: isMobile ? 8.5 : 7.5,
                letterSpacing: '.06em',
                textTransform: 'uppercase',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                color: on ? '#fff' : hv ? s.color : 'var(--text-dim)',
                opacity: hv || on || focusIdx === i || !seenLabels ? 1 : 0,
                transition: 'color .2s, opacity .2s',
              }}
            >
              {confirmKey === s.key ? 'Tap again · confirm' : s.label}
            </span>
          </div>
        );
      })}
      {home && (
        <span
          style={{
            position: 'absolute',
            left: cx,
            top: cy,
            width: ob,
            height: ob,
            marginLeft: -ob / 2,
            marginTop: -ob / 2,
            borderRadius: '50%',
            border: `2px solid ${act.color || '#3A95F2'}`,
            zIndex: 4,
            animation: 'weo-ping .65s ease-out 1',
            pointerEvents: 'none',
          }}
        />
      )}
      <button
        onClick={goHome}
        aria-label="Return to the O toggle — home"
        style={{
          position: 'absolute',
          left: cx,
          top: cy,
          width: ob,
          height: ob,
          marginLeft: -ob / 2,
          marginTop: -ob / 2,
          borderRadius: '50%',
          border: '1px solid var(--border)',
          cursor: 'pointer',
          zIndex: 5,
          background: 'linear-gradient(145deg, var(--surface), var(--surface-2))',
          boxShadow: `var(--nm-raised)${open ? `, 0 0 0 2px color-mix(in srgb, ${act.color || '#3A95F2'} 45%, transparent)` : ''}`,
          display: 'grid',
          placeItems: 'center',
          transition: 'box-shadow .3s',
        }}
      >
        <svg
          width={ob * 0.42}
          height={ob * 0.42}
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--text-dim)"
          strokeWidth="1.7"
        >
          <circle cx="12" cy="12" r="8.5" />
          <circle cx="12" cy="12" r="2.6" />
        </svg>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        aria-label={open ? 'Hide sections' : 'Show sections'}
        style={{
          position: 'absolute',
          left: cx,
          top: cy - ob / 2 - 13,
          transform: 'translate(-50%,-50%)',
          width: 36,
          height: 20,
          borderRadius: 999,
          border: '1px solid var(--border)',
          background: 'var(--glass)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          boxShadow: 'var(--nm-sm)',
          cursor: 'pointer',
          zIndex: 6,
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--text-dim)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: `rotate(${open ? 180 : 0}deg)`,
            transition: 'transform .35s',
          }}
        >
          <path d="M6 15l6-6 6 6" />
        </svg>
      </button>
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: cy + ob / 2 + 6,
          transform: 'translateX(-50%)',
          fontFamily: 'var(--font-mono)',
          fontSize: 8,
          letterSpacing: '.1em',
          textTransform: 'uppercase',
          color: 'var(--text-faint)',
          whiteSpace: 'nowrap',
          textAlign: 'center',
          opacity: open ? 0 : 1,
          transition: 'opacity .3s',
        }}
      >
        {isMobile ? 'Tap ▲' : 'Hover'}
        <br />
        {homeLabel}
      </div>
    </>
  );
  const scrim = (
    <div
      role="presentation"
      onClick={() => setOpen(false)}
      style={{
        position: portal ? 'absolute' : 'fixed',
        inset: 0,
        zIndex: 0,
        background: isMobile ? 'rgba(12,18,38,.32)' : 'rgba(12,18,38,.28)',
        backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
        opacity: open ? 1 : 0,
        pointerEvents: open ? 'auto' : 'none',
        transition: 'opacity .3s',
      }}
    />
  );
  const onKeyNav = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === 'Escape') {
      setOpen(false);
      setConfirmKey(null);
      return;
    }
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusIdx((i) => (i + 1) % items.length);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusIdx((i) => (i - 1 + items.length) % items.length);
    } else if ((e.key === 'Enter' || e.key === ' ') && focusIdx >= 0) {
      e.preventDefault();
      const it = items[focusIdx];
      if (it) choose(it.key);
    }
  };
  if (portal) {
    return createPortal(
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 2000,
          pointerEvents: 'none',
        }}
      >
        {scrim}
        <div
          style={{
            position: 'absolute',
            bottom: dock,
            left: '50%',
            marginLeft: -D / 2,
            width: D,
            height: D,
            pointerEvents: 'auto',
            ...style,
          }}
          tabIndex={0}
          role="menubar"
          aria-label="Floating O navigation"
          onKeyDown={onKeyNav}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => {
            setOpen(false);
            setConfirmKey(null);
          }}
        >
          {inner}
        </div>
      </div>,
      document.body,
    );
  }
  return (
    <div
      style={{
        position: 'absolute',
        bottom: dock,
        left: '50%',
        marginLeft: -D / 2,
        width: D,
        height: D,
        zIndex: 50,
        ...style,
      }}
      tabIndex={0}
      role="menubar"
      aria-label="Floating O navigation"
      onKeyDown={onKeyNav}
      onMouseEnter={isMobile ? undefined : () => setOpen(true)}
      onMouseLeave={
        isMobile
          ? undefined
          : () => {
              setOpen(false);
              setConfirmKey(null);
            }
      }
    >
      {scrim}
      {inner}
    </div>
  );
}

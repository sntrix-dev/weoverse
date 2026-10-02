// design: create.jsx OrbSlider, FloatMod
import { Children, useEffect, useRef, useState, type ReactNode } from 'react';
import { svg } from '@/design-system';

/**
 * A row of orbs that never clips: it scrolls sideways (drag, wheel or trackpad), snaps orb to
 * orb, and shows a round arrow at whichever end has more to see.
 */
export function OrbSlider({
  children,
  label,
  step = 104,
}: {
  children: ReactNode;
  label: string;
  step?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [ends, setEnds] = useState({ l: false, r: false });
  const read = () => {
    const el = ref.current;
    if (!el) return;
    setEnds({ l: el.scrollLeft > 2, r: el.scrollLeft + el.clientWidth < el.scrollWidth - 2 });
  };
  useEffect(() => {
    read();
    const el = ref.current;
    if (!el || typeof ResizeObserver !== 'function') return;
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const by = (dir: number) => ref.current?.scrollBy({ left: dir * step, behavior: 'smooth' });
  const arrow = (dir: number) => (
    <button
      type="button"
      onClick={() => by(dir)}
      aria-label={dir < 0 ? 'Scroll back' : 'Scroll for more'}
      style={{
        position: 'absolute',
        top: '50%',
        [dir < 0 ? 'left' : 'right']: -4,
        transform: 'translateY(-50%)',
        zIndex: 2,
        display: 'grid',
        placeItems: 'center',
        width: 26,
        height: 26,
        padding: 0,
        border: 'none',
        borderRadius: '50%',
        cursor: 'pointer',
        color: 'var(--text-dim)',
        background: 'var(--surface)',
        boxShadow: 'var(--nm-sm)',
      }}
    >
      {svg(
        dir < 0 ? <polyline points="14.5 6 8.5 12 14.5 18" /> : <polyline points="9.5 6 15.5 12 9.5 18" />,
        13,
        'currentColor',
        2,
      )}
    </button>
  );
  const fade = `linear-gradient(90deg, ${ends.l ? 'transparent 0, #000 22px' : '#000 0'}, ${ends.r ? '#000 calc(100% - 22px), transparent 100%' : '#000 100%'})`;
  return (
    <div
      role="group"
      aria-label={label}
      style={{ position: 'relative', display: 'block', width: '100%', maxWidth: '100%', minWidth: 0 }}
    >
      <div
        ref={ref}
        onScroll={read}
        onWheel={(e) => {
          const el = ref.current;
          if (el && Math.abs(e.deltaY) > Math.abs(e.deltaX) && el.scrollWidth > el.clientWidth)
            el.scrollLeft += e.deltaY;
        }}
        className="weo-scroll-hide"
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          overscrollBehaviorX: 'contain',
          scrollSnapType: 'x mandatory',
          padding: '3px 2px',
          WebkitMaskImage: fade,
          maskImage: fade,
        }}
      >
        {Children.map(children, (c) => (
          <span style={{ flex: '0 0 auto', scrollSnapAlign: 'start', display: 'inline-flex' }}>{c}</span>
        ))}
      </div>
      {ends.l && arrow(-1)}
      {ends.r && arrow(1)}
    </div>
  );
}

/**
 * A floating module: a glass pill with an icon and one label at rest; on approach it takes its
 * tone, opens to one line and one action. Press to pin it open. Nothing is explained at rest.
 */
export function FloatMod({
  icon,
  label,
  value,
  tone,
  body,
  cta,
  onCta,
  children,
  open: forced,
  onOpen,
}: {
  icon: ReactNode;
  label: string;
  value?: string | null;
  tone: string;
  body?: ReactNode;
  cta?: string | null;
  onCta?: () => void;
  children?: ReactNode;
  open?: boolean;
  onOpen?: () => void;
}) {
  const [hov, setHov] = useState(false);
  const [pin, setPin] = useState(false);
  const open = hov || pin || !!forced;
  const toggle = () => (onOpen ? onOpen() : setPin((p) => !p));
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        borderRadius: 26,
        overflow: 'hidden',
        background: open ? 'var(--surface)' : 'color-mix(in srgb, var(--surface) 55%, transparent)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        boxShadow: open
          ? `var(--nm-raised), inset 0 0 0 1px color-mix(in srgb, ${tone} 34%, var(--border))`
          : 'inset 0 0 0 1px var(--glass-brd)',
        transform: open ? 'translateY(-2px)' : 'none',
        transition: 'background .26s, box-shadow .3s, transform .3s var(--ease-portal)',
      }}
    >
      <button
        type="button"
        onClick={toggle}
        onFocus={() => setHov(true)}
        onBlur={() => setHov(false)}
        aria-expanded={open}
        aria-label={(pin ? 'Unpin ' : 'Open ') + label}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          width: '100%',
          padding: '11px 14px',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          font: 'inherit',
          textAlign: 'left',
        }}
      >
        <span
          style={{
            display: 'grid',
            placeItems: 'center',
            width: 34,
            height: 34,
            flex: '0 0 auto',
            borderRadius: 999,
            color: open ? '#fff' : 'var(--text-dim)',
            background: open ? tone : 'var(--surface-2)',
            boxShadow: open ? 'none' : 'var(--nm-inset)',
            transition: 'background .26s, color .24s',
          }}
        >
          {svg(icon, 17, 'currentColor', 1.7)}
        </span>
        <span style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '-.01em',
              color: 'var(--text)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </span>
          {value != null && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: open ? tone : 'var(--text-faint)',
                fontVariantNumeric: 'tabular-nums',
                transition: 'color .24s',
              }}
            >
              {value}
            </span>
          )}
        </span>
        {/* CRE-02: a disclosure chevron, not a "+" — it says open/closed and nothing it cannot do */}
        <span
          aria-hidden="true"
          style={{
            display: 'grid',
            placeItems: 'center',
            width: 22,
            height: 22,
            borderRadius: 999,
            color: pin ? tone : 'var(--text-faint)',
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform .3s var(--ease-portal), color .24s',
          }}
        >
          {svg(<polyline points="6 9.5 12 15.5 18 9.5" />, 12, 'currentColor', 2.2)}
        </span>
      </button>
      {open && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            padding: '0 14px 14px 60px',
            animation: 'weo-cardin .28s var(--ease-portal) both',
          }}
        >
          {children}
          {body && <span style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--text-dim)' }}>{body}</span>}
          {cta && (
            <button
              type="button"
              onClick={onCta}
              style={{
                alignSelf: 'flex-start',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                border: 'none',
                cursor: 'pointer',
                borderRadius: 999,
                padding: '8px 13px',
                font: 'inherit',
                fontSize: 11.5,
                fontWeight: 700,
                color: '#fff',
                background: tone,
                boxShadow: `0 8px 18px -8px ${tone}`,
              }}
            >
              {cta}
              {svg(<polyline points="9 6 15 12 9 18" />, 12, 'currentColor', 2.4)}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

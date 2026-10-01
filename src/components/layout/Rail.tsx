import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Button, svg } from '@/design-system';

/**
 * design: discover.jsx Rail — a scroller that says so: one step forward, one step back, shown
 * only on the side that still has records left. Wheel and drag still work.
 */
export function Rail({ w = 260, children }: { w?: number; children?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState({ s: false, e: false });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => {
      const max = el.scrollWidth - el.clientWidth;
      setAt({ s: el.scrollLeft > 8, e: el.scrollLeft < max - 8 });
    };
    read();
    el.addEventListener('scroll', read, { passive: true });
    window.addEventListener('resize', read);
    return () => {
      el.removeEventListener('scroll', read);
      window.removeEventListener('resize', read);
    };
  }, [children]);
  const step = (d: number) => ref.current?.scrollBy({ left: d * (w + 14) * 2, behavior: 'smooth' });
  const arrow = (side: 'left' | 'right', on: boolean, icon: ReactNode) => (
    <button
      type="button"
      onClick={() => step(side === 'left' ? -1 : 1)}
      aria-label={side === 'left' ? 'Back' : 'Forward'}
      tabIndex={on ? 0 : -1}
      style={{
        position: 'absolute',
        top: '50%',
        [side]: 0,
        transform: 'translateY(-50%)',
        zIndex: 6,
        width: 40,
        height: 40,
        borderRadius: '50%',
        border: 'none',
        display: 'grid',
        placeItems: 'center',
        cursor: 'pointer',
        color: 'var(--text)',
        background: 'var(--glass)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        boxShadow: 'var(--nm-raised), inset 0 0 0 1px var(--glass-brd)',
        opacity: on ? 1 : 0,
        pointerEvents: on ? 'auto' : 'none',
        transition: 'opacity .26s',
      }}
    >
      {svg(icon, 17, 'currentColor', 2)}
    </button>
  );
  return (
    <div style={{ position: 'relative' }}>
      <div ref={ref} className="weo-rail weo-scroll-hide" style={{ '--rail-w': `${w}px` } as CSSProperties}>
        {children}
      </div>
      {arrow('left', at.s, <polyline points="15 6 9 12 15 18" />)}
      {arrow('right', at.e, <polyline points="9 6 15 12 9 18" />)}
    </div>
  );
}

const buttonTone = (t: string) =>
  t === '#22C55E' ? 'green' : t === '#F7C62B' ? 'gold' : t === '#D946EF' ? 'violet' : 'blue';

/** design: screens-discover.jsx RailHead — a dot, the rail's name, its note, its controls. */
export function RailHead({
  tone,
  title,
  note,
  action,
  onAction,
  views,
  right,
}: {
  tone?: string;
  title: ReactNode;
  note?: ReactNode;
  action?: ReactNode;
  onAction?: () => void;
  views?: ReactNode;
  right?: ReactNode;
}) {
  const t = tone || '#3A95F2';
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 14, marginBottom: 14 }}>
      <div style={{ minWidth: 240, flex: 1 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: t, flex: '0 0 auto' }} />
          <h2 style={{ margin: 0, fontSize: 'clamp(19px,2.2vw,24px)', fontWeight: 700, letterSpacing: '-.028em', color: 'var(--text)' }}>
            {title}
          </h2>
        </span>
        {note && (
          <p style={{ margin: '5px 0 0', maxWidth: '64ch', fontSize: 12.5, lineHeight: 1.5, color: 'var(--text-dim)' }}>{note}</p>
        )}
      </div>
      <div style={{ flex: '0 0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
        {views}
        {right}
        {action && (
          <Button size="sm" variant="ghost" tone={buttonTone(t)} onClick={onAction}>
            {action}
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * design: screens-discover.jsx Fold — every place is OPEN at rest; each closes on its own, so
 * the reader curates the page down to what they want.
 */
export function Fold({
  id,
  shut,
  onToggle,
  title,
  count,
  tone,
  children,
}: {
  id: string;
  shut?: boolean;
  onToggle: (id: string) => void;
  title: string;
  count?: number | string | null;
  tone?: string;
  children?: ReactNode;
}) {
  const open = !shut;
  return (
    <div style={{ minWidth: 0 }}>
      <button
        type="button"
        onClick={() => onToggle(id)}
        aria-expanded={open}
        title={open ? `Collapse ${title}` : `Expand ${title}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          width: '100%',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          font: 'inherit',
          borderRadius: 18,
          padding: '10px 14px',
          marginBottom: open ? 10 : 0,
          background: open ? 'transparent' : 'var(--surface)',
          boxShadow: open ? 'none' : 'var(--nm-sm), inset 0 0 0 1px var(--border)',
          transition: 'background .24s, box-shadow .24s, margin .24s',
        }}
      >
        <span style={{ width: 7, height: 7, borderRadius: '50%', flex: '0 0 auto', background: tone || 'var(--o-blue)' }} />
        <span
          style={{
            minWidth: 0,
            flex: 1,
            fontSize: 12.5,
            fontWeight: 700,
            letterSpacing: '-.014em',
            color: open ? 'var(--text-faint)' : 'var(--text)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </span>
        {count != null && (
          <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-faint)', fontVariantNumeric: 'tabular-nums' }}>{count}</span>
        )}
        <span
          style={{
            display: 'grid',
            placeItems: 'center',
            color: 'var(--text-faint)',
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform .3s var(--ease-portal)',
          }}
        >
          {svg(<polyline points="6 9 12 15 18 9" />, 14, 'currentColor', 2.2)}
        </span>
      </button>
      <div style={{ display: 'grid', gridTemplateRows: open ? '1fr' : '0fr', transition: 'grid-template-rows .44s var(--ease-portal)' }}>
        <div style={{ overflow: open ? 'visible' : 'hidden', minHeight: 0, minWidth: 0 }}>{children}</div>
      </div>
    </div>
  );
}

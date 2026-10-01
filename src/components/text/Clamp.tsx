import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

/** design: section-hero.jsx Clamp — text that shows its first lines and opens on ask, never a wall at rest. */
export function Clamp({
  children,
  lines = 2,
  style,
  tone,
}: {
  children: ReactNode;
  lines?: number;
  style?: CSSProperties;
  tone?: string;
}) {
  const [open, setOpen] = useState(false);
  const [over, setOver] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (el) setOver(el.scrollHeight - el.clientHeight > 2);
  }, [children]);
  const clamp: CSSProperties = open
    ? {}
    : { display: '-webkit-box', WebkitLineClamp: lines, WebkitBoxOrient: 'vertical', overflow: 'hidden' };
  return (
    <span style={{ display: 'block' }}>
      <span ref={ref} style={{ display: 'block', textWrap: 'pretty', ...style, ...clamp }}>
        {children}
      </span>
      {(over || open) && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          style={{
            marginTop: 5,
            minHeight: 28,
            padding: 0,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            font: 'inherit',
            fontSize: 11.5,
            fontWeight: 600,
            letterSpacing: '.01em',
            color: tone || 'var(--o-violet)',
          }}
        >
          {open ? 'Less' : 'More'}
        </button>
      )}
    </span>
  );
}

import { useState, type ReactNode } from 'react';
import { svg } from '@/design-system';
import { NoteBody, NoteDot, useNote } from './Note';

/** design: screens-hub.jsx SectionMark — the numbered (or iconed) eyebrow with its rule. */
export function SectionMark({
  n,
  icon,
  label,
  tone,
  rule,
}: {
  n?: number;
  icon?: ReactNode;
  label: ReactNode;
  tone?: string;
  rule?: boolean;
}) {
  const t = tone || 'var(--o-violet)';
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
      <span
        style={{
          flex: '0 0 auto',
          width: 24,
          height: 24,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          background: 'var(--surface-2)',
          boxShadow: 'var(--nm-inset)',
          color: t,
          fontSize: 10,
          fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {icon ? svg(icon, 13, 'currentColor', 1.7) : String(n ?? '').padStart(2, '0')}
      </span>
      <span
        style={{
          fontSize: 10.5,
          fontWeight: 700,
          letterSpacing: '.16em',
          textTransform: 'uppercase',
          color: 'var(--text-faint)',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
      {rule !== false && <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />}
    </span>
  );
}

/**
 * design: screens-hub.jsx SectionHead — the title carries the section; the note is there when
 * you want it (hover the head, or tap the dot). "02 — In flight" eyebrows get the numbered mark.
 */
export function SectionHead({
  eyebrow,
  title,
  note,
  right,
}: {
  eyebrow?: string;
  title: ReactNode;
  note?: ReactNode;
  right?: ReactNode;
}) {
  const m = typeof eyebrow === 'string' ? eyebrow.match(/^(\d+)\s*—\s*(.*)$/) : null;
  const n = useNote();
  return (
    <div
      onMouseEnter={n.enter}
      onMouseLeave={n.leave}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 16,
        marginBottom: 18,
      }}
    >
      <div style={{ minWidth: 240, flex: 1 }}>
        {m ? (
          <SectionMark n={Number(m[1])} label={m[2]} />
        ) : eyebrow ? (
          <SectionMark label={eyebrow} rule={false} />
        ) : null}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, margin: '10px 0 0' }}>
          <h2
            style={{
              margin: 0,
              fontSize: 'clamp(20px,2.3vw,25px)',
              fontWeight: 700,
              letterSpacing: '-.025em',
              color: 'var(--text)',
            }}
          >
            {title}
          </h2>
          {note && <NoteDot show={n.show} onClick={n.toggle} label="What this section is" />}
        </div>
        {note && <NoteBody note={note} show={n.show} />}
      </div>
      {right}
    </div>
  );
}

// design: screens-hub.jsx VIEW_ICONS
export const VIEW_ICONS: Record<string, ReactNode> = {
  cards: (
    <>
      <rect x="3.5" y="5" width="7" height="14" rx="2" />
      <rect x="13.5" y="5" width="7" height="14" rx="2" />
    </>
  ),
  carousel: (
    <>
      <rect x="8.5" y="4.5" width="7" height="15" rx="2" />
      <path d="M5 8v8M19 8v8" />
    </>
  ),
  orbit: (
    <>
      <circle cx="12" cy="12" r="3" />
      <ellipse cx="12" cy="12" rx="9" ry="5.4" transform="rotate(-28 12 12)" />
      <circle cx="19" cy="8.6" r="1.6" />
    </>
  ),
  list: (
    <>
      <circle cx="5" cy="7" r="1.7" />
      <circle cx="5" cy="12" r="1.7" />
      <circle cx="5" cy="17" r="1.7" />
      <path d="M10 7h10M10 12h10M10 17h6" />
    </>
  ),
  rail: (
    <>
      <rect x="3.5" y="5" width="7" height="14" rx="2" />
      <rect x="13.5" y="5" width="7" height="14" rx="2" />
    </>
  ),
};

export interface SegItem<V extends string = string> {
  value: V;
  label: string;
}

/**
 * design: screens-hub.jsx IconSegs — icon segments that name themselves only when on or
 * approached (the label slides open; nothing else reflows).
 */
export function IconSegs<V extends string>({
  items,
  value,
  onChange,
  tone,
  icons = VIEW_ICONS,
}: {
  items: readonly SegItem<V>[];
  value: V;
  onChange: (v: V) => void;
  tone?: string;
  icons?: Record<string, ReactNode>;
}) {
  const [hov, setHov] = useState<V | null>(null);
  const t = tone || 'var(--o-violet)';
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 3,
        padding: 4,
        borderRadius: 999,
        background: 'var(--surface-2)',
        boxShadow: 'var(--nm-inset)',
      }}
    >
      {items.map((it) => {
        const on = value === it.value;
        const hot = hov === it.value;
        return (
          <button
            key={it.value}
            type="button"
            onClick={() => onChange(it.value)}
            onMouseEnter={() => setHov(it.value)}
            onMouseLeave={() => setHov(null)}
            aria-label={it.label}
            aria-pressed={on}
            title={it.label}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: on || hot ? 7 : 0,
              height: 36,
              padding: on || hot ? '0 14px' : '0 10px',
              borderRadius: 999,
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontSize: 12.5,
              fontWeight: on ? 700 : 500,
              color: on ? '#fff' : hot ? t : 'var(--text-faint)',
              background: on ? t : hot ? `color-mix(in srgb, ${t} 9%, transparent)` : 'transparent',
              transition:
                'background .26s, color .24s, gap .32s var(--ease-portal), padding .32s var(--ease-portal)',
            }}
          >
            {svg(icons[it.value], 17, 'currentColor', 1.7)}
            <span
              style={{
                maxWidth: on || hot ? 90 : 0,
                opacity: on || hot ? 1 : 0,
                overflow: 'hidden',
                transition: 'max-width .34s var(--ease-portal), opacity .22s',
              }}
            >
              {it.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

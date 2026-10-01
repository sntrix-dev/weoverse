import type { ReactNode } from 'react';

/** design: screens-holdings.jsx Pip — a small tonal label. */
export function Pip({ tone, children }: { tone: string; children?: ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        borderRadius: 999,
        padding: '3px 10px',
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '.1em',
        textTransform: 'uppercase',
        color: tone,
        background: `color-mix(in srgb, ${tone} 12%, var(--surface))`,
      }}
    >
      {children}
    </span>
  );
}

/** design: screens-holdings.jsx StatStrip — a row of figures with their label and note. */
export function StatStrip({ items }: { items: { k: string; v: ReactNode; note?: ReactNode; tone?: string }[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginTop: 22 }}>
      {items.map((s, i) => (
        <div
          key={s.k}
          style={{
            borderRadius: 20,
            padding: '15px 17px',
            background: 'var(--surface)',
            boxShadow: 'var(--nm-sm)',
            animation: `weo-cardin .44s var(--ease-settle) ${i * 0.05}s both`,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 'clamp(19px,2.1vw,24px)',
              fontWeight: 700,
              letterSpacing: '-.03em',
              color: s.tone || 'var(--text)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {s.v}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{s.k}</p>
          <p style={{ margin: '1px 0 0', fontSize: 10.5, color: 'var(--text-faint)' }}>{s.note}</p>
        </div>
      ))}
    </div>
  );
}

// design: js/ds/_ds_bundle.js components/data/StatGrid.jsx — converted from the compiled bundle (scripts/ds2tsx.mjs), then typed by hand.

import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';

export interface StatItem {
  k: ReactNode;
  v: ReactNode;
}

export interface StatGridProps extends Omit<HTMLAttributes<HTMLDivElement>, 'style'> {
  items?: StatItem[];
  tone?: string;
  columns?: number;
  well?: boolean;
  style?: CSSProperties;
}

/**
 * StatGrid — the recurring row of key terms (Ticket · Left · Draw-in).
 * Each cell is an inset chip with an uppercase key and a bold value.
 * items: [{ k, v }]. `tone` colors the values.
 */
export function StatGrid({
  items = [],
  tone = 'var(--text)',
  columns,
  well = true,
  style,
  ...rest
}: StatGridProps) {
  const cols = columns || items.length || 3;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 8,
        ...(well
          ? {
              padding: 12,
              borderRadius: 'var(--radius-md)',
              background: 'var(--surface-2)',
            }
          : {}),
        ...style,
      }}
      {...rest}
    >
      {items.map((it, i) => (
        <div
          key={i}
          style={{
            textAlign: 'center',
            padding: well ? '0' : '9px 4px',
            borderRadius: 14,
            background: well ? 'transparent' : 'var(--surface-2)',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 9.5,
              letterSpacing: '.1em',
              color: 'var(--text-faint)',
              textTransform: 'uppercase',
              marginBottom: 3,
            }}
          >
            {it.k}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-sans)',
              fontWeight: 700,
              fontSize: 16,
              color: tone,
              lineHeight: 1.1,
            }}
          >
            {it.v}
          </div>
        </div>
      ))}
    </div>
  );
}

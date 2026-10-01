import { useState, type ReactNode } from 'react';
import { svg } from '@/design-system';

export interface RowBlock {
  id: string;
  title: string;
  count?: number | string | null;
  tone?: string;
  body: ReactNode;
}

/**
 * design: v3-screens.jsx Rows — the folded modules as BLOCKS: a grid of tiles, one word and a
 * count each; press a tile and its content opens full-width beneath the grid.
 */
export function Rows({ rows, initial }: { rows: RowBlock[]; initial?: string | null }) {
  const [open, setOpen] = useState<string | null>(initial ?? null);
  const cur = rows.find((r) => r.id === open) || null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 190px), 1fr))', gap: 12 }}>
        {rows.map((r) => {
          const on = open === r.id;
          const t = r.tone || 'var(--o-blue)';
          return (
            <button
              key={r.id}
              id={r.id}
              type="button"
              onClick={() => setOpen((o) => (o === r.id ? null : r.id))}
              aria-expanded={on}
              aria-controls={`${r.id}-body`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 10,
                minHeight: 104,
                padding: '14px 16px',
                border: 'none',
                borderRadius: 22,
                cursor: 'pointer',
                textAlign: 'left',
                font: 'inherit',
                background: on ? `color-mix(in srgb, ${t} 9%, var(--surface))` : 'var(--surface)',
                boxShadow: on ? `var(--nm-raised), inset 0 0 0 1.5px ${t}` : 'var(--nm-raised), inset 0 0 0 1px var(--border)',
                transition: 'box-shadow .24s, background .24s, transform .24s var(--ease-portal)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                <span
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: '50%',
                    flex: '0 0 auto',
                    background: t,
                    boxShadow: `0 0 10px color-mix(in srgb, ${t} 60%, transparent)`,
                  }}
                />
                {r.count != null && (
                  <span
                    style={{
                      marginLeft: 'auto',
                      fontSize: 20,
                      fontWeight: 700,
                      letterSpacing: '-.03em',
                      lineHeight: 1,
                      color: on ? t : 'var(--text)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {r.count}
                  </span>
                )}
              </span>
              <span style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}>
                <span
                  style={{
                    minWidth: 0,
                    flex: 1,
                    fontSize: 14.5,
                    fontWeight: 700,
                    letterSpacing: '-.018em',
                    color: 'var(--text)',
                    textWrap: 'balance',
                  }}
                >
                  {r.title}
                </span>
                <span
                  style={{
                    display: 'grid',
                    placeItems: 'center',
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    flex: '0 0 auto',
                    color: on ? '#fff' : 'var(--text-faint)',
                    background: on ? t : 'var(--surface-2)',
                    boxShadow: on ? 'none' : 'var(--nm-inset)',
                    transform: on ? 'rotate(180deg)' : 'none',
                    transition: 'transform .3s var(--ease-portal), background .24s',
                  }}
                >
                  {svg(<polyline points="6 9 12 15 18 9" />, 12, 'currentColor', 2.2)}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      {cur && (
        <div
          id={`${cur.id}-body`}
          role="region"
          aria-label={cur.title}
          style={{
            borderRadius: 26,
            padding: 'clamp(14px,1.8vw,22px)',
            background: 'var(--surface)',
            boxShadow: `var(--nm-raised), inset 0 0 0 1px color-mix(in srgb, ${cur.tone || 'var(--o-blue)'} 30%, var(--border))`,
            animation: 'weo-cardin .36s var(--ease-portal) both',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: cur.tone || 'var(--o-blue)' }} />
            <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 700, letterSpacing: '-.014em', color: 'var(--text)' }}>
              {cur.title}
            </span>
            <button
              type="button"
              onClick={() => setOpen(null)}
              aria-label={`Close ${cur.title}`}
              style={{
                display: 'grid',
                placeItems: 'center',
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-dim)',
                background: 'var(--surface-2)',
                boxShadow: 'var(--nm-inset)',
              }}
            >
              {svg(<path d="M6 6l12 12M18 6L6 18" />, 14, 'currentColor', 2)}
            </button>
          </div>
          {cur.body}
        </div>
      )}
    </div>
  );
}

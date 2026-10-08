// design: screens-create.jsx ModWell
import type { ReactNode } from 'react';
import { OsRun } from '@/components/text/OsRun';
import { svg } from '@/design-system';

/** One module of the composer: what it is, whether it is set, and its body. */
export interface ComposerModule {
  key: string;
  title: string;
  done: boolean;
  optional?: boolean;
  summary: string;
  body: ReactNode;
}

export function ModWell({
  m,
  open,
  onToggle,
  tone,
  pinned,
  onPin,
}: {
  m: ComposerModule;
  open: boolean;
  onToggle: () => void;
  tone: string;
  pinned: boolean;
  onPin?: () => void;
}) {
  // CRE-04: the pin has its own column and shows on hover or when set — it never sits over the value
  return (
    <div
      className="weo-modwell"
      style={{
        position: 'relative',
        borderRadius: 22,
        background: 'var(--surface)',
        boxShadow: open
          ? `var(--nm-raised), inset 0 0 0 1px color-mix(in srgb, ${tone} 26%, transparent)`
          : 'var(--nm-sm)',
        transition: 'box-shadow .3s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingRight: 10 }}>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 11,
            flex: 1,
            minWidth: 0,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            padding: '14px 0 14px 16px',
            textAlign: 'left',
            font: 'inherit',
          }}
        >
          <span
            style={{
              flex: '0 0 auto',
              width: 20,
              height: 20,
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
              background: m.done ? 'var(--o-green)' : 'var(--surface)',
              boxShadow: m.done ? 'none' : 'inset 0 0 0 1.5px var(--border)',
              color: '#fff',
            }}
          >
            {m.done ? svg(<path d="M5 12.5l4.2 4.2L19 7" />, 12, 'currentColor', 2.4) : null}
          </span>
          <span
            style={{
              // live pass U2: the title never shrinks under the summary — the summary gives way and ellipsizes
              flex: '1 0 auto',
              whiteSpace: 'nowrap',
              fontSize: 13.5,
              fontWeight: open ? 600 : 400,
              letterSpacing: '-.008em',
              color: open ? 'var(--text)' : 'var(--text-dim)',
              transition: 'color .2s',
            }}
          >
            {m.title}
          </span>
          {!open && m.summary && (
            <span
              style={{
                flex: '0 1 auto',
                minWidth: 0,
                fontSize: 11.5,
                color: 'var(--text-faint)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: 150,
              }}
            >
              <OsRun text={m.summary} size="0.9em" />
            </span>
          )}
          <span
            style={{
              flex: '0 0 auto',
              color: 'var(--text-faint)',
              transform: open ? 'rotate(90deg)' : 'none',
              transition: 'transform .3s var(--ease-portal)',
            }}
          >
            {svg(<path d="M9 6l6 6-6 6" />, 15, 'currentColor', 1.8)}
          </span>
        </button>
        {onPin && (
          <button
            type="button"
            className="weo-modpin"
            onClick={(e) => {
              e.stopPropagation();
              onPin();
            }}
            title={pinned ? 'Unpin this module' : 'Pin it open'}
            aria-label={pinned ? `Unpin ${m.title}` : `Pin ${m.title} open`}
            aria-pressed={pinned}
            style={{
              flex: '0 0 auto',
              display: 'grid',
              placeItems: 'center',
              width: 26,
              height: 26,
              borderRadius: 999,
              border: 'none',
              cursor: 'pointer',
              background: pinned ? `color-mix(in srgb, ${tone} 14%, var(--surface))` : 'transparent',
              color: pinned ? tone : 'var(--text-faint)',
            }}
          >
            {svg(
              <>
                <path d="M12 17v4" />
                <path d="M8.5 4h7l-1 6 3 3.5H6.5L9.5 10z" />
              </>,
              14,
              'currentColor',
              1.7,
            )}
          </button>
        )}
      </div>
      {open && (
        <div style={{ padding: '0 16px 16px', animation: 'weo-cardin .34s var(--ease-settle) both' }}>
          {m.body}
        </div>
      )}
    </div>
  );
}

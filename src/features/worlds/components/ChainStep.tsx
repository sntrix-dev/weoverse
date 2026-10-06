import type { ReactNode } from 'react';
import { OsRun } from '@/components/text/OsRun';
import { Button, svg } from '@/design-system';

export interface ChainCta {
  label: string;
  act: () => void;
  primary?: boolean;
  tone?: 'violet' | 'green' | 'blue' | 'gold';
  disabled?: boolean;
}

export interface ChainStepProps {
  i: number;
  stepKey: string;
  title: string;
  badge?: ReactNode;
  summary?: string;
  body: ReactNode;
  state: 'done' | 'current' | 'locked';
  open: boolean;
  onToggle: (() => void) | null;
  tone: string;
  ask: string;
  cta?: ChainCta[] | null;
  last?: boolean;
  highlight?: boolean;
}

/** design: world.jsx ChainStep — one module of the rehearsal; one open at a time, a one-line summary at rest. */
export function ChainStep({
  i,
  stepKey,
  title,
  badge,
  summary,
  body,
  state,
  open,
  onToggle,
  tone,
  ask,
  cta,
  last,
  highlight,
}: ChainStepProps) {
  const t = tone || 'var(--o-violet)';
  const locked = state === 'locked';
  const done = state === 'done';
  return (
    <div
      data-chain-step={stepKey}
      style={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: '26px minmax(0,1fr)',
        gap: 10,
        opacity: locked ? 0.5 : 1,
        transition: 'opacity .3s',
      }}
    >
      {!last && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 12,
            top: 40,
            bottom: -16,
            width: 2,
            borderRadius: 2,
            background: done ? t : 'var(--border)',
            transition: 'background .3s',
          }}
        />
      )}
      <span
        style={{
          position: 'relative',
          zIndex: 1,
          marginTop: 12,
          width: 26,
          height: 26,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          fontSize: 11.5,
          fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
          color: locked ? 'var(--text-faint)' : '#fff',
          background: locked ? 'var(--surface)' : t,
          boxShadow: locked
            ? 'inset 0 0 0 1.5px var(--border)'
            : state === 'current' || highlight
              ? `0 0 0 4px color-mix(in srgb, ${t} 20%, transparent)`
              : 'none',
          transition: 'background .3s, box-shadow .3s',
        }}
      >
        {done && !highlight ? svg(<path d="M5 12.5l4.2 4.2L19 7" />, 12, 'currentColor', 2.6) : i + 1}
      </span>
      <div
        className={open || highlight ? undefined : 'weo-quiet'}
        style={{
          minWidth: 0,
          borderRadius: 22,
          background: highlight ? `color-mix(in srgb, ${t} 7%, var(--surface))` : 'var(--surface)',
          boxShadow: highlight
            ? `0 22px 44px -22px ${t}, inset 0 0 0 1.5px ${t}`
            : open
              ? `var(--nm-raised), inset 0 0 0 1px color-mix(in srgb, ${t} 30%, transparent)`
              : 'var(--nm-sm)',
          transition: 'box-shadow .3s, background .3s',
        }}
      >
        <button
          onClick={locked || !onToggle ? undefined : onToggle}
          disabled={locked}
          aria-expanded={onToggle ? open : undefined}
          aria-controls={'chain-' + stepKey}
          title={locked ? 'Finish the step above first' : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            width: '100%',
            border: 'none',
            background: 'transparent',
            cursor: locked || !onToggle ? 'default' : 'pointer',
            padding: '12px 14px',
            textAlign: 'left',
            font: 'inherit',
          }}
        >
          <span style={{ flex: 1, minWidth: 0 }}>
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13.5,
                fontWeight: open ? 700 : 600,
                letterSpacing: '-.008em',
                color: locked ? 'var(--text-faint)' : 'var(--text)',
              }}
            >
              {title}
              {badge}
            </span>
            <span
              style={{
                display: 'block',
                marginTop: 2,
                fontSize: 11.5,
                color: done && !open ? 'var(--text)' : 'var(--text-dim)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {done && !open && summary ? <OsRun text={summary} size="0.9em" /> : ask}
            </span>
          </span>
          {!locked && onToggle && (
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
          )}
        </button>
        {open && (
          <div
            id={'chain-' + stepKey}
            role="region"
            aria-label={title}
            style={{
              padding: '0 14px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              animation: 'weo-cardin .34s var(--ease-settle) both',
            }}
          >
            {body}
            {cta && cta.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {cta.map((c) => (
                  <Button
                    key={c.label}
                    size="sm"
                    variant={c.primary ? 'primary' : 'ghost'}
                    tone={c.tone || 'violet'}
                    onClick={c.act}
                    disabled={c.disabled}
                    style={c.primary ? { flex: 1 } : undefined}
                  >
                    {c.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

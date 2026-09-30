// design: js/ds/_ds_bundle.js components/navigation/Tabs.jsx — converted from the compiled bundle (scripts/ds2tsx.mjs), then typed by hand.

import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';

export type TabItem = string | { value: string; label: ReactNode };

export interface TabsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'style' | 'onChange'> {
  tabs?: TabItem[];
  value?: string | null;
  onChange?: (value: string) => void;
  tone?: string;
  style?: CSSProperties;
}

/** Tabs — a pill segmented control on an inset track. */
export function Tabs({ tabs = [], value, onChange, tone = '#3A95F2', style, ...rest }: TabsProps) {
  const items = tabs.map((t) =>
    typeof t === 'string'
      ? {
          value: t,
          label: t,
        }
      : t,
  );
  const active = value != null ? value : items[0]?.value;
  return (
    <div
      style={{
        display: 'flex',
        gap: 4,
        padding: 5,
        borderRadius: 999,
        background: 'var(--surface-2)',
        boxShadow: 'var(--nm-inset)',
        ...style,
      }}
      {...rest}
    >
      {items.map((t) => {
        const on = t.value === active;
        return (
          <button
            key={t.value}
            onClick={() => onChange?.(t.value)}
            style={{
              flex: 1,
              textAlign: 'center',
              padding: 8,
              borderRadius: 999,
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              fontSize: 12.5,
              fontWeight: on ? 700 : 400,
              color: on ? '#fff' : 'var(--text-faint)',
              background: on ? tone : 'transparent',
              boxShadow: on ? `0 6px 14px -6px ${tone}` : 'none',
              transition: 'background .2s, font-weight .2s, color .2s',
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

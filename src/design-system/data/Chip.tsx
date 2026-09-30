// design: js/ds/_ds_bundle.js components/data/Chip.jsx — converted from the compiled bundle (scripts/ds2tsx.mjs), then typed by hand.

import type { CSSProperties, HTMLAttributes } from 'react';

export interface ChipProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'style'> {
  selected?: boolean;
  tone?: string;
  dot?: boolean;
  onRemove?: () => void;
  disabled?: boolean;
  style?: CSSProperties;
}

/** Chip / tag — pill. Selected carries the section color; removable shows an ✕. */
export function Chip({
  children,
  selected = false,
  tone = '#3A95F2',
  dot = false,
  onRemove,
  disabled = false,
  style,
  ...rest
}: ChipProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        padding: onRemove ? '7px 10px 7px 13px' : '7px 13px',
        borderRadius: 999,
        fontFamily: 'var(--font-sans)',
        fontSize: 12.5,
        fontWeight: 700,
        color: selected ? tone : 'var(--text-dim)',
        background: selected ? `color-mix(in srgb, ${tone} 12%, transparent)` : 'var(--surface-2)',
        border: `1px solid ${selected ? tone : 'var(--border)'}`,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : rest.onClick ? 'pointer' : 'default',
        ...style,
      }}
      {...rest}
    >
      {dot && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: selected ? tone : 'var(--text-faint)',
          }}
        />
      )}
      {children}
      {onRemove && (
        <svg
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--text-faint)"
          strokeWidth="2.4"
          strokeLinecap="round"
          style={{
            cursor: 'pointer',
          }}
        >
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      )}
    </span>
  );
}

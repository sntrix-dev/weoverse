// design: js/ds/_ds_bundle.js components/data/Badge.jsx — converted from the compiled bundle (scripts/ds2tsx.mjs), then typed by hand.

import type { CSSProperties, HTMLAttributes } from 'react';

export interface BadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'style'> {
  variant?: 'count' | 'status' | 'dot';
  tone?: string;
  dot?: boolean;
  style?: CSSProperties;
}

/**
 * Badge — count pill, status pill, or a bare notification dot.
 * variant: 'count' | 'status' | 'dot'
 */
export function Badge({
  children,
  variant = 'count',
  tone = '#FF5A2C',
  dot = false,
  style,
  ...rest
}: BadgeProps) {
  if (variant === 'dot') {
    return (
      <span
        style={{
          width: 9,
          height: 9,
          borderRadius: '50%',
          background: tone,
          border: '2px solid var(--surface)',
          display: 'inline-block',
          ...style,
        }}
        {...rest}
      />
    );
  }
  if (variant === 'status') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: '4px 10px',
          borderRadius: 999,
          fontFamily: 'var(--font-sans)',
          fontSize: 11,
          fontWeight: 700,
          color: tone,
          background: `color-mix(in srgb, ${tone} 15%, transparent)`,
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
              background: tone,
            }}
          />
        )}
        {children}
      </span>
    );
  }
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 22,
        height: 22,
        padding: '0 7px',
        borderRadius: 999,
        background: tone,
        color: '#fff',
        fontFamily: 'var(--font-sans)',
        fontSize: 11,
        fontWeight: 700,
        ...style,
      }}
      {...rest}
    >
      {children}
    </span>
  );
}

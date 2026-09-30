// design: js/ds/_ds_bundle.js components/surfaces/Card.jsx — converted from the compiled bundle (scripts/ds2tsx.mjs), then typed by hand.

import type { CSSProperties, HTMLAttributes } from 'react';

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'style'> {
  elevation?: 'raised' | 'flat' | 'inset' | 'glass';
  padding?: number | string;
  radius?: number | string;
  style?: CSSProperties;
}

/**
 * Card — the neumorphic container. Three elevations: raised (default),
 * inset (a "well"), and glass (blurred overlay). Never neumorphic on an orb.
 */
export function Card({
  children,
  elevation = 'raised',
  padding = 24,
  radius = 22,
  style,
  ...rest
}: CardProps) {
  const elevations: Record<string, CSSProperties> = {
    raised: {
      background: 'var(--surface)',
      boxShadow: 'var(--nm-raised)',
      border: '1px solid var(--border)',
    },
    flat: {
      background: 'var(--surface)',
      boxShadow: 'var(--nm-sm)',
      border: '1px solid var(--border)',
    },
    inset: {
      background: 'var(--surface-2)',
      boxShadow: 'var(--nm-inset)',
      border: 'none',
    },
    glass: {
      background: 'var(--glass)',
      border: '1px solid var(--glass-brd)',
      boxShadow: 'var(--shadow-card)',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
    },
  };
  return (
    <div
      style={{
        borderRadius: typeof radius === 'number' ? `${radius}px` : radius,
        padding: typeof padding === 'number' ? `${padding}px` : padding,
        ...(elevations[elevation] ?? elevations.raised),
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

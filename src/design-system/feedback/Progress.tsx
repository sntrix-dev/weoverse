// design: js/ds/_ds_bundle.js components/feedback/Progress.jsx — converted from the compiled bundle (scripts/ds2tsx.mjs), then typed by hand.

import type { CSSProperties, HTMLAttributes } from 'react';

export interface ProgressProps extends Omit<HTMLAttributes<HTMLDivElement>, 'style'> {
  value?: number;
  variant?: 'circular' | 'linear';
  tone?: string;
  size?: number;
  indeterminate?: boolean;
  showValue?: boolean;
  style?: CSSProperties;
}

/** Progress — circular ring or a linear bar. Determinate or indeterminate. */
export function Progress({
  value = 0,
  variant = 'circular',
  tone = '#3A95F2',
  size = 76,
  indeterminate = false,
  showValue = true,
  style,
  ...rest
}: ProgressProps) {
  if (variant === 'linear') {
    return (
      <div
        style={{
          height: 8,
          borderRadius: 999,
          background: 'var(--surface-2)',
          boxShadow: 'var(--nm-inset)',
          overflow: 'hidden',
          position: 'relative',
          ...style,
        }}
        {...rest}
      >
        {indeterminate ? (
          <div
            style={{
              position: 'absolute',
              width: '40%',
              height: '100%',
              borderRadius: 999,
              background: tone,
              animation: 'weo-float 1.6s ease-in-out infinite',
              left: 0,
            }}
          />
        ) : (
          <div
            style={{
              width: `${value}%`,
              height: '100%',
              borderRadius: 999,
              background: `linear-gradient(90deg, ${tone}, color-mix(in srgb, ${tone} 55%, #fff))`,
            }}
          />
        )}
      </div>
    );
  }
  const px = typeof size === 'number' ? `${size}px` : size;
  const deg = (value / 100) * 360;
  return (
    <div
      style={{
        position: 'relative',
        width: px,
        height: px,
        flex: 'none',
        ...style,
      }}
      {...rest}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: `conic-gradient(from -90deg, ${tone} ${deg}deg, var(--surface-3) 0)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: parseFloat(px) * 0.12,
          borderRadius: '50%',
          background: 'var(--surface)',
          boxShadow: 'var(--nm-inset)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-sans)',
          fontWeight: 700,
          fontSize: parseFloat(px) * 0.21,
          color: 'var(--text)',
        }}
      >
        {showValue && `${Math.round(value)}%`}
      </div>
    </div>
  );
}

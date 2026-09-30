// design: js/ds/_ds_bundle.js components/feedback/Spinner.jsx — converted from the compiled bundle (scripts/ds2tsx.mjs), then typed by hand.

import type { CSSProperties, HTMLAttributes } from 'react';

export interface SpinnerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'style'> {
  size?: number | string;
  tone?: string;
  style?: CSSProperties;
}

/**
 * Spinner — the O eclipse preloader. A corona of light sweeps the rim; the
 * disc stays neutral, only the light moves.
 */
export function Spinner({ size = 66, tone = '#3A95F2', style, ...rest }: SpinnerProps) {
  const px = typeof size === 'number' ? `${size}px` : size;
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
          inset: '-6px',
          borderRadius: '50%',
          background: `radial-gradient(circle, color-mix(in srgb, ${tone} 40%, transparent), transparent 66%)`,
          filter: 'blur(7px)',
          animation: 'weo-breathe 2.2s ease-in-out infinite',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: 'var(--surface)',
          boxShadow: 'var(--nm-raised)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          WebkitMask: 'radial-gradient(circle, transparent 66%, #000 67%)',
          mask: 'radial-gradient(circle, transparent 66%, #000 67%)',
          background: `conic-gradient(from 0deg, transparent 0 232deg, ${tone} 312deg, #eaf3ff 350deg, transparent 360deg)`,
          animation: 'weo-spin 1s linear infinite',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          boxShadow: 'inset 0 0 0 1px var(--border)',
        }}
      />
    </div>
  );
}

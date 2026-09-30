// design: js/ds/_ds_bundle.js components/feedback/Skeleton.jsx — converted from the compiled bundle (scripts/ds2tsx.mjs), then typed by hand.

import type { CSSProperties, HTMLAttributes } from 'react';

export interface SkeletonProps extends Omit<HTMLAttributes<HTMLDivElement>, 'style'> {
  shape?: 'line' | 'circle' | 'block';
  width?: number | string;
  height?: number | string;
  style?: CSSProperties;
}

/** Skeleton — shimmer placeholder. shape: 'line' | 'circle' | 'block'. */
export function Skeleton({ shape = 'line', width, height, style, ...rest }: SkeletonProps) {
  const shimmer: CSSProperties = {
    background: 'linear-gradient(90deg, var(--surface-2), var(--surface-3), var(--surface-2))',
    backgroundSize: '200px 100%',
    animation: 'weo-shimmer 1.2s linear infinite',
  };
  const shapes: Record<string, CSSProperties> = {
    line: {
      height: height || 12,
      width: width || '100%',
      borderRadius: 6,
    },
    circle: {
      width: width || 44,
      height: height || width || 44,
      borderRadius: '50%',
    },
    block: {
      width: width || '100%',
      height: height || 76,
      borderRadius: 14,
    },
  };
  return (
    <div
      style={{
        ...shimmer,
        ...(shapes[shape] ?? shapes.line),
        ...style,
      }}
      {...rest}
    />
  );
}

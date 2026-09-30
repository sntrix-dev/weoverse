// design: js/ds/_ds_bundle.js components/core/OMark.jsx — converted from the compiled bundle (scripts/ds2tsx.mjs), then typed by hand.

import type { CSSProperties, SVGProps } from 'react';

export interface OMarkProps extends Omit<SVGProps<SVGSVGElement>, 'style'> {
  size?: number | string;
  color?: string;
  spin?: boolean;
  tilt?: number;
  style?: CSSProperties;
}

/** The single brush path — a full vortex O whose tapered ends flow past each
 *  other. One continuous stroke, balanced 50/50 dark→light. Never a struck coin. */
export const O_VORTEX_PATH =
  'M58 8.5 A44 44 0 1 1 39 9.2 C31 11.5 26 18 27.5 27 C29.5 20 35 16.5 42 15.6 A30 30 0 1 0 60 15 C55 12 52 11 52 7.5 C54 7.6 56.2 7.9 58 8.5 Z';

/**
 * OMark — the O flow-money mark (the "O" unit; never "currency"). A vortex, not a coin: one continuous brush
 * stroke forming a full O with tapered, flowing ends. Sits before a numeral,
 * baseline-aligned, one space. Inherits text color; status color only for
 * emphasis. Never fill solid, reverse the flow, or gradient-fill.
 */
export function OMark({
  size = '1em',
  color = 'currentColor',
  spin = false,
  tilt = 32,
  style,
  ...rest
}: OMarkProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      fill={color}
      aria-label="O"
      role="img"
      style={{
        display: 'inline-block',
        verticalAlign: '-0.14em',
        flex: 'none',
        transform: spin ? undefined : `rotate(${tilt}deg)`,
        animation: spin ? 'weo-spin 9s linear infinite' : undefined,
        ...style,
      }}
      {...rest}
    >
      <path d={O_VORTEX_PATH} />
    </svg>
  );
}

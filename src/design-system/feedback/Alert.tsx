// design: js/ds/_ds_bundle.js components/feedback/Alert.jsx — converted from the compiled bundle (scripts/ds2tsx.mjs), then typed by hand.

import type { CSSProperties, HTMLAttributes } from 'react';

export type AlertStatus = 'success' | 'warning' | 'error' | 'info';

export interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, 'style'> {
  status?: AlertStatus;
  style?: CSSProperties;
}

type GlyphKind = 'check' | 'bang' | 'x';

const STATUS: Record<AlertStatus, { color: string; glyph: GlyphKind }> = {
  success: {
    color: '#22C55E',
    glyph: 'check',
  },
  warning: {
    color: '#F7B21F',
    glyph: 'bang',
  },
  error: {
    color: '#FF5A2C',
    glyph: 'x',
  },
  info: {
    color: '#3A95F2',
    glyph: 'check',
  },
};
function Glyph({ kind, stroke = '#fff', size = 13 }: { kind: GlyphKind; stroke?: string; size?: number }) {
  if (kind === 'bang')
    return (
      <span
        style={{
          color: stroke,
          fontWeight: 800,
          fontSize: size + 1,
          lineHeight: 1,
        }}
      >
        !
      </span>
    );
  if (kind === 'x')
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={stroke}
        strokeWidth="3.2"
        strokeLinecap="round"
      >
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    );
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  );
}

/** Alert — inline banner, one per status color. */
export function Alert({ children, status = 'info', style, ...rest }: AlertProps) {
  const s = STATUS[status] ?? STATUS.info;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        padding: '12px 14px',
        borderRadius: 14,
        fontFamily: 'var(--font-sans)',
        background: `color-mix(in srgb, ${s.color} 10%, transparent)`,
        border: `1px solid color-mix(in srgb, ${s.color} 30%, transparent)`,
        ...style,
      }}
      {...rest}
    >
      <div
        style={{
          width: 22,
          height: 22,
          flex: 'none',
          borderRadius: '50%',
          background: s.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Glyph kind={s.glyph} />
      </div>
      <span
        style={{
          fontSize: 13,
          color: 'var(--text)',
          fontWeight: 600,
        }}
      >
        {children}
      </span>
    </div>
  );
}

// design: js/ds/_ds_bundle.js components/data/ISRRing.jsx — converted from the compiled bundle (scripts/ds2tsx.mjs), then typed by hand.

import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';

export interface IsrStage {
  max: number;
  label: string;
  color: string;
}

export interface ISRRingProps extends Omit<HTMLAttributes<HTMLDivElement>, 'style'> {
  value?: number;
  size?: number | string;
  showStage?: boolean;
  showValue?: boolean;
  label?: ReactNode;
  style?: CSSProperties;
}

// Born at 100; erodes fast, restores slow. Stages read Depleted → Pristine
// (never a climbing ladder). Functional ramp, distinct from the section colors.
const STAGES: [IsrStage, ...IsrStage[]] = [
  {
    max: 24,
    label: 'Depleted',
    color: '#FF5A2C',
  },
  {
    max: 44,
    label: 'At-Risk',
    color: '#F7B21F',
  },
  {
    max: 74,
    label: 'Healthy',
    color: '#22C55E',
  },
  {
    max: 92,
    label: 'Strong',
    color: '#17C3D6',
  },
  {
    max: 100,
    label: 'Pristine',
    color: '#2F6FF0',
  },
];
export function isrStage(value: number): IsrStage {
  return STAGES.find((s) => value <= s.max) ?? STAGES[STAGES.length - 1] ?? STAGES[0];
}

// Canonical ISR stage ramp (born-at-100 · Depleted → Pristine). Exposed so
// consumers can render legends/labels without re-declaring the thresholds.
export const ISR_STAGES = STAGES;

/**
 * ISRRing — the Individual Success Ring. A 0–100 trust dial, born at 100 and
 * held or eroded by Proof-of-Flow (erodes fast, restores slow — capped at 100).
 * Rendered in its dimensional border, value counting in the center, hue shifting
 * per stage (Depleted → Pristine). FUNCTIONAL scale, independent from the four
 * section colors. ISR is a Ring, never a rate — it never touches the fiat peg.
 */
export function ISRRing({
  value = 0,
  size = 112,
  showStage = true,
  showValue = true,
  label,
  style,
  ...rest
}: ISRRingProps) {
  const px = typeof size === 'number' ? `${size}px` : size;
  const stage = isrStage(value);
  const deg = (value / 100) * 360;
  const s = parseFloat(px);
  const num = Math.max(18, s * 0.24);
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
          background: 'var(--surface)',
          boxShadow: 'var(--nm-sm)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: s * 0.07,
          borderRadius: '50%',
          background: `conic-gradient(from 0deg, ${stage.color} ${deg}deg, var(--surface-3) 0)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: s * 0.15,
          borderRadius: '50%',
          background: 'var(--surface)',
          boxShadow: 'var(--nm-inset)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {showStage && s >= 100 && (
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: Math.max(8, s * 0.09),
              letterSpacing: '.14em',
              color: 'var(--text-faint)',
              textTransform: 'uppercase',
            }}
          >
            {label || stage.label}
          </span>
        )}
        {showValue && (
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontWeight: 700,
              fontSize: num,
              letterSpacing: '-.02em',
              color: stage.color,
              lineHeight: 1,
            }}
          >
            {Math.round(value)}
          </span>
        )}
        {showStage && s >= 100 && (
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: Math.max(7, s * 0.08),
              letterSpacing: '.14em',
              color: 'var(--text-faint)',
              textTransform: 'uppercase',
            }}
          >
            ISR
          </span>
        )}
      </div>
    </div>
  );
}

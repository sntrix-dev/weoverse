// design: js/ds/_ds_bundle.js components/exchange/OPower.jsx — converted from the compiled bundle (scripts/ds2tsx.mjs), then typed by hand.
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { OMark } from '../core/OMark';

export interface OPowerStage {
  key: string;
  label: string;
  at: number;
  color: string;
}

export interface OPowerProps extends Omit<HTMLAttributes<HTMLElement>, 'style'> {
  power?: number;
  format?: 'pip' | 'inline' | 'chip' | 'panel';
  /** amount being qualified — enables the "buys like" line */
  os?: number | null;
  size?: number;
  label?: ReactNode;
  note?: ReactNode;
  style?: CSSProperties;
}

/**
 * O Power — what one O BUYS inside an O-powered network. Never a rate, never a
 * price. The peg is fixed forever (100 Os = $1); O Power is the index of network
 * purchasing power, baseline 1.00x at network launch, rising as more of the
 * network accepts Os. It answers "what will this get me here?", not "what is
 * this worth?".
 *
 * The mark is a gold arc riding the O, filled clockwise from 12 o'clock across a
 * 0-3x sweep. It sits immediately right of any O amount, baseline-aligned, one
 * space, never larger than the numeral it qualifies.
 */
/** Named bands of the index. Ordered low to high; `at` is the inclusive floor. */
export const O_POWER_STAGES: [OPowerStage, ...OPowerStage[]] = [
  {
    key: 'thin',
    label: 'Thin',
    at: 0,
    color: 'var(--text-faint)',
  },
  {
    key: 'even',
    label: 'Even',
    at: 1,
    color: 'var(--o-gold-ink)',
  },
  {
    key: 'strong',
    label: 'Strong',
    at: 1.25,
    color: 'var(--o-gold-ink)',
  },
  {
    key: 'deep',
    label: 'Deep',
    at: 1.75,
    color: 'var(--o-gold-ink)',
  },
  {
    key: 'abundant',
    label: 'Abundant',
    at: 2.5,
    color: 'var(--o-gold-ink)',
  },
];
export const oPowerStage = (power: number): OPowerStage =>
  [...O_POWER_STAGES].reverse().find((s) => power >= s.at) ?? O_POWER_STAGES[0];

/** Os an amount spends LIKE at the current power — the plain-language translation. */
export const buysLike = (os: number, power: number) => Math.round(os * power);
const SWEEP = 3; // the arc's full range: 0x to 3x

function PowerArc({ size = 14, power = 1, color }: { size?: number; power?: number; color?: string }) {
  const pct = Math.max(0.04, Math.min(1, power / SWEEP));
  const c = color || oPowerStage(power).color;
  const mask = 'radial-gradient(circle closest-side at 50% 50%, transparent 58%, #000 59%, #000 100%)';
  return (
    <span
      aria-hidden
      style={{
        position: 'relative',
        display: 'inline-block',
        width: size,
        height: size,
        verticalAlign: '-0.16em',
        flex: 'none',
      }}
    >
      <span
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: 'var(--surface-3)',
          WebkitMask: mask,
          mask,
        }}
      />
      <span
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: `conic-gradient(from 0deg, ${c} ${pct * 360}deg, transparent 0)`,
          WebkitMask: mask,
          mask,
          transition: 'background .5s var(--ease-settle, cubic-bezier(.16,1,.3,1))',
        }}
      />
    </span>
  );
}
export function OPower({
  power = 1,
  format = 'inline',
  // pip | inline | chip | panel
  os,
  // amount being qualified — enables the "buys like" line
  size = 13,
  label = 'O Power',
  note,
  style,
  ...rest
}: OPowerProps) {
  const stage = oPowerStage(power);
  const x = `${power.toFixed(2).replace(/0$/, '').replace(/\.$/, '')}\u00d7`;
  const dataType: CSSProperties = {
    fontWeight: 700,
    letterSpacing: '.02em',
    fontVariantNumeric: 'tabular-nums',
  };
  if (format === 'pip') {
    return (
      <span
        title={`${label} ${x} · ${stage.label}`}
        style={{
          display: 'inline-flex',
          ...style,
        }}
        {...rest}
      >
        <PowerArc size={size} power={power} />
      </span>
    );
  }
  if (format === 'inline') {
    return (
      <span
        title={`${label} ${x} · ${stage.label} — what one O buys in this network`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          color: stage.color,
          fontSize: size,
          ...dataType,
          ...style,
        }}
        {...rest}
      >
        <PowerArc size={size + 1} power={power} />
        {x}
      </span>
    );
  }
  if (format === 'chip') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px 4px 8px',
          borderRadius: 999,
          background: 'var(--surface-2)',
          boxShadow: 'var(--nm-inset)',
          fontSize: size,
          color: 'var(--text-dim)',
          ...style,
        }}
        {...rest}
      >
        <PowerArc size={size + 3} power={power} />
        <span
          style={{
            ...dataType,
            color: stage.color,
          }}
        >
          {x}
        </span>
        <span
          style={{
            fontSize: size - 2.5,
            letterSpacing: '.12em',
            textTransform: 'uppercase',
            color: 'var(--text-faint)',
            fontWeight: 600,
          }}
        >
          {label}
        </span>
      </span>
    );
  }
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 16px',
        borderRadius: 16,
        background: 'var(--surface)',
        boxShadow: 'var(--nm-inset)',
        ...style,
      }}
      {...rest}
    >
      <PowerArc size={44} power={power} />
      <div
        style={{
          minWidth: 0,
        }}
      >
        <div
          style={{
            fontSize: 10,
            letterSpacing: '.14em',
            textTransform: 'uppercase',
            color: 'var(--text-faint)',
            fontWeight: 600,
          }}
        >
          {label}
          {' \xB7 '}
          {stage.label}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 8,
            marginTop: 2,
          }}
        >
          <span
            style={{
              fontSize: 22,
              color: stage.color,
              ...dataType, // design also set fontWeight 700 / letterSpacing -.02em here; dataType overrides both
            }}
          >
            {x}
          </span>
          {os != null && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 13,
                color: 'var(--text-dim)',
                ...dataType,
              }}
            >
              <OMark size="0.85em" color="var(--o-gold-ink)" />
              {os.toLocaleString('en-US')}
              {' buys like '}
              <OMark size="0.85em" color="var(--o-gold-ink)" />
              {buysLike(os, power).toLocaleString('en-US')}
            </span>
          )}
        </div>
        {note && (
          <div
            style={{
              fontSize: 12,
              lineHeight: 1.5,
              color: 'var(--text-dim)',
              marginTop: 4,
            }}
          >
            {note}
          </div>
        )}
      </div>
    </div>
  );
}

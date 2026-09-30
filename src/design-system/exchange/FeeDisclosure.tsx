// design: js/ds/_ds_bundle.js components/exchange/FeeDisclosure.jsx — converted from the compiled bundle (scripts/ds2tsx.mjs), then typed by hand.
import { Fragment } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { OMark } from '../core/OMark';

export interface FeeLine {
  label: ReactNode;
  os: number;
  enables?: string;
  basis?: string;
  to?: string;
  when?: string;
}

export interface FeeDisclosureProps {
  subtotal: number;
  fees?: FeeLine[];
  currency?: string;
  rate?: number;
  style?: CSSProperties;
}

// v4.1 peg-lock: fiat surfaces fixed at 100 Os = $1 (rate 0.01); no ISR/tier rate.

const fmt = (n: number) => n.toLocaleString('en-US');

/**
 * FeeDisclosure — the honest fee line (protocol §8). Leads with what the fee
 * ENABLES, then discloses exact amount, calculation basis, recipient and timing,
 * and always shows the running total BEFORE confirmation. Never reveal an
 * unavoidable fee only at the last step.
 */
export function FeeDisclosure({
  subtotal,
  fees = [],
  currency = 'USD',
  rate = 0.01,
  style,
}: FeeDisclosureProps) {
  const feeTotal = fees.reduce((s, f) => s + f.os, 0);
  const total = subtotal + feeTotal;
  const money = (os: number) =>
    '≈ ' +
    (os * rate).toLocaleString('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    });
  const row = (label: ReactNode, os: number, opts: { total?: boolean; sub?: string } = {}) => (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 12,
        padding: opts.total ? '12px 0 0' : '5px 0',
      }}
    >
      <div
        style={{
          minWidth: 0,
        }}
      >
        <div
          style={{
            fontSize: opts.total ? 14 : 13,
            fontWeight: opts.total ? 700 : 500,
            color: opts.total ? 'var(--text)' : 'var(--text-dim)',
          }}
        >
          {label}
        </div>
        {opts.sub && (
          <div
            style={{
              fontSize: 11.5,
              color: 'var(--text-faint)',
              lineHeight: 1.45,
              marginTop: 2,
            }}
          >
            {opts.sub}
          </div>
        )}
      </div>
      <div
        style={{
          textAlign: 'right',
          flex: 'none',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontWeight: opts.total ? 800 : 600,
            fontSize: opts.total ? 17 : 13.5,
            color: 'var(--text)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            justifyContent: 'flex-end',
          }}
        >
          <OMark size="0.8em" color={opts.total ? 'var(--o-gold-ink)' : 'currentColor'} /> {fmt(os)}
        </div>
        <div
          style={{
            fontSize: 11,
            color: 'var(--text-faint)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {money(os)}
        </div>
      </div>
    </div>
  );
  return (
    <div
      style={{
        padding: '14px 16px',
        borderRadius: 16,
        background: 'var(--surface)',
        boxShadow: 'var(--nm-sm)',
        ...style,
      }}
    >
      {row('Subtotal', subtotal)}
      {fees.map((f, i) => (
        // key added in the port — the design mapped rows without one
        <Fragment key={i}>
          {row(f.label, f.os, {
            sub: [
              f.enables,
              f.basis && `Basis: ${f.basis}`,
              f.to && `To: ${f.to}`,
              f.when && `When: ${f.when}`,
            ]
              .filter(Boolean)
              .join(' · '),
          })}
        </Fragment>
      ))}
      <div
        style={{
          borderTop: '1px solid var(--border)',
          marginTop: 8,
        }}
      >
        {row('Total before you confirm', total, {
          total: true,
        })}
      </div>
    </div>
  );
}

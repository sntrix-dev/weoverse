// design: js/ds/_ds_bundle.js components/exchange/ValueLadder.jsx — converted from the compiled bundle (scripts/ds2tsx.mjs), then typed by hand.
import type { CSSProperties } from 'react';
import { OMark } from '../core/OMark';

export type ValueBucket = 'available' | 'protected' | 'pending' | 'locked';

export interface ValueLadderProps {
  balances?: Partial<Record<ValueBucket, number | null>>;
  currency?: string;
  rate?: number;
  compact?: boolean;
  style?: CSSProperties;
}

// v4.1 peg-lock: fiat surfaces fixed at 100 Os = $1 (rate 0.01); no ISR/tier rate.

const BUCKETS: { key: ValueBucket; label: string; desc: string; color: string }[] = [
  {
    key: 'available',
    label: 'Available',
    desc: 'Spendable now',
    color: 'var(--val-available)',
  },
  {
    key: 'protected',
    label: 'Protected',
    desc: 'Held / escrow-protected',
    color: 'var(--val-protected)',
  },
  {
    key: 'pending',
    label: 'Pending',
    desc: 'In flight, not settled',
    color: 'var(--val-pending)',
  },
  {
    key: 'locked',
    label: 'Locked',
    desc: 'Committed / time-locked',
    color: 'var(--val-locked)',
  },
];
const fmt = (n: number | null | undefined) => (n == null ? '—' : n.toLocaleString('en-US'));

/**
 * ValueLadder — the O Wallet's mental-accounting primitive (protocol §8).
 * Keeps available / protected / pending / locked Os visually SEPARATE so a
 * participant always knows what can actually be spent or withdrawn. Never sum
 * them into one headline "balance" — that hides what is really spendable.
 */
export function ValueLadder({
  balances = {},
  currency = 'USD',
  rate = 0.01,
  compact = false,
  style,
}: ValueLadderProps) {
  const rows = BUCKETS.filter((b) => balances[b.key] != null);
  const money = (os: number | null | undefined) =>
    '≈ ' +
    ((os ?? 0) * rate).toLocaleString('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    });
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: compact ? 6 : 10,
        ...style,
      }}
    >
      {rows.map((b) => (
        <div
          key={b.key}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: compact ? '8px 12px' : '12px 16px',
            borderRadius: 14,
            background: 'var(--surface)',
            boxShadow: 'var(--nm-sm)',
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: b.color,
              flex: 'none',
              boxShadow: `0 0 8px ${b.color}`,
            }}
          />
          <div
            style={{
              minWidth: 0,
              flex: 1,
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                letterSpacing: '.12em',
                textTransform: 'uppercase',
                color: 'var(--text-dim)',
              }}
            >
              {b.label}
            </div>
            {!compact && (
              <div
                style={{
                  fontSize: 11.5,
                  color: 'var(--text-faint)',
                }}
              >
                {b.desc}
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
                fontWeight: 700,
                fontSize: compact ? 15 : 18,
                color: 'var(--text)',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                justifyContent: 'flex-end',
              }}
            >
              <OMark size="0.82em" color={b.color} /> {fmt(balances[b.key])}
            </div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--text-faint)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {money(balances[b.key])}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

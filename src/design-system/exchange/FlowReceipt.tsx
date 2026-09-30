// design: js/ds/_ds_bundle.js components/exchange/FlowReceipt.jsx — converted from the compiled bundle (scripts/ds2tsx.mjs), then typed by hand.
import { Fragment } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { OMark } from '../core/OMark';
import { OPower } from './OPower';

export type FlowStatus = 'submitted' | 'received' | 'verified' | 'completed';

export interface ReceiptLine {
  label: ReactNode;
  value: ReactNode;
  mono?: boolean;
}

export interface FlowReceiptProps {
  title?: ReactNode;
  status?: FlowStatus;
  amountOs?: number | null;
  currency?: string;
  rate?: number;
  /** O Power index — what one O buys in this network */
  power?: number | null;
  lines?: ReceiptLine[];
  id?: string;
  timestamp?: ReactNode;
  onSupport?: () => void;
  onDone?: () => void;
  style?: CSSProperties;
}

// v4.1 peg-lock: fiat surfaces fixed at 100 Os = $1 (rate 0.01); no ISR/tier rate.
/**
 * FlowReceipt — the permanent, legible record every completed flow writes
 * (protocol §7 step 8, §8). Distinguishes submitted / received / verified /
 * completed, and preserves a recovery/support path. Generated task UI may vanish;
 * this receipt may not.
 */
export function FlowReceipt({
  title = 'Flow Receipt',
  status = 'completed',
  // submitted | received | verified | completed
  amountOs,
  currency = 'USD',
  rate = 0.01,
  power,
  // O Power index — what one O buys in this network
  lines = [],
  // [{ label, value }]
  id,
  timestamp,
  onSupport,
  onDone,
  style,
}: FlowReceiptProps) {
  const STAGES: FlowStatus[] = ['submitted', 'received', 'verified', 'completed'];
  const idx = Math.max(0, STAGES.indexOf(status));
  const fiat =
    amountOs != null
      ? (amountOs * rate).toLocaleString('en-US', {
          style: 'currency',
          currency,
          maximumFractionDigits: 2,
        })
      : null;
  return (
    <div
      style={{
        width: '100%',
        maxWidth: 360,
        padding: '20px 22px',
        borderRadius: 22,
        background: 'var(--surface)',
        boxShadow: 'var(--shadow-pop)',
        border: '1px solid var(--border)',
        ...style,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 14,
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: 'var(--status-success)',
            boxShadow: '0 0 8px var(--status-success)',
          }}
        />
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '.12em',
            textTransform: 'uppercase',
            color: 'var(--text-dim)',
          }}
        >
          {title}
        </div>
      </div>
      {amountOs != null && (
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 10,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              fontSize: 28,
              color: 'var(--text)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <OMark size="0.82em" color="var(--o-gold-ink)" />
            {amountOs.toLocaleString('en-US')}
            {power != null && <OPower power={power} size={13} />}
          </div>
          {fiat && (
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 14,
                color: 'var(--text-dim)',
              }}
            >
              {'\u2248 '}
              {fiat}
            </div>
          )}
        </div>
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          marginBottom: 16,
        }}
      >
        {STAGES.map((s, i) => (
          <Fragment key={s}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 5,
                flex: 'none',
              }}
            >
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: i <= idx ? 'var(--status-success)' : 'var(--surface-3)',
                  boxShadow: i <= idx ? '0 0 8px var(--status-success)' : 'var(--nm-inset)',
                  transition: 'background .3s',
                }}
              />
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 7.5,
                  letterSpacing: '.06em',
                  textTransform: 'uppercase',
                  color: i <= idx ? 'var(--text-dim)' : 'var(--text-faint)',
                }}
              >
                {s}
              </span>
            </div>
            {i < STAGES.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: 2,
                  background: i < idx ? 'var(--status-success)' : 'var(--surface-3)',
                  margin: '0 4px',
                  marginBottom: 16,
                  transition: 'background .3s',
                }}
              />
            )}
          </Fragment>
        ))}
      </div>
      {lines.map((l, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            padding: '6px 0',
            borderBottom: '1px solid var(--border)',
            fontSize: 12.5,
          }}
        >
          <span
            style={{
              color: 'var(--text-faint)',
            }}
          >
            {l.label}
          </span>
          <span
            style={{
              color: 'var(--text)',
              textAlign: 'right',
              fontFamily: l.mono ? 'var(--font-mono)' : 'inherit',
            }}
          >
            {l.value}
          </span>
        </div>
      ))}
      {(id || timestamp) && (
        <div
          style={{
            marginTop: 12,
            fontFamily: 'var(--font-mono)',
            fontSize: 10.5,
            color: 'var(--text-faint)',
            lineHeight: 1.6,
          }}
        >
          {id && (
            <div>
              {'Ref '}
              {id}
            </div>
          )}
          {timestamp && <div>{timestamp}</div>}
        </div>
      )}
      <div
        style={{
          display: 'flex',
          gap: 10,
          marginTop: 16,
        }}
      >
        {onDone && (
          <button
            onClick={onDone}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: 14,
              border: 'none',
              cursor: 'pointer',
              background: 'var(--surface)',
              color: 'var(--text)',
              fontWeight: 700,
              fontSize: 13.5,
              boxShadow: 'var(--nm-raised)',
            }}
          >
            Done
          </button>
        )}
        {onSupport && (
          <button
            onClick={onSupport}
            style={{
              flex: 'none',
              padding: '12px 16px',
              borderRadius: 14,
              cursor: 'pointer',
              background: 'transparent',
              color: 'var(--text-dim)',
              border: '1px solid var(--border)',
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            Get help
          </button>
        )}
      </div>
    </div>
  );
}

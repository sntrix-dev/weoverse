// design: js/ds/_ds_bundle.js components/exchange/CommitReview.jsx — converted from the compiled bundle (scripts/ds2tsx.mjs), then typed by hand.
import type { CSSProperties, ReactNode } from 'react';
import { OMark } from '../core/OMark';
import { OPower } from './OPower';

export interface CommitReviewProps {
  title?: ReactNode;
  what?: ReactNode;
  amountOs?: number | null;
  currency?: string;
  rate?: number;
  /** O Power index — what one O buys in this network */
  power?: number | null;
  when?: ReactNode;
  to?: ReactNode;
  next?: ReactNode;
  recover?: ReactNode;
  /** labelled recommendation with an honest basis */
  recommended?: { label: ReactNode; basis?: ReactNode } | null;
  confirmLabel?: ReactNode;
  onConfirm?: () => void;
  onEdit?: () => void;
  onCancel?: () => void;
  busy?: boolean;
  style?: CSSProperties;
}

// v4.1 peg-lock: fiat surfaces fixed at 100 Os = $1 (rate 0.01); no ISR/tier rate.
/**
 * CommitReview — the universal, LOW-creative-freedom review that precedes EVERY
 * consequential action (protocol §1, §3 law 8, §8). It answers the six questions
 * a participant must be able to answer before committing: WHAT, HOW MUCH, WHEN,
 * TO WHOM, WHAT HAPPENS NEXT, HOW TO RECOVER. Confirm is deliberate and
 * proportional; decline/pause/edit are always visible and equally legible.
 *
 * No commitment may be triggered by hover, swipe, drag-release, inactivity, or
 * navigation — only the explicit Confirm button here.
 */
export function CommitReview({
  title = 'Review before you confirm',
  what,
  amountOs,
  currency = 'USD',
  rate = 0.01,
  power,
  // O Power index — what one O buys in this network
  when,
  to,
  next,
  recover,
  recommended,
  // { label, basis } — labelled recommendation, honest basis
  confirmLabel = 'Confirm',
  onConfirm,
  onEdit,
  onCancel,
  busy = false,
  style,
}: CommitReviewProps) {
  const fiat =
    amountOs != null
      ? (amountOs * rate).toLocaleString('en-US', {
          style: 'currency',
          currency,
          maximumFractionDigits: 2,
        })
      : null;
  const line = (k: ReactNode, v: ReactNode) =>
    v == null ? null : (
      <div
        style={{
          display: 'flex',
          gap: 12,
          padding: '9px 0',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            width: 92,
            flex: 'none',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '.1em',
            textTransform: 'uppercase',
            color: 'var(--text-faint)',
            paddingTop: 2,
          }}
        >
          {k}
        </div>
        <div
          style={{
            fontSize: 13.5,
            color: 'var(--text)',
            lineHeight: 1.5,
            flex: 1,
          }}
        >
          {v}
        </div>
      </div>
    );
  return (
    <div
      style={{
        width: '100%',
        maxWidth: 380,
        padding: '20px 22px',
        borderRadius: 22,
        background: 'var(--surface)',
        boxShadow: 'var(--shadow-pop)',
        border: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        ...style,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 6,
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: 'var(--zone-low)',
            flex: 'none',
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
            margin: '2px 0 10px',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              fontSize: 30,
              color: 'var(--text)',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
            }}
          >
            <OMark size="0.82em" color="var(--o-gold-ink)" />
            {amountOs.toLocaleString('en-US')}
            {power != null && <OPower power={power} size={14} />}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 15,
              color: 'var(--text-dim)',
              fontWeight: 600,
            }}
          >
            {'\u2248 '}
            {fiat}
          </div>
        </div>
      )}
      {line('What', what)}
      {line('To', to)}
      {line('When', when)}
      {line('Next', next)}
      {line('Recover', recover)}
      {recommended && (
        <div
          style={{
            marginTop: 10,
            padding: '9px 12px',
            borderRadius: 12,
            background: 'var(--zone-guided-soft)',
            fontSize: 12.5,
            color: 'var(--text-dim)',
            lineHeight: 1.5,
          }}
        >
          <b
            style={{
              color: 'var(--o-blue)',
            }}
          >
            Recommended:
          </b>{' '}
          {recommended.label}
          {recommended.basis && (
            <span
              style={{
                color: 'var(--text-faint)',
              }}
            >
              {' \u2014 '}
              {recommended.basis}
            </span>
          )}
        </div>
      )}
      <div
        style={{
          display: 'flex',
          gap: 10,
          marginTop: 16,
        }}
      >
        <button
          onClick={onConfirm}
          disabled={busy}
          style={{
            flex: 1,
            padding: '13px 16px',
            borderRadius: 14,
            border: 'none',
            cursor: busy ? 'wait' : 'pointer',
            background: 'var(--status-success)',
            color: '#fff',
            fontWeight: 700,
            fontSize: 14.5,
            boxShadow: 'var(--nm-sm)',
            opacity: busy ? 0.7 : 1,
          }}
        >
          {busy ? 'Working…' : confirmLabel}
        </button>
        {onEdit && (
          <button onClick={onEdit} style={secBtn}>
            Edit
          </button>
        )}
        {onCancel && (
          <button onClick={onCancel} style={secBtn}>
            Not now
          </button>
        )}
      </div>
      <div
        style={{
          marginTop: 8,
          fontSize: 11,
          color: 'var(--text-faint)',
          textAlign: 'center',
          lineHeight: 1.5,
        }}
      >
        {'Nothing moves until you press '}
        {confirmLabel}. You can edit or decline with equal ease.
      </div>
    </div>
  );
}
const secBtn = {
  flex: 'none',
  padding: '13px 16px',
  borderRadius: 14,
  cursor: 'pointer',
  background: 'var(--surface)',
  color: 'var(--text-dim)',
  border: '1px solid var(--border)',
  fontWeight: 600,
  fontSize: 14,
  boxShadow: 'var(--nm-sm)',
};

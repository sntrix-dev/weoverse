// design: passport.jsx PassportBalance
import { useState } from 'react';
import { OMark, svg } from '@/design-system';
import { osFmt } from '@/lib/format';

/** The wallet's front door on the passport: what you can spend, and what is in flight. */
export function PassportBalance({
  available,
  inFlight,
  onWallet,
  onTopUp,
}: {
  available: number | null;
  inFlight: number | null;
  onWallet: () => void;
  onTopUp: () => void;
}) {
  const [hov, setHov] = useState(false);
  const fig = available == null ? '—' : osFmt(available);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        padding: '14px 16px 14px 20px',
        borderRadius: 24,
        minWidth: 0,
        alignSelf: 'stretch',
        background:
          'linear-gradient(135deg, color-mix(in srgb, var(--o-gold) 22%, var(--surface)), var(--surface) 70%)',
        boxShadow: `var(--nm-raised), inset 0 0 0 1px color-mix(in srgb, var(--o-gold) ${hov ? 60 : 38}%, transparent)`,
        transition: 'box-shadow .25s',
      }}
    >
      <button
        type="button"
        onClick={onWallet}
        aria-label={`O-Wallet · ${fig} Os available to spend`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 3,
          padding: 0,
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          font: 'inherit',
          textAlign: 'left',
          minWidth: 0,
        }}
      >
        <span
          style={{
            fontSize: 9.5,
            fontWeight: 700,
            letterSpacing: '.14em',
            textTransform: 'uppercase',
            color: 'var(--o-gold-ink, #8a6a06)',
          }}
        >
          Available to spend
        </span>
        <b
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 'clamp(28px,2.8vw,36px)',
            fontWeight: 700,
            letterSpacing: '-.04em',
            lineHeight: 1,
            color: 'var(--text)',
            fontVariantNumeric: 'tabular-nums',
            whiteSpace: 'nowrap',
          }}
        >
          <OMark size="0.62em" />
          {fig}
        </b>
        <span style={{ fontSize: 11, color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
          + {inFlight == null ? '—' : osFmt(inFlight)} protected, pending & locked
        </span>
      </button>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button
          type="button"
          onClick={onTopUp}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            height: 34,
            padding: '0 16px',
            borderRadius: 999,
            border: 'none',
            cursor: 'pointer',
            font: 'inherit',
            fontSize: 12.5,
            fontWeight: 700,
            color: '#3a2c00',
            background: 'linear-gradient(180deg, color-mix(in srgb, #F7C62B 88%, #fff), #F7C62B)',
            boxShadow: '0 10px 22px -10px color-mix(in srgb, #F7C62B 80%, transparent)',
          }}
        >
          {svg(
            <>
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </>,
            13,
            'currentColor',
            2.4,
          )}
          Top up
        </button>
        <button
          type="button"
          onClick={onWallet}
          style={{
            height: 34,
            padding: '0 16px',
            borderRadius: 999,
            border: 'none',
            cursor: 'pointer',
            font: 'inherit',
            fontSize: 12.5,
            fontWeight: 600,
            color: 'var(--text)',
            background: 'var(--surface)',
            boxShadow: 'var(--nm-sm), inset 0 0 0 1px var(--border)',
          }}
        >
          O-Wallet
        </button>
      </div>
    </div>
  );
}

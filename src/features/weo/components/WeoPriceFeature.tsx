import { useState } from 'react';
import { OMark, svg } from '@/design-system';
import type { WeoCardModel } from '@/lib/cardModel';
import { osFmt } from '@/lib/format';

/**
 * design: weo.jsx WeoPriceFeature — the price leads the WeO's page, in the WeO's own colour.
 * Ask (M05) opens the push sheet; Rehearse arrives with worlds (M11, D-027).
 */
export function WeoPriceFeature({ w, tone, onAsk }: { w: WeoCardModel; tone: string; onAsk?: () => void }) {
  const [hov, setHov] = useState(false);
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
        background: `linear-gradient(135deg, color-mix(in srgb, ${tone} 20%, var(--surface)), var(--surface) 70%)`,
        boxShadow: `var(--nm-raised), inset 0 0 0 1px color-mix(in srgb, ${tone} ${hov ? 60 : 38}%, transparent)`,
        transition: 'box-shadow .25s',
      }}
    >
      <button
        type="button"
        onClick={() =>
          document.getElementById('weo-collect')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
        aria-label={`${w.priceLabel} · ${osFmt(w.os)} Os — go to ${w.cta}`}
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
        }}
      >
        <span
          style={{
            fontSize: 9.5,
            fontWeight: 700,
            letterSpacing: '.14em',
            textTransform: 'uppercase',
            color: tone,
          }}
        >
          {w.priceLabel}
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
          {osFmt(w.os)}
        </b>
        <span style={{ fontSize: 11, color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
          {w.live ? 'Nothing is taken until you confirm' : 'This one has closed'}
        </span>
      </button>
      {onAsk && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button
            type="button"
            onClick={onAsk}
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
              fontWeight: 600,
              color: 'var(--text)',
              background: 'var(--surface)',
              boxShadow: 'var(--nm-sm), inset 0 0 0 1px var(--border)',
            }}
          >
            {svg(
              <path d="M20.5 11.5a8 8 0 0 1-8 8 8 8 0 0 1-3.6-.85L3.5 20.5l1.85-5.4A8 8 0 0 1 12.5 3.5a8 8 0 0 1 8 8z" />,
              13,
              'currentColor',
              1.8,
            )}
            Ask
          </button>
        </div>
      )}
    </div>
  );
}

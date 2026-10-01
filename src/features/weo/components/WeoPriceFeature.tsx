import { useState } from 'react';
import { OMark } from '@/design-system';
import type { WeoCardModel } from '@/lib/cardModel';
import { osFmt } from '@/lib/format';

/**
 * design: weo.jsx WeoPriceFeature — the price leads the WeO's page, in the WeO's own colour.
 * The design's Rehearse (M11) and Ask (M05) buttons arrive with their modules (D-027).
 */
export function WeoPriceFeature({ w, tone }: { w: WeoCardModel; tone: string }) {
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
    </div>
  );
}

import { useState } from 'react';
import { Chip, OMark, Orb, svg } from '@/design-system';
import { openCollect } from '@/stores/flow';
import type { WeoCardModel } from '@/lib/cardModel';
import { osFmt } from '@/lib/format';

/** design: screens-discover.jsx WeoTimer — the countdown is the WeO's own close time, at rest. */
export function WeoTimer({ t, tone }: { t: string | null | undefined; tone?: string }) {
  if (!t) return null;
  const h = parseInt(String(t).split(':')[0] ?? '0', 10) || 0;
  const hot = h < 12;
  const c = hot ? '#F7C62B' : tone || 'var(--text-dim)';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        borderRadius: 999,
        padding: '3px 9px',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '.02em',
        color: c,
        background: `color-mix(in srgb, ${c} 12%, var(--surface))`,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: '50%',
          background: c,
          animation: hot ? 'weo-breathe-sm 2.2s var(--ease-standard) infinite' : 'none',
        }}
      />
      {t}
    </span>
  );
}

/**
 * design: section-hero.jsx WeoPriceAtRest — one unit, on the card's own row, never behind a
 * flip; the tier advantage rides beside it as a percentage (hidden until G-23 gives one).
 */
export function WeoPriceAtRest({
  os,
  label,
  advPct,
  align,
}: {
  os: number;
  label?: string;
  advPct?: number;
  align?: 'center' | 'flex-start' | 'flex-end';
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'baseline',
        justifyContent: align || 'center',
        gap: 9,
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'baseline',
          gap: 5,
          fontSize: 19,
          fontWeight: 700,
          letterSpacing: '-.025em',
          color: 'var(--text)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        <OMark size="0.66em" />
        {osFmt(os || 0)}
      </span>
      {label && (
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '.13em',
            textTransform: 'uppercase',
            color: 'var(--text-faint)',
          }}
        >
          {label}
        </span>
      )}
      {advPct ? (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            borderRadius: 999,
            padding: '3px 9px',
            fontSize: 10,
            fontWeight: 600,
            color: 'var(--o-green)',
            boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--o-green) 34%, var(--border))',
          }}
        >
          <OMark size={9} />
          {advPct}% off for you
        </span>
      ) : null}
    </div>
  );
}

/**
 * design: screens-discover.jsx StallTile (v4) — a faint wash of the WeO's photo behind a 120px
 * orb; type, urgency and the close time, the name, rarity and the one price. On approach the
 * tile lifts, takes its format colour and opens a drawer: what the price is, who is here now,
 * and the one action (Place a bid while it is under the clock, else Collect).
 */
export function StallTile({ w, onOpen }: { w: WeoCardModel; onOpen: (w: WeoCardModel) => void }) {
  const [hov, setHov] = useState(false);
  const tone = w.hex;
  const hrs = hoursOf(w.timer);
  const urg =
    hrs == null
      ? w.activeNow >= 10
        ? 'Moving'
        : null
      : hrs <= 12
        ? 'Closing now'
        : hrs <= 48
          ? 'Closing soon'
          : null;
  const urgent = urg === 'Closing now' || urg === 'Closing soon';
  const cta = w.timer ? 'Place a bid' : 'Collect';
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onFocus={() => setHov(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHov(false);
      }}
      onClick={() => onOpen(w)}
      role="button"
      tabIndex={0}
      aria-label={`${w.name} · ${w.type}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && e.target === e.currentTarget) onOpen(w);
      }}
      style={{
        position: 'relative',
        zIndex: hov ? 6 : 1,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        minWidth: 0,
        cursor: 'pointer',
        borderRadius: 24,
        padding: 15,
        background: hov ? `color-mix(in srgb, ${tone} 16%, var(--surface))` : 'var(--surface)',
        boxShadow: hov
          ? `0 22px 46px -20px color-mix(in srgb, ${tone} 85%, transparent), inset 0 0 0 1.5px ${tone}`
          : 'var(--nm-raised), inset 0 0 0 1px var(--border)',
        transform: hov ? 'translateY(-5px)' : 'none',
        transition: 'background .3s, box-shadow .32s, transform .32s var(--ease-settle)',
      }}
    >
      {w.img && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            borderRadius: 'inherit',
            overflow: 'hidden',
          }}
        >
          <img
            src={w.img}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: hov ? 0.44 : 0.17,
              filter: hov ? 'saturate(1.2)' : 'none',
              transition: 'opacity .4s, filter .4s',
            }}
          />
          <span
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(180deg, color-mix(in srgb, var(--surface) 58%, transparent) 0%, color-mix(in srgb, var(--surface) 90%, transparent) 46%, var(--surface) 100%)',
            }}
          />
          <span
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(190deg, transparent 46%, color-mix(in srgb, ${tone} 16%, transparent))`,
            }}
          />
        </span>
      )}
      {w.img && (
        <div style={{ position: 'relative', flex: '0 0 auto', display: 'grid', placeItems: 'center' }}>
          <Orb
            size={120 + (hov ? 10 : 0)}
            fill="image"
            src={w.img}
            ring
            ringColor={tone}
            matcap
            breathe={hov || urgent}
          />
        </div>
      )}
      <div style={{ position: 'relative', minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              borderRadius: 999,
              padding: hov ? '3px 10px' : '3px 0',
              background: hov ? tone : 'transparent',
              transition: 'background .26s, padding .26s',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: hov ? '#fff' : tone,
                flex: '0 0 auto',
                transition: 'background .24s',
              }}
            />
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '.15em',
                textTransform: 'uppercase',
                color: hov ? '#fff' : 'var(--text-faint)',
                transition: 'color .24s',
              }}
            >
              {w.type}
            </span>
          </span>
          {urg && <Chip tone={tone}>{urg}</Chip>}
          {w.timer && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: 'var(--text-faint)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {w.timer}
            </span>
          )}
        </span>
        <h3
          style={{
            margin: '8px 0 0',
            fontSize: 14.5,
            fontWeight: 600,
            letterSpacing: '-.022em',
            lineHeight: 1.14,
            color: hov ? 'var(--text)' : 'var(--text-dim)',
            transition: 'color .24s',
            textWrap: 'pretty',
          }}
        >
          {w.name}
        </h3>
        <span style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 9 }}>
          <span
            style={{
              fontSize: 11.5,
              color: 'var(--text-faint)',
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {w.rarity}
          </span>
          <span
            style={{
              marginLeft: 'auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 13.5,
              fontWeight: 700,
              color: 'var(--text)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <OMark size={12} /> {osFmt(w.os)}
          </span>
        </span>
        {/* the drawer: what the price is, who is here, the one action */}
        <div
          style={{
            display: 'grid',
            gridTemplateRows: hov ? '1fr' : '0fr',
            transition: 'grid-template-rows .44s var(--ease-portal)',
          }}
        >
          <div style={{ overflow: 'hidden', minHeight: 0 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                flexWrap: 'wrap',
                marginTop: 12,
                paddingTop: 12,
                borderTop: '1px solid var(--border)',
                opacity: hov ? 1 : 0,
                transition: 'opacity .3s .05s',
              }}
            >
              <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span
                  style={{
                    fontSize: 10,
                    letterSpacing: '.06em',
                    textTransform: 'uppercase',
                    color: 'var(--text-faint)',
                  }}
                >
                  {w.priceLabel}
                </span>
                {w.activeNow > 0 && (
                  <span style={{ fontSize: 11.5, fontWeight: 500, color: tone }}>{w.activeNow} here now</span>
                )}
              </span>
              <button
                type="button"
                tabIndex={hov ? 0 : -1}
                onClick={(e) => {
                  e.stopPropagation();
                  openCollect(w.id);
                }}
                style={{
                  marginLeft: 'auto',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: 999,
                  padding: '9px 16px',
                  font: 'inherit',
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: '#fff',
                  background: tone,
                  boxShadow: `0 8px 18px -8px color-mix(in srgb, ${tone} 90%, transparent)`,
                }}
              >
                {cta}
                {svg(<polyline points="9 6 15 12 9 18" />, 14, 'currentColor', 2.4)}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** hours left on a "hh:mm:ss" countdown */
function hoursOf(t: string | null): number | null {
  if (!t) return null;
  const p = String(t).split(':').map(Number);
  return Number.isNaN(p[0]) ? null : (p[0] ?? 0) + (p[1] ?? 0) / 60;
}

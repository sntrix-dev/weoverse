import { useState } from 'react';
import { Button, ISRRing, OButton, Orb, OMark, svg, WeOCard } from '@/design-system';
import type { WeoCardModel } from '@/lib/cardModel';
import { osFmt } from '@/lib/format';
import { WeoPriceAtRest } from './WeoBits';
import { weoCardProps, type WeoHandlers } from './weoCardProps';

/** design: screens-hub.jsx WeoActions — the WeO's own verbs, revealed on approach. */
export function WeoActions({ w, h, show }: { w: WeoCardModel; h: WeoHandlers; show: boolean }) {
  if (!h.onPush && !h.onRehearse) return null;
  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        opacity: show ? 1 : 0,
        transform: `translateY(${show ? 0 : 6}px)`,
        transition: 'opacity .26s, transform .34s var(--ease-portal)',
        pointerEvents: show ? 'auto' : 'none',
      }}
    >
      {h.onPush && (
        <Button size="sm" variant="ghost" tone="violet" onClick={() => h.onPush?.(w)}>
          Push to Circle
        </Button>
      )}
      {h.onRehearse && (
        <Button size="sm" variant="ghost" tone="blue" onClick={() => h.onRehearse?.(w)}>
          Rehearse
        </Button>
      )}
    </div>
  );
}

/**
 * design: screens-hub.jsx WeoTile — one WeO card, everywhere. Only the width and the engage
 * action change per context.
 */
export function WeoTile({
  w,
  h,
  width,
  active,
  engageLabel,
  onEngage,
  advPct,
}: {
  w: WeoCardModel;
  h: WeoHandlers;
  width?: number;
  active?: boolean;
  engageLabel?: string;
  onEngage?: () => void;
  advPct?: number;
}) {
  const engage = onEngage ?? (() => h.onOpen(w));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div
        onClick={engage}
        onKeyDown={(e) => e.key === 'Enter' && engage()}
        role="button"
        tabIndex={0}
        aria-label={`Open ${w.name}`}
        style={{ cursor: 'pointer' }}
      >
        <WeOCard
          w={width || 240}
          active={active}
          {...weoCardProps(w, h)}
          engageLabel={engageLabel || w.cta || 'Collect'}
          onEngage={engage}
        />
      </div>
      <WeoPriceAtRest os={w.os} label={w.priceLabel} advPct={advPct} />
    </div>
  );
}

/** design: screens-hub.jsx MyWeoCard — the card, its price at rest, its verbs on approach. */
export function MyWeoCard({
  w,
  h,
  i = 0,
  advPct,
}: {
  w: WeoCardModel;
  h: WeoHandlers;
  i?: number;
  advPct?: number;
}) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 11,
        animation: `weo-cardin .5s var(--ease-settle) ${i * 0.07}s both`,
      }}
    >
      <div
        onClick={() => h.onOpen(w)}
        onKeyDown={(e) => e.key === 'Enter' && h.onOpen(w)}
        role="button"
        tabIndex={0}
        aria-label={`Open ${w.name}`}
        style={{ cursor: 'pointer' }}
      >
        <WeOCard w={272} {...weoCardProps(w, h)} />
      </div>
      <WeoPriceAtRest os={w.os} label={w.priceLabel} advPct={advPct} />
      <WeoActions w={w} h={h} show={hov} />
    </div>
  );
}

/** design: screens-hub.jsx WeoCarousel — one card in focus, its neighbours stepping back. */
export function WeoCarousel({ list, h }: { list: WeoCardModel[]; h: WeoHandlers }) {
  const items = list;
  const [idx, setIdx] = useState(0);
  const go = (d: number) => setIdx((i) => (i + d + items.length) % items.length);
  return (
    <div
      style={{
        position: 'relative',
        height: 500,
        borderRadius: 30,
        background: 'var(--surface-2)',
        boxShadow: 'var(--nm-inset)',
        overflow: 'hidden',
      }}
    >
      {items.map((w, i) => {
        let off = i - idx;
        if (off > items.length / 2) off -= items.length;
        if (off < -items.length / 2) off += items.length;
        const focus = off === 0;
        const far = Math.abs(off) > 1.5;
        return (
          <div
            key={w.id}
            onClick={() => !focus && setIdx(i)}
            role="presentation"
            style={{
              position: 'absolute',
              left: '50%',
              top: 26,
              marginLeft: -130,
              width: 260,
              cursor: focus ? 'default' : 'pointer',
              zIndex: 10 - Math.abs(off),
              transformOrigin: 'top center',
              transform: `translateX(${off * 274}px) scale(${focus ? 1 : 0.78})`,
              opacity: far ? 0 : focus ? 1 : 0.5,
              transition: 'transform .62s var(--ease-portal), opacity .42s',
            }}
          >
            <WeOCard format="card" w={260} selected={focus} {...weoCardProps(w, h)} />
            <div style={{ marginTop: 9 }}>
              <WeoPriceAtRest os={w.os} label={w.priceLabel} />
            </div>
          </div>
        );
      })}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 18,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 18,
        }}
      >
        <OButton variant="ghost" size={40} aria-label="Previous WeO" onClick={() => go(-1)}>
          {svg(<polyline points="15 6 9 12 15 18" />, 18, 'currentColor', 1.8)}
        </OButton>
        <div style={{ display: 'flex', gap: 6 }}>
          {items.map((w, i) => (
            <span
              key={w.id}
              style={{
                width: i === idx ? 20 : 7,
                height: 7,
                borderRadius: 999,
                background: i === idx ? 'var(--o-violet)' : 'var(--surface-3)',
                transition: 'width .4s var(--ease-portal), background .3s',
              }}
            />
          ))}
        </div>
        <OButton variant="ghost" size={40} aria-label="Next WeO" onClick={() => go(1)}>
          {svg(<polyline points="9 6 15 12 9 18" />, 18, 'currentColor', 1.8)}
        </OButton>
      </div>
    </div>
  );
}

export interface OrbitCentre {
  avatarUrl: string | null;
  isr: number;
}

/** design: screens-hub.jsx WeoOrbitView — your WeOs circling your standing. */
export function WeoOrbitView({ list, h, me }: { list: WeoCardModel[]; h: WeoHandlers; me?: OrbitCentre }) {
  const items = list;
  const R = 168;
  const tap = (w: WeoCardModel) => (h.onPush ? h.onPush(w) : h.onOpen(w));
  return (
    <div
      className="orbit-ring"
      style={{
        position: 'relative',
        height: 440,
        borderRadius: 30,
        background: 'var(--surface-2)',
        boxShadow: 'var(--nm-inset)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: R * 2,
          height: R * 2,
          marginLeft: -R,
          marginTop: -R,
        }}
      >
        <div
          style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px dashed var(--border)' }}
        />
        <div
          style={{ position: 'absolute', inset: 46, borderRadius: '50%', border: '1px solid var(--border)' }}
        />
        <div style={{ position: 'absolute', inset: 0, animation: 'weo-orbit 38s linear infinite' }}>
          {items.map((w, i) => (
            <div
              key={w.id}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: `rotate(${(i / items.length) * 360}deg) translateY(-${R}px)`,
              }}
            >
              <div
                style={{ animation: 'weo-orbit-rev 38s linear infinite', marginLeft: -39, marginTop: -39 }}
              >
                <button
                  type="button"
                  onClick={() => tap(w)}
                  title={`${w.name} · ${w.type}`}
                  aria-label={`${w.name} · ${w.type}`}
                  style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}
                >
                  <Orb
                    size={78}
                    fill="image"
                    src={w.img ?? undefined}
                    ring
                    ringColor={w.hex}
                    matcap
                    breathe
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
        {me && (
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%,-50%)',
              width: 150,
              height: 150,
            }}
          >
            <ISRRing value={me.isr} size={150} showStage={false} showValue={false} />
            <span
              style={{
                position: 'absolute',
                inset: 18,
                borderRadius: '50%',
                overflow: 'hidden',
                background: me.avatarUrl
                  ? `url('${me.avatarUrl}') center/cover, var(--surface)`
                  : 'var(--surface)',
                boxShadow: 'inset 0 0 0 1px var(--border)',
              }}
            />
          </div>
        )}
      </div>
      <p
        style={{
          position: 'absolute',
          left: 20,
          bottom: 16,
          margin: 0,
          fontSize: 10.5,
          fontWeight: 700,
          letterSpacing: '.14em',
          textTransform: 'uppercase',
          color: 'var(--text-faint)',
        }}
      >
        {items.length} WeOs{me ? ` · ISR ${me.isr}` : ''}
      </p>
    </div>
  );
}

/** design: screens-hub.jsx WeoList — one row per WeO, the verbs on approach. */
export function WeoList({ list, h }: { list: WeoCardModel[]; h: WeoHandlers }) {
  const [hovId, setHovId] = useState<string | null>(null);
  return (
    <div
      style={{
        display: 'grid',
        gap: 1,
        borderRadius: 26,
        overflow: 'hidden',
        background: 'var(--border)',
        boxShadow: 'var(--nm-raised), inset 0 0 0 1px var(--border)',
      }}
    >
      {list.map((w, i) => (
        <div
          key={w.id}
          onMouseEnter={() => setHovId(w.id)}
          onMouseLeave={() => setHovId(null)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            flexWrap: 'wrap',
            padding: '14px 18px',
            background:
              hovId === w.id ? 'color-mix(in srgb, var(--o-violet) 4%, var(--surface))' : 'var(--surface)',
            transition: 'background .26s',
            animation: `weo-cardin .44s var(--ease-settle) ${i * 0.06}s both`,
          }}
        >
          <Orb
            size={54}
            fill="image"
            src={w.img ?? undefined}
            ring
            ringColor={w.hex}
            matcap
            breathe={hovId === w.id}
            style={{ flex: '0 0 auto' }}
          />
          <div style={{ minWidth: 0, flex: '1 1 200px' }}>
            <h3
              style={{
                margin: 0,
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: '-.01em',
                color: 'var(--text)',
              }}
            >
              {w.name}
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 11.5, color: 'var(--text-faint)' }}>
              {w.type} · {w.category} · {w.edition}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 18, flex: '0 0 auto' }}>
            {w.terms.slice(0, 2).map((t) => (
              <span key={t.k} style={{ display: 'flex', flexDirection: 'column' }}>
                <span
                  style={{
                    fontSize: 13.5,
                    fontWeight: 700,
                    color: 'var(--text)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {t.v}
                </span>
                <span style={{ fontSize: 10, color: 'var(--text-faint)' }}>{t.k}</span>
              </span>
            ))}
          </div>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 15,
              fontWeight: 700,
              color: 'var(--text)',
              fontVariantNumeric: 'tabular-nums',
              flex: '0 0 auto',
            }}
          >
            <OMark size={13} /> {osFmt(w.os)}
          </span>
          <div
            style={{
              flex: '0 0 auto',
              marginLeft: 'auto',
              width: 236,
              display: 'flex',
              justifyContent: 'flex-end',
            }}
          >
            <WeoActions w={w} h={h} show={hovId === w.id} />
          </div>
        </div>
      ))}
    </div>
  );
}

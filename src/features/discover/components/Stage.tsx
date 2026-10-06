import { useState } from 'react';
import { OsRun } from '@/components/text/OsRun';
import { Avatar, OButton, OMark, Orb, svg } from '@/design-system';
import type { WeoCardModel } from '@/lib/cardModel';
import { osFmt } from '@/lib/format';
import { askAbout, openCollect, openCreator, openWorld } from '@/stores/flow';

/** design: discover.jsx StageDeck — every candidate present, neutral until it is the one on stage. */
export function StageDeck({ list }: { list: WeoCardModel[] }) {
  const [i, setI] = useState(0);
  if (!list.length) return null;
  const at = ((i % list.length) + list.length) % list.length;
  const w = list[at] as WeoCardModel;
  const go = (n: number) => setI((x) => x + n);
  return (
    <div id="d-stage">
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '.15em',
            textTransform: 'uppercase',
            color: 'var(--text-faint)',
            flex: '0 0 auto',
          }}
        >
          On the stage
        </span>
        <span
          style={{
            fontSize: 11.5,
            fontWeight: 400,
            color: 'var(--text-faint)',
            flex: '1 1 auto',
            minWidth: 0,
          }}
        >
          {at + 1} of {list.length} · {w.name}
        </span>
        <span style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 7, flex: '0 0 auto' }}>
          {list.map((it, n) => {
            const on = n === at;
            return (
              <button
                type="button"
                key={it.id}
                onClick={() => setI(n)}
                title={it.name}
                aria-label={it.name}
                aria-current={on ? 'true' : undefined}
                style={{
                  position: 'relative',
                  width: 40,
                  height: 40,
                  padding: 0,
                  border: 'none',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  background: 'transparent',
                  flex: '0 0 auto',
                  transform: on ? 'scale(1.08)' : 'none',
                  opacity: on ? 1 : 0.62,
                  transition: 'transform .26s var(--ease-portal), opacity .24s',
                }}
              >
                <Orb
                  size={40}
                  fill="image"
                  src={it.img}
                  ring
                  ringColor={on ? it.hex : 'var(--border)'}
                  matcap
                  breathe={on}
                />
              </button>
            );
          })}
          <span style={{ width: 1, height: 22, background: 'var(--border)', margin: '0 2px' }} />
          <OButton variant="ghost" size={38} aria-label="Previous" onClick={() => go(-1)}>
            {svg(<polyline points="15 18 9 12 15 6" />, 16, 'currentColor', 2)}
          </OButton>
          <OButton variant="ghost" size={38} aria-label="Next" onClick={() => go(1)}>
            {svg(<polyline points="9 6 15 12 9 18" />, 16, 'currentColor', 2)}
          </OButton>
        </span>
      </div>
      <div key={w.id} style={{ animation: 'weo-cardin .46s var(--ease-settle) both' }}>
        <StageWeo w={w} />
      </div>
    </div>
  );
}

/**
 * design: discover.jsx StageWeo — the loudest thing on the floor: the WeO's own photograph is the
 * poster. Rehearse it opens the World Studio (M11); Ask about it, the push sheet (M05).
 */
export function StageWeo({ w }: { w: WeoCardModel }) {
  const [hov, setHov] = useState(false);
  const tone = w.hex;
  const cr = w.creator;
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 'clamp(20px,3vw,44px)',
        borderRadius: 34,
        padding: 'clamp(20px,2.8vw,34px)',
        color: '#fff',
        background: '#0b0e18',
        boxShadow: hov
          ? `0 28px 60px -26px color-mix(in srgb, ${tone} 85%, transparent), inset 0 0 0 1.5px ${tone}`
          : `var(--nm-hero), inset 0 0 0 1px color-mix(in srgb, ${tone} 40%, transparent)`,
        transition: 'box-shadow .34s',
      }}
    >
      <span aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {w.img && (
          <img
            src={w.img}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: hov ? 0.58 : 0.44,
              filter: 'saturate(1.18)',
              transition: 'opacity .4s',
            }}
          />
        )}
        <span
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(100deg, rgba(8,10,18,.9) 0%, rgba(8,10,18,.66) 46%, rgba(8,10,18,.34) 100%)',
          }}
        />
        <span
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(180deg, transparent 40%, color-mix(in srgb, ${tone} 34%, transparent) 100%)`,
          }}
        />
      </span>

      <div
        style={{
          position: 'relative',
          flex: '0 0 auto',
          margin: '0 auto',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: `radial-gradient(circle, color-mix(in srgb, ${tone} 46%, transparent), transparent 66%)`,
            filter: 'blur(28px)',
            opacity: hov ? 1 : 0.7,
            transition: 'opacity .4s',
          }}
        />
        <button
          type="button"
          onClick={() => openCollect(w.id)}
          title={w.name}
          aria-label={`${w.cta} · ${w.name}`}
          className="weo-req-orb"
          style={{
            position: 'relative',
            border: 'none',
            background: 'transparent',
            padding: 0,
            cursor: 'pointer',
          }}
        >
          <Orb size={236} fill="image" src={w.img} ring ringColor={tone} matcap breathe />
        </button>
      </div>

      <div style={{ position: 'relative', flex: '1 1 320px', minWidth: 280 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              borderRadius: 999,
              padding: '4px 11px',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '.14em',
              textTransform: 'uppercase',
              color: '#fff',
              background: tone,
            }}
          >
            {w.live && (
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#fff',
                  animation: 'weo-breathe 2.2s ease-in-out infinite',
                }}
              />
            )}
            {w.type}
          </span>
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 600,
              letterSpacing: '.14em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,.86)',
              textShadow: '0 1px 8px rgba(8,10,18,.7)',
            }}
          >
            {w.category}
          </span>
          {w.timer && (
            <span
              style={{ fontSize: 12, fontWeight: 700, color: '#fff', fontVariantNumeric: 'tabular-nums' }}
            >
              {w.timer}
            </span>
          )}
        </span>
        <h2
          style={{
            margin: '11px 0 0',
            fontSize: 'clamp(26px,3.2vw,40px)',
            fontWeight: 700,
            letterSpacing: '-.038em',
            lineHeight: 1.02,
            textWrap: 'pretty',
            textShadow: '0 3px 22px rgba(8,10,18,.5)',
          }}
        >
          {w.name}
        </h2>
        {w.points[0] && (
          <p
            style={{
              margin: '11px 0 0',
              maxWidth: '46ch',
              fontSize: 13.5,
              lineHeight: 1.55,
              color: 'rgba(255,255,255,.9)',
              textShadow: '0 1px 10px rgba(8,10,18,.6)',
            }}
          >
            {w.points[0]}
          </p>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(110px,1fr))',
            gap: 10,
            marginTop: 18,
          }}
        >
          {w.terms.map((t) => (
            <div
              key={t.k}
              style={{
                borderRadius: 16,
                padding: '11px 13px',
                background: 'rgba(255,255,255,.1)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.18)',
              }}
            >
              <span
                style={{
                  display: 'block',
                  fontSize: 14.5,
                  fontWeight: 700,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                <OsRun text={t.v} />
              </span>
              <span
                style={{
                  display: 'block',
                  marginTop: 2,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '.1em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,.62)',
                }}
              >
                {t.k}
              </span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 18 }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openCreator(cr.id);
            }}
            title={`Open ${cr.handle}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              border: 'none',
              background: 'transparent',
              padding: 0,
              cursor: 'pointer',
              font: 'inherit',
            }}
          >
            <Avatar src={cr.avatarUrl ?? undefined} isr={cr.isr} size={30} />
            <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,.8)' }}>
              {cr.handle} · ISR {cr.isr}
            </span>
          </button>
          <span
            style={{
              marginLeft: 'auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 21,
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <OMark size={16} />
            {osFmt(w.os)}
          </span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginTop: 18 }}>
          <button
            type="button"
            onClick={() => openCollect(w.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              border: 'none',
              cursor: 'pointer',
              borderRadius: 999,
              padding: '12px 20px',
              font: 'inherit',
              fontSize: 13.5,
              fontWeight: 700,
              color: '#0b0e18',
              background: '#fff',
              boxShadow: '0 10px 26px -10px rgba(8,10,18,.6)',
            }}
          >
            {w.cta}
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: tone }} />
          </button>
          {(
            [
              ['Rehearse it', () => openWorld({ weoId: w.id })],
              ['Ask about it', () => askAbout(w)],
            ] as const
          ).map(([label, go]) => (
            <button
              key={label}
              type="button"
              onClick={go}
              style={{
                border: 'none',
                cursor: 'pointer',
                borderRadius: 999,
                padding: '12px 18px',
                font: 'inherit',
                fontSize: 13,
                fontWeight: 600,
                color: '#fff',
                background: 'rgba(255,255,255,.12)',
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.24)',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

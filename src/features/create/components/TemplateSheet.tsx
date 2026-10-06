// design: create.jsx TemplateSheet — the template picker as a room of its own: the template AS a
// WeO card, the figures called out either side, what it fills in, and the whole set as a filmstrip.
import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Button, OMark, WeOCard, svg } from '@/design-system';
import { osFmt } from '@/lib/format';
import type { TemplateDto } from '../api/create';
import { CREATE_TEMPLATES, createTone } from '../model/formats';
import { cssUrl } from '@/lib/cssUrl';

/** What a locked template says when it is pressed. */
export const lockedLine = (tp: TemplateDto) =>
  `${tp.name} · ${tp.plan ?? 'Premium'} plan${tp.unlockOs ? `, or O ${osFmt(tp.unlockOs)} outright` : ''}`;

function Fact({ v, k, note }: { v: ReactNode; k: string; note?: string }) {
  return (
    <div
      style={{
        borderRadius: 18,
        padding: '12px 14px',
        background: 'var(--surface-2)',
        boxShadow: 'var(--nm-inset)',
      }}
    >
      <span
        style={{
          display: 'block',
          fontSize: 9.5,
          fontWeight: 700,
          letterSpacing: '.12em',
          textTransform: 'uppercase',
          color: 'var(--text-faint)',
        }}
      >
        {k}
      </span>
      <span
        style={{
          display: 'block',
          marginTop: 4,
          fontSize: 16,
          fontWeight: 700,
          letterSpacing: '-.02em',
          color: 'var(--text)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {v}
      </span>
      {note && (
        <span
          style={{
            display: 'block',
            marginTop: 3,
            fontSize: 10.5,
            lineHeight: 1.4,
            color: 'var(--text-faint)',
          }}
        >
          {note}
        </span>
      )}
    </div>
  );
}

const roundBtn = {
  display: 'grid',
  placeItems: 'center',
  width: 40,
  height: 40,
  borderRadius: 999,
  border: 'none',
  cursor: 'pointer',
  background: 'var(--surface)',
  boxShadow: 'var(--nm-sm)',
  color: 'var(--text-dim)',
} as const;

export function TemplateSheet({
  templates,
  onPick,
  onLocked,
  onClose,
}: {
  templates: readonly TemplateDto[];
  onPick: (tp: TemplateDto) => void;
  onLocked: (tp: TemplateDto) => void;
  onClose: () => void;
}) {
  const all = templates;
  const [i, setI] = useState(0);
  const n = all.length;
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setI((x) => (x + 1) % Math.max(1, n));
      else if (e.key === 'ArrowLeft') setI((x) => (x - 1 + n) % Math.max(1, n));
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [n, onClose]);
  const tp = all[Math.max(0, Math.min(n - 1, i))];
  if (!tp) return null;
  const go = (d: number) => setI((x) => (x + d + n) % n);
  const tt = createTone(tp.format);
  const open = tp.usable;
  const use = () => {
    if (!open) return onLocked(tp);
    onPick(tp);
    onClose();
  };
  const qty = tp.qty || 1;
  // what the template actually fills in for you — the informed part of the choice
  const fills: [string, boolean][] = [
    ['Title', !!tp.name],
    ['One-liner', !!tp.line],
    ['Category', !!tp.category.name],
    ['Image', !!tp.image],
    ['Price', tp.os > 0],
    ['Edition', qty > 1],
  ];
  const filled = fills.filter((f) => f[1]).length;
  return createPortal(
    <div
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2400,
        display: 'grid',
        placeItems: 'center',
        padding: 20,
        overflowY: 'auto',
        background: 'color-mix(in srgb, var(--text) 40%, transparent)',
        backdropFilter: 'blur(6px)',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Start from a template"
        style={{
          width: 'min(880px, 100%)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          borderRadius: 32,
          padding: 'clamp(18px,2vw,26px)',
          background: 'var(--surface)',
          boxShadow: 'var(--shadow-card), inset 0 0 0 1px var(--glass-brd)',
          animation: 'weo-cardin .32s var(--ease-portal) both',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: '.14em',
                textTransform: 'uppercase',
                color: 'var(--text-faint)',
              }}
            >
              Start from a template
            </p>
            <h3
              style={{
                margin: '5px 0 0',
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: '-.03em',
                color: 'var(--text)',
              }}
            >
              A WeO that is already most of the way there
            </h3>
          </div>
          <span
            style={{
              marginLeft: 'auto',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text-faint)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {i + 1} / {n}
          </span>
        </div>

        <div
          className="weo-tpl-stage"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(150px,.72fr) minmax(230px,1fr) minmax(150px,.72fr)',
            gap: 'clamp(12px,1.8vw,22px)',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, minWidth: 0 }}>
            <Fact
              v={tp.format}
              k="Format"
              note={CREATE_TEMPLATES.find((x) => x.key === tp.format)?.blurb ?? 'How the terms behave'}
            />
            <Fact
              v={
                tp.os > 0 ? (
                  <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4 }}>
                    <OMark size={12} />
                    {osFmt(tp.os)}
                  </span>
                ) : (
                  'Free'
                )
              }
              k="Suggested ask"
              note="Yours to change"
            />
          </div>

          <div
            key={tp.key}
            style={{
              display: 'grid',
              placeItems: 'center',
              animation: 'weo-cardin .32s var(--ease-portal) both',
            }}
          >
            <WeOCard
              w={268}
              name={tp.name}
              typeLabel={tp.format + (tp.category.name ? ` · ${tp.category.name}` : '')}
              id="Template"
              tone={tt}
              fill="image"
              src={tp.image}
              rarity={tp.plan ?? undefined}
              edition={`${qty} of ${qty}`}
              price={null}
              points={[tp.line]}
              backTitle={tp.name}
              backFacts={[
                { k: 'Format', v: tp.format },
                { k: 'Suggested ask', v: tp.os > 0 ? `${osFmt(tp.os)} Os` : 'Free' },
                { k: 'Units', v: String(qty) },
              ]}
              passport={{ label: 'Template', resale: '—' }}
              engageLabel={open ? 'Use this template' : 'Unlock it'}
              onEngage={use}
              onCreate={use}
              onResell={use}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, minWidth: 0 }}>
            <Fact
              v={String(qty)}
              k={qty === 1 ? 'Unit' : 'Units'}
              note={qty > 1 ? 'A capped run' : 'A single piece'}
            />
            <Fact
              v={`${filled}/${fills.length}`}
              k="Fields prefilled"
              note={open ? 'Opens straight into the composer' : `${tp.plan ?? 'Premium'} plan`}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, minWidth: 0, flex: '1 1 260px' }}>
            {fills.map(([label, on]) => (
              <span
                key={label}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  borderRadius: 999,
                  padding: '5px 10px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: on ? 'var(--text)' : 'var(--text-faint)',
                  background: on ? `color-mix(in srgb, ${tt} 12%, var(--surface))` : 'var(--surface-2)',
                  boxShadow: on ? 'none' : 'var(--nm-inset)',
                }}
              >
                {on
                  ? svg(<polyline points="20 6 9 17 4 12" />, 11, tt, 2.6)
                  : svg(<path d="M6 12h12" />, 11, 'currentColor', 2)}
                {label}
              </span>
            ))}
          </div>
          <button type="button" onClick={() => go(-1)} aria-label="Previous template" style={roundBtn}>
            {svg(<polyline points="15 18 9 12 15 6" />, 16, 'currentColor', 2)}
          </button>
          <button type="button" onClick={() => go(1)} aria-label="Next template" style={roundBtn}>
            {svg(<polyline points="9 6 15 12 9 18" />, 16, 'currentColor', 2)}
          </button>
          {/* the decision, always visible, in its colour at rest — it is what this sheet is for */}
          <Button size="sm" variant="primary" selected tone={open ? 'green' : 'gold'} onClick={use}>
            {open ? 'Use this template' : 'Unlock it'}
          </Button>
          <Button size="sm" variant="ghost" tone="violet" onClick={onClose}>
            Close
          </Button>
        </div>

        {/* the whole set as a filmstrip — jump straight to one */}
        <div
          className="weo-scroll-hide"
          style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 2 }}
        >
          {all.map((x, k) => (
            <button
              type="button"
              key={x.key}
              onClick={() => setI(k)}
              title={x.name}
              aria-label={x.name}
              style={{
                flex: '0 0 auto',
                width: 62,
                height: 44,
                padding: 0,
                border: 'none',
                borderRadius: 12,
                overflow: 'hidden',
                cursor: 'pointer',
                background: `${cssUrl(x.image)} center/cover, var(--surface-2)`,
                boxShadow: k === i ? `0 0 0 2px ${createTone(x.format)}` : 'var(--nm-sm)',
                opacity: k === i ? 1 : 0.58,
                transition: 'opacity .2s, box-shadow .2s',
              }}
            />
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}

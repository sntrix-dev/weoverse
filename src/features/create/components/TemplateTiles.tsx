// design: create.jsx TemplateDrawer (the quick drawer along the bottom of the composer) and the
// hero's template shelf strip
import { createPortal } from 'react-dom';
import { OMark, svg } from '@/design-system';
import { osFmt } from '@/lib/format';
import type { TemplateDto } from '../api/create';
import { createTone } from '../model/formats';

const LOCK = (
  <>
    <rect x="5" y="11" width="14" height="9" rx="2.4" />
    <path d="M8.4 11V8.6a3.6 3.6 0 0 1 7.2 0V11" />
  </>
);

/** Small tiles, one tap, no reading — for when you already know which template you want. */
export function TemplateDrawer({
  templates,
  onPick,
  onLocked,
  onClose,
  onBrowse,
}: {
  templates: readonly TemplateDto[];
  onPick: (tp: TemplateDto) => void;
  onLocked: (tp: TemplateDto) => void;
  onClose: () => void;
  onBrowse: () => void;
}) {
  return createPortal(
    <div
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 2300,
        padding: '0 clamp(10px,2vw,20px) clamp(10px,1.6vw,18px)',
        pointerEvents: 'none',
      }}
    >
      <div
        role="dialog"
        aria-label="Template drawer"
        style={{
          pointerEvents: 'auto',
          maxWidth: 'var(--page-w)',
          margin: '0 auto',
          borderRadius: 28,
          padding: '14px 16px 16px',
          background: 'var(--glass)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          boxShadow: 'var(--shadow-card), inset 0 0 0 1px var(--glass-brd)',
          animation: 'weo-cardin .3s var(--ease-portal) both',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 11 }}>
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: '.14em',
              textTransform: 'uppercase',
              color: 'var(--text-faint)',
            }}
          >
            Start from a template
          </span>
          <span style={{ fontSize: 11.5, color: 'var(--text-faint)', fontVariantNumeric: 'tabular-nums' }}>
            {templates.length}
          </span>
          <button
            type="button"
            onClick={onBrowse}
            style={{
              marginLeft: 'auto',
              border: 'none',
              background: 'transparent',
              padding: 0,
              cursor: 'pointer',
              font: 'inherit',
              fontSize: 11.5,
              fontWeight: 600,
              color: 'var(--o-green)',
            }}
          >
            See them full size
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close the template drawer"
            style={{
              display: 'grid',
              placeItems: 'center',
              width: 32,
              height: 32,
              borderRadius: 999,
              border: 'none',
              cursor: 'pointer',
              background: 'var(--surface)',
              boxShadow: 'var(--nm-sm)',
              color: 'var(--text-dim)',
            }}
          >
            {svg(<path d="M6 6l12 12M18 6L6 18" />, 14, 'currentColor', 2)}
          </button>
        </div>
        <div
          className="weo-scroll-hide"
          style={{ display: 'flex', gap: 9, overflowX: 'auto', paddingBottom: 2 }}
        >
          {templates.map((tp) => {
            const tt = createTone(tp.format);
            return (
              <button
                type="button"
                key={tp.key}
                title={tp.line}
                onClick={() => {
                  if (!tp.usable) return onLocked(tp);
                  onPick(tp);
                  onClose();
                }}
                style={{
                  flex: '0 0 auto',
                  width: 138,
                  display: 'flex',
                  flexDirection: 'column',
                  padding: 0,
                  border: 'none',
                  borderRadius: 16,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  textAlign: 'left',
                  font: 'inherit',
                  background: 'var(--surface)',
                  boxShadow: 'var(--nm-sm)',
                  opacity: tp.usable ? 1 : 0.62,
                }}
              >
                <span
                  style={{
                    display: 'block',
                    height: 66,
                    background: `url('${tp.image}') center/cover, color-mix(in srgb, ${tt} 18%, var(--surface-2))`,
                  }}
                />
                <span style={{ display: 'block', padding: '8px 10px 10px' }}>
                  <span
                    style={{
                      display: 'block',
                      fontSize: 11.5,
                      fontWeight: 700,
                      color: 'var(--text)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {tp.name}
                  </span>
                  <span
                    style={{
                      display: 'block',
                      marginTop: 2,
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '.1em',
                      textTransform: 'uppercase',
                      color: tt,
                    }}
                  >
                    {tp.format}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** The hero's strip of templates, shown when the Templates dock is chosen. */
export function TemplateShelf({
  templates,
  shown,
  onPick,
  onLocked,
}: {
  templates: readonly TemplateDto[];
  shown: boolean;
  onPick: (tp: TemplateDto) => void;
  onLocked: (tp: TemplateDto) => void;
}) {
  return (
    <div
      className="weo-scroll-hide"
      style={{
        display: shown ? 'flex' : 'none',
        gap: 10,
        overflowX: 'auto',
        paddingBottom: 2,
        width: '100%',
        maxWidth: 1100,
        pointerEvents: 'auto',
        animation: 'weo-cardin .5s var(--ease-portal) both',
      }}
    >
      {templates.map((tp) => {
        const tt = createTone(tp.format);
        return (
          <button
            type="button"
            key={tp.key}
            onClick={() => (tp.usable ? onPick(tp) : onLocked(tp))}
            title={tp.line}
            style={{
              position: 'relative',
              flex: '0 0 auto',
              width: 152,
              display: 'flex',
              flexDirection: 'column',
              padding: 0,
              border: 'none',
              borderRadius: 18,
              overflow: 'hidden',
              cursor: 'pointer',
              textAlign: 'left',
              font: 'inherit',
              background: 'var(--surface)',
              boxShadow: 'var(--nm-sm)',
              opacity: tp.usable ? 1 : 0.72,
            }}
          >
            <span
              style={{
                position: 'relative',
                display: 'block',
                height: 72,
                background: 'var(--surface-2)',
                overflow: 'hidden',
              }}
            >
              <img src={tp.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {!tp.usable && (
                <span
                  style={{
                    position: 'absolute',
                    right: 6,
                    top: 6,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    borderRadius: 999,
                    padding: '2px 7px',
                    fontSize: 9,
                    fontWeight: 600,
                    letterSpacing: '.08em',
                    textTransform: 'uppercase',
                    color: 'var(--o-gold-ink, #8a6a06)',
                    background: 'color-mix(in srgb, var(--o-gold) 82%, #fff)',
                  }}
                >
                  {svg(LOCK, 9, 'currentColor', 2)}
                  {tp.plan}
                </span>
              )}
            </span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '9px 11px 11px' }}>
              <span
                style={{
                  fontSize: 12.5,
                  fontWeight: 600,
                  letterSpacing: '-.01em',
                  color: 'var(--text)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {tp.name}
              </span>
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 10.5,
                  fontWeight: 500,
                  color: 'var(--text-dim)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                <span
                  style={{ width: 6, height: 6, borderRadius: '50%', background: tt, flex: '0 0 auto' }}
                />
                {tp.format}
                {tp.os > 0 && (
                  <span
                    style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'baseline', gap: 3 }}
                  >
                    <OMark size={9} />
                    {osFmt(tp.os)}
                  </span>
                )}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

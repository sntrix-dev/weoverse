import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { svg } from '@/design-system';
import { FORMATS, formatHex } from '@/lib/cardModel';
import { FEED_KIND, FEED_KINDS } from '@/lib/feedKinds';
import { setPrefs, usePrefs, type UiPreferences } from '@/stores/prefs';

/**
 * design: view-prefs.jsx — one curation surface, reachable from every section. The section's
 * own filters stay inline on the bar; the View button opens the preferences that travel with
 * you (`uiPreferences`: mutedFormats, mutedKinds, density, media, motion, valueDisplay).
 */
const VIEW_DEFAULTS: Partial<UiPreferences> = {
  density: 'roomy',
  media: 'rich',
  motion: 'full',
  valueDisplay: 'os',
  mutedFormats: [],
  mutedKinds: [],
};

export function useViewPrefs() {
  const prefs = usePrefs((s) => s.prefs);
  const toggle = (key: 'mutedFormats' | 'mutedKinds', v: string) => {
    const cur = usePrefs.getState().prefs[key];
    setPrefs({ [key]: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] });
  };
  return { prefs, set: setPrefs, toggle };
}

/** design: view-prefs.jsx PrefRow */
export function PrefRow({
  label,
  note,
  children,
}: {
  label: ReactNode;
  note?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 14,
        minHeight: 44,
      }}
    >
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text)' }}>
          {label}
        </span>
        {note && (
          <span style={{ display: 'block', marginTop: 1, fontSize: 10.5, color: 'var(--text-faint)' }}>
            {note}
          </span>
        )}
      </span>
      <span style={{ flex: '0 0 auto' }}>{children}</span>
    </div>
  );
}

export interface PrefOption<V extends string> {
  value: V;
  label: string;
  title?: string;
}

/** design: view-prefs.jsx PrefSeg — a small segmented control. */
export function PrefSeg<V extends string>({
  options,
  value,
  onChange,
  tone,
  label,
}: {
  options: readonly PrefOption<V>[];
  value: V;
  onChange: (v: V) => void;
  tone?: string;
  label?: string;
}) {
  const t = tone || 'var(--o-blue)';
  return (
    <span
      role="radiogroup"
      aria-label={label}
      style={{
        display: 'flex',
        gap: 2,
        padding: 3,
        borderRadius: 999,
        background: 'var(--surface-2)',
        boxShadow: 'var(--nm-inset)',
      }}
    >
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            title={o.title || o.label}
            style={{
              flex: 1,
              minHeight: 30,
              padding: '0 10px',
              borderRadius: 999,
              border: 'none',
              cursor: 'pointer',
              font: 'inherit',
              fontSize: 11.5,
              fontWeight: on ? 700 : 500,
              color: on ? '#fff' : 'var(--text-dim)',
              background: on ? t : 'transparent',
              boxShadow: on ? `0 5px 12px -6px color-mix(in srgb, ${t} 80%, transparent)` : 'none',
              transition: 'background .2s, color .2s, box-shadow .2s',
            }}
          >
            {o.label}
          </button>
        );
      })}
    </span>
  );
}

/** design: view-prefs.jsx ViewPanel — sized to fit, rides the viewport, flips above when needed. */
export function ViewPanel({ tone, at }: { tone?: string; at: DOMRect | null }) {
  const { prefs: p, set, toggle } = useViewPrefs();
  const t = tone || 'var(--o-blue)';
  const kinds = FEED_KINDS.filter((k) => k.k !== 'all');
  const muted = p.mutedFormats.length + p.mutedKinds.length;
  const H = 470;
  const W = 420;
  const GAP = 10;
  const EDGE = 12;
  let place: CSSProperties = { position: 'absolute', top: 'calc(100% + 10px)', right: 0 };
  let cap = H;
  if (at) {
    const below = window.innerHeight - at.bottom - GAP - EDGE;
    const above = at.top - GAP - EDGE;
    const under = below >= Math.min(H, 300) || below >= above;
    cap = Math.max(220, Math.min(H, under ? below : above));
    place = {
      position: 'fixed',
      right: Math.max(EDGE, window.innerWidth - at.right),
      top: under ? at.bottom + GAP : Math.max(EDGE, at.top - GAP - cap),
    };
  }
  /* one chip grammar: neutral inset well when it is off, the thing's own colour when it is on */
  const chip = (label: string, on: boolean, chipTone: string, onClick: () => void, key?: string) => (
    <button
      key={key || label}
      type="button"
      onClick={onClick}
      aria-pressed={on}
      title={on ? `${label} — showing` : `${label} — hidden`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        minHeight: 34,
        padding: on ? '0 13px' : '0 12px',
        borderRadius: 999,
        border: 'none',
        cursor: 'pointer',
        font: 'inherit',
        fontSize: 12,
        fontWeight: on ? 700 : 500,
        color: on ? '#fff' : 'var(--text-faint)',
        background: on ? chipTone : 'var(--surface-2)',
        boxShadow: on
          ? `0 6px 14px -6px color-mix(in srgb, ${chipTone} 80%, transparent)`
          : 'var(--nm-inset)',
        transition: 'background .22s, color .22s, box-shadow .22s',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: on ? '#fff' : 'var(--text-faint)',
          opacity: on ? 1 : 0.5,
        }}
      />
      {label}
    </button>
  );
  const group = (label: string, body: ReactNode) => (
    <div
      style={{
        borderRadius: 20,
        padding: '12px 13px',
        background: 'var(--surface)',
        boxShadow: 'var(--nm-raised), inset 0 0 0 1px var(--border)',
      }}
    >
      <p
        style={{
          margin: '0 0 9px',
          fontSize: 9.5,
          fontWeight: 600,
          letterSpacing: '.16em',
          textTransform: 'uppercase',
          color: 'var(--text-faint)',
        }}
      >
        {label}
      </p>
      {body}
    </div>
  );
  const reads = [
    [
      'Density',
      p.density,
      (v: string) => set({ density: v as UiPreferences['density'] }),
      [
        { value: 'roomy', label: 'Roomy' },
        { value: 'compact', label: 'Compact' },
      ],
    ],
    [
      'Imagery',
      p.media,
      (v: string) => set({ media: v as UiPreferences['media'] }),
      [
        { value: 'rich', label: 'Rich' },
        { value: 'quiet', label: 'Quiet' },
      ],
    ],
    [
      'Motion',
      p.motion,
      (v: string) => set({ motion: v as UiPreferences['motion'] }),
      [
        { value: 'full', label: 'Full' },
        { value: 'calm', label: 'Calm' },
      ],
    ],
    [
      'Values',
      p.valueDisplay,
      (v: string) => set({ valueDisplay: v as UiPreferences['valueDisplay'] }),
      [
        { value: 'os', label: 'Os' },
        { value: 'both', label: 'Os + $' },
      ],
    ],
  ] as const;
  return (
    <div
      role="dialog"
      aria-label="View preferences"
      data-view-panel="1"
      style={{
        ...place,
        zIndex: 2600,
        maxHeight: cap,
        overflowY: 'auto',
        width: `min(${W}px, calc(100vw - 32px))`,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        padding: 14,
        borderRadius: 28,
        background: 'var(--glass)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        boxShadow: 'var(--shadow-card), inset 0 0 0 1px var(--glass-brd)',
        animation: 'weo-cardin .26s var(--ease-portal) both',
        textAlign: 'left',
      }}
    >
      {group(
        'Formats in your feed',
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {FORMATS.map((fm) =>
            chip(fm, !p.mutedFormats.includes(fm), formatHex(fm) || t, () => toggle('mutedFormats', fm), fm),
          )}
        </div>,
      )}
      {kinds.length > 0 &&
        group(
          'Kinds of post',
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {kinds.map((k) =>
              chip(
                k.label,
                !p.mutedKinds.includes(k.k),
                FEED_KIND[k.k].color || t,
                () => toggle('mutedKinds', k.k),
                k.k,
              ),
            )}
          </div>,
        )}
      {group(
        'How it reads',
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 10 }}>
          {reads.map(([label, val, onChange, options]) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)' }}>{label}</span>
              <PrefSeg tone={t} value={val} onChange={onChange} options={options} label={label} />
            </div>
          ))}
        </div>,
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          padding: '2px 4px',
        }}
      >
        <button
          type="button"
          onClick={() => set(VIEW_DEFAULTS)}
          style={{
            minHeight: 34,
            padding: '0 13px',
            borderRadius: 999,
            border: 'none',
            cursor: 'pointer',
            font: 'inherit',
            fontSize: 11.5,
            fontWeight: 600,
            color: 'var(--text-dim)',
            background: 'var(--surface)',
            boxShadow: 'var(--nm-sm)',
          }}
        >
          Reset view
        </button>
        <span style={{ fontSize: 11, fontWeight: 600, color: muted ? t : 'var(--text-faint)' }}>
          {muted ? `${muted} hidden` : 'Everything showing'}
        </span>
      </div>
    </div>
  );
}

/** design: view-prefs.jsx ViewBar — the section's filters at rest, the preferences one tap away. */
export function ViewBar({
  tone,
  filters,
  summary,
  bare,
}: {
  tone?: string;
  filters?: ReactNode;
  summary?: ReactNode;
  bare?: boolean;
}) {
  const t = tone || 'var(--o-blue)';
  const [open, setOpen] = useState(false);
  const { prefs: p } = useViewPrefs();
  const wrap = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const [at, setAt] = useState<DOMRect | null>(null);
  useEffect(() => {
    if (!open) return;
    const place = () => {
      if (btn.current) setAt(btn.current.getBoundingClientRect());
    };
    const away = (e: MouseEvent) => {
      const target = e.target as Element;
      if (wrap.current && !wrap.current.contains(target) && !target.closest?.('[data-view-panel]'))
        setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      document.removeEventListener('mousedown', away);
      document.removeEventListener('keydown', esc);
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [open]);
  const hidden = p.mutedFormats.length + p.mutedKinds.length;
  return (
    <div
      className="weo-viewbar"
      style={{
        position: 'relative',
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flex: bare ? '1 1 340px' : undefined,
        minWidth: bare ? 260 : 0,
        marginTop: bare ? 0 : 14,
        paddingTop: bare ? 0 : 12,
        borderTop: bare ? 'none' : '1px solid var(--border)',
      }}
    >
      <div
        className="weo-scroll-hide"
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'nowrap',
          justifyContent: bare ? 'flex-end' : 'flex-start',
          gap: 10,
          minWidth: 0,
          flex: 1,
          overflowX: 'auto',
          overflowY: 'hidden',
          padding: '2px 0',
        }}
      >
        {filters || (summary && <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>{summary}</span>)}
      </div>
      <div ref={wrap} style={{ position: 'relative', flex: '0 0 auto' }}>
        <button
          ref={btn}
          type="button"
          onClick={() => {
            if (!open && btn.current) setAt(btn.current.getBoundingClientRect());
            setOpen((o) => !o);
          }}
          aria-expanded={open}
          title="Curate this view"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            minHeight: 40,
            padding: '0 14px',
            borderRadius: 999,
            border: 'none',
            cursor: 'pointer',
            font: 'inherit',
            fontSize: 12,
            fontWeight: 600,
            color: open ? '#fff' : t,
            background: open ? t : `color-mix(in srgb, ${t} 11%, var(--surface))`,
            boxShadow: open ? 'none' : 'var(--nm-sm)',
            transition: 'background .22s, color .22s',
          }}
        >
          {svg(<path d="M4 6h16M7 12h10M10 18h4" />, 15, 'currentColor', 1.9)}
          View
          {hidden > 0 && (
            <span
              style={{
                display: 'grid',
                placeItems: 'center',
                minWidth: 18,
                height: 18,
                padding: '0 5px',
                borderRadius: 999,
                fontSize: 10,
                fontWeight: 700,
                color: open ? t : '#fff',
                background: open ? '#fff' : t,
              }}
            >
              {hidden}
            </span>
          )}
        </button>
        {open && createPortal(<ViewPanel tone={t} at={at} />, document.body)}
      </div>
    </div>
  );
}

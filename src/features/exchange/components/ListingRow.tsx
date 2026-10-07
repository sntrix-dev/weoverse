import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Pip } from '@/components/layout/Pip';
import { ICO, OMark, Orb, svg } from '@/design-system';
import { formatHex } from '@/lib/cardModel';
import { compact, osFmt } from '@/lib/format';
import type { ListingModel, ListingStateLabel } from '../model/listings';
import { openWorld } from '@/stores/flow';

/** design: screens-holdings.jsx STATE_TONE (+ Scheduled) */
export const STATE_TONE: Record<ListingStateLabel, string> = {
  Live: '#22C55E',
  Paused: '#F7C62B',
  Scheduled: '#3A95F2',
  Draft: 'var(--text-faint)',
  Closed: 'var(--text-dim)',
};

const MENU_ICO = {
  edit: (
    <>
      <path d="M4 20h4l10-10-4-4L4 16z" />
      <path d="M14 6l4 4" />
    </>
  ),
  play: (
    <>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M10 8.6l5 3.4-5 3.4z" />
    </>
  ),
  pause: (
    <>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M10 9v6M14 9v6" />
    </>
  ),
  more: (
    <>
      <circle cx="5.5" cy="12" r="1.4" />
      <circle cx="12" cy="12" r="1.4" />
      <circle cx="18.5" cy="12" r="1.4" />
    </>
  ),
};

export interface ListingRowHandlers {
  onOpen: (l: ListingModel) => void;
  onEdit: (l: ListingModel) => void;
  onToggle: (l: ListingModel) => void;
  onPush: (l: ListingModel) => void;
}

interface MenuItem {
  k: string;
  label: string;
  icon: ReactNode;
  go: () => void;
}

/**
 * design: screens-holdings.jsx ListingRow (LST-08) — the row opens the WeO; its actions live in
 * one always-visible ⋯ menu, labelled. The preflight bar only means something before posting, so
 * it shows on drafts alone. Rehearse opens the World Studio — a draft's rehearsal, a WeO's simulation (M11).
 */
export function ListingRow({ l, i, act }: { l: ListingModel; i: number; act: ListingRowHandlers }) {
  const [hov, setHov] = useState(false);
  const [menu, setMenu] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menu) return;
    const down = (e: MouseEvent) => {
      const t = e.target as Node;
      if (ref.current && !ref.current.contains(t) && !(btn.current && btn.current.contains(t)))
        setMenu(false);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenu(false);
    };
    const scroll = () => setMenu(false);
    document.addEventListener('mousedown', down);
    document.addEventListener('keydown', key);
    window.addEventListener('scroll', scroll, { passive: true, capture: true });
    return () => {
      document.removeEventListener('mousedown', down);
      document.removeEventListener('keydown', key);
      window.removeEventListener('scroll', scroll, { capture: true });
    };
  }, [menu]);

  const tone = formatHex(l.format);
  const draft = l.kind === 'draft';
  const items: MenuItem[] = [
    { k: 'edit', label: 'Edit WeO', icon: MENU_ICO.edit, go: () => act.onEdit(l) },
    ...(l.pausable
      ? [
          {
            k: 'pause',
            label: l.paused ? 'Activate' : 'Inactivate',
            icon: l.paused ? MENU_ICO.play : MENU_ICO.pause,
            go: () => act.onToggle(l),
          },
        ]
      : []),
    ...(!draft ? [{ k: 'hub', label: 'Push to hub', icon: ICO.hub, go: () => act.onPush(l) }] : []),
    {
      k: 'world',
      label: 'Rehearse',
      icon: ICO.world,
      go: () => openWorld(draft ? { draftId: l.id } : { weoId: l.id }),
    },
  ];

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => act.onOpen(l)}
      role="button"
      tabIndex={0}
      aria-label={`Open ${l.name}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter') act.onOpen(l);
      }}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        flexWrap: 'wrap',
        padding: '14px 18px',
        cursor: 'pointer',
        background: hov ? `color-mix(in srgb, ${tone} 4%, var(--surface))` : 'var(--surface)',
        transition: 'background .26s',
        animation: `weo-cardin .44s var(--ease-settle) ${i * 0.05}s both`,
        opacity: l.paused ? 0.72 : 1,
      }}
    >
      <Orb
        size={58}
        fill={l.img ? 'image' : tone}
        src={l.img}
        ring
        ringColor={tone}
        matcap
        breathe={hov}
        style={{ flex: '0 0 auto' }}
      />
      <div style={{ minWidth: 0, flex: '1 1 150px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <h3
            style={{
              margin: 0,
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: '-.015em',
              color: 'var(--text)',
            }}
          >
            {l.name}
          </h3>
          <Pip tone={STATE_TONE[l.state]}>{l.state}</Pip>
        </div>
        <p style={{ margin: '3px 0 0', fontSize: 11.5, color: 'var(--text-faint)' }}>
          {l.format} · {l.left} · {l.since}
        </p>
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
        <OMark size={13} /> {l.ask != null ? osFmt(l.ask) : '—'}
      </span>
      {!draft && (
        <div style={{ display: 'flex', gap: 16, flex: '0 0 auto' }}>
          {(
            [
              [compact(l.views), 'views'],
              [compact(l.saves), 'saves'],
              [String(l.collects), 'collects'],
            ] as const
          ).map(([v, k]) => (
            <span key={k} style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontSize: 13.5,
                  fontWeight: 700,
                  color: 'var(--text)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {v}
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-faint)' }}>{k}</span>
            </span>
          ))}
        </div>
      )}
      {draft && (
        <span
          title={l.open ? `${l.open} of 5 checks open` : 'Preflight complete'}
          style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <span
            style={{
              width: 74,
              height: 6,
              borderRadius: 999,
              background: 'var(--surface-2)',
              boxShadow: 'var(--nm-inset)',
              overflow: 'hidden',
            }}
          >
            <span
              style={{
                display: 'block',
                width: `${l.ready * 100}%`,
                height: '100%',
                borderRadius: 999,
                background: l.ready === 1 ? 'var(--o-green)' : 'var(--o-gold)',
              }}
            />
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: l.ready === 1 ? 'var(--o-green)' : 'var(--o-gold-ink)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {l.ready === 1 ? 'Ready' : `${l.open} open`}
          </span>
        </span>
      )}
      <div
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="presentation"
        style={{ position: 'relative', flex: '0 0 auto' }}
      >
        <button
          ref={btn}
          type="button"
          onClick={() => {
            if (!menu && btn.current) setRect(btn.current.getBoundingClientRect());
            setMenu((m) => !m);
          }}
          aria-haspopup="menu"
          aria-expanded={menu}
          aria-label={`Actions for ${l.name}`}
          style={{
            display: 'grid',
            placeItems: 'center',
            width: 38,
            height: 38,
            borderRadius: '50%',
            border: 'none',
            cursor: 'pointer',
            background: menu ? 'var(--surface-2)' : 'var(--surface)',
            boxShadow: menu ? 'var(--nm-inset)' : 'var(--nm-sm)',
            color: 'var(--text-dim)',
          }}
        >
          {svg(MENU_ICO.more, 17, 'currentColor', 2)}
        </button>
        {menu &&
          rect &&
          createPortal(
            <div
              ref={ref}
              role="menu"
              style={{
                position: 'fixed',
                left: Math.max(8, rect.right - 176),
                top: rect.bottom + 6,
                zIndex: 2500,
                minWidth: 176,
                padding: 6,
                borderRadius: 18,
                background: 'var(--surface)',
                boxShadow: 'var(--shadow-pop), inset 0 0 0 1px var(--border)',
                animation: 'weo-cardin .22s var(--ease-portal) both',
              }}
            >
              {items.map((it) => (
                <button
                  key={it.k}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenu(false);
                    it.go();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '9px 11px',
                    border: 'none',
                    borderRadius: 12,
                    cursor: 'pointer',
                    background: 'transparent',
                    font: 'inherit',
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--text)',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--surface-2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <span
                    style={{ display: 'grid', placeItems: 'center', width: 22, color: 'var(--text-dim)' }}
                  >
                    {svg(it.icon, 16, 'currentColor', 1.7)}
                  </span>
                  {it.label}
                </button>
              ))}
            </div>,
            document.body,
          )}
      </div>
    </div>
  );
}

import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { ICO, svg } from '@/design-system';
import { VIEW_ICONS, type SegItem } from '@/components/layout/SectionMark';
import { useWeoView } from '@/components/weo/WeoView';
import s from './FilterMenu.module.css';

export interface FilterMenuItem {
  key: string;
  label: string;
  count?: number | null;
  active?: boolean;
  onClick?: () => void;
}
export interface FilterMenuGroup {
  label: string;
  items: FilterMenuItem[];
}
export interface QuickFilter {
  key: string;
  label: string;
  count?: number | null;
  active?: boolean;
  /** the red "Closing soonest" chip with its pulsing dot */
  urgent?: boolean;
  color?: string;
  onClick: () => void;
}

const tone = (c: string) => ({ '--t': c }) as CSSProperties;

/**
 * design: filter-menu.jsx FilterMenu (v4) — one dropdown holding every place on the page
 * ("Jump to"), then the quick chips that filter the feed. The menu is portalled so a sticky,
 * frosted bar never clips it.
 */
export function FilterMenu({
  label = 'Filter',
  current,
  groups,
  quick = [],
  tone: t = 'var(--o-blue)',
}: {
  label?: string;
  current?: ReactNode;
  groups: FilterMenuGroup[];
  quick?: QuickFilter[];
  tone?: string;
}) {
  const [open, setOpen] = useState(false);
  const [at, setAt] = useState<DOMRect | null>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const place = () => {
      if (btn.current) setAt(btn.current.getBoundingClientRect());
    };
    place();
    const away = (e: MouseEvent) => {
      const el = e.target as Node;
      if (btn.current?.contains(el) || panel.current?.contains(el)) return;
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

  const menu =
    open &&
    at &&
    createPortal(
      <div
        ref={panel}
        role="menu"
        aria-label={label}
        className={s.menu}
        style={{ ...tone(t), left: Math.min(at.left, window.innerWidth - 284), top: at.bottom + 8 }}
      >
        {groups.map((g, gi) => (
          <div key={g.label} className={s.group} data-rule={gi ? '1' : undefined}>
            <div className={s.groupLabel}>{g.label}</div>
            {g.items.map((it) => (
              <button
                key={it.key}
                type="button"
                role="menuitem"
                className={s.item}
                data-on={it.active || undefined}
                onClick={() => {
                  setOpen(false);
                  it.onClick?.();
                }}
              >
                <span className={s.itemLabel}>{it.label}</span>
                {it.count != null && <span className={s.itemCount}>{it.count}</span>}
              </button>
            ))}
          </div>
        ))}
      </div>,
      document.body,
    );

  return (
    <span className={s.root}>
      <span className={s.anchor}>
        <button
          ref={btn}
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={open}
          className={s.trigger}
          data-open={open || undefined}
          style={tone(t)}
        >
          {svg(<path d="M4 6h16M7 12h10M10 18h4" />, 15, 'currentColor', 1.9)}
          <span className={s.triggerLabel}>{label}</span>
          {current}
          <span className={s.chev} data-open={open || undefined}>
            {svg(<polyline points="6 9.5 12 15.5 18 9.5" />, 12, 'currentColor', 2.2)}
          </span>
        </button>
        {menu}
      </span>
      {quick.map((q) => (
        <button
          key={q.key}
          type="button"
          onClick={q.onClick}
          aria-pressed={!!q.active}
          className={s.quick}
          data-urgent={q.urgent || undefined}
          data-on={q.active || undefined}
          style={tone(q.urgent ? (q.color ?? '#E5484D') : t)}
        >
          {q.urgent && <span aria-hidden="true" className={s.pulse} />}
          {q.label}
          {q.count != null && <span className={s.quickCount}>{q.count}</span>}
        </button>
      ))}
    </span>
  );
}

const EDITORIAL = (
  <>
    <rect x="3.5" y="4.5" width="10" height="15" rx="2" />
    <rect x="16" y="4.5" width="4.5" height="6.5" rx="1.5" />
    <rect x="16" y="13" width="4.5" height="6.5" rx="1.5" />
  </>
);

/**
 * design: filter-menu.jsx StuckViews (v4) — the feed's view switch as icons, for a pinned bar:
 * the same choice as the board it mirrors (`useWeoView` id), then "Enter a world". The bar
 * shows it only while pinned (`.stuck` in the sticky bar's CSS).
 */
export function StuckViews<V extends string>({
  id,
  items,
  initial,
  tone: t = 'var(--o-blue)',
  onWorld,
}: {
  id: string;
  items: SegItem<V>[];
  initial: V;
  tone?: string;
  onWorld?: () => void;
}) {
  const [v, setV] = useWeoView<V>(id, items, initial);
  return (
    <span role="group" aria-label="Feed view" className={`weo-stuck-views ${s.views}`} style={tone(t)}>
      {items.map((o) => {
        const on = v === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => setV(o.value)}
            aria-label={o.label}
            aria-pressed={on}
            title={o.label}
            className={s.view}
            data-on={on || undefined}
          >
            {svg(
              o.value === 'editorial' ? EDITORIAL : (VIEW_ICONS[o.value] ?? null),
              24,
              'currentColor',
              1.7,
            )}
          </button>
        );
      })}
      {onWorld && (
        <>
          <span aria-hidden="true" className={s.viewRule} />
          <button
            type="button"
            onClick={onWorld}
            aria-label="Enter a world"
            title="Enter a world"
            className={s.world}
          >
            {svg(ICO.world, 24, 'currentColor', 1.7)}
          </button>
        </>
      )}
    </span>
  );
}

/**
 * design: filter-menu.jsx's pin watcher — whether a `position: sticky` bar is pinned under the
 * nav (its top has reached its `top` and the page has scrolled).
 */
export function useStuck(ref: RefObject<HTMLElement | null>): boolean {
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    let raf = 0;
    const check = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const top = parseFloat(getComputedStyle(el).top) || 0;
      setStuck(el.getBoundingClientRect().top <= top + 0.5 && window.scrollY > 0);
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    check();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', on);
      window.removeEventListener('resize', on);
    };
  }, [ref]);
  return stuck;
}

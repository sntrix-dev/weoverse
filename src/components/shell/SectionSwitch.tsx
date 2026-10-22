import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Icon, Toggle } from '@/design-system';
import type { SectionKey } from '@/app/useShellRoute';
import { PHONE, TOO_NARROW_FOR_ALL, useMedia } from '@/lib/useMedia';
import { setPrefs, usePref } from '@/stores/prefs';
import { MARKET, type MarketItem } from './market';
import { Tip, tipHandlers } from './Tip';
import s from './SectionSwitch.module.css';

const tone = (c: string) => ({ '--c': c }) as CSSProperties;
const chevron = <polyline points="6 9.5 12 15.5 18 9.5" />;

export interface SectionSwitchProps {
  section: SectionKey;
  onJump: (key: SectionKey) => void;
}

/**
 * design: chrome.jsx SectionSwitch — ONE pill says where you are; press it for the rest.
 * The full set, in the WeOverse order, arrives on intent. v4: the "Next · section" pill is gone. Preference: one pill (default) or
 * every section in the bar (`uiPreferences.navSections`). Below 1080px it is always the one pill,
 * and on a phone (≤ 760px) the pill is its icon and chevron only.
 */
export function SectionSwitch({ section, onJump }: SectionSwitchProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  // a narrow screen has room for one pill only, whatever the preference says
  const phone = useMedia(PHONE);
  const narrow = useMedia(TOO_NARROW_FOR_ALL);
  const all = usePref('navSections') === 'all' && !phone && !narrow;
  const key = MARKET.some((m) => m.key === section) ? section : 'create';
  const cur = MARKET.find((m) => m.key === key) ?? MARKET[0]!;

  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', down);
    document.addEventListener('keydown', k);
    return () => {
      document.removeEventListener('mousedown', down);
      document.removeEventListener('keydown', k);
    };
  }, [open]);
  const [prevSection, setPrevSection] = useState(section);
  if (prevSection !== section) {
    setPrevSection(section);
    setOpen(false);
  }

  const menu = open && (
    <div role="menu" aria-label="Switch section" className={s.menu}>
      {MARKET.map((m) => {
        const on = m.key === key;
        return (
          <button
            key={m.key}
            type="button"
            role="menuitem"
            aria-current={on ? 'page' : undefined}
            onClick={() => {
              setOpen(false);
              if (!on) onJump(m.key);
            }}
            className={s.item}
            data-on={on || undefined}
            style={tone(m.color)}
          >
            <span className={s.itemIcon} data-on={on || undefined}>
              <Icon size={15} sw={1.9}>
                {m.icon}
              </Icon>
            </span>
            <span className={s.itemText}>
              <span className={s.itemLabel}>{m.label}</span>
              <span className={s.itemLong}>{m.long}</span>
            </span>
          </button>
        );
      })}
      {/* the preference: every section in the bar, if you would rather see them all (wide screens) */}
      {!phone && !narrow && (
        <label className={s.pref} htmlFor="weo-nav-sections">
          <span className={s.prefLabel}>Show every section in the bar</span>
          <Toggle
            id="weo-nav-sections"
            checked={all}
            onChange={(v) => {
              setPrefs({ navSections: v ? 'all' : 'one' });
              setOpen(false);
            }}
          />
        </label>
      )}
    </div>
  );

  if (all)
    return (
      <div ref={ref} className={`weo-nav ${s.root} ${s.rootAll}`}>
        <nav aria-label="Sections" className={s.bar}>
          {MARKET.map((m) => (
            <NavPill key={m.key} item={m} active={section === m.key} onClick={() => onJump(m.key)} />
          ))}
        </nav>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="Section options"
          className={s.options}
        >
          <Icon size={24} sw={2.2}>
            {chevron}
          </Icon>
        </button>
        {menu}
      </div>
    );

  return (
    <div ref={ref} className={`weo-nav ${s.root}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`You are in ${cur.label} — switch section`}
        className={s.pill}
        data-open={open || undefined}
      >
        <span className={s.pillIcon} style={tone(cur.color)}>
          <Icon size={24} sw={1.9}>
            {cur.icon}
          </Icon>
        </span>
        <span className={s.pillLabel}>{cur.label}</span>
        <span className={s.pillChevron} data-open={open || undefined}>
          <Icon size={24} sw={2.2}>
            {chevron}
          </Icon>
        </span>
      </button>
      {menu}
    </div>
  );
}

/**
 * design: chrome.jsx NavPill — icons at rest; ONLY the active item carries a label.
 * Hover never changes any item's width, so a neighbour is never pulled from under the pointer.
 */
export function NavPill({
  item,
  active,
  onClick,
}: {
  item: MarketItem;
  active: boolean;
  onClick: () => void;
}) {
  const [tip, setTip] = useState<DOMRect | null>(null);
  const create = item.key === 'create';
  return (
    <span className={s.navPillWrap}>
      <button
        type="button"
        onClick={onClick}
        {...tipHandlers(setTip)}
        aria-label={item.label}
        aria-current={active ? 'page' : undefined}
        className={s.navPill}
        data-active={active || undefined}
        style={tone(item.color)}
      >
        <Icon size={24} sw={create ? 2 : 1.7}>
          {item.icon}
        </Icon>
        {active && <span>{item.label}</span>}
      </button>
      {!active && <Tip label={item.label} at={tip} />}
    </span>
  );
}

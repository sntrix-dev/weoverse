import { useEffect, useState, type CSSProperties } from 'react';
import { Button, ICO, Icon, Orb } from '@/design-system';
import type { SectionKey } from '@/app/useShellRoute';
import { usePref } from '@/stores/prefs';
import { dismissNavConfirm, floatNav, parkNav, toggleMya, useUi } from '@/stores/ui';
import { JUMP } from './market';
import s from './NavDock.module.css';
import { openWorld } from '@/stores/flow';

// design: chrome.jsx FAN_CONIC — the jumps' colours around one disc
const FAN_CONIC = `conic-gradient(from -90deg, ${JUMP.map(
  (j, i) =>
    `${j.color} ${((i / JUMP.length) * 100).toFixed(1)}% ${(((i + 1) / JUMP.length) * 100).toFixed(1)}%`,
).join(', ')})`;

/** design: chrome.jsx FanDisc — the parked O nav's mark. */
export function FanDisc({ size, live }: { size: number; live?: boolean }) {
  const b = Math.max(4, Math.round(size * 0.17));
  return (
    <span className={s.disc} style={{ width: size, height: size }}>
      <span className={s.discFan} style={{ background: FAN_CONIC, opacity: live ? 1 : 0.34 }} />
      <span className={s.discWell} style={{ inset: b }} />
    </span>
  );
}

/**
 * design: chrome.jsx NavDockNode — the O nav's dock in the top bar: park it, open it, float
 * it again. After a park, a confirm card offers "Bring it back" / "Keep it here".
 */
export function NavDockNode({
  section,
  onJump,
}: {
  section: SectionKey;
  onJump: (k: SectionKey | 'mya') => void;
}) {
  const parked = usePref('navDock') === 'top';
  const navConfirm = useUi((u) => u.navConfirm);
  const myaOpen = useUi((u) => u.myaOpen);
  const [open, setOpen] = useState(false);
  const [wasParked, setWasParked] = useState(parked);
  if (wasParked !== parked) {
    setWasParked(parked);
    if (!parked) setOpen(false);
  }
  useEffect(() => {
    if (!open) return;
    const f = (e: MouseEvent) => {
      if (!(e.target as Element | null)?.closest?.('[data-navdock-root]')) setOpen(false);
    };
    document.addEventListener('mousedown', f);
    return () => document.removeEventListener('mousedown', f);
  }, [open]);
  const pick = (k: SectionKey | 'mya' | 'worlds') => {
    setOpen(false);
    if (k === 'mya') toggleMya();
    else if (k === 'worlds') openWorld();
    else onJump(k);
  };
  return (
    <span data-navdock-root className={s.root}>
      <button
        type="button"
        data-navdock
        onClick={() => (parked ? setOpen((o) => !o) : parkNav())}
        aria-label={parked ? 'Open the O nav fan' : 'Park the O nav in the top bar'}
        aria-expanded={parked ? open : undefined}
        title={parked ? 'O nav · parked here' : 'Park the O nav here'}
        className={s.node}
        data-parked={parked || undefined}
      >
        {parked ? (
          <FanDisc size={22} live />
        ) : (
          <Icon size={19} sw={1.6}>
            {ICO.ring}
          </Icon>
        )}
      </button>
      {navConfirm && (
        <div className={`weo-menu ${s.menu} ${s.confirm}`} role="dialog" aria-label="O nav parked here">
          <div className={s.confirmHead}>
            <FanDisc size={40} live />
            <div className={s.confirmText}>
              <p className={s.confirmTitle}>O nav parked here</p>
              <p className={s.confirmSub}>{JUMP.length} jumps</p>
            </div>
          </div>
          <div className={s.confirmActions}>
            <Button size="sm" variant="ghost" tone="violet" onClick={floatNav}>
              Bring it back
            </Button>
            <Button size="sm" variant="primary" tone="green" onClick={dismissNavConfirm}>
              Keep it here
            </Button>
          </div>
        </div>
      )}
      {parked && open && !navConfirm && (
        <div className={`weo-menu ${s.menu} ${s.fan}`} role="menu" aria-label="O nav">
          <div className={s.fanList}>
            {JUMP.map((j) => {
              const on = section === j.key || (j.key === 'mya' && myaOpen);
              return (
                <button
                  key={j.key}
                  type="button"
                  role="menuitem"
                  onClick={() => pick(j.key)}
                  className={s.fanItem}
                  data-on={on || undefined}
                  style={{ '--c': j.color } as CSSProperties}
                >
                  <span className={s.fanIcon}>
                    <Icon size={15} sw={1.7}>
                      {j.icon}
                    </Icon>
                  </span>
                  {j.label}
                </button>
              );
            })}
          </div>
          <div className={s.fanFoot}>
            <Orb size={22} fill="#D946EF" matcap style={{ flex: '0 0 auto' }} />
            <Button
              size="sm"
              variant="ghost"
              tone="violet"
              style={{ marginLeft: 'auto' }}
              onClick={() => {
                setOpen(false);
                floatNav();
              }}
            >
              Float the O again
            </Button>
          </div>
        </div>
      )}
    </span>
  );
}

/** design: chrome.jsx NavParkFlight — the O travels between its floating dock and the top bar. */
export function NavParkFlight({ dir, onDone }: { dir: 'park' | 'float'; onDone: () => void }) {
  const [pts] = useState(() => {
    const el = document.querySelector('[data-navdock]');
    const r = el ? el.getBoundingClientRect() : null;
    const top = r
      ? { x: r.left + r.width / 2, y: r.top + r.height / 2 }
      : { x: window.innerWidth - 220, y: 36 };
    const bottom = { x: window.innerWidth / 2, y: window.innerHeight - 92 };
    return dir === 'park' ? [bottom, top] : [top, bottom];
  });
  const [at, setAt] = useState<0 | 1>(0);
  useEffect(() => {
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setAt(1)));
    const t = setTimeout(onDone, 620);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
    // the flight runs once per mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const p = pts[at]!;
  const sc = at ? (dir === 'park' ? 0.4 : 1) : dir === 'park' ? 1 : 0.4;
  return (
    <div
      aria-hidden="true"
      className={s.flight}
      style={{
        transform: `translate(${p.x}px, ${p.y}px) translate(-50%,-50%) scale(${sc})`,
        opacity: at ? (dir === 'park' ? 0.35 : 1) : 1,
      }}
    >
      <Orb size={56} fill="#D946EF" matcap />
    </div>
  );
}

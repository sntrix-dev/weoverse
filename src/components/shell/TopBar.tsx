import { useEffect, useState } from 'react';
import { Icon, SICO } from '@/design-system';
import type { SectionKey } from '@/app/useShellRoute';
import type { ShellMe } from '@/features/shell/model/me';
import { setPrefs, usePref } from '@/stores/prefs';
import { toast } from '@/stores/ui';
import { BarDivider, BellNode, MakeNode, WeOverseBadge } from './Nodes';
import { NavDockNode } from './NavDock';
import { SearchField } from './SearchField';
import { SectionSwitch } from './SectionSwitch';
import { WalletMenu } from './WalletMenu';
import s from './TopBar.module.css';

export interface ShellNavProps {
  me: ShellMe | undefined;
  section: SectionKey;
  onJump: (key: SectionKey | 'mya') => void;
  onHome: () => void;
  onSearch: (q: string) => void;
  onNotifications: () => void;
}

/** design `app.setNavMode(v)` — writes the pref and says what changed */
export const setNavMode = (v: 'bar' | 'split') => {
  setPrefs({ navMode: v });
  toast(v === 'split' ? 'Sections on the left, support up top' : 'One bar across the top');
};

/**
 * design: chrome.jsx TopBar (v4) — a fixed glass pill that tightens once you scroll. Wordmark,
 * the section switch, then the support row: search, Make, the split toggle, the bell and the
 * passport pill, every icon 24px. Mya lives in her dock only. The parked O nav shows here only
 * while it is parked (v4 dropped it from the bar; without it a parked nav had no way back).
 * On Create the search and Make leave the bar.
 */
export function TopBar({ me, section, onJump, onHome, onSearch, onNotifications }: ShellNavProps) {
  const [small, setSmall] = useState(false);
  const parked = usePref('navDock') === 'top';
  const making = section === 'create';
  useEffect(() => {
    const f = () => setSmall(window.scrollY > 40);
    f();
    window.addEventListener('scroll', f, { passive: true });
    return () => window.removeEventListener('scroll', f);
  }, []);
  return (
    <>
      <div className={s.spacer} data-small={small || undefined} />
      <header className={s.header} data-small={small || undefined}>
        <div className={s.inner} data-small={small || undefined}>
          <WeOverseBadge h={small ? 26 : 31} onClick={onHome} />
          <SectionSwitch section={section} onJump={onJump} />
          <div className={s.grow} />
          {!making && <SearchField onSearch={onSearch} variant="bar" iconSize={24} />}
          {parked && <NavDockNode section={section} onJump={onJump} />}
          <MakeNode here={making} onMake={() => onJump('create')} iconSize={24} />
          <button
            type="button"
            onClick={() => setNavMode('split')}
            title="Split the nav — sections left, support up top"
            aria-label="Split the nav"
            className={s.split}
          >
            <Icon size={24} sw={1.7}>
              {SICO.panel}
            </Icon>
          </button>
          <BarDivider />
          <BellNode unread={me?.unread ?? 0} onOpen={onNotifications} iconSize={24} />
          <WalletMenu me={me} />
        </div>
      </header>
    </>
  );
}

import { useEffect } from 'react';
import { RingNav } from '@/design-system';
import type { SectionKey } from '@/app/useShellRoute';
import { usePref } from '@/stores/prefs';
import { endNavFlight, parkNav, parkNavQuiet, useUi } from '@/stores/ui';
import { JUMP } from './market';
import { NavParkFlight } from './NavDock';

/**
 * design: chrome.jsx QuickJump — the floating O nav (DS RingNav). The fan carries the
 * destinations (Mya is not on it — she has one home, the dock); the centre O parks the ring
 * in the top bar. Below 720px of viewport height it parks itself.
 * The design's rim capsule is only drawn when no flow bar exists, and the flow bar always
 * exists in the design (`window.V3NextBar`), so it is not ported.
 */
export function QuickJump({ section, onJump }: { section: SectionKey; onJump: (k: SectionKey) => void }) {
  const navDock = usePref('navDock');
  const navFlight = useUi((u) => u.navFlight);
  const floating = navDock !== 'top';
  useEffect(() => {
    const fit = () => {
      if (window.innerHeight < 720 && navDock !== 'top') parkNavQuiet();
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [navDock]);
  /* RingNav caps the fan at 7 (protocol §5) */
  const fanItems = JUMP.filter((j) => j.key !== 'mya').slice(0, 7);
  return (
    <>
      {floating && (
        <RingNav
          items={fanItems}
          active={section}
          onSelect={(k) => onJump(k as SectionKey)}
          onHome={parkNav}
          homeLabel="Park the O nav in the top bar"
          style={{ transform: 'scale(.76)', transformOrigin: '50% 100%' }}
        />
      )}
      {navFlight && <NavParkFlight key={navFlight} dir={navFlight} onDone={endNavFlight} />}
    </>
  );
}

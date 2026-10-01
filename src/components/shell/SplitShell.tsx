import { useState, type CSSProperties } from 'react';
import { Icon, SICO } from '@/design-system';
import { setPrefs, usePref } from '@/stores/prefs';
import { MARKET } from './market';
import { BarDivider, BellNode, MakeNode, MyaNode, WeOverseBadge } from './Nodes';
import { NavDockNode } from './NavDock';
import { SearchField } from './SearchField';
import { setNavMode, type ShellNavProps } from './TopBar';
import { WalletMenu } from './WalletMenu';
import s from './SplitShell.module.css';

// design: section-hero.jsx O_LOGO_CLIP (served locally, like the design's RES() fallback)
const O_LOGO_CLIP = '/media/WEO_Logo.webm';

/** design: shell.jsx ModeToggle */
function ModeToggle({ mode, label }: { mode: 'bar' | 'split'; label: string }) {
  return (
    <button
      type="button"
      onClick={() => setNavMode(mode)}
      title={label}
      aria-label={label}
      className={s.iconBtn}
    >
      <Icon size={17} sw={1.7}>
        {mode === 'bar' ? SICO.bar : SICO.panel}
      </Icon>
    </button>
  );
}

/** design: shell.jsx LeftPanel — the logo, then the sections, vertically. */
function LeftPanel({ section, onJump, onHome }: Pick<ShellNavProps, 'section' | 'onJump' | 'onHome'>) {
  const wide = usePref('railOpen');
  const [hov, setHov] = useState<string | null>(null);
  return (
    <nav aria-label="Sections" className={s.panel} data-wide={wide || undefined}>
      {wide ? (
        <span className={s.logoWide}>
          <WeOverseBadge h={30} onClick={onHome} />
        </span>
      ) : (
        <button type="button" onClick={onHome} title="WeOverse" aria-label="WeOverse" className={s.logoThin}>
          {/* collapsed, the mark is the living O — the same clip the toggle carries */}
          <video
            src={O_LOGO_CLIP}
            autoPlay
            muted
            loop
            playsInline
            aria-label="WeOverse"
            onError={(ev) => {
              ev.currentTarget.style.display = 'none';
            }}
            ref={(el) => {
              if (el) {
                el.muted = true;
                el.defaultMuted = true;
                el.volume = 0;
              }
            }}
            className={s.logoVideo}
          />
        </button>
      )}

      <div className={`weo-scroll-hide ${s.list}`} data-wide={wide || undefined}>
        {MARKET.map((m) => {
          const on = section === m.key;
          const lit = on || hov === m.key;
          const create = m.key === 'create';
          return (
            <button
              key={m.key}
              type="button"
              onMouseEnter={() => setHov(m.key)}
              onMouseLeave={() => setHov(null)}
              onClick={() => onJump(m.key)}
              onFocus={() => setHov(m.key)}
              onBlur={() => setHov((h) => (h === m.key ? null : h))}
              title={m.long || m.label}
              aria-label={m.label}
              aria-current={on ? 'page' : undefined}
              className={s.item}
              data-wide={wide || undefined}
              data-lit={lit || undefined}
              data-on={on || undefined}
              style={{ '--c': m.color } as CSSProperties}
            >
              {/* Create is the action the whole network is nudging: its mark runs larger and
                  keeps a filled well behind it, so the eye finds it before the others */}
              <span
                className={create ? s.wellCreate : s.well}
                data-lit={lit || undefined}
                data-on={on || undefined}
              >
                <Icon size={create ? 23 : 19} sw={create ? 2 : 1.7}>
                  {m.icon}
                </Icon>
              </span>
              {/* the short name at rest, the whole stage on approach — same as the top bar */}
              {wide && <span className={s.label}>{lit ? m.long || m.label : m.label}</span>}
            </button>
          );
        })}
      </div>

      <div className={s.foot} data-wide={wide || undefined}>
        <button
          type="button"
          onClick={() => setPrefs({ railOpen: !wide })}
          title={wide ? 'Collapse to icons' : 'Show labels'}
          aria-label={wide ? 'Collapse to icons' : 'Show labels'}
          className={s.iconBtn}
        >
          <Icon size={17} sw={1.7}>
            {wide ? SICO.collapse : SICO.expand}
          </Icon>
        </button>
        {wide && <ModeToggle mode="bar" label="Back to the top bar" />}
      </div>
    </nav>
  );
}

/** design: shell.jsx SupportCluster — the support half floats top-right, nothing structural in it. */
function SupportCluster({ me, section, onJump, onSearch, onNotifications }: ShellNavProps) {
  return (
    <div className={s.support}>
      <ModeToggle mode="bar" label="Back to the top bar" />
      <BarDivider />
      <SearchField onSearch={onSearch} variant="support" />
      <NavDockNode section={section} onJump={onJump} />
      <MakeNode here={section === 'create'} onMake={() => onJump('create')} />
      <MyaNode />
      <BellNode unread={me?.unread ?? 0} onOpen={onNotifications} />
      <WalletMenu me={me} />
    </div>
  );
}

/**
 * design: shell.jsx Shell — the nav split in two: the logo and the sections stand in a panel
 * on the left, the support controls float top-right. Either half can send you back to the bar.
 */
export function SplitShell(props: ShellNavProps) {
  return (
    <>
      <LeftPanel section={props.section} onJump={props.onJump} onHome={props.onHome} />
      <SupportCluster {...props} />
    </>
  );
}

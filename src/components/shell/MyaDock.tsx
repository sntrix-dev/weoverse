import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { ICO, Icon, OButton } from '@/design-system';
import { MYA_STARTERS } from '@/features/shell/model/myaFaq';
import { setPrefs, usePref } from '@/stores/prefs';
import { askMya, sendMya, setMyaDraft, useMya } from '@/stores/mya';
import { closeDock, openDock, setDockTab, useUi } from '@/stores/ui';
import { MYA } from './mya';
import { SettingsBody, type SettingsBodyProps } from './SettingsBody';
import { useDockPlace } from './useDockPlace';
import s from './MyaDock.module.css';

/** design: chrome.jsx useDockPlace default — `b: 96` rests the orb above the flow bar's band */
export const DOCK_REST = { r: 22, b: 96 } as const;

/** in the chat she is alive — a looping clip, poster-backed so it never flashes empty */
function Live({ poster }: { poster: string }) {
  return (
    <video
      src={MYA.clips.chat}
      poster={poster}
      autoPlay
      muted
      loop
      playsInline
      aria-label="Mya"
      ref={(el) => {
        if (el) {
          el.muted = true;
          el.defaultMuted = true;
          el.volume = 0;
        }
      }}
      className={s.video}
    />
  );
}

/**
 * design: chrome.jsx MyaDock — one dock, two tabs: Mya and your settings, never two panels.
 * Closed it is a breathing orb you can drag anywhere; it remembers where you left it.
 */
export function MyaDock({ settings }: { settings: SettingsBodyProps }) {
  const shell = useRef<HTMLDivElement>(null);
  const dock = useUi((u) => u.dock);
  const myaOpen = useUi((u) => u.myaOpen);
  const myaHidden = usePref('myaHidden');
  const navMode = usePref('navMode');
  const railOpen = usePref('railOpen');
  const stored = usePref('dockPosition');
  // the backend default (22, 22) means "never placed": rest above the flow bar like the design (D-023)
  const saved = stored.r === 22 && stored.b === 22 ? DOCK_REST : stored;
  const { thinking, feed, draft } = useMya();
  const { pos, onDown, moved } = useDockPlace(
    shell,
    `${dock.open ? 'open' : 'orb'}:${navMode}:${railOpen ? 'wide' : 'thin'}`,
    saved,
    (p) => setPrefs({ dockPosition: p }),
  );
  const tab = myaHidden ? 'settings' : dock.tab;
  const F = MYA.faces;
  const gif = thinking ? F.reading : feed.length ? F.answered : F.idle;
  const small = thinking ? F.reading : F.chip;
  const ringHolds = myaOpen && !dock.open;
  const place = { right: pos.r, bottom: pos.b };

  if (!dock.open) {
    if (myaHidden || ringHolds) return null;
    return createPortal(
      /* a dimensional shell: outer ring, inset well, specular light — not a bare image */
      <div ref={shell} onPointerDown={onDown} className={s.orbShell} style={place}>
        <button
          type="button"
          onClick={() => {
            if (!moved()) openDock('mya');
          }}
          aria-label="Open Mya's panel"
          title="Ask Mya — drag to place her"
          className={s.orb}
        >
          <Live poster={gif} />
          <span className={s.shine} />
        </button>
        <span className={s.orbDot} />
      </div>,
      document.body,
    );
  }

  const onSettings = tab === 'settings';
  return createPortal(
    <div
      ref={shell}
      className={`weo-menu ${s.panel}`}
      style={place}
      role="dialog"
      aria-label={onSettings ? 'Settings' : 'Mya'}
    >
      <div onPointerDown={onDown} className={s.head}>
        <span className={s.face} data-dim={onSettings || undefined}>
          {onSettings ? <img src={small} alt="Mya" className={s.img} /> : <Live poster={small} />}
        </span>
        <span className={s.title}>
          <span className={s.name}>{onSettings ? 'Settings' : 'Mya'}</span>
          <span className={s.sub}>
            {onSettings ? 'Appearance · the exchange' : thinking ? 'Reading the last 7 days…' : 'Your guide'}
          </span>
        </span>
        <OButton variant="ghost" size={30} aria-label="Close this panel" onClick={closeDock}>
          <Icon size={15} sw={1.8}>
            {ICO.close}
          </Icon>
        </OButton>
      </div>
      {!myaHidden && (
        <div className={s.tabs} role="tablist">
          {(
            [
              ['mya', 'Ask Mya'],
              ['settings', 'Settings'],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={tab === k}
              onClick={() => setDockTab(k)}
              className={s.tab}
              data-on={tab === k || undefined}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      {onSettings ? (
        <div className={s.settings}>
          <SettingsBody {...settings} />
        </div>
      ) : (
        <>
          <div className={s.feed} aria-live="polite">
            {feed.length === 0 && (
              <>
                <p className={s.intro}>
                  Ask me anything about WeO, or what moved in your Circles this week. I never set your price
                  and never see your money.
                </p>
                {MYA_STARTERS.map((q) => (
                  <button key={q.q} type="button" onClick={() => void askMya(q.q)} className={s.starter}>
                    {q.q}
                  </button>
                ))}
              </>
            )}
            {feed.map((m, i) => (
              <span key={i} className={s.msg} data-me={m.me || undefined}>
                {m.text}
              </span>
            ))}
            {thinking && (
              <span className={s.dots} aria-label="Mya is thinking">
                {[0, 1, 2].map((i) => (
                  <span key={i} className={s.dot} style={{ animationDelay: `${i * 0.14}s` }} />
                ))}
              </span>
            )}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void sendMya();
            }}
            className={s.form}
          >
            <input
              value={draft}
              onChange={(e) => setMyaDraft(e.target.value)}
              placeholder="Ask Mya…"
              aria-label="Ask Mya"
              className={s.input}
            />
            <OButton variant="solid" size={36} aria-label="Send" type="submit">
              <Icon size={16} sw={1.7}>
                {ICO.send}
              </Icon>
            </OButton>
          </form>
        </>
      )}
    </div>,
    document.body,
  );
}

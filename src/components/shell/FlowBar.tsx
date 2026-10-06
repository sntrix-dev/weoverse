import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router';
import { ICO, Icon, O_SECTION_ICONS, type PortalEdge } from '@/design-system';
import { routes } from '@/app/routes';
import { setPrefs, usePref } from '@/stores/prefs';
import { isIntroKey } from '@/components/intro/sections';
import { openWorld, useWorld } from '@/stores/flow';
import { replayIntro, replayWalk } from '@/stores/intro';
import { openDock, parkNav, parkNavQuiet } from '@/stores/ui';
import s from './FlowBar.module.css';

export type FlowScreen = 'discover' | 'collected' | 'hub' | 'listed' | 'create';

interface FlowStop {
  key: Exclude<FlowScreen, 'create'>;
  to: string;
  label: string;
  tone: string;
  icon: PortalEdge;
  lead: string;
}

// design: v3-spine.jsx V3_FLOW — the four stops of the O, in order
const FLOW: readonly FlowStop[] = [
  {
    key: 'discover',
    to: routes.discover(),
    label: 'Discover',
    tone: '#3A95F2',
    icon: 'top',
    lead: 'Find what’s happening now',
  },
  {
    key: 'collected',
    to: routes.collected(),
    label: 'Collect',
    tone: '#D946EF',
    icon: 'right',
    lead: 'What you hold, still moving',
  },
  {
    key: 'hub',
    to: routes.hub(),
    label: 'Community',
    tone: '#D946EF',
    icon: 'bottom',
    lead: 'Your WeOs in flight',
  },
  {
    key: 'listed',
    to: routes.listed(),
    label: 'Exchange',
    tone: '#F7C62B',
    icon: 'left',
    lead: 'Move with the market',
  },
];
const flowAt = (screen: FlowScreen) =>
  Math.max(
    0,
    FLOW.findIndex((f) => f.key === (screen === 'create' ? 'hub' : screen)),
  );
const stop = (i: number) => FLOW[((i % 4) + 4) % 4]!;

export interface FlowAction {
  label: string;
  act: () => void;
  needsReady?: boolean;
}

export interface FlowBarProps {
  screen: FlowScreen;
  tone?: string;
  step?: number;
  of?: number;
  label?: string;
  note?: string;
  primary?: FlowAction;
  secondary?: FlowAction;
  disabled?: boolean;
  back?: { label: string; go: () => void };
  /** the studio's own bar (M11): it stays up while a world is open; a page's bar stands down */
  overlay?: boolean;
  /** the ? — by default this screen's intro and walkthrough again (M11) */
  onHelp?: () => void;
}

const chevronRight = <polyline points="9 6 15 12 9 18" />;

/**
 * design: v3-spine.jsx V3NextBar — ONE fixed bar along the bottom of every section: the way
 * back, and the ONE next action. With the O nav floating it opens a notch for the ring and
 * becomes two capsules; parked, it is one. Folds to a pill (`uiPreferences.flowBar`); the left
 * capsule's tools are remembered separately (`flowBarTools`).
 */
export function FlowBar({
  screen,
  tone,
  step,
  of,
  label,
  note,
  primary,
  secondary,
  disabled,
  back,
  overlay,
  onHelp,
}: FlowBarProps) {
  const navigate = useNavigate();
  const worldOpen = useWorld((w) => !!w.world);
  const at = flowAt(screen);
  const nx = stop(at + 1);
  const t = tone || stop(at).tone;
  const prim = primary || { label: nx.label, act: () => void navigate(nx.to) };
  const lab = label || `Next · ${nx.lead}`;
  const prevStop = stop(at + 3);
  const prev =
    back ||
    (screen === 'create'
      ? { label: 'Community', go: () => void navigate(routes.hub()) }
      : { label: prevStop.label, go: () => void navigate(prevStop.to) });
  const floating = usePref('navDock') !== 'top';
  const min = usePref('flowBar') === 'min';
  const lOpen = usePref('flowBarTools');
  const setMin = (v: boolean) => setPrefs({ flowBar: v ? 'min' : 'full' });
  const setLOpen = (v: boolean) => setPrefs({ flowBarTools: v });

  /* when the O nav comes out to float, the bar's controls stand down: both capsules fold */
  const wasFloating = useRef(floating);
  useEffect(() => {
    if (floating && !wasFloating.current) setPrefs({ flowBar: 'min', flowBarTools: false });
    wasFloating.current = floating;
  }, [floating]);
  useEffect(() => {
    if (!floating) return;
    const fit = () => {
      const half = (window.innerWidth - 330) / 2 - 40;
      if (half < 420 && lOpen) setPrefs({ flowBarTools: false });
      if (half < 380 && !min) setPrefs({ flowBar: 'min' });
      if (half < 190) parkNavQuiet();
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [floating, lOpen, min]);

  const cur = screen === 'create' ? { ...stop(at), label: 'Create', tone: '#22C55E' } : stop(at);
  const primTone = primary ? t : nx.tone;

  const util = (key: string, lbl: string, color: string, icon: ReactNode, act: () => void) => (
    <button
      key={key}
      type="button"
      onClick={act}
      aria-label={lbl}
      title={lbl}
      className={`weo-flowbar-util ${s.util}`}
      style={{ color }}
    >
      <Icon size={15} sw={1.8}>
        {icon}
      </Icon>
    </button>
  );
  const utils = [
    overlay ? null : util('world', 'Enter a world', '#3A95F2', ICO.world, () => openWorld()),
    util('mya', 'Ask Mya', '#D946EF', ICO.chat, () => openDock('mya')),
    floating ? util('park', 'Park the O nav in the top bar', '#F7C62B', ICO.dock, parkNav) : null,
  ];
  const backBtn = (
    <button type="button" onClick={prev.go} className={`weo-flowbar-back ${s.backBtn}`}>
      <Icon size={14} sw={2}>
        <path d="M15 6l-6 6 6 6" />
      </Icon>
      <span className="weo-flowbar-back-label">{prev.label}</span>
    </button>
  );
  const backIcon = (
    <button
      type="button"
      onClick={prev.go}
      aria-label={`Back · ${prev.label}`}
      title={`Back · ${prev.label}`}
      className={s.backIcon}
    >
      <Icon size={16} sw={2}>
        <path d="M15 6l-6 6 6 6" />
      </Icon>
    </button>
  );
  const chev = (open: boolean, onClick: () => void, lbl: string) => (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      aria-label={lbl}
      title={lbl}
      className={s.chevBtn}
    >
      <span className={s.chev} data-open={open || undefined}>
        <Icon size={14} sw={2.2}>
          {chevronRight}
        </Icon>
      </span>
    </button>
  );
  const text = (
    <span className={`weo-flowbar-text ${s.text}`}>
      <span className={s.eyebrow}>{of ? `Step ${step} of ${of}` : primary ? 'Next' : 'Next section'}</span>
      <span className={s.lab}>{lab}</span>
      {note && <span className={s.note}>{note}</span>}
    </span>
  );
  /* the secondary is the WeO's OWN verb — a tonal pill in its own right */
  const secBtn = secondary && (
    <button
      type="button"
      onClick={secondary.act}
      disabled={!!(disabled && secondary.needsReady)}
      className={s.secBtn}
      style={{ '--t': t } as CSSProperties}
    >
      <span className={s.secDot} />
      {secondary.label}
    </button>
  );
  const primBtn = (
    <button
      type="button"
      onClick={prim.act}
      disabled={disabled}
      className={s.primBtn}
      style={{ '--t': primTone } as CSSProperties}
    >
      {prim.label}
      <span className={s.primArrow}>
        <Icon size={14} sw={2.2}>
          <path d="M9 6l6 6-6 6" />
        </Icon>
      </span>
    </button>
  );
  const minBtn = (
    <button
      type="button"
      onClick={() => setMin(true)}
      title="Minimise the flow bar"
      aria-label="Minimise the flow bar"
      className={s.util}
    >
      <Icon size={15} sw={2.2}>
        <path d="M6 12h12" />
      </Icon>
    </button>
  );
  const curPill = (
    <button
      type="button"
      onClick={() => setMin(false)}
      title={`Expand · you are in ${cur.label}`}
      aria-expanded={false}
      aria-label={`Expand the next step — you are in ${cur.label}`}
      className={s.curPill}
      style={{ '--t': cur.tone } as CSSProperties}
    >
      <span className={s.curIcon}>
        <Icon size={14} sw={1.8}>
          {O_SECTION_ICONS[cur.icon]}
        </Icon>
      </span>
      <span className="weo-flowbar-min-label">{cur.label}</span>
      <Icon size={12} sw={2.2}>
        <path d="M6 15l6-6 6 6" />
      </Icon>
    </button>
  );
  const help = onHelp ?? (() => (isIntroKey(screen) ? replayIntro(screen) : replayWalk(screen)));
  const helpBtn = (
    <button
      type="button"
      onClick={help}
      title="Show me this screen"
      aria-label="Replay the intro and walkthrough for this screen"
      className={`weo-flowbar-util ${s.util}`}
      style={{ color: 'var(--text-dim)' }}
    >
      <Icon size={16} sw={1.7}>
        <circle cx="12" cy="12" r="8.4" />
        <path d="M9.6 9.6a2.5 2.5 0 0 1 4.8.8c0 1.6-2.4 2-2.4 3.4" />
        <circle cx="12" cy="16.8" r=".9" fill="currentColor" />
      </Icon>
    </button>
  );
  const leftGroup = lOpen ? (
    <>
      {backBtn}
      <span aria-hidden="true" className={s.divider} />
      {helpBtn}
      {utils}
      {chev(true, () => setLOpen(false), 'Fold the tools away')}
    </>
  ) : (
    <>
      {backIcon}
      {chev(false, () => setLOpen(true), 'Show help and tools')}
    </>
  );
  const rightGroup = min ? (
    <>
      {curPill}
      {primBtn}
    </>
  ) : (
    <>
      {text}
      {secBtn}
      {primBtn}
      {minBtn}
    </>
  );
  const capVars = { '--t': t } as CSSProperties;
  if (worldOpen && !overlay) return null;
  return createPortal(
    <div role="region" className={`weo-flowbar-wrap ${s.wrap}`} aria-label="Where you are and what is next">
      {floating ? (
        <div className={`weo-flowbar ${s.split}`}>
          <div
            className={`${lOpen ? 'weo-flowbar-left' : 'weo-flowbar-left weo-flowbar-left-min'} ${s.cap} ${s.half}`}
            style={capVars}
          >
            {leftGroup}
          </div>
          <span aria-hidden="true" className={`weo-flowbar-notch ${s.notch}`} />
          <div
            className={`${min ? 'weo-flowbar-right weo-flowbar-min' : 'weo-flowbar-right'} ${s.cap} ${s.half}`}
            style={capVars}
          >
            {rightGroup}
          </div>
        </div>
      ) : (
        <div
          className={`weo-flowbar ${s.cap} ${s.one}`}
          data-auto={(min && !lOpen) || undefined}
          style={capVars}
        >
          {leftGroup}
          <span aria-hidden="true" className={s.dividerTall} />
          {rightGroup}
        </div>
      )}
    </div>,
    document.body,
  );
}

/** design: v3-spine.jsx V3FlowFoot — the same bar, with the next section as its one action. */
export function FlowFoot({
  screen,
  back,
  next,
}: {
  screen: FlowScreen;
  back?: { label: string; go: () => void };
  next?: { label: string; lead: string; go: () => void; tone: string };
}) {
  return (
    <FlowBar
      screen={screen}
      back={back}
      primary={next ? { label: next.label, act: next.go } : undefined}
      tone={next?.tone}
      label={next ? `Next · ${next.lead}` : undefined}
    />
  );
}

import { useState } from 'react';
import { ICO, Icon, OButton, WeOverseLettering } from '@/design-system';
import { useUi, openDock } from '@/stores/ui';
import { useMya } from '@/stores/mya';
import { Tip, tipHandlers } from './Tip';
import s from './Nodes.module.css';

/** design: chrome.jsx WeOverseMark + WeOverseBadge — the drawn wordmark, one ink. */
export function WeOverseBadge({
  h,
  onClick,
  pad,
}: {
  h: number;
  onClick: () => void;
  pad?: number | string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="WeOverse"
      className={s.badge}
      style={pad != null ? { padding: pad } : undefined}
    >
      <WeOverseLettering
        h={h}
        treatment="ink"
        ink="var(--text)"
        className="weo-wordmark"
        style={{ transition: 'height .3s var(--ease-portal)' }}
      />
    </button>
  );
}

/**
 * design: chrome.jsx MakeNode — Make, from anywhere. Neutral at rest; the green arrives on
 * approach, and inside Make itself it sits filled. Fixed 40px footprint (NAV-04).
 */
export function MakeNode({ here, onMake }: { here: boolean; onMake: () => void }) {
  const [tip, setTip] = useState<DOMRect | null>(null);
  return (
    <span className={s.wrap}>
      <button
        type="button"
        onClick={onMake}
        {...tipHandlers(setTip)}
        aria-label="Make a WeO"
        className={s.make}
        data-lit={!!tip || here || undefined}
      >
        <Icon size={16} sw={2.2}>
          <path d="M12 7.6v8.8M7.6 12h8.8" />
        </Icon>
      </button>
      <Tip label="Make a WeO" at={tip} />
    </span>
  );
}

/** design: chrome.jsx MyaNode — a chat affordance with a live dot that says she is awake. */
export function MyaNode() {
  const on = useUi((u) => u.myaOpen || u.dock.open);
  const busy = useMya((m) => m.thinking);
  return (
    <button
      type="button"
      onClick={() => openDock('mya')}
      aria-label="Ask Mya"
      title={busy ? 'Mya is thinking…' : 'Ask Mya — your guide'}
      className={s.mya}
      data-on={on || busy || undefined}
    >
      <span className={s.myaRing} data-on={on || undefined} />
      <Icon size={19} sw={1.7}>
        {ICO.chat}
      </Icon>
      <span aria-hidden="true" title="Mya is active" className={s.myaDot} data-busy={busy || undefined} />
    </button>
  );
}

/**
 * design: the bell OButton in TopBar/SupportCluster. The design always draws the violet dot;
 * here it shows only when there is something unread (nav-summary `notifications.unread`).
 */
export function BellNode({ unread, onOpen }: { unread: number; onOpen: () => void }) {
  return (
    <OButton
      variant="ghost"
      size={38}
      aria-label="Notifications"
      onClick={onOpen}
      style={{ position: 'relative' }}
    >
      <Icon size={18} sw={1.7}>
        {ICO.bell}
      </Icon>
      {unread > 0 && <span className={s.bellDot} />}
    </OButton>
  );
}

/** the hairline between groups in the bar */
export const BarDivider = () => <span className={s.divider} />;

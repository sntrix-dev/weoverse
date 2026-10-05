// design: screens-hub.jsx OProfileHub / HubNode / useHubOrder
import { useRef, useState, type MutableRefObject, type ReactNode } from 'react';
import { svg } from '@/design-system';
import { OProfileStage, type StageItem, type StageUtility } from './ProfileStage';

export interface HubModule {
  label: string;
  note?: string;
  tone?: string;
  cta?: string;
  icon?: ReactNode;
  preview?: ReactNode;
  onClick: () => void;
}

export interface HubView {
  key: string;
  label: string;
  tone?: string;
  note?: string;
  around?: HubModule[];
  /** a layer that is a whole instrument gets the full width under the composition */
  panel?: ReactNode;
}

const read = <T,>(key: string, fallback: T): T => {
  try {
    const v = JSON.parse(localStorage.getItem(key) || 'null') as T | null;
    return v ?? fallback;
  } catch {
    return fallback;
  }
};
const write = (key: string, v: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    /* storage can be blocked; the order simply isn't kept */
  }
};

/** design useHubOrder — the stacks are yours: pin what you use, drag to reorder; kept on this device. */
function useHubOrder(key: string, labels: string[]) {
  const sk = `weo.hub.${key}`;
  const [state, setState] = useState<{ order: string[]; pins: string[] }>(() => {
    const s = read<{ order?: string[]; pins?: string[] } | null>(sk, null);
    return s && Array.isArray(s.order) ? { order: s.order, pins: s.pins ?? [] } : { order: [], pins: [] };
  });
  const save = (next: { order: string[]; pins: string[] }) => {
    setState(next);
    write(sk, next);
  };
  const order = state.order
    .filter((l) => labels.includes(l))
    .concat(labels.filter((l) => !state.order.includes(l)));
  const pins = state.pins.filter((l) => labels.includes(l));
  return {
    order,
    pins,
    pin: (l: string) => save({ order, pins: pins.includes(l) ? pins.filter((x) => x !== l) : [...pins, l] }),
    move: (from: number, to: number) => {
      const next = order.slice();
      const [it] = next.splice(from, 1);
      if (it !== undefined) next.splice(to, 0, it);
      save({ order: next, pins });
    },
  };
}

/** design HubNode — a door with a window in it: icon and label at rest, a live preview and the route on approach. */
function HubNode({
  a,
  pinned,
  onPin,
  onDragStart,
  onDropOn,
  lock,
}: {
  a: HubModule;
  pinned: boolean;
  onPin: () => void;
  onDragStart: () => void;
  onDropOn: () => void;
  lock: MutableRefObject<number>;
}) {
  const [hov, setHov] = useState(false);
  const [look, setLook] = useState(false);
  const [over, setOver] = useState(false);
  // pinning re-sorts the stacks; the shared lock stops a node that slid under the pointer from opening
  const enter = () => {
    if (Date.now() - lock.current > 600) setHov(true);
  };
  const open = hov || look || pinned;
  const tone = a.tone || 'var(--o-blue)';
  return (
    <div
      draggable
      onDragStart={(e) => {
        try {
          e.dataTransfer.setData('text/plain', a.label);
          e.dataTransfer.effectAllowed = 'move';
        } catch {
          /* ignore */
        }
        onDragStart();
      }}
      onDragEnd={() => setOver(false)}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        onDropOn();
      }}
      onMouseEnter={enter}
      onMouseLeave={() => setHov(false)}
      style={{
        width: '100%',
        borderRadius: 22,
        padding: open ? '9px 12px 12px 9px' : '9px 12px 9px 9px',
        cursor: 'grab',
        background: open ? `color-mix(in srgb, ${tone} 14%, var(--surface))` : 'var(--surface)',
        boxShadow: over
          ? `0 0 0 2px ${tone}`
          : open
            ? `0 16px 32px -16px color-mix(in srgb, ${tone} 85%, transparent), inset 0 0 0 1.5px ${tone}`
            : `var(--nm-sm), inset 0 0 0 1px ${pinned ? `color-mix(in srgb, ${tone} 44%, var(--border))` : 'var(--border)'}`,
        transform: open ? 'translateY(-2px)' : 'none',
        transition: 'background .28s, box-shadow .3s, transform .3s var(--ease-settle), padding .3s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <button
          type="button"
          onClick={() => setLook((l) => !l)}
          aria-expanded={open}
          title={a.note || a.label}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 11,
            flex: 1,
            minWidth: 0,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            textAlign: 'left',
            font: 'inherit',
            padding: 0,
          }}
        >
          <span
            style={{
              display: 'grid',
              placeItems: 'center',
              width: 34,
              height: 34,
              flex: '0 0 auto',
              borderRadius: '50%',
              color: open ? '#fff' : tone,
              background: open ? tone : `color-mix(in srgb, ${tone} 14%, var(--surface))`,
              transition: 'background .26s, color .26s',
            }}
          >
            {svg(a.icon || <circle cx="12" cy="12" r="8" />, 17, 'currentColor', 1.8)}
          </span>
          <span
            style={{
              minWidth: 0,
              flex: 1,
              fontSize: 12.5,
              fontWeight: 700,
              letterSpacing: '-.012em',
              color: 'var(--text)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {a.label}
          </span>
        </button>
        <span
          aria-hidden="true"
          title="Drag to reorder"
          style={{
            display: 'grid',
            placeItems: 'center',
            flex: '0 0 auto',
            color: 'var(--text-faint)',
            opacity: open ? 0.8 : 0.34,
            cursor: 'grab',
            transition: 'opacity .24s',
          }}
        >
          {svg(
            <>
              <circle cx="9" cy="7" r="1.3" fill="currentColor" />
              <circle cx="15" cy="7" r="1.3" fill="currentColor" />
              <circle cx="9" cy="12" r="1.3" fill="currentColor" />
              <circle cx="15" cy="12" r="1.3" fill="currentColor" />
              <circle cx="9" cy="17" r="1.3" fill="currentColor" />
              <circle cx="15" cy="17" r="1.3" fill="currentColor" />
            </>,
            14,
            'currentColor',
            0,
          )}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setHov(false);
            setLook(false);
            onPin();
          }}
          aria-pressed={pinned}
          aria-label={pinned ? `Unpin ${a.label}` : `Pin ${a.label}`}
          title={pinned ? 'Unpin' : 'Pin to the top'}
          style={{
            width: 26,
            height: 26,
            flex: '0 0 auto',
            borderRadius: '50%',
            border: 'none',
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
            color: pinned ? tone : 'var(--text-faint)',
            background: pinned ? `color-mix(in srgb, ${tone} 16%, var(--surface))` : 'transparent',
            opacity: pinned ? 1 : open ? 0.9 : 0.34,
            transition: 'opacity .24s, background .24s, color .2s',
          }}
        >
          {svg(
            <>
              <path d="M12 17v4" />
              <path d="M8.5 4h7l-1 7 2.5 2.5H6L8.5 11z" />
            </>,
            14,
            'currentColor',
            1.9,
          )}
        </button>
        <span
          style={{
            display: 'grid',
            placeItems: 'center',
            flex: '0 0 auto',
            color: open ? tone : 'var(--text-faint)',
            transform: open ? 'rotate(90deg)' : 'none',
            transition: 'transform .3s var(--ease-portal), color .2s',
          }}
        >
          {svg(<polyline points="9 6 15 12 9 18" />, 14, 'currentColor', 2.2)}
        </span>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateRows: open ? '1fr' : '0fr',
          transition: 'grid-template-rows .38s var(--ease-portal)',
        }}
      >
        <div style={{ overflow: 'hidden', minHeight: 0 }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 9,
              marginTop: 10,
              paddingTop: 10,
              paddingLeft: 3,
              borderTop: `1px solid color-mix(in srgb, ${tone} 30%, transparent)`,
              opacity: open ? 1 : 0,
              transition: 'opacity .28s .04s',
            }}
          >
            {a.note && (
              <span style={{ fontSize: 11, lineHeight: 1.45, color: 'var(--text-dim)' }}>{a.note}</span>
            )}
            {a.preview}
            <button
              type="button"
              onClick={a.onClick}
              tabIndex={open ? 0 : -1}
              style={{
                alignSelf: 'flex-start',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                border: 'none',
                cursor: 'pointer',
                borderRadius: 999,
                padding: '7px 13px',
                font: 'inherit',
                fontSize: 11.5,
                fontWeight: 700,
                color: '#fff',
                background: tone,
                boxShadow: `0 6px 14px -6px color-mix(in srgb, ${tone} 90%, transparent)`,
              }}
            >
              {a.cta || 'Open'}
              {svg(<polyline points="9 6 15 12 9 18" />, 13, 'currentColor', 2.4)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * design: screens-hub.jsx OProfileHub — one panel, the O profile at its centre, the functions
 * around it in two ordered stacks. The first view is who you are; the others expand it (a wallet
 * is the same passport opened further). Which layers are on is kept on this device.
 */
export function OProfileHub({
  views,
  storeKey,
  stage,
}: {
  views: HubView[];
  storeKey: string;
  stage: {
    size?: number;
    isr: number;
    avatar: string | null;
    items: StageItem[];
    tone?: string;
    onOpen?: () => void;
    collapsible?: boolean;
    utility?: StageUtility;
  };
}) {
  const lk = `weo.hub.layers.${storeKey}`;
  const [on, setOn] = useState<string[]>(() => read<string[]>(lk, []));
  const toggle = (k: string) => {
    const next = on.includes(k) ? on.filter((x) => x !== k) : [...on, k];
    setOn(next);
    write(lk, next);
  };
  const live = views.filter((v, i) => i === 0 || on.includes(v.key));
  const items = live.flatMap((v) => v.around ?? []);
  const panels = live.filter((v) => v.panel);
  const ord = useHubOrder(
    storeKey,
    items.map((i) => i.label),
  );
  const drag = useRef<number | null>(null);
  const lock = useRef(0);
  const sorted = [...ord.pins, ...ord.order.filter((l) => !ord.pins.includes(l))]
    .map((l) => items.find((i) => i.label === l))
    .filter((x): x is HubModule => !!x);
  const half = Math.floor(sorted.length / 2) + (sorted.length % 2);
  const node = (a: HubModule) => (
    <HubNode
      key={a.label}
      a={a}
      lock={lock}
      pinned={ord.pins.includes(a.label)}
      onPin={() => {
        lock.current = Date.now();
        ord.pin(a.label);
      }}
      onDragStart={() => {
        drag.current = ord.order.indexOf(a.label);
      }}
      onDropOn={() => {
        const to = ord.order.indexOf(a.label);
        if (drag.current != null && drag.current !== to) ord.move(drag.current, to);
        drag.current = null;
      }}
    />
  );
  const col = (arr: HubModule[]) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0, width: '100%' }}>
      {arr.map(node)}
    </div>
  );
  const first = views[0];
  return (
    <div
      className="weo-ohub"
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(170px,1fr) auto minmax(170px,1fr)',
        gap: 'clamp(12px,1.8vw,24px)',
        alignItems: 'center',
        width: '100%',
      }}
    >
      {col(sorted.slice(0, half))}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
          minWidth: 0,
          maxWidth: '100%',
        }}
      >
        <OProfileStage {...stage} />
        {views.length > 1 && first && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                borderRadius: 999,
                padding: '7px 13px',
                fontSize: 12,
                fontWeight: 700,
                color: '#fff',
                background: first.tone || 'var(--o-blue)',
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />
              {first.label}
            </span>
            {views.slice(1).map((v) => {
              const lit = on.includes(v.key);
              const vt = v.tone || 'var(--o-gold)';
              return (
                <button
                  type="button"
                  key={v.key}
                  onClick={() => toggle(v.key)}
                  aria-pressed={lit}
                  title={v.note || v.label}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    minHeight: 34,
                    padding: '0 13px',
                    borderRadius: 999,
                    border: 'none',
                    cursor: 'pointer',
                    font: 'inherit',
                    fontSize: 12,
                    fontWeight: lit ? 700 : 600,
                    color: lit ? '#fff' : 'var(--text-dim)',
                    background: lit ? vt : 'var(--surface)',
                    boxShadow: lit
                      ? `0 8px 18px -8px color-mix(in srgb, ${vt} 85%, transparent)`
                      : 'var(--nm-sm)',
                    transition: 'background .22s, color .2s, box-shadow .22s',
                  }}
                >
                  {svg(lit ? <path d="M8 12h8" /> : <path d="M12 8v8M8 12h8" />, 14, 'currentColor', 2.2)}
                  {v.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
      {col(sorted.slice(half))}
      {panels.map((p) => (
        <div key={p.key} style={{ gridColumn: '1 / -1', width: '100%' }}>
          {p.panel}
        </div>
      ))}
    </div>
  );
}

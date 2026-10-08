// design: create.jsx CreateScreen — the module rails either side of the O; collapsed, each is a column of icons
import { svg } from '@/design-system';
import { MOD_ICO } from './icons';
import { ModWell, type ComposerModule } from './ModWell';

export function ModRail({
  side,
  list,
  mods,
  done,
  rail,
  setRail,
  tone,
  openMod,
  setOpenMod,
  pins,
  onPin,
  reqMiss,
  modHov,
  setModHov,
}: {
  side: 'left' | 'right';
  list: ComposerModule[];
  mods: ComposerModule[];
  done: number;
  rail: boolean;
  setRail: (fn: (r: boolean) => boolean) => void;
  tone: string;
  openMod: string | null;
  setOpenMod: (k: string | null) => void;
  pins: Record<string, boolean>;
  onPin: (k: string) => void;
  reqMiss: (key: string) => boolean;
  /** the collapsed icon under the pointer — named in the left rail's head */
  modHov: string | null;
  setModHov: (fn: (h: string | null) => string | null) => void;
}) {
  const leave = (t: string) => setModHov((h) => (h === t ? null : h));
  return (
    <aside
      className={rail ? 'weo-quiet' : 'weo-modrail weo-quiet'}
      style={{ position: 'sticky', top: 120, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '.15em',
            textTransform: 'uppercase',
            color: modHov ? tone : 'var(--text-faint)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            transition: 'color .2s',
          }}
        >
          {side === 'left' ? (modHov ?? `Modules · ${done}/${mods.length}`) : rail ? 'Terms' : ''}
        </span>
        {side === 'right' && (
          <button
            type="button"
            onClick={() => setRail((r) => !r)}
            title={rail ? 'Collapse the modules' : 'Show the modules'}
            aria-label={rail ? 'Collapse the modules' : 'Show the modules'}
            aria-expanded={rail}
            style={{
              display: 'grid',
              placeItems: 'center',
              width: 42,
              height: 42,
              flex: '0 0 auto',
              borderRadius: 999,
              border: 'none',
              cursor: 'pointer',
              background: 'var(--surface)',
              boxShadow: 'var(--nm-sm)',
              color: 'var(--text-dim)',
            }}
          >
            {svg(
              rail ? <path d="M14.5 8.5L10 12l4.5 3.5" /> : <path d="M9.5 8.5L14 12l-4.5 3.5" />,
              16,
              'currentColor',
              1.8,
            )}
          </button>
        )}
      </div>
      {rail ? (
        list.map((m) => (
          <div key={m.key} className={reqMiss(m.key) ? 'weo-req-miss' : undefined}>
            <ModWell
              m={m}
              tone={tone}
              open={!!pins[m.key] || openMod === m.key}
              onToggle={() => setOpenMod(openMod === m.key ? null : m.key)}
              pinned={!!pins[m.key]}
              onPin={() => onPin(m.key)}
            />
          </div>
        ))
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {list.map((m) => (
            <button
              type="button"
              key={m.key}
              onClick={() => {
                setRail(() => true);
                setOpenMod(m.key);
              }}
              onMouseEnter={() => setModHov(() => m.title)}
              onMouseLeave={() => leave(m.title)}
              onFocus={() => setModHov(() => m.title)}
              onBlur={() => leave(m.title)}
              title={m.title}
              aria-label={m.title}
              style={{
                position: 'relative',
                display: 'grid',
                placeItems: 'center',
                width: 42,
                height: 42,
                flex: '0 0 auto',
                borderRadius: 999,
                border: 'none',
                cursor: 'pointer',
                background: 'var(--surface)',
                boxShadow: modHov === m.title ? 'var(--nm-raised)' : 'var(--nm-sm)',
                color: m.done ? 'var(--o-green)' : 'var(--text-dim)',
                transition: 'box-shadow .2s, color .2s',
              }}
            >
              {svg(MOD_ICO[m.key] ?? MOD_ICO.title, 17, 'currentColor', 1.7)}
              {m.done && (
                <span
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    right: 3,
                    bottom: 3,
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: 'var(--o-green)',
                    boxShadow: '0 0 0 2px var(--surface)',
                  }}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </aside>
  );
}

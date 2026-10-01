import type { CSSProperties } from 'react';
import { Button, OMark, Orb, Toggle } from '@/design-system';
import type { ShellMe } from '@/features/shell/model/me';
import { osFmt } from '@/lib/format';
import { setPrefs, usePref } from '@/stores/prefs';
import { closeSettings, setMyaHidden, toast } from '@/stores/ui';
import { MYA } from './mya';
import s from './SettingsBody.module.css';

export interface SettingsBodyProps {
  me: ShellMe | undefined;
  onPassport: () => void;
  onAllSettings: () => void;
}

const HOMES = [
  ['hub', 'Community', 'var(--o-violet)'],
  ['discover', 'Discover', 'var(--o-blue)'],
  ['create', 'Create', 'var(--o-green)'],
] as const;

/** design: screens-footer.jsx SettingsBody — appearance, and the exchange (the dock's Settings tab). */
export function SettingsBody({ me, onPassport, onAllSettings }: SettingsBodyProps) {
  const theme = usePref('theme');
  const home = usePref('home');
  const myaHidden = usePref('myaHidden');
  const t = me?.tier ?? null;
  return (
    <div className={s.root}>
      <div>
        <span className={s.eyebrow}>Appearance</span>
        <div className={s.seg} role="radiogroup" aria-label="Appearance">
          {(
            [
              ['light', 'Light'],
              ['dark', 'Dark'],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={theme === k}
              onClick={() => setPrefs({ theme: k })}
              className={s.segBtn}
              data-on={theme === k || undefined}
              style={{ '--c': 'var(--o-violet)' } as CSSProperties}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className={s.eyebrow}>The wordmark opens</span>
        <div className={s.seg} role="radiogroup" aria-label="The wordmark opens">
          {HOMES.map(([k, label, tone]) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={home === k}
              onClick={() => setPrefs({ home: k })}
              className={s.segBtn}
              data-on={home === k || undefined}
              style={{ '--c': tone } as CSSProperties}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className={s.well}>
        <span className={s.myaFace}>
          <img src={MYA.avatar} alt="Mya" />
        </span>
        <span className={s.wellText}>
          <span className={s.wellTitle}>Mya in the corner</span>
          <span className={s.wellNote}>
            Your guide stays reachable from the corner, the O nav and the top bar.
          </span>
        </span>
        <Toggle checked={!myaHidden} aria-label="Mya in the corner" onChange={(v) => setMyaHidden(!v)} />
      </div>

      {/* Into Os is the boundary to WeO Local, where fiat is the unit that moves (FR-20.7).
          WeOverse links to it; it does not reimplement it, and it never shows a rate. */}
      <div className={s.local}>
        <span className={s.localOrb}>
          <Orb size={40} fill="#F7C62B" matcap breathe />
          <span aria-hidden="true" className={s.localMark}>
            <OMark size={15} />
          </span>
        </span>
        <span className={s.wellText}>
          <span className={s.wellTitle}>Topping up happens in WeO Local</span>
          <span className={s.localNote}>
            Money moves there, under its own rules. Here, everything is priced in Os.
          </span>
        </span>
        <Button
          size="sm"
          variant="secondary"
          tone="gold"
          onClick={() => toast('WeO Local is a separate app')}
        >
          Open Local
        </Button>
      </div>

      <div className={s.figures}>
        {(
          [
            ['Your Os', me ? osFmt(me.available) : '—', 'available to spend'],
            ['Your tier', t ? t.label : '—', t ? `Tier ${t.rank}` : ''],
          ] as const
        ).map(([k, a, b]) => (
          <div key={k} className={s.figure}>
            <span className={s.figureKey}>{k}</span>
            <b className={s.figureValue}>{a}</b>
            <span className={s.figureNote}>{b}</span>
          </div>
        ))}
      </div>

      <div className={s.actions}>
        <Button
          size="sm"
          variant="ghost"
          tone="blue"
          onClick={() => {
            closeSettings();
            onPassport();
          }}
        >
          Open your passport
        </Button>
        <Button
          size="sm"
          variant="primary"
          selected
          tone="violet"
          onClick={() => {
            closeSettings();
            onAllSettings();
          }}
        >
          All settings
        </Button>
      </div>
    </div>
  );
}

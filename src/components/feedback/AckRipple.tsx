import { useEffect, useState, type CSSProperties } from 'react';
import { Icon } from '@/design-system';
import { useUi } from '@/stores/ui';
import s from './AckRipple.module.css';

/** design: arrival.jsx AckRipple — the centred check that says an action landed. */
export function AckRipple() {
  const ack = useUi((u) => u.ack);
  const [on, setOn] = useState(false);
  const [played, setPlayed] = useState(ack.play);
  if (played !== ack.play) {
    setPlayed(ack.play);
    if (ack.play) setOn(true);
  }
  useEffect(() => {
    if (!on) return;
    const t = setTimeout(() => setOn(false), 1250);
    return () => clearTimeout(t);
  }, [on, played]);
  if (!ack.play) return null;
  const tone = ack.tone || 'var(--o-green)';
  return (
    <div
      aria-live="polite"
      className={s.root}
      data-on={on || undefined}
      style={{ '--tone': tone } as CSSProperties}
    >
      <div className={s.col}>
        <span className={s.rings}>
          {[0, 1, 2].map((i) => (
            <span
              key={`${played}-${i}`}
              aria-hidden="true"
              className={s.ring}
              data-on={on || undefined}
              style={{ animationDelay: `${i * 200}ms` }}
            />
          ))}
          <span className={s.check} data-on={on || undefined}>
            <Icon size={30} sw={2.6}>
              <polyline points="20 6 9 17 4 12" />
            </Icon>
          </span>
        </span>
        {ack.label && (
          <span className={s.label} data-on={on || undefined}>
            {ack.label}
          </span>
        )}
      </div>
    </div>
  );
}

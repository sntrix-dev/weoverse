import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/design-system';
import { closeExternal, useUi } from '@/stores/ui';
import s from './ExternalGate.module.css';

/**
 * design: screens-more.jsx ExternalGate — anything that leaves the WeOverse stops here first:
 * what the destination is, and the one way through. A link out is never a silent jump.
 * The design's prototype toasts on Continue; the app opens the address in a new tab.
 */
export function ExternalGate() {
  const g = useUi((u) => u.external);
  const shown = !!g;
  useEffect(() => {
    if (!shown) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeExternal();
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [shown]);
  if (!g) return null;
  const go = () => {
    closeExternal();
    g.onConfirm?.();
    if (g.url)
      window.open(/^https?:\/\//.test(g.url) ? g.url : `https://${g.url}`, '_blank', 'noopener,noreferrer');
  };
  return createPortal(
    <div
      className={s.scrim}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) closeExternal();
      }}
      role="presentation"
    >
      <div className={s.card} role="dialog" aria-modal="true" aria-label={g.label}>
        <div>
          <p className={s.eyebrow}>{g.eyebrow || 'Leaving the WeOverse'}</p>
          <h3 className={s.title}>{g.label}</h3>
          <p className={s.note}>{g.note}</p>
        </div>
        {g.url && <div className={s.url}>{g.url}</div>}
        <div className={s.actions}>
          <Button size="sm" variant="ghost" tone="violet" onClick={closeExternal}>
            Stay here
          </Button>
          <Button size="sm" variant="primary" tone={g.tone || 'violet'} onClick={go}>
            {g.cta || 'Continue'}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

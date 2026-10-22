import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { closeConfirm, useUi } from '@/stores/ui';
import s from './ConfirmDialog.module.css';

/**
 * design: app.jsx weoConfirmLeave (v4) — a small card that asks before you leave a circle (and
 * anything else that should not happen on one stray tap): Stay, or the action. Esc and the
 * backdrop keep things as they are; Stay takes focus first.
 */
export function ConfirmDialog() {
  const c = useUi((u) => u.confirm);
  const shown = !!c;
  useEffect(() => {
    if (!shown) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeConfirm();
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [shown]);
  if (!c) return null;
  return createPortal(
    <div
      className={s.scrim}
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) closeConfirm();
      }}
    >
      <div
        className={s.card}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="weo-confirm-title"
        aria-describedby="weo-confirm-body"
      >
        <h3 id="weo-confirm-title" className={s.title}>
          {c.title}
        </h3>
        <p id="weo-confirm-body" className={s.body}>
          {c.body}
        </p>
        <div className={s.row}>
          <button type="button" className={s.stay} onClick={closeConfirm}>
            {c.cancel ?? 'Stay'}
          </button>
          <button
            type="button"
            className={s.go}
            data-danger={c.danger || undefined}
            onClick={() => {
              closeConfirm();
              c.onConfirm();
            }}
          >
            {c.confirm}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

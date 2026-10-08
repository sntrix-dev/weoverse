import { createPortal } from 'react-dom';
import { OsRun } from '@/components/text/OsRun';
import { useUi } from '@/stores/ui';
import s from './Toasts.module.css';

/**
 * design: screens-more.jsx Toasts — above every sheet and modal. Portaled to <body>: inside
 * #root (its own stacking context) they sat under the floating O nav and the flow bar (live pass).
 */
export function Toasts() {
  const toasts = useUi((u) => u.toasts);
  return createPortal(
    <div className={s.stack} role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={s.toast}>
          <OsRun text={t.msg} />
        </div>
      ))}
    </div>,
    document.body,
  );
}

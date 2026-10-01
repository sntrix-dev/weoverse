import { OsRun } from '@/components/text/OsRun';
import { useUi } from '@/stores/ui';
import s from './Toasts.module.css';

/** design: screens-more.jsx Toasts — above every sheet and modal. */
export function Toasts() {
  const toasts = useUi((u) => u.toasts);
  return (
    <div className={s.stack} role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={s.toast}>
          <OsRun text={t.msg} />
        </div>
      ))}
    </div>
  );
}

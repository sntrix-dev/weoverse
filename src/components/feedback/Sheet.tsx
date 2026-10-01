import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ICO, Icon } from '@/design-system';
import s from './Sheet.module.css';

export interface SheetProps {
  title: ReactNode;
  sub?: ReactNode;
  onClose: () => void;
  children?: ReactNode;
  footer?: ReactNode;
  /** max width, px (default 520) */
  w?: number;
}

/**
 * design: screens-more.jsx Sheet — the modal shell. Portalled to the body so a transformed
 * ancestor never becomes its containing block; tall sheets scroll. The shell is glass; the
 * solid surface inside is always the thing you act on.
 */
export function Sheet({ title, sub, onClose, children, footer, w = 520 }: SheetProps) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return createPortal(
    <div
      className={s.scrim}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        className={`weo-menu ${s.card}`}
        style={{ maxWidth: w }}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
      >
        <div className={s.head}>
          <div className={s.headText}>
            <h3 className={s.title}>{title}</h3>
            {sub && <p className={s.sub}>{sub}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className={s.close}>
            <Icon size={16} sw={1.8}>
              {ICO.close}
            </Icon>
          </button>
        </div>
        {children}
        {footer && <div className={s.footer}>{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

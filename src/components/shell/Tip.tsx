import { createPortal } from 'react-dom';
import s from './Tip.module.css';

/**
 * design: chrome.jsx Tip — names a control without moving anything around it (NAV-01/04).
 * `at` is the control's rect, captured on hover/focus (null = hidden).
 */
export function Tip({ label, at }: { label: string; at: DOMRect | null }) {
  if (!at) return null;
  return createPortal(
    <span role="tooltip" className={s.tip} style={{ top: at.bottom + 8, left: at.left + at.width / 2 - 70 }}>
      <span className={s.label}>{label}</span>
    </span>,
    document.body,
  );
}

/** hover/focus handlers that capture the control's rect for <Tip at> */
export const tipHandlers = (set: (r: DOMRect | null) => void) => ({
  onMouseEnter: (e: React.MouseEvent<HTMLElement>) => set(e.currentTarget.getBoundingClientRect()),
  onMouseLeave: () => set(null),
  onFocus: (e: React.FocusEvent<HTMLElement>) => set(e.currentTarget.getBoundingClientRect()),
  onBlur: () => set(null),
});

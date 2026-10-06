import { useEffect } from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(',');

const focusables = (root: Element) =>
  Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => !el.closest('[inert],[hidden]'));

/** The dialog on top: the last modal in the document (sheets portal to the end of <body>). */
const topModal = (): HTMLElement | null => {
  const all = document.querySelectorAll<HTMLElement>('[aria-modal="true"]');
  return all.length ? all[all.length - 1]! : null;
};

/**
 * Keyboard focus for every modal in the app, in one place (M12): when a sheet, gate or curtain
 * (`aria-modal="true"`) opens, focus moves into it unless something inside already has it; Tab
 * and Shift+Tab stay inside the one on top; when it closes, focus returns where it was.
 */
export function useModalFocus() {
  useEffect(() => {
    let top: HTMLElement | null = null;
    const returnTo = new Map<HTMLElement, HTMLElement | null>();

    const enter = (m: HTMLElement) => {
      const active = document.activeElement as HTMLElement | null;
      returnTo.set(m, active && !m.contains(active) ? active : null);
      // after the dialog's own effects: one that focuses its own field keeps it
      queueMicrotask(() => {
        if (!m.isConnected || m.contains(document.activeElement)) return;
        const first = focusables(m)[0];
        if (first) first.focus({ preventScroll: true });
        else {
          if (!m.hasAttribute('tabindex')) m.setAttribute('tabindex', '-1');
          m.focus({ preventScroll: true });
        }
      });
    };

    const sync = () => {
      const next = topModal();
      if (next === top) return;
      // closed ones hand focus back, newest first
      for (const [m, el] of [...returnTo].reverse()) {
        if (m.isConnected) continue;
        returnTo.delete(m);
        if (el?.isConnected && (!next || next.contains(el))) el.focus({ preventScroll: true });
      }
      top = next;
      if (next && !returnTo.has(next)) enter(next);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !top) return;
      const items = focusables(top);
      if (!items.length) {
        e.preventDefault();
        return;
      }
      const first = items[0]!;
      const last = items[items.length - 1]!;
      const active = document.activeElement;
      if (!top.contains(active)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    sync();
    const mo = new MutationObserver(sync);
    mo.observe(document.body, { childList: true, subtree: true });
    document.addEventListener('keydown', onKey);
    return () => {
      mo.disconnect();
      document.removeEventListener('keydown', onKey);
    };
  }, []);
}

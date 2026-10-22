import { useSyncExternalStore } from 'react';

/**
 * Where the top bar folds (phones, small tablets): below this the full bar — wordmark, section
 * pill, search, Make, split, bell, passport pill — no longer fits in one row. Keep in step with
 * the `max-width: 760px` blocks in the shell's CSS.
 */
export const PHONE = '(max-width: 760px)';

/** Below this, "every section in the bar" does not fit beside the support row; one pill shows. */
export const TOO_NARROW_FOR_ALL = '(max-width: 1080px)';

const has = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function';

/** Whether a media query matches now, kept live as the window changes. */
export function useMedia(query: string): boolean {
  return useSyncExternalStore(
    (on) => {
      if (!has()) return () => {};
      const m = window.matchMedia(query);
      m.addEventListener('change', on);
      return () => m.removeEventListener('change', on);
    },
    () => (has() ? window.matchMedia(query).matches : false),
    () => false,
  );
}

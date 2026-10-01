import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { usePrefs } from '@/stores/prefs';
import { toggleMya } from '@/stores/ui';
import { routes } from './routes';

export type JumpKey =
  'hub' | 'collect' | 'earn' | 'discover' | 'create' | 'creators' | 'requests' | 'passport' | 'mya';

/** design `app.jump(key)` — section keys to routes. Worlds join in M11 (hidden until then). */
export function useJump() {
  const navigate = useNavigate();
  return useCallback(
    (key: JumpKey) => {
      switch (key) {
        case 'hub':
          return navigate(routes.hub());
        case 'collect':
          return navigate(routes.collected());
        case 'earn':
          return navigate(routes.listed());
        case 'discover':
          return navigate(routes.discover());
        case 'create':
          return navigate(routes.create());
        case 'creators':
          return navigate(routes.creators());
        case 'requests':
          return navigate(routes.requests());
        case 'passport':
          return navigate(routes.passport());
        case 'mya':
          return toggleMya();
      }
    },
    [navigate],
  );
}

/** design `app.goHome()` — the wordmark opens the section chosen in Settings. */
export function useGoHome() {
  const navigate = useNavigate();
  return useCallback(() => {
    const home = usePrefs.getState().prefs.home;
    void navigate(
      home === 'discover' ? routes.discover() : home === 'create' ? routes.create() : routes.hub(),
    );
  }, [navigate]);
}

/** design `app.search(q)` — results land on the Discover floor. */
export function useSearch() {
  const navigate = useNavigate();
  return useCallback((q: string) => void navigate(routes.discover(q)), [navigate]);
}

import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { glideToId } from './glide';

/**
 * `/passport#tier`, `/settings#notifications` — once the page has what it needs to draw
 * (`ready`), bring the named section to the reading line. `map` turns a hash into an element
 * id when the two differ.
 */
export function useHashGlide(ready: boolean, map: Record<string, string> = {}) {
  const { hash } = useLocation();
  const key = hash.replace(/^#/, '');
  const target = map[key] ?? key;
  useEffect(() => {
    if (!ready || !target) return;
    const t = setTimeout(() => glideToId(target), 60);
    return () => clearTimeout(t);
  }, [ready, target]);
}

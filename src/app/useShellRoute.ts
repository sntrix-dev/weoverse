import { useMatches } from 'react-router';
import type { RouteHandle } from './AppLayout';
import type { RouteName } from './routes';

/** The design's top-level sections (chrome.jsx MARKET keys). */
export type SectionKey = 'create' | 'hub' | 'earn' | 'requests' | 'discover' | 'collect' | 'passport';

// design: src/app.jsx SECTION_OF — everything else belongs to the Community hub
const SECTION_OF: Partial<Record<RouteName, SectionKey>> = {
  collected: 'collect',
  listed: 'earn',
  creators: 'earn',
  requests: 'requests',
  passport: 'passport',
  discover: 'discover',
  create: 'create',
};

export const sectionOf = (route: RouteName | null): SectionKey => (route && SECTION_OF[route]) || 'hub';

/** Which design route the current URL is, and the section it belongs to. */
export function useShellRoute(): { route: RouteName | null; section: SectionKey } {
  const matches = useMatches();
  const handle = [...matches].reverse().find((m) => (m.handle as RouteHandle | undefined)?.route)?.handle as
    RouteHandle | undefined;
  const route = handle?.route ?? null;
  return { route, section: sectionOf(route) };
}

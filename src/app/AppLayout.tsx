import { useEffect } from 'react';
import { Outlet, useMatches } from 'react-router';
import { ROUTE_META, type RouteName } from './routes';

export interface RouteHandle {
  route?: RouteName;
}

/**
 * The frame every signed-in page renders in. M01 only sets the route's colour on
 * <html> (the design's `--focus-tint` wash, css/app.css `body::before`); the shell —
 * top bar, split nav, Mya dock, footer — is added in M02.
 */
export function AppLayout() {
  const matches = useMatches();
  const route = [...matches].reverse().find((m) => (m.handle as RouteHandle | undefined)?.route)?.handle as
    RouteHandle | undefined;
  const tone = route?.route ? ROUTE_META[route.route].tone : '#D946EF';

  useEffect(() => {
    document.documentElement.style.setProperty('--focus-tint', tone);
  }, [tone]);

  return <Outlet />;
}

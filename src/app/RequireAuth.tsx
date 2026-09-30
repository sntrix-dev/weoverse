import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { routes } from './routes';
import { useHasSession } from './session';

/** Sends anonymous visitors to /login and brings them back after signing in. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const hasSession = useHasSession();
  const location = useLocation();
  if (!hasSession) {
    return <Navigate to={routes.login(location.pathname + location.search + location.hash)} replace />;
  }
  return children;
}

import type { ComponentType } from 'react';
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router';
import { PlannedPage } from '@/components/layout/PlannedPage';
import { CallbackPage } from '@/features/auth/pages/CallbackPage';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { AppLayout, type RouteHandle } from './AppLayout';
import { RequireAuth } from './RequireAuth';
import { RootLayout } from './RootLayout';
import { routes, type RouteName } from './routes';

/**
 * A built screen, loaded on first visit (each section is its own chunk); `handle.route` drives
 * the shell (section pill, colour wash, flow bar).
 */
const page = (
  path: string,
  route: RouteName,
  load: () => Promise<{ default: ComponentType }>,
): RouteObject => ({
  path,
  handle: { route } satisfies RouteHandle,
  // shown while a section's chunk loads on a cold start
  HydrateFallback: () => null,
  lazy: async () => ({ Component: (await load()).default }),
});

/** A route whose page lands in a later module renders PlannedPage until then. */
const planned = (path: string, route: RouteName): RouteObject => ({
  path,
  element: <PlannedPage route={route} />,
  handle: { route } satisfies RouteHandle,
});

const devRoutes: RouteObject[] = import.meta.env.DEV
  ? [
      {
        path: routes.devGallery(),
        // shown while the lazy gallery chunk loads on a cold start at /dev/ds
        HydrateFallback: () => null,
        lazy: async () => ({ Component: (await import('@/features/dev/pages/DsGalleryPage')).DsGalleryPage }),
      },
    ]
  : [];

const childRoutes: RouteObject[] = [
  { path: routes.login(), element: <LoginPage /> },
  { path: routes.callback(), element: <CallbackPage /> },
  ...devRoutes,
  {
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      // design: index.html opens on Create
      { index: true, element: <Navigate to={routes.create()} replace /> },
      planned('/create', 'create'),
      page('/discover', 'discover', () =>
        import('@/features/discover/pages/DiscoverPage').then((m) => ({ default: m.DiscoverPage })),
      ),
      planned('/collect', 'collected'),
      planned('/exchange', 'listed'),
      planned('/community', 'hub'),
      planned('/community/circles', 'manage'),
      planned('/community/circles/:circleId', 'circle'),
      planned('/community/threads/:threadId', 'thread'),
      planned('/community/stewards', 'stewards'),
      planned('/community/stories', 'stories'),
      page('/weos/:weoId', 'weo', () =>
        import('@/features/weo/pages/WeoPage').then((m) => ({ default: m.WeoPage })),
      ),
      planned('/creators', 'creators'),
      planned('/creators/:creatorId', 'creators'),
      planned('/requests', 'requests'),
      planned('/requests/:requestId', 'requests'),
      planned('/tracking', 'tracking'),
      planned('/passport', 'passport'),
      planned('/wallet', 'wallet'),
      planned('/settings', 'settings'),
      planned('/notifications', 'notifications'),
      planned('/company', 'company'),
      planned('/company/:doc', 'company'),
      { path: '*', element: <Navigate to={routes.create()} replace /> },
    ],
  },
];

/** RootLayout wraps everything: theme, scroll restoration, toasts, ack, external gate. */
export const appRoutes: RouteObject[] = [{ element: <RootLayout />, children: childRoutes }];

export const router = createBrowserRouter(appRoutes);

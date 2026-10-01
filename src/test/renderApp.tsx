import { render } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { http } from 'msw';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { createQueryClient } from '@/api/queryClient';
import { tokens } from '@/api/tokens';
import { appRoutes } from '@/app/router';
import type { NavSummaryDto } from '@/features/shell/model/me';
import { navSummaryFixture } from './fixtures/navSummary';
import { ok, url } from './msw/handlers';
import { server } from './msw/server';

/** Shell reads every signed-in page makes. Override per test with server.use(...). */
export const shellHandlers = (summary: NavSummaryDto = navSummaryFixture()) => [
  http.get(url('/frontend/users/me/nav-summary'), () => ok(summary)),
  http.patch(url('/frontend/users/me/preferences'), async ({ request }) =>
    ok({ ...summary.uiPreferences, ...((await request.json()) as object) }),
  ),
];

/** Renders the real route tree at `path` with a fresh query client. */
export function renderApp(path: string, opts: { signedIn?: boolean; summary?: NavSummaryDto } = {}) {
  if (opts.signedIn ?? true) tokens.set('acc', 'ref');
  server.use(...shellHandlers(opts.summary));
  const queryClient = createQueryClient();
  queryClient.setDefaultOptions({ queries: { ...queryClient.getDefaultOptions().queries, retry: false } });
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] });
  // the shell looks up #root like index.html (route tint, data-lead)
  const container = document.body.appendChild(Object.assign(document.createElement('div'), { id: 'root' }));
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
    { container },
  );
  return { ...utils, router, queryClient };
}

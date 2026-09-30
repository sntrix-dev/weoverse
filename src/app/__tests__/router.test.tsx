import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { tokens } from '@/api/tokens';
import { appRoutes } from '../router';

const renderAt = (path: string) => {
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  return router;
};

afterEach(() => tokens.clear());

describe('routing', () => {
  it('sends anonymous visitors to sign in and keeps where they were going', async () => {
    const router = renderAt('/discover?q=mug');
    expect(await screen.findByRole('button', { name: 'Continue with O-Wallet' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
    expect(router.state.location.search).toBe(`?next=${encodeURIComponent('/discover?q=mug')}`);
  });

  it('opens on Create like the design', async () => {
    tokens.set('acc', 'ref');
    const router = renderAt('/');
    expect(await screen.findByText('Create')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/create');
  });

  it.each([
    ['/discover', 'Discover', 'M04'],
    ['/collect', 'Collect', 'M06'],
    ['/exchange', 'Exchange', 'M06'],
    ['/community', 'Community', 'M05'],
    ['/community/circles/c1', 'Circle', 'M05'],
    ['/community/threads/t1', 'Thread', 'M05'],
    ['/weos/abc', 'WeO', 'M04'],
    ['/creators/mya', 'Creators', 'M08'],
    ['/requests/rq-1', 'Ask', 'M08'],
    ['/passport', 'Your passport', 'M09'],
    ['/wallet', 'O-Wallet', 'M09'],
    ['/settings', 'Settings', 'M09'],
    ['/notifications', 'Notifications', 'M10'],
    ['/company/about', 'WeO Global', 'M10'],
  ])('%s renders its planned screen (%s, %s)', async (path, label, module) => {
    tokens.set('acc', 'ref');
    renderAt(path);
    expect(await screen.findByText(label)).toBeInTheDocument();
    expect(screen.getByText(module)).toBeInTheDocument();
  });

  it('sets the route colour for the design wash', async () => {
    tokens.set('acc', 'ref');
    renderAt('/wallet');
    await screen.findByText('O-Wallet');
    expect(document.documentElement.style.getPropertyValue('--focus-tint')).toBe('#F7C62B');
  });

  it('redirects signed-in users away from /login', async () => {
    tokens.set('acc', 'ref');
    const router = renderAt('/login?next=/wallet');
    await screen.findByText('O-Wallet');
    expect(router.state.location.pathname).toBe('/wallet');
  });
});

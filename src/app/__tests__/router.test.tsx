import { screen } from '@testing-library/react';
import { tokens } from '@/api/tokens';
import { renderApp } from '@/test/renderApp';

afterEach(() => tokens.clear());

const planned = (module: string) => screen.findByText(`This screen is built in module ${module}.`);

describe('routing', () => {
  it('sends anonymous visitors to sign in and keeps where they were going', async () => {
    const { router } = renderApp('/discover?q=mug', { signedIn: false });
    expect(await screen.findByRole('button', { name: 'Continue with O-Wallet' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
    expect(router.state.location.search).toBe(`?next=${encodeURIComponent('/discover?q=mug')}`);
  });

  it('opens on Create like the design', async () => {
    const { router } = renderApp('/');
    await planned('M07');
    expect(router.state.location.pathname).toBe('/create');
  });

  it.each([
    ['/discover', 'M04'],
    ['/collect', 'M06'],
    ['/exchange', 'M06'],
    ['/community', 'M05'],
    ['/community/circles/c1', 'M05'],
    ['/community/threads/t1', 'M05'],
    ['/weos/abc', 'M04'],
    ['/creators/mya', 'M08'],
    ['/requests/rq-1', 'M08'],
    ['/passport', 'M09'],
    ['/wallet', 'M09'],
    ['/settings', 'M09'],
    ['/notifications', 'M10'],
    ['/company/about', 'M10'],
  ])('%s renders its planned screen (%s)', async (path, module) => {
    renderApp(path);
    expect(await planned(module)).toBeInTheDocument();
  });

  it('sets the route colour for the design wash and marks the lead section', async () => {
    renderApp('/wallet');
    await planned('M09');
    expect(document.documentElement.style.getPropertyValue('--focus-tint')).toBe('#F7C62B');
    expect(document.querySelector('main section')).toHaveAttribute('data-lead');
  });

  it('redirects signed-in users away from /login', async () => {
    const { router } = renderApp('/login?next=/wallet');
    await planned('M09');
    expect(router.state.location.pathname).toBe('/wallet');
  });
});

import { screen } from '@testing-library/react';
import { tokens } from '@/api/tokens';
import { routes, safeNext } from '@/app/routes';
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
    expect(await screen.findByRole('region', { name: 'Make a WeO' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/create');
    expect(document.documentElement.style.getPropertyValue('--focus-tint')).toBe('#22C55E');
  });

  it.each([
    ['/passport', 'M09'],
    ['/wallet', 'M09'],
    ['/settings', 'M09'],
    ['/notifications', 'M10'],
    ['/company/about', 'M10'],
  ])('%s renders its planned screen (%s)', async (path, module) => {
    renderApp(path);
    expect(await planned(module)).toBeInTheDocument();
  });

  it('/discover is the Discover screen, in the Discover section', async () => {
    renderApp('/discover');
    expect(await screen.findByRole('heading', { level: 1, name: 'Discover' })).toBeInTheDocument();
    expect(document.documentElement.style.getPropertyValue('--focus-tint')).toBe('#3A95F2');
  });

  it.each([
    ['/collect', 'Collect', '#D946EF'],
    ['/exchange', 'Exchange', '#F7C62B'],
  ])('%s is the %s screen, in its section', async (path, name, tint) => {
    renderApp(path);
    expect(await screen.findByRole('heading', { level: 1, name })).toBeInTheDocument();
    expect(document.documentElement.style.getPropertyValue('--focus-tint')).toBe(tint);
  });

  it.each([
    ['/creators', 'Who is trading, and how well'],
    ['/requests', 'Someone wants it made'],
    ['/tracking', 'What you are watching, and why it matters this week'],
  ])('%s is its M08 screen', async (path, name) => {
    renderApp(path);
    expect(await screen.findByRole('heading', { level: 1, name })).toBeInTheDocument();
  });

  it('/weos/:id is the WeO page', async () => {
    renderApp('/weos/weo-1');
    expect(await screen.findByRole('heading', { level: 1, name: 'Sunrise Loop' })).toBeInTheDocument();
  });

  it('sets the route colour for the design wash and marks the lead section', async () => {
    renderApp('/wallet');
    await planned('M09');
    expect(document.documentElement.style.getPropertyValue('--focus-tint')).toBe('#F7C62B');
    expect(document.querySelector('main section')).toHaveAttribute('data-lead');
  });

  it('a nested sign-in link unwraps to where it was going, and never wraps itself again', async () => {
    const nested = `/login?next=${encodeURIComponent(`/login?next=${encodeURIComponent('/wallet')}`)}`;
    const { router } = renderApp(nested);
    await planned('M09');
    expect(router.state.location.pathname).toBe('/wallet');
    expect(routes.login(nested)).toBe(nested);
    expect(safeNext('//evil.test')).toBe('/create');
  });

  it('redirects signed-in users away from /login', async () => {
    const { router } = renderApp('/login?next=/wallet');
    await planned('M09');
    expect(router.state.location.pathname).toBe('/wallet');
  });
});

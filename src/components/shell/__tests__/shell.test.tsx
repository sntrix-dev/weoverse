import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { tokens } from '@/api/tokens';
import { usePrefs } from '@/stores/prefs';
import { navSummaryFixture } from '@/test/fixtures/navSummary';
import { fail, ok, url } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { renderApp } from '@/test/renderApp';

const patches = () => {
  const bodies: Record<string, unknown>[] = [];
  server.use(
    http.patch(url('/frontend/users/me/preferences'), async ({ request }) => {
      const b = (await request.json()) as Record<string, unknown>;
      bodies.push(b);
      return ok({ ...navSummaryFixture().uiPreferences, ...b });
    }),
  );
  return bodies;
};

const setWidth = (w: number) => {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: w });
  window.dispatchEvent(new Event('resize'));
};

beforeEach(() => setWidth(1440));
afterEach(() => tokens.clear());

describe('top bar', () => {
  it('shows the passport pill with the real balance and the unread dot', async () => {
    renderApp('/create');
    const pill = await screen.findByRole('button', { name: 'Your Os, your tier and your passport' });
    await waitFor(() => expect(pill).toHaveTextContent('12,480'));
    expect(within(pill).getByTitle('Tier 2 · Player')).toBeInTheDocument();
  });

  it('names the section you are in and queues the next one', async () => {
    renderApp('/create');
    expect(
      await screen.findByRole('button', { name: 'You are in Create — switch section' }),
    ).toBeInTheDocument();
    // Create sits with Community on the O; next is Exchange
    expect(
      screen.getByRole('button', { name: 'Next · Exchange — Move with the market' }),
    ).toBeInTheDocument();
  });

  it('switches section from the menu', async () => {
    const user = userEvent.setup();
    const { router } = renderApp('/create');
    await user.click(await screen.findByRole('button', { name: 'You are in Create — switch section' }));
    const menu = screen.getByRole('menu', { name: 'Switch section' });
    expect(
      within(menu)
        .getAllByRole('menuitem')
        .map((b) => b.textContent),
    ).toEqual([
      'CreateMake your offer. Make it live.',
      'CommunityCircles and threads',
      'ExchangeMove with the market',
      'AskAsk · Offer',
      'DiscoverFind what’s happening now',
      'CollectGet it. Use it. Resell it. Remix it.',
      'YouYou and your standing',
    ]);
    await user.click(within(menu).getByRole('menuitem', { name: /Discover/ }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/discover'));
  });

  it('can show every section in the bar (a saved preference)', async () => {
    const user = userEvent.setup();
    renderApp('/collect');
    const bodies = patches();
    await user.click(await screen.findByRole('button', { name: 'You are in Collect — switch section' }));
    await user.click(screen.getByRole('switch'));
    const bar = await screen.findByRole('navigation', { name: 'Sections' });
    expect(within(bar).getByRole('button', { name: 'Collect' })).toHaveAttribute('aria-current', 'page');
    await waitFor(() => expect(bodies).toContainEqual({ navSections: 'all' }));
  });

  it('searches onto the Discover floor', async () => {
    const user = userEvent.setup();
    const { router } = renderApp('/create');
    await user.click(await screen.findByRole('button', { name: 'Search the WeOverse' }));
    await user.type(screen.getByRole('textbox', { name: 'Search WeOs, circles, creators' }), 'mug{Enter}');
    await waitFor(() => expect(router.state.location.pathname).toBe('/discover'));
    expect(router.state.location.search).toBe('?q=mug');
  });

  it('splits the nav and comes back to the bar', async () => {
    const user = userEvent.setup();
    renderApp('/discover');
    const bodies = patches();
    await user.click(await screen.findByRole('button', { name: 'Split the nav' }));
    expect(await screen.findByText('Sections on the left, support up top')).toBeInTheDocument();
    expect(document.documentElement.getAttribute('data-nav')).toBe('split');
    expect(document.documentElement.style.getPropertyValue('--shell-left')).toBe('270px');
    const panel = screen.getByRole('navigation', { name: 'Sections' });
    expect(within(panel).getByRole('button', { name: 'Discover' })).toHaveAttribute('aria-current', 'page');
    await user.click(within(panel).getByRole('button', { name: 'Collapse to icons' }));
    expect(document.documentElement.style.getPropertyValue('--shell-left')).toBe('86px');
    await user.click(screen.getAllByRole('button', { name: 'Back to the top bar' })[0]!);
    expect(document.documentElement.getAttribute('data-nav')).toBe('bar');
    // the split was saved; coming back is the same optimistic write (batched, 400 ms)
    expect(bodies).toContainEqual({ navMode: 'split' });
    expect(usePrefs.getState().prefs.navMode).toBe('bar');
  });

  it('opens the wordmark on the home chosen in settings', async () => {
    const user = userEvent.setup();
    const { router } = renderApp('/create', { summary: navSummaryFixture({}, { home: 'discover' }) });
    await screen.findByRole('button', { name: 'Your Os, your tier and your passport' });
    await waitFor(() => expect(usePrefs.getState().prefs.home).toBe('discover'));
    await user.click(screen.getAllByTitle('WeOverse')[0]!);
    await waitFor(() => expect(router.state.location.pathname).toBe('/discover'));
  });

  it('paints the theme the server has saved', async () => {
    renderApp('/create', { summary: navSummaryFixture({}, { theme: 'dark' }) });
    await waitFor(() => expect(document.documentElement.getAttribute('data-theme')).toBe('dark'));
  });
});

describe('passport dropdown', () => {
  it('shows identity, standing and counts, and copies the WeO ID', async () => {
    const user = userEvent.setup();
    renderApp('/create');
    await user.click(await screen.findByRole('button', { name: 'Your Os, your tier and your passport' }));
    const sheet = await screen.findByRole('dialog', { name: 'Your passport' });
    expect(within(sheet).getByText('Mya Rivers')).toBeInTheDocument();
    expect(within(sheet).getByText('@mya · joined Feb 2024')).toBeInTheDocument();
    expect(within(sheet).getByText('ISR 86 · STRONG')).toBeInTheDocument();
    expect(within(sheet).getByText('# OW-4F82C1')).toBeInTheDocument();
    expect(within(sheet).getByText('Tier 2 · Player')).toBeInTheDocument();
    for (const [k, v] of [
      ['Collected', '38'],
      ['Created', '12'],
      ['Circles', '4'],
      ['Campaigns', '3'],
    ] as const)
      expect(within(sheet).getByText(k).parentElement).toHaveTextContent(`${k}${v}`);
    await user.click(within(sheet).getByRole('button', { name: 'Copy Your WeO ID' }));
    expect(await screen.findByText('Your WeO ID copied · OW-4F82C1')).toBeInTheDocument();
    await user.click(within(sheet).getByRole('button', { name: 'Show buckets' }));
    expect(within(sheet).getByText('Available')).toBeInTheDocument();
  });

  it('logs out for real: ends the O-Wallet session, revokes, clears and lands on sign-in', async () => {
    const user = userEvent.setup();
    const revoked = vi.fn();
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    server.use(
      http.post(url('/frontend/auth/logout'), async ({ request }) => {
        revoked(await request.json());
        return ok(null, 'Logged out');
      }),
    );
    const { router } = renderApp('/wallet');
    await user.click(await screen.findByRole('button', { name: 'Your Os, your tier and your passport' }));
    await user.click(await screen.findByRole('button', { name: 'Log out' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    expect(revoked).toHaveBeenCalledWith({ refresh_token: 'ref' });
    expect(String(open.mock.calls[0]?.[0])).toMatch(/\/api\/oauth\/logout\?redirect_uri=/);
    expect(tokens.hasSession()).toBe(false);
    expect(await screen.findByText('Signed out — see you at the O')).toBeInTheDocument();
  });
});

describe('Mya dock', () => {
  it('opens from the top bar, answers a starter, and holds settings', async () => {
    const user = userEvent.setup();
    renderApp('/create');
    const bodies = patches();
    await user.click(await screen.findByRole('button', { name: 'Ask Mya' }));
    const dock = await screen.findByRole('dialog', { name: 'Mya' });
    await user.click(within(dock).getByRole('button', { name: 'What is a WeO?' }));
    expect(await within(dock).findByText(/Wealth Exchange Offer/, {}, { timeout: 3000 })).toBeInTheDocument();
    await user.click(within(dock).getByRole('tab', { name: 'Settings' }));
    const settings = screen.getByRole('dialog', { name: 'Settings' });
    await user.click(within(settings).getByRole('radio', { name: 'Dark' }));
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    await waitFor(() => expect(bodies).toContainEqual({ theme: 'dark' }));
    await user.click(within(settings).getByRole('button', { name: 'Close this panel' }));
    expect(screen.getByRole('button', { name: "Open Mya's panel" })).toBeInTheDocument();
  });

  it('hides the corner orb when Mya is switched off', async () => {
    const user = userEvent.setup();
    renderApp('/create');
    expect(await screen.findByRole('button', { name: "Open Mya's panel" })).toBeInTheDocument();
    await user.click(await screen.findByRole('button', { name: 'Ask Mya' }));
    await user.click(screen.getByRole('tab', { name: 'Settings' }));
    await user.click(screen.getByRole('switch', { name: 'Mya in the corner' }));
    // only Settings remains in the dock
    expect(screen.queryByRole('tab', { name: 'Ask Mya' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Close this panel' }));
    expect(screen.queryByRole('button', { name: "Open Mya's panel" })).not.toBeInTheDocument();
  });
});

describe('O nav', () => {
  it('floats the ring, parks it in the top bar, and floats it again', async () => {
    const user = userEvent.setup();
    renderApp('/create');
    expect(await screen.findByLabelText('Floating O navigation')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Park the O nav in the top bar' }));
    expect(screen.queryByLabelText('Floating O navigation')).not.toBeInTheDocument();
    await act(() => new Promise((r) => setTimeout(r, 700)));
    const confirm = await screen.findByRole('dialog', { name: 'O nav parked here' });
    await user.click(within(confirm).getByRole('button', { name: 'Keep it here' }));
    await user.click(screen.getByRole('button', { name: 'Open the O nav fan' }));
    const fan = screen.getByRole('menu', { name: 'O nav' });
    expect(
      within(fan)
        .getAllByRole('menuitem')
        .map((b) => b.textContent),
    ).toEqual(['Create', 'Exchange', 'Ask', 'Discover', 'Collect', 'You', 'Mya']);
    await user.click(within(fan).getByRole('button', { name: 'Float the O again' }));
    await act(() => new Promise((r) => setTimeout(r, 700)));
    expect(await screen.findByLabelText('Floating O navigation')).toBeInTheDocument();
  });
});

describe('flow bar', () => {
  it('gives the way back and the next section', async () => {
    const user = userEvent.setup();
    usePrefs.getState().hydrate({ ...navSummaryFixture().uiPreferences!, navDock: 'top' });
    const { router } = renderApp('/discover', { summary: navSummaryFixture({}, { navDock: 'top' }) });
    const bar = await screen.findByRole('region', { name: 'Where you are and what is next' });
    expect(within(bar).getByText('Next section')).toBeInTheDocument();
    expect(within(bar).getByText('Next · What you hold, still moving')).toBeInTheDocument();
    await user.click(within(bar).getByRole('button', { name: /^Collect/ }));
    expect(router.state.location.pathname).toBe('/collect');
  });

  it('folds to a pill and back (remembered)', async () => {
    const user = userEvent.setup();
    renderApp('/exchange', { summary: navSummaryFixture({}, { navDock: 'top' }) });
    const bodies = patches();
    const bar = await screen.findByRole('region', { name: 'Where you are and what is next' });
    await waitFor(() =>
      expect(within(bar).getByRole('button', { name: 'Minimise the flow bar' })).toBeInTheDocument(),
    );
    await user.click(within(bar).getByRole('button', { name: 'Minimise the flow bar' }));
    expect(
      within(bar).getByRole('button', { name: 'Expand the next step — you are in Exchange' }),
    ).toBeInTheDocument();
    await waitFor(() => expect(bodies).toContainEqual({ flowBar: 'min' }));
  });
});

describe('footer', () => {
  it('opens the sitemap and routes from it', async () => {
    const user = userEvent.setup();
    const { router } = renderApp('/create');
    await user.click(await screen.findByRole('button', { name: 'Sitemap' }));
    await user.click(
      within(screen.getByRole('navigation', { name: 'Community' })).getByRole('button', { name: 'Circles' }),
    );
    // a built page loads its chunk first
    await waitFor(() => expect(router.state.location.pathname).toBe('/community/circles'));
  });

  it('subscribes to signals from the O', async () => {
    const user = userEvent.setup();
    const posted = vi.fn();
    server.use(
      http.post(url('/frontend/email-subscription/subscribe'), async ({ request }) => {
        posted(await request.json());
        return ok({ id: '1', email: 'a@b.co', isSubscribed: true }, 'Successfully subscribed');
      }),
    );
    renderApp('/create');
    await user.click(await screen.findByRole('button', { name: 'Sitemap' }));
    await user.click(screen.getByRole('button', { name: /Signals from the O/ }));
    await user.type(screen.getByRole('textbox', { name: 'Email for WeO updates' }), 'a@b.co');
    await user.click(screen.getByRole('button', { name: 'Subscribe' }));
    expect(await screen.findByText('You’re on the list')).toBeInTheDocument();
    expect(posted).toHaveBeenCalledWith({ email: 'a@b.co' });
  });

  it('treats an address already on the list as done', async () => {
    const user = userEvent.setup();
    server.use(
      http.post(url('/frontend/email-subscription/subscribe'), () =>
        fail(400, 'Email is already subscribed'),
      ),
    );
    renderApp('/create');
    await user.click(await screen.findByRole('button', { name: 'Sitemap' }));
    await user.click(screen.getByRole('button', { name: /Signals from the O/ }));
    await user.type(screen.getByRole('textbox', { name: 'Email for WeO updates' }), 'a@b.co{Enter}');
    expect(await screen.findByText('You’re already on the list')).toBeInTheDocument();
  });

  it('stops at the gate before leaving the WeOverse', async () => {
    const user = userEvent.setup();
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    renderApp('/create');
    await user.click(await screen.findByRole('button', { name: 'Sitemap' }));
    await user.click(screen.getByRole('button', { name: 'Discord' }));
    const gate = screen.getByRole('dialog', { name: 'Discord' });
    expect(within(gate).getByText('discord.com/weo')).toBeInTheDocument();
    await user.click(within(gate).getByRole('button', { name: 'Stay here' }));
    expect(screen.queryByRole('dialog', { name: 'Discord' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Discord' }));
    fireEvent.click(screen.getByRole('button', { name: 'Open Discord' }));
    expect(open).toHaveBeenCalledWith('https://discord.com/weo', '_blank', 'noopener,noreferrer');
  });
});

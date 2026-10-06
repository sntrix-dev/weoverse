import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { tokens } from '@/api/tokens';
import { usePrefs } from '@/stores/prefs';
import { ALL_TOURS_SEEN, navSummaryFixture } from '@/test/fixtures/navSummary';
import { ok, url } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { renderApp } from '@/test/renderApp';

afterEach(() => tokens.clear());

/** Records every preferences write (after renderApp, whose shell handlers it overrides). */
function prefsSpy() {
  const calls = vi.fn();
  server.use(
    http.patch(url('/frontend/users/me/preferences'), async ({ request }) => {
      const body = (await request.json()) as object;
      calls(body);
      // the server answers with the whole set, as the real one does
      return ok({ ...usePrefs.getState().server, ...body });
    }),
  );
  return calls;
}

describe('section intros (D-088)', () => {
  it('raises the curtain once per account and remembers it on the account', async () => {
    const user = userEvent.setup();
    renderApp('/community', {
      summary: navSummaryFixture({}, { seen: ALL_TOURS_SEEN.filter((k) => k !== 'intro.hub') }),
    });
    const saved = prefsSpy();
    const curtain = await screen.findByRole('dialog', { name: 'Community' });
    expect(
      within(curtain).getByText('Your WeOs in flight, and the Circles around them.'),
    ).toBeInTheDocument();
    // the five steps of the spine ring the O
    expect(within(curtain).getByText('Rehearse')).toBeInTheDocument();
    await user.click(within(curtain).getByRole('button', { name: 'Enter Community' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Community' })).not.toBeInTheDocument());
    await waitFor(
      () =>
        expect(saved).toHaveBeenCalledWith(
          expect.objectContaining({ seen: expect.arrayContaining(['intro.hub']) }),
        ),
      {
        timeout: 2000,
      },
    );
  });

  it('never shows once seen, and the hero’s mark brings it back', async () => {
    const user = userEvent.setup();
    renderApp('/community');
    await screen.findByRole('heading', { level: 1, name: 'Community' });
    expect(screen.queryByRole('dialog', { name: 'Community' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Replay the Community intro' }));
    const curtain = await screen.findByRole('dialog', { name: 'Community' });
    await user.click(within(curtain).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Community' })).not.toBeInTheDocument());
  });

  it('walks the screen after the intro, one anchored step at a time', async () => {
    const user = userEvent.setup();
    renderApp('/community', {
      summary: navSummaryFixture({}, { seen: ALL_TOURS_SEEN.filter((k) => k !== 'walk.hub') }),
    });
    const saved = prefsSpy();
    expect(
      await screen.findByRole('dialog', { name: 'Your WeOs in flight' }, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(await screen.findByText(/Showing you around · 1 of/)).toBeInTheDocument();
    await user.click(await screen.findByRole('button', { name: 'Skip' }));
    await waitFor(
      () =>
        expect(saved).toHaveBeenCalledWith(
          expect.objectContaining({ seen: expect.arrayContaining(['walk.hub']) }),
        ),
      {
        timeout: 2000,
      },
    );
  });

  it('Settings resets every guided tour', async () => {
    const user = userEvent.setup();
    renderApp('/settings');
    const saved = prefsSpy();
    await user.click(await screen.findByRole('button', { name: 'Reset' }));
    await waitFor(() => expect(saved).toHaveBeenCalledWith(expect.objectContaining({ seen: [] })), {
      timeout: 2000,
    });
  });
});

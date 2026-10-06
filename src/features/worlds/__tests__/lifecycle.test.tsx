import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { tokens } from '@/api/tokens';
import { closeVet, closeWorld, openWorld } from '@/stores/flow';
import { notificationsFixture } from '@/test/fixtures/notifications';
import { fullDraft, lifecycleDrafts, vettingCard } from '@/test/fixtures/worlds';
import { ok, url } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { renderApp } from '@/test/renderApp';

afterEach(() => {
  tokens.clear();
  act(() => {
    closeWorld();
    closeVet();
  });
});

/** Records every write to `path` and answers with `data`. */
function spy(method: 'post' | 'delete', path: string, data: unknown) {
  const calls = vi.fn();
  server.use(
    http[method](url(path), async ({ request }) => {
      calls(method === 'delete' ? null : await request.json().catch(() => null));
      return ok(data);
    }),
  );
  return calls;
}

const withDrafts = () =>
  server.use(
    http.get(url('/frontend/me/drafts'), () => ok({ items: lifecycleDrafts, total: lifecycleDrafts.length })),
  );

describe('in flight: every stage with its next step', () => {
  it('derives the one verb per stage, and the waiting ones carry their counts', async () => {
    withDrafts();
    renderApp('/community');
    expect(await screen.findByRole('button', { name: 'Night Market Print — Rehearse' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Harbour Lights — Open to reactions' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Paper Moons — 7 of 12 reactions' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Salt Study — Open pledges' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Kiln Set — 14 of 20 pledges' })).toBeInTheDocument();
    // what pledges promise, never Os held
    expect(screen.getByText('Pre-sold · O 16,800 committed')).toBeInTheDocument();
  });

  it('opens a rehearsed draft to reactions only after one explicit confirm, with the WeO it will post', async () => {
    withDrafts();
    const user = userEvent.setup();
    const opened = spy('post', '/frontend/me/drafts/d-r/open-reactions', {
      id: 'd-r',
      stage: 'reacting',
      reactions: { count: 0, need: 12 },
      pledges: { count: 0, threshold: 20, promisedOs: 0 },
      notified: 4,
    });
    renderApp('/community');
    await user.click(await screen.findByRole('button', { name: 'Harbour Lights — Open to reactions' }));
    const dialog = await screen.findByRole('dialog', { name: 'Open to reactions' });
    expect(opened).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole('button', { name: 'Open to Digital Arts' }));
    await waitFor(() => expect(opened).toHaveBeenCalledTimes(1));
    const post = (opened.mock.calls[0]![0] as { post: Record<string, unknown> }).post;
    expect(post).toMatchObject({
      weoType: 'regular',
      title: 'Harbour Lights',
      format: 'Listing',
      isResellable: true,
    });
    expect(await screen.findByText(/4 people told/)).toBeInTheDocument();
  });

  it('sends an unfinished draft to the composer instead of opening it', async () => {
    withDrafts();
    server.use(http.get(url('/frontend/me/drafts/d-r'), () => ok(fullDraft('d-r', { price: 0, catId: '' }))));
    const user = userEvent.setup();
    const { router } = renderApp('/community');
    await user.click(await screen.findByRole('button', { name: 'Harbour Lights — Open to reactions' }));
    const dialog = await screen.findByRole('dialog', { name: 'Finish it first' });
    await user.click(within(dialog).getByRole('button', { name: 'Open the composer' }));
    await waitFor(() => expect(router.state.location.search).toBe('?draft=d-r'));
  });

  it('opens pledges after twelve reactions', async () => {
    withDrafts();
    const user = userEvent.setup();
    const pledges = spy('post', '/frontend/me/drafts/d-b/open-pledges', {
      id: 'd-b',
      stage: 'pledging',
      reactions: {},
      pledges: {},
    });
    renderApp('/community');
    await user.click(await screen.findByRole('button', { name: 'Salt Study — Open pledges' }));
    await waitFor(() => expect(pledges).toHaveBeenCalledTimes(1));
  });
});

describe('the vetting sheet', () => {
  it('opens from a notification and sends what you would pay, and why', async () => {
    const data = notificationsFixture();
    data.notifications.unshift({
      ...data.notifications[0]!,
      _id: 'n-vet',
      title: 'Ada Obi wants your read',
      message: 'Tide Charts — what would you pay?',
      category: 'community',
      target: { kind: 'vetting', id: 'd-x' },
    });
    server.use(http.get(url('/frontend/notifications'), () => ok(data)));
    const reacted = spy(
      'post',
      '/frontend/vetting/d-x/reactions',
      vettingCard({
        id: 'd-x',
        mine: { isOwner: false, reaction: { os: 1000, note: 'Love the grid' }, pledge: null },
      }),
    );
    const user = userEvent.setup();
    renderApp('/notifications');
    await user.click(await screen.findByText('Ada Obi wants your read'));
    const dialog = await screen.findByRole('dialog', { name: 'Tide Charts' });
    expect(within(dialog).getByText('Would collect at 900')).toBeInTheDocument();
    await user.type(within(dialog).getByRole('textbox', { name: /What would you pay/ }), '1000');
    await user.type(within(dialog).getByRole('textbox', { name: 'Why' }), 'Love the grid');
    await user.click(within(dialog).getByRole('button', { name: 'Send my reaction' }));
    await waitFor(() => expect(reacted).toHaveBeenCalledWith({ os: 1000, note: 'Love the grid' }));
  });

  it('pledges at its price — a promise, nothing held', async () => {
    server.use(
      http.get(url('/frontend/vetting/d-x'), () =>
        ok(
          vettingCard({
            id: 'd-x',
            stage: 'pledging',
            pledges: { count: 14, threshold: 20, promisedOs: 16800 },
          }),
        ),
      ),
    );
    const pledged = spy(
      'post',
      '/frontend/vetting/d-x/pledges',
      vettingCard({
        id: 'd-x',
        stage: 'pledging',
        mine: { isOwner: false, reaction: null, pledge: { os: 1200 } },
      }),
    );
    const user = userEvent.setup();
    renderApp('/community');
    act(() => {
      openVetFor('d-x');
    });
    const dialog = await screen.findByRole('dialog', { name: 'Tide Charts' });
    expect(within(dialog).getByText(/nothing leaves your wallet/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Pledge at O 1,200' }));
    await waitFor(() => expect(pledged).toHaveBeenCalledWith({}));
  });

  it('shows what waits on a Circle on its page', async () => {
    server.use(
      http.get(url('/frontend/vetting'), () => ok({ items: [vettingCard({ id: 'd-x' })], total: 1 })),
    );
    renderApp('/community/circles/circ-1');
    expect(await screen.findByText('Waiting on this circle · 1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tide Charts — 5 of 12 reactions' })).toBeInTheDocument();
  });
});

describe('the World Studio', () => {
  it('rehearses a draft through the chain and keeps the terms with its audience', async () => {
    const kept = spy('post', '/frontend/me/drafts/d-1/rehearsal', {
      id: 'd-1',
      stage: 'rehearsed',
      reactions: {},
      pledges: {},
    });
    const user = userEvent.setup();
    renderApp('/community');
    await user.click(await screen.findByRole('button', { name: 'Night Market Print — Rehearse' }));
    const studio = await screen.findByRole('dialog', { name: 'Rehearse in a world' });
    // no WebGL in the test DOM: the flat stage stands in
    expect(
      await within(studio).findByTitle('Harbour Lights · Listing · provisional', {}, { timeout: 8000 }),
    ).toBeInTheDocument();
    await user.click(within(studio).getByRole('button', { name: 'Next · Who is there' }));
    await user.click(within(studio).getByRole('button', { name: 'Next · Terms' }));
    await user.click(within(studio).getByRole('button', { name: 'Run the rehearsal' }));
    expect(await within(studio).findByText(/^collect-through/, {}, { timeout: 3000 })).toBeInTheDocument();
    await user.click(within(studio).getByRole('button', { name: 'Next · Who sees it first' }));
    await user.click(within(studio).getByRole('button', { name: 'Keep terms · share with Digital Arts' }));
    const review = await screen.findByRole('dialog', { name: 'Keep the rehearsed terms' });
    expect(kept).not.toHaveBeenCalled();
    await user.click(within(review).getByRole('button', { name: 'Keep · back to Community' }));
    await waitFor(() => expect(kept).toHaveBeenCalledTimes(1));
    const body = kept.mock.calls[0]![0] as Record<string, unknown>;
    expect(body).toMatchObject({
      world: { id: 'night', name: 'Night market', fidelity: 3 },
      season: 'weekend',
      terms: { price: 1200, edition: 50, days: 7, bundle: false, resale: 2 },
      audience: { kind: 'circle', circleId: 'circ-1' },
    });
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Rehearse in a world' })).not.toBeInTheDocument(),
    );
  });

  it('simulates a live WeO with the sweep, free for everyone', async () => {
    const user = userEvent.setup();
    renderApp('/community');
    await screen.findByRole('heading', { level: 1, name: 'Community' });
    act(() => openWorld({}));
    const studio = await screen.findByRole('dialog', { name: 'Flow simulation' });
    expect(await within(studio).findByText('Under test')).toBeInTheDocument();
    expect(await within(studio).findByText('Likely after it lists')).toBeInTheDocument();
    await user.click(await screen.findByRole('button', { name: 'Run the simulation' }));
    expect(
      await within(studio).findByText('Provisional · simulated', {}, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(within(studio).getByText('Sensitivity sweep · the price ladder')).toBeInTheDocument();
    // no plan, no fee line, no hand-off to an operator desk (D-087, D-093)
    expect(within(studio).queryByText(/WeO Flow fee|Hand to WeO Flow|See the plan/)).not.toBeInTheDocument();
  });
});

function openVetFor(id: string) {
  // the notification and the Circle page open it the same way
  void import('@/stores/flow').then((m) => m.openVet(id));
}

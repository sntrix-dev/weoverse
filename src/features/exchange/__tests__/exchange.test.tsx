import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { tokens } from '@/api/tokens';
import { draftsFixture } from '@/test/fixtures/community';
import { listingRow, listingsSnapshotFixture } from '@/test/fixtures/holdings';
import { fail, ok, url } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { renderApp } from '@/test/renderApp';
import { attention, draftModel, listingModel } from '../model/listings';

afterEach(() => tokens.clear());

describe('listings model', () => {
  it('files a paused listing under Live with its pill, a sold-through one under Closed', () => {
    const paused = listingModel(listingRow({ state: 'draft', status: 'inactive', paused: true }));
    expect([paused.state, paused.tab, paused.pausable]).toEqual(['Paused', 'Live', true]);
    const closed = listingModel(listingRow({ state: 'closed', stockLeft: 0, stockTotal: 60 }));
    expect([closed.state, closed.tab, closed.left]).toEqual(['Closed', 'Closed', 'Sold out']);
    // a re-listing (resold) is live, and cannot be paused
    const relisted = listingModel(listingRow({ status: 'resold' }));
    expect([relisted.state, relisted.pausable]).toEqual(['Live', false]);
  });

  it('needs attention: close to selling out first, then open checks, then drafts to finish', () => {
    const rows = [
      draftModel(draftsFixture[0]!),
      listingModel(listingRow({ id: 'a', stockLeft: 40, readyRate: 0.8, preflight: [{ label: 'Media · orb preview', ok: false }] })),
      listingModel(listingRow({ id: 'b', stockLeft: 5, stockTotal: 50 })),
    ];
    expect(attention(rows).map((a) => [a.l.id, a.act])).toEqual([
      ['b', 'Restock'],
      ['a', 'Fix'],
      ['d-1', 'Finish'],
    ]);
    expect(draftModel(draftsFixture[0]!).open).toBe(3);
  });
});

/** The open row menu's items (the shell has menus of its own). */
const rowMenu = () =>
  screen
    .getAllByRole('menu')
    .flatMap((m) => within(m).queryAllByRole('menuitem'))
    .map((m) => m.textContent)
    .filter((t) => ['Edit WeO', 'Activate', 'Inactivate', 'Push to hub'].includes(t ?? ''));

describe('exchange page', () => {
  it('lists what you flow with drafts, filters by state, and opens the right thing', async () => {
    const user = userEvent.setup();
    const { container, router } = renderApp('/exchange');
    expect(await screen.findByRole('heading', { level: 1, name: 'Exchange' })).toBeInTheDocument();
    const listed = container.querySelector('#l-listed') as HTMLElement;
    expect(await within(listed).findByText('Tide Pool')).toBeInTheDocument();
    expect(within(listed).getByText('Night Market Print')).toBeInTheDocument();
    // Os, not dollars
    expect(within(listed).getAllByText('1,881').length).toBeGreaterThan(0);

    await user.click(within(listed).getByRole('button', { name: /^Live/ }));
    const names = () => within(listed).getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(names()).toEqual(['Tide Pool', 'Studio Hour']);
    expect(within(listed).getByText('Paused')).toBeInTheDocument();
    await user.click(within(listed).getByRole('button', { name: /^Draft/ }));
    expect(names()).toEqual(['Night Market Print']);
    expect(within(listed).getByText('3 open')).toBeInTheDocument();

    await user.click(within(listed).getByRole('button', { name: 'Open Night Market Print' }));
    await waitFor(() => expect(router.state.location.search).toBe('?draft=d-1'));
  });

  it('activates a paused listing in place, and rolls back when refused', async () => {
    const patched = vi.fn();
    server.use(
      http.patch(url('/frontend/weos/:id/status'), async ({ params, request }) => {
        const body = (await request.json()) as { status: string };
        patched(params.id, body);
        return ok({ _id: params.id, status: body.status, changed: true });
      }),
    );
    const user = userEvent.setup();
    renderApp('/exchange');
    await user.click(await screen.findByRole('button', { name: 'Actions for Studio Hour' }));
    await user.click(screen.getByRole('menuitem', { name: 'Activate' }));
    await waitFor(() => expect(patched).toHaveBeenCalledWith('l-2', { status: 'active' }));

    server.use(http.patch(url('/frontend/weos/:id/status'), () => fail(409, 'A resold WeO cannot be paused')));
    await user.click(screen.getByRole('button', { name: 'Actions for Tide Pool' }));
    await user.click(screen.getByRole('menuitem', { name: 'Inactivate' }));
    expect(await screen.findByText('A resold WeO cannot be paused')).toBeInTheDocument();
  });

  it('offers only what a row can do: no pause on a re-listing, no push on a draft', async () => {
    server.use(
      http.get(url('/frontend/me/listings/snapshot'), () =>
        ok({ ...listingsSnapshotFixture(), rows: [listingRow({ id: 'l-9', title: 'Relisted Loop', status: 'resold' })] }),
      ),
    );
    const user = userEvent.setup();
    renderApp('/exchange');
    await user.click(await screen.findByRole('button', { name: 'Actions for Relisted Loop' }));
    expect(rowMenu()).toEqual(['Edit WeO', 'Push to hub']);
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button', { name: 'Actions for Night Market Print' }));
    expect(rowMenu()).toEqual(['Edit WeO']);
  });

  it('shows the snapshot with what needs attention, and the creators in your circles', async () => {
    const asked = vi.fn();
    server.use(
      http.get(url('/frontend/creators'), ({ request }) => {
        asked(new URL(request.url).searchParams.get('circle'));
        return ok({
          items: [
            {
              id: 'c-2',
              name: 'Mira K',
              handle: '@mirak',
              avatarUrl: null,
              bio: 'Ceramics.',
              isr: 77,
              formats: ['regular'],
              format: 'Listing',
              tone: '#22C55E',
              settled7d: 0,
              trace7d: [0, 0, 0, 0, 0, 0, 0],
              collectors: 1,
              circledBy: 2,
              circled: false,
            },
          ],
          total: 1,
          page: 1,
          pages: 1,
        });
      }),
    );
    const user = userEvent.setup();
    const { container } = renderApp('/exchange');
    await screen.findByRole('heading', { level: 1, name: 'Exchange' });
    await user.click(container.querySelector('#l-snapshot') as HTMLElement);
    expect(await screen.findByText('Needs attention')).toBeInTheDocument();
    // the paused listing's open check, the draft to finish
    expect(screen.getAllByRole('button', { name: 'Finish' }).length).toBeGreaterThan(0);

    await user.click(container.querySelector('#l-creators') as HTMLElement);
    expect(await screen.findByRole('button', { name: 'Open Mira K' })).toBeInTheDocument();
    expect(asked).toHaveBeenCalledWith('joined');
    expect(screen.getByText(/1 creator shares your Circles/)).toBeInTheDocument();
  });
});

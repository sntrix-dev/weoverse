import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';
import { tokens } from '@/api/tokens';
import { creatorsFixture } from '@/test/fixtures/discover';
import { creatorViewFixture } from '@/test/fixtures/people';
import { fail, ok, url } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { renderApp } from '@/test/renderApp';
import { creatorBoards, creatorModel, creatorPulse } from '../model/creators';

afterEach(() => tokens.clear());

const calls = (method: 'post' | 'delete', path: string, data: unknown = null) => {
  const hits: { path: string; body: unknown }[] = [];
  server.use(
    http[method](url(path), async ({ request }) => {
      const u = new URL(request.url);
      hits.push({
        path: u.pathname,
        body: method === 'post' ? await request.json().catch(() => null) : null,
      });
      return ok(data);
    }),
  );
  return hits;
};

describe('creators · model', () => {
  const list = [
    creatorModel(creatorsFixture[0]!),
    creatorModel({
      ...creatorsFixture[0]!,
      id: 'c-2',
      name: 'Bo',
      isr: 64,
      settled7d: 9000,
      collectors: 3,
      weeksLive: 30,
      weos: null,
    }),
  ];

  it('sorts each board by its own figure', () => {
    const b = creatorBoards(list);
    expect(b.standing!.rows.map((r) => r.name)).toEqual(['Lena V', 'Bo']);
    expect(b.settled!.rows.map((r) => r.name)).toEqual(['Bo', 'Lena V']);
    expect(b.reach!.rows[0]!.name).toBe('Lena V');
    expect(b.consistency!.rows[0]).toMatchObject({ name: 'Bo', value: '30', sub: 'WeOs private' });
  });

  it('reads the pulse from the directory as it stands — leaders low to high, no delta', () => {
    const p = creatorPulse(list);
    expect(p.standing).toMatchObject({ headline: '89', series: [64, 89] });
    expect(p.settled!.headline).toBe('O 11.0k');
    expect(p.standing!.delta).toBeUndefined();
    expect(creatorPulse([])).toEqual({});
  });
});

describe('creators · the page', () => {
  it('shows the hero, Mya beside the creators, and a record opening into its orbit', async () => {
    const user = userEvent.setup();
    const { router } = renderApp('/creators');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Who is trading, and how well' }),
    ).toBeInTheDocument();
    expect(document.documentElement.style.getPropertyValue('--focus-tint')).toBe('#3A95F2');
    expect(screen.getByRole('button', { name: 'Mya — your guide' })).toBeInTheDocument();
    await user.click(await screen.findByRole('button', { name: 'Lena V — open their record' }));
    expect(router.state.location.pathname).toBe('/creators/c-1');
    expect(await screen.findByRole('button', { name: 'Sunrise Loop · Drop' })).toBeInTheDocument();
    expect(screen.getByText('74%')).toBeInTheDocument();
    expect(screen.getByText('answers accepted')).toBeInTheDocument();
  });

  it('/creators/:id opens that record; Circle them follows', async () => {
    const user = userEvent.setup();
    const follows = calls('post', '/frontend/users/:id/follow');
    renderApp('/creators/c-1');
    const panel = await screen.findByRole('button', { name: 'Circle them' });
    await user.click(panel);
    await waitFor(() => expect(follows.map((f) => f.path)).toEqual(['/api/frontend/users/c-1/follow']));
    expect(await screen.findByText('Following Lena V')).toBeInTheDocument();
  });

  it('Mya opens as a guide, never ranked', async () => {
    const user = userEvent.setup();
    renderApp('/creators');
    await user.click(await screen.findByRole('button', { name: 'Mya — your guide' }));
    expect(screen.getByText(/Never: Set your price/)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Ask Mya' }).length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: /Rehearse/ })).toBeNull();
  });
});

describe('creators · the sheet, from any face', () => {
  it('opens from the WeO page and obeys their settings', async () => {
    const user = userEvent.setup();
    server.use(
      http.get(url('/frontend/creators/:id'), () =>
        ok(
          creatorViewFixture({
            shows: { collections: true, activity: false, invites: false, contact: 'circles' },
            viewer: { circled: false, tracked: false, sharedCircles: [], canContact: false, isSelf: false },
          }),
        ),
      ),
    );
    renderApp('/weos/weo-1');
    await user.click((await screen.findAllByRole('button', { name: /lenav/ }))[0]!);
    const sheet = await screen.findByRole('dialog', { name: 'Lena V — public profile' });
    expect(within(sheet).getByRole('button', { name: 'Invite' })).toBeDisabled();
    expect(within(sheet).getByRole('button', { name: 'Contact' })).toBeDisabled();
    expect(within(sheet).getByText('off')).toBeInTheDocument();
    expect(within(sheet).getByText('ISR 89 · Trusted')).toBeInTheDocument();
  });

  it('tracks their drops and invites them into a circle you are in', async () => {
    const user = userEvent.setup();
    const tracks = calls('post', '/frontend/me/tracking/creators/:id', { tracked: true });
    const invites = calls('post', '/frontend/community/circles/:id/invite', { invited: true });
    renderApp('/creators');
    // a face on the snapshot board opens the sheet
    const faces = await screen.findAllByRole('button', { name: /Lena V/ });
    await user.click(faces.find((b) => !/open their record/.test(b.getAttribute('aria-label') ?? ''))!);
    const sheet = await screen.findByRole('dialog', { name: 'Lena V — public profile' });
    await user.click(within(sheet).getByRole('button', { name: 'Track drops' }));
    await waitFor(() => expect(tracks).toHaveLength(1));
    expect(await within(sheet).findByRole('button', { name: 'Tracking' })).toBeInTheDocument();
    await user.click(within(sheet).getByRole('button', { name: 'Invite' }));
    await user.click(within(sheet).getByRole('button', { name: 'Digital Arts' }));
    await waitFor(() =>
      expect(invites).toEqual([
        { path: '/api/frontend/community/circles/circ-1/invite', body: { userId: 'c-1' } },
      ]),
    );
  });

  it('says so when a profile cannot be opened', async () => {
    server.use(http.get(url('/frontend/creators'), () => ok({ items: [], total: 0, page: 1, pages: 1 })));
    server.use(http.get(url('/frontend/creators/:id'), () => fail(404, 'Creator not found')));
    renderApp('/creators/ghost');
    expect(await screen.findByText('This profile could not be opened.')).toBeInTheDocument();
  });
});

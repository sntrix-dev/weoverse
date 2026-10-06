import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';
import { tokens } from '@/api/tokens';
import { notificationsFixture } from '@/test/fixtures/notifications';
import { ok, url } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { renderApp } from '@/test/renderApp';
import { atLabel, byDay, dayOf, routeOf } from '../model/notifications';

afterEach(() => tokens.clear());

describe('notifications model', () => {
  const now = new Date('2026-10-08T15:00:00').getTime();
  it('groups by day in local time', () => {
    expect(dayOf('2026-10-08T09:00:00', now)).toBe('Today');
    expect(dayOf('2026-10-07T23:00:00', now)).toBe('Yesterday');
    expect(dayOf('2026-10-03T12:00:00', now)).toBe('This week');
    expect(dayOf('2026-09-20T12:00:00', now)).toBe('Earlier');
    const days = byDay([{ createdAt: '2026-09-20T12:00:00' }, { createdAt: '2026-10-08T09:00:00' }], now);
    expect(days.map(([d]) => d)).toEqual(['Today', 'Earlier']);
  });
  it('labels a moment like the design', () => {
    expect(atLabel('2026-10-08T13:00:00', now)).toBe('2h ago');
    expect(atLabel('2026-10-07T23:00:00', now)).toBe('Yesterday');
    expect(atLabel('2026-10-05T12:00:00', now)).toBe('Mon');
    expect(atLabel('2026-09-20T12:00:00', now)).toBe('Sep 20');
  });
  it('opens the place the backend names, or nowhere', () => {
    expect(routeOf({ kind: 'weo', id: 'w1' })).toBe('/weos/w1');
    expect(routeOf({ kind: 'request', id: 'r1' })).toBe('/requests/r1');
    expect(routeOf({ kind: 'thread', id: 't1' })).toBe('/community/threads/t1');
    expect(routeOf({ kind: 'collected', id: null })).toBe('/collect');
    expect(routeOf({ kind: 'listed', id: null })).toBe('/exchange');
    expect(routeOf(null)).toBeNull();
  });
});

describe('notifications page', () => {
  it('counts what waits, groups by day, and shows categories with their totals', async () => {
    renderApp('/notifications');
    expect(await screen.findByRole('heading', { level: 1, name: '2 waiting on you' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Today' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Yesterday' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Earlier' })).toBeInTheDocument();
    const cats = screen.getByRole('group', { name: 'Categories' });
    expect(within(cats).getByRole('button', { name: /Everything 3/ })).toBeInTheDocument();
    expect(within(cats).getByRole('button', { name: /Wallet 1/ })).toBeInTheDocument();
    // System holds one, so it appears; Community holds none, so it does not
    expect(within(cats).getByRole('button', { name: /System 1/ })).toBeInTheDocument();
    expect(within(cats).queryByRole('button', { name: /Community/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Unread: Ada Obi just listed' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Top-up successful' })).toBeInTheDocument();
  });

  it('opening a row marks it read and goes where it points', async () => {
    const user = userEvent.setup();
    const read: string[] = [];
    server.use(
      http.patch(url('/frontend/notifications/:id/read'), ({ params }) => {
        read.push(String(params.id));
        return ok({});
      }),
    );
    const { router } = renderApp('/notifications');
    await user.click(await screen.findByRole('button', { name: 'Unread: Ada Obi just listed' }));
    await waitFor(() => expect(read).toEqual(['n-1']));
    await waitFor(() => expect(router.state.location.pathname).toBe('/weos/weo-1'));
  });

  it('a row with nowhere to go is marked read and stays', async () => {
    const user = userEvent.setup();
    const read: string[] = [];
    server.use(
      http.patch(url('/frontend/notifications/:id/read'), ({ params }) => {
        read.push(String(params.id));
        return ok({});
      }),
      http.get(url('/frontend/notifications'), () => {
        const f = notificationsFixture();
        return ok({
          ...f,
          notifications: f.notifications.map((n) =>
            read.includes(String(n._id)) ? { ...n, read: true } : n,
          ),
        });
      }),
    );
    const { router } = renderApp('/notifications');
    await user.click(await screen.findByRole('button', { name: 'Unread: Your report was reviewed' }));
    await waitFor(() => expect(read).toEqual(['n-3']));
    expect(router.state.location.pathname).toBe('/notifications');
    expect(await screen.findByRole('button', { name: 'Your report was reviewed' })).toBeInTheDocument();
  });

  it('marks everything read, filters by category and unread, and says when nothing matches', async () => {
    const user = userEvent.setup();
    let all = 0;
    const asked: string[] = [];
    server.use(
      http.patch(url('/frontend/notifications/read-all'), () => {
        all += 1;
        return ok(2);
      }),
      http.get(url('/frontend/notifications'), ({ request }) => {
        asked.push(new URL(request.url).search);
        const q = new URL(request.url).searchParams;
        const f = notificationsFixture();
        if (q.get('category') === 'payment') return ok({ ...f, notifications: [], total: 0, unReadCount: 0 });
        return ok(all ? { ...f, notifications: f.notifications.map((n) => ({ ...n, read: true })) } : f);
      }),
    );
    renderApp('/notifications');
    await user.click(await screen.findByRole('button', { name: 'Mark all read' }));
    await waitFor(() => expect(all).toBe(1));
    expect(await screen.findByRole('button', { name: 'Ada Obi just listed' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Unread only' }));
    await waitFor(() => expect(asked.some((s) => s.includes('read=false'))).toBe(true));
    await user.click(
      within(screen.getByRole('group', { name: 'Categories' })).getByRole('button', { name: /Payments/ }),
    );
    expect(await screen.findByText('Nothing under this lens')).toBeInTheDocument();
    expect(asked.some((s) => s.includes('category=payment'))).toBe(true);
    await user.click(screen.getByRole('button', { name: 'Show everything' }));
    expect(await screen.findByRole('button', { name: /Ada Obi just listed/ })).toBeInTheDocument();
  });
});

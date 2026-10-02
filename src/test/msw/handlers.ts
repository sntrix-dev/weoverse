import { http, HttpResponse } from 'msw';
import { apiRoot } from '@/lib/env';
import {
  circleFixture,
  creatorsFixture,
  feedFixture,
  interestsFixture,
  liveWeos,
  quoteFor,
  snapshotFixture,
} from '../fixtures/discover';
import {
  circleDetailFixture,
  circleWeosFixture,
  contributorsFixture,
  draftsFixture,
  membersFixture,
  myWeosFixture,
  pulseFixture,
  storiesFixture,
  threadDetailFixture,
  threadFixture,
  walletFixture,
} from '../fixtures/community';
import { collectionsSnapshotFixture, listingsSnapshotFixture, resellQuoteFixture } from '../fixtures/holdings';

/** Wraps data in the backend envelope (weo-3.0 ResponseHandler.success). */
export const ok = <T>(data: T, message = 'OK') => HttpResponse.json({ success: true, message, data });

/** ResponseHandler.error shape. */
export const fail = (
  status: number,
  message: string,
  errors: { field: string; message: string }[] | null = null,
) => HttpResponse.json({ success: false, message, data: null, error: message, errors }, { status });

export const url = (path: string) => `${apiRoot}${path}`;

/** Default handlers shared by every test; tests add their own with server.use(...). */
export const handlers = [
  http.post(url('/frontend/auth/new_access_token'), () => fail(401, 'Invalid refresh token')),
  // M04 reads — every page that lands on Discover / a WeO gets a full floor by default
  http.get(url('/frontend/weos/discovery-snapshot'), () => ok(snapshotFixture)),
  http.get(url('/frontend/weos/interests'), () => ok(interestsFixture)),
  http.get(url('/frontend/feed'), () => ok({ items: feedFixture(), total: 3, page: 1, totalPages: 1 })),
  http.get(url('/frontend/creators'), () => ok({ items: creatorsFixture, total: 1, page: 1, pages: 1 })),
  http.get(url('/frontend/community/circles'), () => ok({ joined: [circleFixture()], suggested: [] })),
  http.get(url('/frontend/weos'), ({ request }) => {
    const q = new URL(request.url).searchParams;
    const search = (q.get('search') ?? '').toLowerCase();
    const items =
      q.get('feed') === 'following' ? [] : liveWeos().filter((w) => w.title.toLowerCase().includes(search));
    return ok({ items, pagination: { total: items.length, page: 1, limit: 24, totalPages: 1 } });
  }),
  http.get(url('/frontend/weos/:id/collect/quote'), ({ params, request }) => {
    const w = liveWeos().find((x) => x._id === params.id);
    if (!w) return fail(404, 'WeO not found');
    const q = new URL(request.url).searchParams;
    const n = (k: string) => (q.get(k) != null ? Number(q.get(k)) : undefined);
    return ok(quoteFor(w, { amount: n('amount'), bundle: n('bundle') }));
  }),
  // M05 reads — the community and the wallet row
  http.get(url('/frontend/community/circles/:id'), ({ params }) => ok(circleDetailFixture({ id: String(params.id) }))),
  http.get(url('/frontend/community/circles/:id/members'), () =>
    ok({ items: membersFixture, pagination: { total: 2, page: 1, limit: 24, totalPages: 1 } }),
  ),
  http.get(url('/frontend/community/circles/:id/weos'), () => {
    const items = circleWeosFixture();
    return ok({ items, pagination: { total: items.length, page: 1, limit: 24, totalPages: 1 } });
  }),
  http.get(url('/frontend/community/discussions'), () => ok({ items: [threadFixture()], nextBefore: null })),
  http.get(url('/frontend/community/threads/:id'), ({ params }) => ok(threadDetailFixture({ id: String(params.id) }))),
  http.get(url('/frontend/community/stories'), () => ok({ items: storiesFixture, nextBefore: null, total: 2 })),
  http.get(url('/frontend/community/snapshot/contributors'), () => ok(contributorsFixture)),
  http.get(url('/frontend/community/snapshot/pulse'), () => ok(pulseFixture)),
  http.get(url('/frontend/community/my-weos'), () => ok({ items: myWeosFixture, nextBefore: null })),
  http.get(url('/frontend/me/drafts'), () => ok({ items: draftsFixture, total: 1 })),
  http.get(url('/frontend/me/collections'), () => ok({ items: [], pagination: { total: 0, page: 1, limit: 3, totalPages: 0 } })),
  http.get(url('/frontend/wallet/overview'), () => ok(walletFixture)),
  // M06 reads — Collect and Exchange
  http.get(url('/frontend/me/collections/snapshot'), () => ok(collectionsSnapshotFixture())),
  http.get(url('/frontend/me/listings/snapshot'), () => ok(listingsSnapshotFixture())),
  http.get(url('/frontend/weos/:id/resell/quote'), ({ params }) => ok(resellQuoteFixture({ weoId: String(params.id) }))),
  http.get(url('/frontend/weos/:id'), ({ params }) => {
    const w = liveWeos().find((x) => x._id === params.id);
    return w ? ok(w) : fail(404, 'WeO not found');
  }),
];

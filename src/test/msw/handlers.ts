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
import { categoriesFixture, pegFixture, templatesFixture } from '../fixtures/create';
import { briefOffersFixture, briefsFixture, creatorViewFixture, trackingFixture } from '../fixtures/people';
import { companyFixture } from '../fixtures/company';
import { notificationsFixture } from '../fixtures/notifications';
import { fullDraft, vettingCard } from '../fixtures/worlds';
import { fullWalletFixture, graphFixture, passportFixture, settingsFixture } from '../fixtures/identity';
import {
  collectionsSnapshotFixture,
  listingsSnapshotFixture,
  resellQuoteFixture,
} from '../fixtures/holdings';

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
  http.get(url('/frontend/community/circles/:id'), ({ params }) =>
    ok(circleDetailFixture({ id: String(params.id) })),
  ),
  http.get(url('/frontend/community/circles/:id/members'), () =>
    ok({ items: membersFixture, pagination: { total: 2, page: 1, limit: 24, totalPages: 1 } }),
  ),
  http.get(url('/frontend/community/circles/:id/weos'), () => {
    const items = circleWeosFixture();
    return ok({ items, pagination: { total: items.length, page: 1, limit: 24, totalPages: 1 } });
  }),
  http.get(url('/frontend/community/discussions'), () => ok({ items: [threadFixture()], nextBefore: null })),
  http.get(url('/frontend/community/threads/:id'), ({ params }) =>
    ok(threadDetailFixture({ id: String(params.id) })),
  ),
  http.get(url('/frontend/community/stories'), () =>
    ok({ items: storiesFixture, nextBefore: null, total: 2 }),
  ),
  http.get(url('/frontend/community/snapshot/contributors'), () => ok(contributorsFixture)),
  http.get(url('/frontend/community/snapshot/pulse'), () => ok(pulseFixture)),
  http.get(url('/frontend/community/my-weos'), () => ok({ items: myWeosFixture, nextBefore: null })),
  http.get(url('/frontend/me/drafts'), () => ok({ items: draftsFixture, total: 1 })),
  http.get(url('/frontend/me/collections'), () =>
    ok({ items: [], pagination: { total: 0, page: 1, limit: 3, totalPages: 0 } }),
  ),
  http.get(url('/frontend/wallet/overview'), () => ok({ ...fullWalletFixture(), ...walletFixture })),
  // M10 notifications & company
  http.get(url('/frontend/notifications'), () => ok(notificationsFixture())),
  http.get(url('/frontend/company'), () => ok(companyFixture)),
  // M09 identity & money
  http.get(url('/frontend/users/me/passport'), () => ok(passportFixture())),
  http.get(url('/frontend/users/me/graph'), () => ok(graphFixture)),
  http.get(url('/frontend/users/me/settings'), () => ok(settingsFixture())),
  // M06 reads — Collect and Exchange
  http.get(url('/frontend/me/collections/snapshot'), () => ok(collectionsSnapshotFixture())),
  http.get(url('/frontend/me/listings/snapshot'), () => ok(listingsSnapshotFixture())),
  http.get(url('/frontend/weos/:id/resell/quote'), ({ params }) =>
    ok(resellQuoteFixture({ weoId: String(params.id) })),
  ),
  http.get(url('/frontend/weos/:id'), ({ params }) => {
    const w = liveWeos().find((x) => x._id === params.id);
    return w ? ok(w) : fail(404, 'WeO not found');
  }),
  // M07 — Create
  http.get(url('/frontend/config/o'), () => ok(pegFixture)),
  http.get(url('/frontend/templates'), () => ok(templatesFixture())),
  // the categories read answers in the envelope like every other read
  http.get(url('/frontend/categories'), () => ok(categoriesFixture)),
  http.get(url('/frontend/request-weos'), () => {
    const rows = briefsFixture();
    return ok({ requestOffers: rows, total: rows.length, page: 1, totalPages: 1 });
  }),
  http.get(url('/frontend/request-weos/:id'), ({ params }) => {
    const r = briefsFixture().find((b) => b._id === params.id);
    return r ? ok(r) : fail(404, 'Request offer not found');
  }),
  http.get(url('/frontend/request-weos/:id/accepted-weos'), () => ok(briefOffersFixture)),
  http.post(url('/frontend/request-weos/:id/accept'), () => ok({ _id: 'weo-answer' }, 'Request accepted')),
  http.post(url('/frontend/request-weos/:id/close'), ({ params }) =>
    ok({ id: String(params.id), status: 'closed', open: false }),
  ),
  http.get(url('/frontend/creators/:id'), ({ params }) =>
    params.id === 'c-1' ? ok(creatorViewFixture()) : fail(404, 'Creator not found'),
  ),
  http.post(url('/frontend/users/:id/follow'), () => ok(null)),
  http.delete(url('/frontend/users/:id/unfollow'), () => ok(null)),
  http.get(url('/frontend/me/tracking'), () => ok(trackingFixture())),
  http.post(url('/frontend/me/tracking/:kind/:id'), () => ok({ tracked: true })),
  http.delete(url('/frontend/me/tracking/:kind/:id'), () => ok({ tracked: false })),
  http.post(url('/frontend/community/circles/:id/invite'), ({ params }) =>
    ok({ invited: true, circleId: String(params.id), userId: 'c-1' }),
  ),
  http.post(url('/frontend/media'), ({ request }) => {
    const type = request.headers.get('content-type') ?? '';
    return HttpResponse.json(
      {
        success: true,
        message: 'Uploaded',
        data: {
          url: `https://cdn.test/weoverse/app/u/weos/2026/10/up.${type.split('/')[1] ?? 'bin'}`,
          type: type.startsWith('video/') ? 'video' : 'image',
          size: 9,
          contentType: type,
        },
      },
      { status: 201 },
    );
  }),
  http.post(url('/frontend/ai/describe'), () =>
    ok({ lines: ['Sixty prints, each signed and numbered by hand.', 'One of sixty — yours, signed.'] }),
  ),
  http.post(url('/frontend/weos'), () => ok({ _id: 'weo-new', title: 'Posted' }, 'WeO created successfully')),
  http.put(url('/frontend/weos/:id'), ({ params }) => ok({ _id: String(params.id) })),
  http.post(url('/frontend/request-weos'), () => ok({ _id: 'rq-new' })),
  http.post(url('/frontend/me/drafts'), () => ok({ _id: 'draft-new' })),
  http.put(url('/frontend/me/drafts/:id'), ({ params }) => ok({ _id: String(params.id) })),
  // M11: worlds and the way to live
  http.get(url('/frontend/me/drafts/:id'), ({ params }) => ok(fullDraft(String(params.id)))),
  http.post(url('/frontend/me/drafts/:id/rehearsal'), ({ params }) =>
    ok({
      id: String(params.id),
      stage: 'rehearsed',
      reactions: { count: 0, need: 12 },
      pledges: { count: 0, threshold: 20, promisedOs: 0 },
    }),
  ),
  http.post(url('/frontend/me/drafts/:id/open-reactions'), ({ params }) =>
    ok({
      id: String(params.id),
      stage: 'reacting',
      reactions: { count: 0, need: 12 },
      pledges: { count: 0, threshold: 20, promisedOs: 0 },
      notified: 3,
    }),
  ),
  http.post(url('/frontend/me/drafts/:id/open-pledges'), ({ params }) =>
    ok({
      id: String(params.id),
      stage: 'pledging',
      reactions: { count: 12, need: 12 },
      pledges: { count: 0, threshold: 20, promisedOs: 0 },
    }),
  ),
  http.get(url('/frontend/vetting'), () => ok({ items: [], total: 0 })),
  http.get(url('/frontend/vetting/:id'), ({ params }) => ok(vettingCard({ id: String(params.id) }))),
  http.post(url('/frontend/vetting/:id/reactions'), ({ params }) =>
    ok(
      vettingCard({
        id: String(params.id),
        mine: { isOwner: false, reaction: { os: null, note: '' }, pledge: null },
      }),
    ),
  ),
  http.post(url('/frontend/vetting/:id/pledges'), ({ params }) =>
    ok(
      vettingCard({
        id: String(params.id),
        stage: 'pledging',
        mine: { isOwner: false, reaction: null, pledge: { os: 1200 } },
      }),
    ),
  ),
  http.delete(url('/frontend/vetting/:id/pledges'), ({ params }) =>
    ok(vettingCard({ id: String(params.id), stage: 'pledging' })),
  ),
  http.post(url('/frontend/weos/:id/rehearsals'), ({ params }) =>
    ok({
      _id: 'r-1',
      weoId: String(params.id),
      receiptId: 'WEO-SIM-1A2B-7Q',
      settledAt: '2026-09-28T10:00:00.000Z',
    }),
  ),
  http.delete(url('/frontend/me/drafts/:id'), () => ok(null)),
  http.post(url('/frontend/community/push'), () => ok({ id: 't-push' })),
];

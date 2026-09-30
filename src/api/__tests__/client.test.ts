import { http, HttpResponse } from 'msw';
import { fail, ok, url } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { api, ApiError, setSessionExpiredHandler } from '../client';
import { tokens } from '../tokens';

afterEach(() => {
  tokens.clear();
  setSessionExpiredHandler(null);
});

describe('api client', () => {
  it('unwraps the envelope and sends the bearer token', async () => {
    tokens.set('access-1', 'refresh-1');
    let auth: string | null = null;
    server.use(
      http.get(url('/frontend/users/me/nav-summary'), ({ request }) => {
        auth = request.headers.get('authorization');
        return ok({ name: 'Mira' });
      }),
    );
    await expect(api.get('/frontend/users/me/nav-summary')).resolves.toEqual({ name: 'Mira' });
    expect(auth).toBe('Bearer access-1');
  });

  it('passes raw (non-envelope) JSON through — e.g. GET /frontend/categories', async () => {
    server.use(
      http.get(url('/frontend/categories'), () => HttpResponse.json([{ _id: 'c1', name: 'Wellness' }])),
    );
    await expect(api.get('/frontend/categories')).resolves.toEqual([{ _id: 'c1', name: 'Wellness' }]);
  });

  it('drops empty query params and encodes the rest', async () => {
    let seen = '';
    server.use(
      http.get(url('/frontend/weos'), ({ request }) => {
        seen = new URL(request.url).search;
        return ok([]);
      }),
    );
    await api.get('/frontend/weos', {
      query: { sort: 'trending', search: '', page: 2, categoryId: undefined },
    });
    expect(seen).toBe('?sort=trending&page=2');
  });

  it('turns 422 into an ApiError with field errors', async () => {
    server.use(
      http.post(url('/frontend/weos'), () =>
        fail(422, 'Validation error', [{ field: 'media', message: 'At least one media item is required' }]),
      ),
    );
    const err = await api.post('/frontend/weos', {}).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(422);
    expect((err as ApiError).fieldErrors).toEqual([
      { field: 'media', message: 'At least one media item is required' },
    ]);
  });

  it('reads the account code from 403 envelopes', async () => {
    server.use(
      http.get(url('/frontend/wallet'), () =>
        HttpResponse.json(
          {
            success: false,
            message: 'Account banned',
            data: { code: 'ACCOUNT_BANNED' },
            error: 'Account banned',
          },
          { status: 403 },
        ),
      ),
    );
    const err = (await api.get('/frontend/wallet').catch((e: unknown) => e)) as ApiError;
    expect(err.code).toBe('ACCOUNT_BANNED');
  });

  it('handles a plain-text 429 from the rate limiter', async () => {
    server.use(http.get(url('/frontend/feed'), () => new HttpResponse('Too many requests', { status: 429 })));
    const err = (await api.get('/frontend/feed').catch((e: unknown) => e)) as ApiError;
    expect(err.status).toBe(429);
    expect(err.message).toBe('Too many requests');
  });

  it('refreshes once on a plain-text 401, then retries with the new token', async () => {
    tokens.set('expired', 'refresh-1');
    const seen: (string | null)[] = [];
    server.use(
      http.get(url('/frontend/users/me/passport'), ({ request }) => {
        const a = request.headers.get('authorization');
        seen.push(a);
        return a === 'Bearer fresh' ? ok({ isr: 86 }) : new HttpResponse('Invalid token', { status: 401 });
      }),
      http.post(url('/frontend/auth/new_access_token'), async ({ request }) => {
        const body = (await request.json()) as { refresh_token: string };
        expect(body.refresh_token).toBe('refresh-1');
        return ok({ accessToken: 'fresh', refreshToken: 'refresh-2' });
      }),
    );
    await expect(api.get('/frontend/users/me/passport')).resolves.toEqual({ isr: 86 });
    expect(seen).toEqual(['Bearer expired', 'Bearer fresh']);
    expect(tokens.getRefresh()).toBe('refresh-2');
  });

  it('shares one refresh between concurrent 401s', async () => {
    tokens.set('expired', 'refresh-1');
    let refreshCalls = 0;
    server.use(
      http.get(url('/frontend/a'), ({ request }) =>
        request.headers.get('authorization') === 'Bearer fresh'
          ? ok('a')
          : new HttpResponse('No token', { status: 401 }),
      ),
      http.get(url('/frontend/b'), ({ request }) =>
        request.headers.get('authorization') === 'Bearer fresh'
          ? ok('b')
          : new HttpResponse('No token', { status: 401 }),
      ),
      http.post(url('/frontend/auth/new_access_token'), () => {
        refreshCalls += 1;
        return ok({ accessToken: 'fresh', refreshToken: 'refresh-2' });
      }),
    );
    await expect(Promise.all([api.get('/frontend/a'), api.get('/frontend/b')])).resolves.toEqual(['a', 'b']);
    expect(refreshCalls).toBe(1);
  });

  it('clears the session and calls the expiry handler when refresh fails', async () => {
    tokens.set('expired', 'refresh-1');
    const expired = vi.fn();
    setSessionExpiredHandler(expired);
    server.use(http.get(url('/frontend/wallet'), () => new HttpResponse('Invalid token', { status: 401 })));
    const err = (await api.get('/frontend/wallet').catch((e: unknown) => e)) as ApiError;
    expect(err.status).toBe(401);
    expect(expired).toHaveBeenCalledTimes(1);
    expect(tokens.hasSession()).toBe(false);
  });

  it('never sends a token or refreshes on auth:false calls', async () => {
    tokens.set('access-1', 'refresh-1');
    let auth: string | null = 'unset';
    server.use(
      http.post(url('/frontend/auth/verify'), ({ request }) => {
        auth = request.headers.get('authorization');
        return fail(401, 'Authentication failed');
      }),
    );
    const err = (await api
      .post('/frontend/auth/verify', {}, { auth: false })
      .catch((e: unknown) => e)) as ApiError;
    expect(auth).toBeNull();
    expect(err.status).toBe(401);
    expect(tokens.getAccess()).toBe('access-1');
  });
});

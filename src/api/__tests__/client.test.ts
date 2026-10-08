import { delay, http, HttpResponse } from 'msw';
import { fail, ok, url } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { api, ApiError, setSessionExpiredHandler, timeouts } from '../client';
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

  it('a 5xx says something people can read and keeps the server text in detail (live pass)', async () => {
    server.use(
      http.post(url('/frontend/media'), () =>
        fail(500, 'S3 media upload not configured: S3_MEDIA_BUCKET is required.'),
      ),
    );
    const err = (await api.post('/frontend/media', {}).catch((e: unknown) => e)) as ApiError;
    expect(err.status).toBe(500);
    expect(err.message).toBe('Something went wrong on our side — try again in a moment.');
    expect(err.detail).toBe('S3 media upload not configured: S3_MEDIA_BUCKET is required.');
  });

  it('never surfaces an HTML error page as the message (live pass)', async () => {
    server.use(
      http.get(
        url('/frontend/nope'),
        () =>
          new HttpResponse('<!DOCTYPE html><pre>Cannot GET /api/frontend/nope</pre>', {
            status: 404,
            statusText: 'Not Found',
            headers: { 'Content-Type': 'text/html' },
          }),
      ),
    );
    const err = (await api.get('/frontend/nope').catch((e: unknown) => e)) as ApiError;
    expect(err.status).toBe(404);
    expect(err.message).toBe('Not Found');
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

  it('after a reload (refresh token only) refreshes once before the first requests — no 401 burst', async () => {
    tokens.set(null, 'refresh-1');
    const seen: (string | null)[] = [];
    let refreshCalls = 0;
    server.use(
      http.get(url('/frontend/a'), ({ request }) => {
        seen.push(request.headers.get('authorization'));
        return ok('a');
      }),
      http.get(url('/frontend/b'), ({ request }) => {
        seen.push(request.headers.get('authorization'));
        return ok('b');
      }),
      http.post(url('/frontend/auth/new_access_token'), () => {
        refreshCalls += 1;
        return ok({ accessToken: 'fresh', refreshToken: 'refresh-2' });
      }),
    );
    await expect(Promise.all([api.get('/frontend/a'), api.get('/frontend/b')])).resolves.toEqual(['a', 'b']);
    expect(refreshCalls).toBe(1);
    expect(seen).toEqual(['Bearer fresh', 'Bearer fresh']);
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

  it('waits its turn across tabs and spends the refresh token the previous tab rotated in', async () => {
    tokens.set('expired', 'refresh-1');
    const spent: string[] = [];
    // another tab holds the lock and rotates the shared token before this tab gets it
    Object.defineProperty(navigator, 'locks', {
      configurable: true,
      value: {
        // the Web Locks signature with options: (name, { signal }, callback)
        request: async (_name: string, _opts: { signal?: AbortSignal }, cb: () => Promise<boolean>) => {
          localStorage.setItem('weo.auth.refresh', 'refresh-from-other-tab');
          return cb();
        },
      },
    });
    server.use(
      http.get(url('/frontend/me'), ({ request }) =>
        request.headers.get('authorization') === 'Bearer fresh'
          ? ok('me')
          : new HttpResponse('No token', { status: 401 }),
      ),
      http.post(url('/frontend/auth/new_access_token'), async ({ request }) => {
        const { refresh_token } = (await request.json()) as { refresh_token: string };
        spent.push(refresh_token);
        return refresh_token === 'refresh-from-other-tab'
          ? ok({ accessToken: 'fresh', refreshToken: 'refresh-3' })
          : fail(401, 'Refresh token reused');
      }),
    );
    try {
      await expect(api.get('/frontend/me')).resolves.toBe('me');
    } finally {
      Reflect.deleteProperty(navigator, 'locks');
    }
    expect(spent).toEqual(['refresh-from-other-tab']);
    expect(tokens.getRefresh()).toBe('refresh-3');
  });

  it('without locks, a refusal caused by another tab rotating the token retries with the newer one', async () => {
    tokens.set('expired', 'refresh-1');
    const spent: string[] = [];
    server.use(
      http.get(url('/frontend/me'), ({ request }) =>
        request.headers.get('authorization') === 'Bearer fresh'
          ? ok('me')
          : new HttpResponse('No token', { status: 401 }),
      ),
      http.post(url('/frontend/auth/new_access_token'), async ({ request }) => {
        const { refresh_token } = (await request.json()) as { refresh_token: string };
        spent.push(refresh_token);
        if (refresh_token === 'refresh-1') {
          // the other tab won the race and stored its rotated token
          localStorage.setItem('weo.auth.refresh', 'refresh-2');
          return fail(401, 'Refresh token reused');
        }
        return ok({ accessToken: 'fresh', refreshToken: 'refresh-3' });
      }),
    );
    await expect(api.get('/frontend/me')).resolves.toBe('me');
    expect(spent).toEqual(['refresh-1', 'refresh-2']);
    expect(tokens.hasSession()).toBe(true);
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

  it('keeps the session when the refresh cannot reach the backend (M12)', async () => {
    tokens.set('expired', 'refresh-1');
    const expired = vi.fn();
    setSessionExpiredHandler(expired);
    server.use(
      http.get(url('/frontend/wallet'), () => new HttpResponse('Invalid token', { status: 401 })),
      http.post(url('/frontend/auth/new_access_token'), () => HttpResponse.error()),
    );
    const err = (await api.get('/frontend/wallet').catch((e: unknown) => e)) as ApiError;
    expect(err.status).toBe(401);
    expect(expired).not.toHaveBeenCalled();
    expect(tokens.getRefresh()).toBe('refresh-1');
  });

  it('a server that never answers is a 504 after the deadline, not a hang (M12)', async () => {
    const before = { ...timeouts };
    timeouts.requestMs = 50;
    try {
      server.use(
        http.get(url('/frontend/slow'), async () => {
          await delay('infinite');
          return ok(null);
        }),
      );
      tokens.set('acc', 'ref');
      const err = (await api.get('/frontend/slow').catch((e: unknown) => e)) as ApiError;
      expect(err).toBeInstanceOf(ApiError);
      expect(err.status).toBe(504);
    } finally {
      Object.assign(timeouts, before);
    }
  });

  it('a refresh that never answers keeps the session and frees the next try (M12)', async () => {
    const before = { ...timeouts };
    timeouts.refreshMs = 50;
    const expired = vi.fn();
    setSessionExpiredHandler(expired);
    try {
      server.use(
        http.get(url('/frontend/wallet'), () => new HttpResponse('Invalid token', { status: 401 })),
        http.post(url('/frontend/auth/new_access_token'), async () => {
          await delay('infinite');
          return ok(null);
        }),
      );
      tokens.set('expired', 'refresh-1');
      const err = (await api.get('/frontend/wallet').catch((e: unknown) => e)) as ApiError;
      expect(err.status).toBe(401);
      expect(expired).not.toHaveBeenCalled();
      expect(tokens.getRefresh()).toBe('refresh-1');
    } finally {
      Object.assign(timeouts, before);
    }
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

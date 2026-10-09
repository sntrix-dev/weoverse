import { apiRoot } from '@/lib/env';
import { accountState } from './accountState';
import type { components } from './generated/schema';
import { tokens } from './tokens';

/** Field-level validation error from the backend's Zod middleware (422). */
export interface FieldError {
  field: string;
  message: string;
}

/** The backend's response envelope (weo-3.0 CLAUDE.md §4). */
export interface Envelope<T> {
  success: boolean;
  message: string;
  data: T;
  error?: string | null;
  errors?: FieldError[] | null;
}

export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: FieldError[];
  /** e.g. ACCOUNT_BANNED / ACCOUNT_SUSPENDED / ACCOUNT_DELETED from `authenticate` */
  readonly code: string | undefined;
  readonly data: unknown;
  /** what the server said when `message` was replaced by a friendlier one (5xx) */
  readonly detail: string | undefined;

  constructor(
    status: number,
    message: string,
    opts: { fieldErrors?: FieldError[]; code?: string; data?: unknown; detail?: string } = {},
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = opts.fieldErrors ?? [];
    this.code = opts.code;
    this.data = opts.data;
    this.detail = opts.detail;
  }
}

export type Query = Record<string, string | number | boolean | null | undefined>;

export interface RequestOptions {
  query?: Query;
  body?: unknown;
  /** send the bearer token and refresh on 401 (default true) */
  auth?: boolean;
  signal?: AbortSignal;
}

const isEnvelope = (v: unknown): v is Envelope<unknown> =>
  typeof v === 'object' && v !== null && 'success' in v && 'message' in v;

const buildUrl = (path: string, query?: Query) => {
  const url = new URL(`${apiRoot}${path.startsWith('/') ? path : `/${path}`}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
};

/** Parses JSON when the server sent JSON; some backend paths answer 401/403 in plain text. */
async function readBody(res: Response): Promise<unknown> {
  const type = res.headers.get('content-type') ?? '';
  if (res.status === 204) return null;
  if (type.includes('application/json')) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }
  const text = await res.text();
  return text || null;
}

/** People see this for any server-side failure; the server's own words stay in `detail`. */
export const SERVER_TROUBLE = 'Something went wrong on our side — try again in a moment.';

function toError(res: Response, body: unknown): ApiError {
  const e = readError(res, body);
  // live pass: a 5xx message is written for operators ("S3_MEDIA_BUCKET is required"), not people
  if (res.status < 500) return e;
  return new ApiError(e.status, SERVER_TROUBLE, {
    fieldErrors: e.fieldErrors,
    code: e.code,
    data: e.data,
    detail: e.message,
  });
}

function readError(res: Response, body: unknown): ApiError {
  if (isEnvelope(body)) {
    const data = body.data as { code?: string } | null;
    return new ApiError(res.status, body.message || body.error || res.statusText, {
      fieldErrors: body.errors ?? [],
      code: data && typeof data === 'object' ? data.code : undefined,
      data: body.data,
    });
  }
  if (body && typeof body === 'object' && 'message' in body) {
    return new ApiError(res.status, String((body as { message: unknown }).message));
  }
  // an HTML page (Express "Cannot GET", a proxy error page) is never a message for people
  const text = typeof body === 'string' && body && !body.trimStart().startsWith('<') ? body : '';
  return new ApiError(res.status, text || res.statusText || 'Request failed');
}

/* ---------- time limits ---------- */

/**
 * How long a call may wait for an answer (M12). Without a limit, a request the server accepted
 * but never answered (a restart mid-deploy, a stuck proxy) hung for minutes — and a hung refresh
 * held the cross-tab refresh lock, so every open tab sat with empty screens and then signed out.
 * Uploads get longer. Mutable only for tests.
 */
export const timeouts = { requestMs: 20_000, uploadMs: 120_000, refreshMs: 15_000 };

/** A signal that aborts after `ms` (with a fallback for browsers before AbortSignal.timeout). */
export function timeoutSignal(ms: number): AbortSignal {
  if (typeof AbortSignal.timeout === 'function') return AbortSignal.timeout(ms);
  const c = new AbortController();
  setTimeout(() => c.abort(new DOMException('The operation timed out.', 'TimeoutError')), ms);
  return c.signal;
}

/** The caller's signal (if any) and a deadline, as one signal (Safari < 17.4 has no AbortSignal.any). */
function deadline(ms: number, signal?: AbortSignal): AbortSignal {
  const limit = timeoutSignal(ms);
  if (!signal) return limit;
  if (typeof AbortSignal.any === 'function') return AbortSignal.any([signal, limit]);
  const c = new AbortController();
  const stop = (s: AbortSignal) => () => c.abort(s.reason);
  if (signal.aborted) c.abort(signal.reason);
  signal.addEventListener('abort', stop(signal), { once: true });
  limit.addEventListener('abort', stop(limit), { once: true });
  return c.signal;
}

// by name: a DOMException from another realm (a test DOM) is not `instanceof` this one
const isTimeout = (e: unknown) => (e as { name?: unknown } | null)?.name === 'TimeoutError';

/* ---------- refresh (single flight, across tabs) ---------- */

let refreshing: Promise<boolean> | null = null;
/** The last refresh could not reach the backend (offline, restarting): the session is kept. */
let refreshUnreachable = false;
let onSessionExpired: (() => void) | null = null;

/** The auth layer registers what to do when a refresh fails (clear state, go to /login). */
export const setSessionExpiredHandler = (fn: (() => void) | null) => {
  onSessionExpired = fn;
};

/** One tab at a time may spend the (shared, rotating) refresh token. */
const REFRESH_LOCK = 'weo.auth.refresh';

async function exchange(refreshToken: string): Promise<boolean> {
  // a timeout throws: the refresh is "unreachable" and the session is kept
  const res = await fetch(buildUrl('/frontend/auth/new_access_token'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
    signal: deadline(timeouts.refreshMs),
  });
  const body = await readBody(res);
  if (!res.ok || !isEnvelope(body) || !body.success) {
    if (isEnvelope(body)) accountState.report(res.status, body.message, body.data);
    return false;
  }
  const data = body.data as components['schemas']['NewAccessTokenData'];
  tokens.set(data.accessToken, data.refreshToken);
  return true;
}

/**
 * Spends the refresh token as it is NOW in storage — read inside the lock, so a tab that waited
 * uses the token the previous tab just rotated in, never the one it already spent. If the
 * exchange is refused but another tab rotated the token meanwhile (a browser without Web Locks),
 * it tries once more with the newer one before giving up.
 */
async function refreshFromStorage(): Promise<boolean> {
  const first = tokens.getRefresh();
  if (!first) return false;
  if (await exchange(first)) return true;
  const latest = tokens.getRefresh();
  return !!latest && latest !== first && exchange(latest);
}

export function refreshAccessToken(): Promise<boolean> {
  if (!tokens.getRefresh()) return Promise.resolve(false);
  refreshing ??= (async () => {
    refreshUnreachable = false;
    try {
      const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined;
      // waiting for another tab's refresh is bounded too: a lock that never frees must not
      // freeze this tab (aborting the wait throws, which keeps the session)
      return locks
        ? await locks.request(
            REFRESH_LOCK,
            { signal: timeoutSignal(timeouts.refreshMs * 2) },
            refreshFromStorage,
          )
        : await refreshFromStorage();
    } catch {
      // fetch threw: no answer at all, so nothing says the refresh token is bad (M12)
      refreshUnreachable = true;
      return false;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

/* ---------- request ---------- */

async function request<T>(
  method: string,
  path: string,
  opts: RequestOptions = {},
  retried = false,
): Promise<T> {
  const { query, body, auth = true, signal } = opts;
  const headers: Record<string, string> = { Accept: 'application/json' };
  // a Blob / File goes as the raw body with its own type (POST /frontend/media)
  const raw = typeof Blob !== 'undefined' && body instanceof Blob;
  if (raw) headers['Content-Type'] = body.type || 'application/octet-stream';
  else if (body !== undefined && !(body instanceof FormData)) headers['Content-Type'] = 'application/json';
  // After a reload the access token is gone (memory only) but the refresh token is kept: refresh
  // once, shared by every request of the first paint, instead of sending each one to a 401 first
  // (a burst that also spends the per-IP rate limit).
  if (auth && !retried && !tokens.getAccess() && tokens.getRefresh()) await refreshAccessToken();
  const access = tokens.getAccess();
  if (auth && access) headers.Authorization = `Bearer ${access}`;

  const slow = raw || body instanceof FormData;
  let res: Response;
  let payload: unknown;
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      headers,
      signal: deadline(slow ? timeouts.uploadMs : timeouts.requestMs, signal),
      body:
        body === undefined
          ? undefined
          : raw || body instanceof FormData
            ? (body as BodyInit)
            : JSON.stringify(body),
    });
    payload = await readBody(res);
  } catch (e) {
    // a deadline is a server that did not answer: a 504 the screens and retries already handle
    if (isTimeout(e))
      throw new ApiError(504, 'The server is taking too long to answer — try again in a moment.');
    throw e;
  }

  if (res.status === 401 && auth && !retried) {
    const ok = await refreshAccessToken();
    if (ok) return request<T>(method, path, opts, true);
    // only a refused refresh ends the session; an unreachable backend keeps it for the next try
    if (!refreshUnreachable) {
      tokens.clear();
      onSessionExpired?.();
    }
  }
  if (!res.ok || (isEnvelope(payload) && !payload.success)) {
    const err = toError(res, payload);
    // a suspended, banned or deleted account: said once, over everything (M12)
    accountState.report(err.status, err.message, err.data);
    throw err;
  }
  if (isEnvelope(payload)) {
    return payload.data as T;
  }
  // a few backend reads (e.g. GET /frontend/categories) return raw JSON with no envelope
  return payload as T;
}

export const api = {
  get: <T>(path: string, opts?: Omit<RequestOptions, 'body'>) => request<T>('GET', path, opts),
  post: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'body'>) =>
    request<T>('POST', path, { ...opts, body }),
  put: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'body'>) =>
    request<T>('PUT', path, { ...opts, body }),
  patch: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'body'>) =>
    request<T>('PATCH', path, { ...opts, body }),
  delete: <T>(path: string, opts?: Omit<RequestOptions, 'body'>) => request<T>('DELETE', path, opts),
};

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

  constructor(
    status: number,
    message: string,
    opts: { fieldErrors?: FieldError[]; code?: string; data?: unknown } = {},
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = opts.fieldErrors ?? [];
    this.code = opts.code;
    this.data = opts.data;
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

function toError(res: Response, body: unknown): ApiError {
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
  return new ApiError(
    res.status,
    typeof body === 'string' && body ? body : res.statusText || 'Request failed',
  );
}

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
  const res = await fetch(buildUrl('/frontend/auth/new_access_token'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
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
      return locks ? await locks.request(REFRESH_LOCK, refreshFromStorage) : await refreshFromStorage();
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

  const res = await fetch(buildUrl(path, query), {
    method,
    headers,
    signal,
    body:
      body === undefined
        ? undefined
        : raw || body instanceof FormData
          ? (body as BodyInit)
          : JSON.stringify(body),
  });
  const payload = await readBody(res);

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

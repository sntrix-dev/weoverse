import { env } from '@/lib/env';

/**
 * Token storage. The backend is bearer-only (no cookies):
 *  - access token (15 min) lives in memory only;
 *  - refresh token (30 days) lives in localStorage so a reload keeps the session.
 * In dev, VITE_DEV_ACCESS_TOKEN seeds the access token so the app works without the IdP —
 * but only when no real session is stored: a signed-in person stays themselves across reloads
 * (the first request refreshes from their refresh token) instead of turning back into the dev user.
 */
const REFRESH_KEY = 'weo.auth.refresh';

type Listener = () => void;

const listeners = new Set<Listener>();

const safeStorage = {
  get(key: string): string | null {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string | null) {
    try {
      if (value === null) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, value);
    } catch {
      // storage can be blocked (private mode); the session simply won't survive a reload
    }
  },
};

let accessToken: string | null = (!safeStorage.get(REFRESH_KEY) && env.devAccessToken) || null;

const notify = () => listeners.forEach((l) => l());

/*
 * Another tab signed out (its refresh token was removed from the shared storage): this tab's
 * access token is the same person's, so it ends here too instead of carrying on until it expires.
 */
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === REFRESH_KEY && e.oldValue && !e.newValue && accessToken) {
      accessToken = null;
      notify();
    }
  });
}

export const tokens = {
  getAccess: () => accessToken,
  getRefresh: () => safeStorage.get(REFRESH_KEY),
  /** true when we hold something that can authenticate a request (now or after a refresh) */
  hasSession: () => Boolean(accessToken || safeStorage.get(REFRESH_KEY)),
  set(access: string | null, refresh?: string | null) {
    accessToken = access;
    if (refresh !== undefined) safeStorage.set(REFRESH_KEY, refresh);
    notify();
  },
  clear() {
    accessToken = null;
    safeStorage.set(REFRESH_KEY, null);
    notify();
  },
  subscribe(l: Listener) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};

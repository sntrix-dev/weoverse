import { create } from 'zustand';
import { api } from '@/api/client';
import type { components } from '@/api/generated/schema';

/**
 * Shell preferences (design `app.jsx` theme/currency/navMode/railOpen/home/myaHidden/navDock,
 * `chrome.jsx` dock position, SectionSwitch `wv3.navmode`, flow bar `wv3.flowbar*`).
 *
 * Source of truth: `uiPreferences` on the user (`GET /users/me/nav-summary` hydrates,
 * `PATCH /users/me/preferences` writes). Writes are optimistic and batched; localStorage
 * only holds a first-paint copy so a dark-theme user doesn't flash light on reload (D-021).
 */
export type UiPreferences = components['schemas']['UiPreferences'];
export type UiPreferencesPatch = components['schemas']['UiPreferencesPatch'];

/** Mirrors weo-3.0 `UI_PREFERENCE_DEFAULTS`. */
export const DEFAULT_PREFS: UiPreferences = {
  theme: 'light',
  currency: 'USD',
  navMode: 'bar',
  railOpen: true,
  navDock: 'float',
  motion: 'full',
  myaHidden: false,
  dockPosition: { r: 22, b: 22 },
  weoView: 'cards',
  snapshotBoard: 'collected',
  density: 'roomy',
  media: 'rich',
  valueDisplay: 'os',
  mutedFormats: [],
  mutedKinds: [],
  home: 'hub',
  navSections: 'one',
  flowBar: 'full',
  flowBarTools: false,
  /** intros and walkthrough steps already shown, once per account (M11, D-088) */
  seen: [],
};

const CACHE_KEY = 'weo.prefs';
const FLUSH_MS = 400;

const readCache = (): UiPreferences => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) return { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<UiPreferences>) };
  } catch {
    /* private mode / corrupt cache: defaults */
  }
  return DEFAULT_PREFS;
};
const writeCache = (p: UiPreferences) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
};

interface PrefsState {
  prefs: UiPreferences;
  /** the last set the server confirmed (rollback target) */
  server: UiPreferences | null;
  /** local changes not yet sent / confirmed */
  pending: UiPreferencesPatch;
  /** called when a save fails (the shell shows a toast) */
  onSaveError: ((err: unknown) => void) | null;
  hydrate: (server: UiPreferences | null | undefined) => void;
  set: (patch: UiPreferencesPatch) => void;
  /** test/logout helper: back to defaults, cache cleared */
  reset: () => void;
}

let timer: ReturnType<typeof setTimeout> | null = null;
let inFlight = 0;
/** PATCHes currently on the wire — a read that raced one must not overwrite it */
let saving = 0;

export const usePrefs = create<PrefsState>((set, get) => {
  const flush = async () => {
    timer = null;
    const patch = get().pending;
    if (Object.keys(patch).length === 0) return;
    set({ pending: {} });
    const ticket = ++inFlight;
    saving += 1;
    try {
      const saved = await api.patch<UiPreferences>('/frontend/users/me/preferences', patch);
      // a newer write is queued or running: keep the local values, it will answer last
      if (ticket !== inFlight || Object.keys(get().pending).length) {
        set({ server: saved });
        return;
      }
      const full = { ...DEFAULT_PREFS, ...saved };
      writeCache(full);
      set({ prefs: full, server: full });
    } catch (err) {
      const back = get().server;
      if (back && ticket === inFlight && !Object.keys(get().pending).length) {
        writeCache(back);
        set({ prefs: back });
      }
      get().onSaveError?.(err);
    } finally {
      saving -= 1;
    }
  };

  return {
    prefs: readCache(),
    server: null,
    pending: {},
    onSaveError: null,
    hydrate: (server) => {
      if (!server || saving > 0) return;
      const full = { ...DEFAULT_PREFS, ...server };
      // never clobber a change the user just made
      const merged = { ...full, ...get().pending } as UiPreferences;
      writeCache(merged);
      set({ prefs: merged, server: full });
    },
    set: (patch) => {
      const next = { ...get().prefs, ...patch } as UiPreferences;
      writeCache(next);
      set({ prefs: next, pending: { ...get().pending, ...patch } });
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void flush(), FLUSH_MS);
    },
    reset: () => {
      if (timer) clearTimeout(timer);
      timer = null;
      try {
        localStorage.removeItem(CACHE_KEY);
      } catch {
        /* ignore */
      }
      set({ prefs: DEFAULT_PREFS, server: null, pending: {} });
    },
  };
});

/** Selector hook for one preference. */
export const usePref = <K extends keyof UiPreferences>(key: K): UiPreferences[K] =>
  usePrefs((s) => s.prefs[key]);

export const setPrefs = (patch: UiPreferencesPatch) => usePrefs.getState().set(patch);

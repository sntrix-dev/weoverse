import { create } from 'zustand';
import { setPrefs, usePrefs } from './prefs';

/**
 * Transient shell UI (design `app.jsx`: toasts, ack, external, idSheet, dock, navFlight,
 * navConfirm). Nothing here is persisted — preferences live in `stores/prefs.ts`.
 */
export interface Toast {
  id: number;
  msg: string;
}

export interface ExternalGateData {
  label: string;
  note: string;
  eyebrow?: string;
  url?: string;
  cta?: string;
  tone?: 'violet' | 'blue' | 'green' | 'gold';
}

export type DockTab = 'mya' | 'settings';

interface UiState {
  toasts: Toast[];
  ack: { play: number; label: string; tone: string };
  external: ExternalGateData | null;
  idSheet: boolean;
  dock: { open: boolean; tab: DockTab };
  /** design `mya.open` — Mya's conversation is the live one in the dock */
  myaOpen: boolean;
  navFlight: 'park' | 'float' | null;
  navConfirm: boolean;
}

const TOAST_MS = 2800;
let toastSeq = 0;

export const useUi = create<UiState>(() => ({
  toasts: [],
  ack: { play: 0, label: '', tone: '' },
  external: null,
  idSheet: false,
  dock: { open: false, tab: 'mya' },
  myaOpen: false,
  navFlight: null,
  navConfirm: false,
}));

const set = useUi.setState;
const get = useUi.getState;

/** design `app.toast(msg)` — a glass pill at the bottom, 2.8 s. */
export function toast(msg: string) {
  const id = ++toastSeq;
  set((s) => ({ toasts: [...s.toasts, { id, msg }] }));
  setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), TOAST_MS);
}

/** design `app.ack(label, tone)` — the centred check ripple. */
export function ack(label = '', tone = 'var(--o-green)') {
  set((s) => ({ ack: { play: s.ack.play + 1, label, tone } }));
}

export const openExternal = (g: ExternalGateData) => set({ external: g });
export const closeExternal = () => set({ external: null });

export const openId = () => set({ idSheet: true });
export const closeId = () => set({ idSheet: false });

/* ---- the dock: Mya and Settings share one panel ---- */
export const openDock = (tab: DockTab = 'mya') =>
  set((s) => ({ dock: { open: true, tab }, myaOpen: tab !== 'settings' ? true : s.myaOpen }));
export const setDockTab = (tab: DockTab) => set((s) => ({ dock: { ...s.dock, tab } }));
export const closeDock = () => set((s) => ({ dock: { ...s.dock, open: false }, myaOpen: false }));
export const closeSettings = () => set((s) => ({ dock: { ...s.dock, open: false } }));
export const toggleMya = () => {
  const { dock } = get();
  const on = dock.open && dock.tab === 'mya';
  set({ dock: on ? { ...dock, open: false } : { open: true, tab: 'mya' }, myaOpen: !on });
};
export const setMyaHidden = (hidden: boolean) => {
  setPrefs({ myaHidden: hidden });
  if (hidden) set({ myaOpen: false });
};

/* ---- the O nav: float it, park it in the top bar ---- */
export const parkNav = () => {
  setPrefs({ navDock: 'top' });
  set({ navFlight: 'park' });
};
export const parkNavQuiet = () => {
  if (usePrefs.getState().prefs.navDock !== 'top') setPrefs({ navDock: 'top' });
};
export const floatNav = () => set({ navConfirm: false, navFlight: 'float' });
export const endNavFlight = () => {
  if (get().navFlight === 'park') set({ navConfirm: true });
  else setPrefs({ navDock: 'float' });
  set({ navFlight: null });
};
export const dismissNavConfirm = () => set({ navConfirm: false });

/** test helper */
export const resetUi = () =>
  set({
    toasts: [],
    ack: { play: 0, label: '', tone: '' },
    external: null,
    idSheet: false,
    dock: { open: false, tab: 'mya' },
    myaOpen: false,
    navFlight: null,
    navConfirm: false,
  });

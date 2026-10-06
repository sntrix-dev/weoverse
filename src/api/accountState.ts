import { useSyncExternalStore } from 'react';

/**
 * The account's own state, when the backend refuses it (`authenticate`: 403 with
 * `data.code` ACCOUNT_SUSPENDED / ACCOUNT_BANNED / ACCOUNT_DELETED). Every screen would otherwise
 * fail one by one with the same reason; the app shows it once, over everything (M12).
 */
export type AccountCode = 'ACCOUNT_SUSPENDED' | 'ACCOUNT_BANNED' | 'ACCOUNT_DELETED';

export interface AccountBlock {
  code: AccountCode;
  message: string;
  /** the reason staff gave, when there is one */
  reason: string | null;
}

const CODES = new Set<string>(['ACCOUNT_SUSPENDED', 'ACCOUNT_BANNED', 'ACCOUNT_DELETED']);

let current: AccountBlock | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

export const isAccountCode = (code: unknown): code is AccountCode =>
  typeof code === 'string' && CODES.has(code);

export const accountState = {
  get: () => current,
  /** from a refused response: its status, message and envelope `data` */
  report(status: number, message: string, data: unknown) {
    if (status !== 403 || !data || typeof data !== 'object') return;
    const d = data as { code?: unknown; reason?: unknown };
    if (!isAccountCode(d.code)) return;
    const reason = typeof d.reason === 'string' && d.reason.trim() ? d.reason.trim() : null;
    if (current?.code === d.code && current.reason === reason) return;
    current = { code: d.code, message, reason };
    notify();
  },
  clear() {
    if (!current) return;
    current = null;
    notify();
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};

export function useAccountBlock(): AccountBlock | null {
  return useSyncExternalStore(accountState.subscribe, accountState.get, accountState.get);
}

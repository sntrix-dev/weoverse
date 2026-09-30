import { useSyncExternalStore } from 'react';
import { tokens } from '@/api/tokens';

/** True while we hold an access or refresh token. Re-renders on login/logout. */
export function useHasSession(): boolean {
  return useSyncExternalStore(tokens.subscribe, tokens.hasSession, tokens.hasSession);
}

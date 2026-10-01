import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { endWalletSession, logout } from '@/api/auth';
import { routes } from '@/app/routes';
import { closeFlow } from '@/stores/flow';
import { resetMya } from '@/stores/mya';
import { usePrefs } from '@/stores/prefs';
import { resetUi, toast } from '@/stores/ui';

/** Log out: end the O-Wallet session, revoke the refresh token, drop every cached read and shell state, land on /login. */
export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useCallback(async () => {
    // first, while still inside the click — a popup opened after an await is blocked
    endWalletSession();
    try {
      await logout();
    } finally {
      queryClient.clear();
      usePrefs.getState().reset();
      resetMya();
      closeFlow();
      resetUi();
      void navigate(routes.login(), { replace: true });
      // design copy (WeOverseIdSheet "Log out")
      toast('Signed out — see you at the O');
    }
  }, [queryClient, navigate]);
}

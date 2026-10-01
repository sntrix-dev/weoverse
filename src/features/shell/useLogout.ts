import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { logout } from '@/api/auth';
import { routes } from '@/app/routes';
import { resetMya } from '@/stores/mya';
import { usePrefs } from '@/stores/prefs';
import { resetUi, toast } from '@/stores/ui';

/** Log out: revoke the refresh token, drop every cached read and shell state, land on /login. */
export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useCallback(async () => {
    try {
      await logout();
    } finally {
      queryClient.clear();
      usePrefs.getState().reset();
      resetMya();
      resetUi();
      void navigate(routes.login(), { replace: true });
      // design copy (WeOverseIdSheet "Log out")
      toast('Signed out — see you at the O');
    }
  }, [queryClient, navigate]);
}

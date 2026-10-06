import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { qk } from '@/api/queryKeys';
import { usePrefs } from '@/stores/prefs';
import { toShellMe, type NavSummaryDto } from '../model/me';

/** The shell's one read (backend: "everything the navigation shell needs, in one round trip"). */
const NAV_SUMMARY_POLL_MS = 60_000;

export const fetchNavSummary = async () => {
  const dto = await api.get<NavSummaryDto>('/frontend/users/me/nav-summary');
  usePrefs.getState().hydrate(dto.uiPreferences);
  return dto;
};

export function useNavSummary() {
  return useQuery({
    queryKey: qk.me.navSummary(),
    queryFn: fetchNavSummary,
    select: toShellMe,
    staleTime: NAV_SUMMARY_POLL_MS,
    // the bell's unread dot; the socket refreshes it live (api/live.ts, M12) — this poll is the fallback
    refetchInterval: NAV_SUMMARY_POLL_MS,
  });
}

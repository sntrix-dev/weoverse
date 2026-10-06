import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { routes } from '@/app/routes';
import type { WeoHandlers } from '@/components/weo/weoCardProps';
import { askAbout, openCollect, openWorld } from '@/stores/flow';

/**
 * What a WeO surface can do: open the WeO's page, collect it, and push it to a Circle (M05 —
 * yours as a push, anyone else's as a question about it, D-040), and rehearse it in a world (M11).
 */
export function useWeoHandlers(): WeoHandlers {
  const navigate = useNavigate();
  return useMemo(
    () => ({
      onOpen: (w) => void navigate(routes.weo(w.id)),
      onCollect: (w) => openCollect(w.id),
      onPush: (w) => askAbout(w),
      onRehearse: (w) => openWorld({ weoId: w.id }),
    }),
    [navigate],
  );
}

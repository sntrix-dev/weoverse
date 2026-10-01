import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { routes } from '@/app/routes';
import type { WeoHandlers } from '@/components/weo/weoCardProps';
import { openCollect } from '@/stores/flow';

/**
 * What a WeO surface can do in M04: open the WeO's page, and collect it. Push to a Circle
 * (M05) and Rehearse (M11) arrive with their modules, so their controls stay hidden (D-027).
 */
export function useWeoHandlers(): WeoHandlers {
  const navigate = useNavigate();
  return useMemo(
    () => ({
      onOpen: (w) => void navigate(routes.weo(w.id)),
      onCollect: (w) => openCollect(w.id),
    }),
    [navigate],
  );
}

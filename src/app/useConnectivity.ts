import { onlineManager, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from '@/stores/ui';

/**
 * Offline and back (M12): reads pause while the browser is offline (TanStack's onlineManager)
 * and the screen says so once; on the way back it says so and refreshes what is on screen.
 */
export function useConnectivity() {
  const qc = useQueryClient();
  useEffect(() => {
    let wasOnline = onlineManager.isOnline();
    return onlineManager.subscribe((online) => {
      if (online === wasOnline) return;
      wasOnline = online;
      if (!online) {
        toast('You’re offline — what you see may be out of date');
        return;
      }
      toast('Back online');
      void qc.invalidateQueries({ refetchType: 'active' });
    });
  }, [qc]);
}

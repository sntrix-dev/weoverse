import { useEffect, useState, type ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { setSessionExpiredHandler } from '@/api/client';
import { createQueryClient } from '@/api/queryClient';

/** App-wide providers. `onSessionExpired` runs when a token refresh fails. */
export function Providers({
  children,
  onSessionExpired,
}: {
  children: ReactNode;
  onSessionExpired: () => void;
}) {
  const [queryClient] = useState(createQueryClient);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      queryClient.clear();
      onSessionExpired();
    });
    return () => setSessionExpiredHandler(null);
  }, [queryClient, onSessionExpired]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

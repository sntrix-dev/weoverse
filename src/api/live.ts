import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import type { Socket } from 'socket.io-client';
import { qk } from '@/api/queryKeys';
import { tokens } from '@/api/tokens';
import { env } from '@/lib/env';

/** What the backend emits when a notification is created for you (M12, G-71). */
export interface LiveNotification {
  _id: string;
  title: string;
  category: string;
  type: string;
  createdAt: string;
}

export const LIVE_NAMESPACE = '/authenticated';

/**
 * The bell, live: one socket on `/authenticated`, opened while there is an access token. A new
 * notification refreshes the bell's dot and the notifications list; the nav summary's 60 s poll
 * stays as the fallback (no socket, a dropped connection, a blocked port).
 *
 * The handshake reads the access token each time it connects, so a refreshed token is picked up
 * on the next reconnect; signing out closes the socket. socket.io-client loads lazily, in its own
 * chunk, after the first paint.
 */
export function useLiveNotifications() {
  const qc = useQueryClient();

  useEffect(() => {
    let socket: Socket | null = null;
    let closed = false;

    const refresh = (_n: LiveNotification) => {
      void qc.invalidateQueries({ queryKey: qk.me.navSummary() });
      void qc.invalidateQueries({ queryKey: qk.notifications.all });
    };

    const sync = async () => {
      const token = tokens.getAccess();
      if (!token) {
        socket?.disconnect();
        return;
      }
      if (socket) {
        // a refused handshake (expired token) stops retrying; the new token reopens it
        if (!socket.connected && !socket.active) socket.connect();
        return;
      }
      const { io } = await import('socket.io-client');
      if (closed || socket) return;
      socket = io(`${env.apiUrl}${LIVE_NAMESPACE}`, {
        auth: (cb) => cb({ token: tokens.getAccess() }),
        transports: ['websocket'],
        reconnectionDelayMax: 30_000,
      });
      socket.on('notification:new', refresh);
      // missed while disconnected: read once on the way back
      socket.io.on('reconnect', () => void qc.invalidateQueries({ queryKey: qk.me.navSummary() }));
    };

    void sync();
    const off = tokens.subscribe(() => void sync());
    return () => {
      closed = true;
      off();
      socket?.disconnect();
      socket = null;
    };
  }, [qc]);
}

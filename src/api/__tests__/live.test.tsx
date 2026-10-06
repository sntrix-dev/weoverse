import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LIVE_NAMESPACE, useLiveNotifications } from '@/api/live';
import { qk } from '@/api/queryKeys';
import { tokens } from '@/api/tokens';
import { env } from '@/lib/env';

type Handler = (...args: unknown[]) => void;

const fake = vi.hoisted(() => {
  const handlers = new Map<string, (...args: unknown[]) => void>();
  const socket = {
    connected: false,
    active: true,
    on: vi.fn((ev: string, fn: (...args: unknown[]) => void) => handlers.set(ev, fn)),
    connect: vi.fn(),
    disconnect: vi.fn(),
    io: { on: vi.fn() },
  };
  return { handlers, socket, io: vi.fn(() => socket) };
});

vi.mock('socket.io-client', () => ({ io: fake.io }));

function setup() {
  const qc = new QueryClient();
  const spy = vi.spyOn(qc, 'invalidateQueries');
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  const view = renderHook(() => useLiveNotifications(), { wrapper });
  return { spy, view };
}

afterEach(() => {
  tokens.clear();
  vi.clearAllMocks();
  fake.handlers.clear();
  fake.socket.active = true;
});

describe('the live bell (G-71)', () => {
  it('opens /authenticated with the current access token and refreshes the bell on a new notification', async () => {
    tokens.set('access-1');
    const { spy } = setup();
    await waitFor(() => expect(fake.io).toHaveBeenCalledTimes(1));
    const [uri, opts] = fake.io.mock.calls[0] as unknown as [
      string,
      { auth: (cb: (a: object) => void) => void },
    ];
    expect(uri).toBe(`${env.apiUrl}${LIVE_NAMESPACE}`);

    // the handshake reads the token each time it connects
    tokens.set('access-2');
    const auth = vi.fn();
    opts.auth(auth);
    expect(auth).toHaveBeenCalledWith({ token: 'access-2' });

    act(() =>
      (fake.handlers.get('notification:new') as Handler)({
        _id: 'n-1',
        title: 'Hi',
        category: 'system',
        type: 'info',
        createdAt: '2026-10-07T00:00:00Z',
      }),
    );
    expect(spy).toHaveBeenCalledWith({ queryKey: qk.me.navSummary() });
    expect(spy).toHaveBeenCalledWith({ queryKey: qk.notifications.all });
  });

  it('stays closed without a token, closes on sign-out, reopens on a new token', async () => {
    const { view } = setup();
    await Promise.resolve();
    expect(fake.io).not.toHaveBeenCalled();

    act(() => tokens.set('access-1'));
    await waitFor(() => expect(fake.io).toHaveBeenCalledTimes(1));

    act(() => tokens.clear());
    expect(fake.socket.disconnect).toHaveBeenCalled();

    fake.socket.active = false;
    act(() => tokens.set('access-3'));
    expect(fake.socket.connect).toHaveBeenCalled();
    expect(fake.io).toHaveBeenCalledTimes(1);

    view.unmount();
    expect(fake.socket.disconnect).toHaveBeenCalledTimes(2);
  });
});

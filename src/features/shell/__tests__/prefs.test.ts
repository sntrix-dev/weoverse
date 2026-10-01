import { http } from 'msw';
import { DEFAULT_PREFS, usePrefs } from '@/stores/prefs';
import { fail, ok, url } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';

const until = async (fn: () => boolean, ms = 2000) => {
  const t0 = Date.now();
  while (!fn()) {
    if (Date.now() - t0 > ms) throw new Error('timed out');
    await new Promise((r) => setTimeout(r, 20));
  }
};

describe('prefs store', () => {
  it('applies changes at once and batches them into one PATCH', async () => {
    const bodies: unknown[] = [];
    server.use(
      http.patch(url('/frontend/users/me/preferences'), async ({ request }) => {
        const body = (await request.json()) as object;
        bodies.push(body);
        return ok({ ...DEFAULT_PREFS, ...body });
      }),
    );
    usePrefs.getState().set({ theme: 'dark' });
    usePrefs.getState().set({ navMode: 'split' });
    expect(usePrefs.getState().prefs.theme).toBe('dark');
    expect(JSON.parse(localStorage.getItem('weo.prefs') ?? '{}').theme).toBe('dark');
    await until(() => bodies.length === 1);
    expect(bodies[0]).toEqual({ theme: 'dark', navMode: 'split' });
    await until(() => usePrefs.getState().server?.theme === 'dark');
  });

  it('rolls back to the saved set and reports when a save fails', async () => {
    const onSaveError = vi.fn();
    usePrefs.setState({ onSaveError });
    usePrefs.getState().hydrate({ ...DEFAULT_PREFS, theme: 'light' });
    server.use(http.patch(url('/frontend/users/me/preferences'), () => fail(500, 'boom')));
    usePrefs.getState().set({ theme: 'dark' });
    await until(() => onSaveError.mock.calls.length === 1);
    expect(usePrefs.getState().prefs.theme).toBe('light');
  });

  it('hydrates from the server without clobbering a pending change', () => {
    usePrefs.getState().set({ railOpen: false });
    usePrefs.getState().hydrate({ ...DEFAULT_PREFS, theme: 'dark', railOpen: true });
    const p = usePrefs.getState().prefs;
    expect(p.theme).toBe('dark');
    expect(p.railOpen).toBe(false);
  });

  it('fills keys an older server payload lacks', () => {
    const partial = { theme: 'dark' } as unknown as typeof DEFAULT_PREFS;
    usePrefs.getState().hydrate(partial);
    expect(usePrefs.getState().prefs.home).toBe('hub');
  });
});

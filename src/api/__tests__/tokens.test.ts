import { afterEach, describe, expect, it, vi } from 'vitest';

/** `tokens` reads the dev token once, when the module loads — so each case loads it fresh. */
async function loadTokens(devAccessToken: string) {
  vi.resetModules();
  vi.doMock('@/lib/env', async (orig) => {
    const real = (await orig()) as { env: Record<string, unknown> };
    return { env: { ...real.env, devAccessToken } };
  });
  return (await import('../tokens')).tokens;
}

afterEach(() => {
  vi.doUnmock('@/lib/env');
  vi.resetModules();
});

describe('dev token', () => {
  it('seeds the access token when nobody is signed in', async () => {
    const tokens = await loadTokens('dev-token');
    expect(tokens.getAccess()).toBe('dev-token');
  });

  it('yields to a stored real session, so a reload keeps the person who signed in', async () => {
    localStorage.setItem('weo.auth.refresh', 'real-refresh');
    const tokens = await loadTokens('dev-token');
    expect(tokens.getAccess()).toBeNull();
    expect(tokens.hasSession()).toBe(true);
  });
});

describe('across tabs', () => {
  it('signing out in another tab ends this tab’s session too', async () => {
    const { tokens } = await import('../tokens');
    tokens.set('acc', 'ref');
    const seen = vi.fn();
    const off = tokens.subscribe(seen);
    localStorage.removeItem('weo.auth.refresh');
    window.dispatchEvent(
      new StorageEvent('storage', { key: 'weo.auth.refresh', oldValue: 'ref', newValue: null }),
    );
    expect(tokens.getAccess()).toBeNull();
    expect(tokens.hasSession()).toBe(false);
    expect(seen).toHaveBeenCalled();
    off();
  });

  it('a token rotated in another tab leaves this tab signed in', async () => {
    const { tokens } = await import('../tokens');
    tokens.set('acc', 'ref');
    localStorage.setItem('weo.auth.refresh', 'ref-2');
    window.dispatchEvent(
      new StorageEvent('storage', { key: 'weo.auth.refresh', oldValue: 'ref', newValue: 'ref-2' }),
    );
    expect(tokens.getAccess()).toBe('acc');
    tokens.clear();
  });
});

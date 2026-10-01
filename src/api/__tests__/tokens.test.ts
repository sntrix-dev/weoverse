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

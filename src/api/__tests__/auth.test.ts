import { http } from 'msw';
import { fail, ok, url } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { buildAuthorizeUrl, CallbackError, codeChallenge, completeLogin, logout } from '../auth';
import { tokens } from '../tokens';

afterEach(() => tokens.clear());

describe('PKCE', () => {
  it('derives the S256 challenge as base64url(SHA-256(verifier)) with no padding', async () => {
    // expected value computed independently with Node: createHash('sha256').update(v).digest('base64url')
    const verifier = 'dBjftJeZ4CVP-mJ92ZvqH6zUT0xq6qqcBbZpSwh8wz4';
    await expect(codeChallenge(verifier)).resolves.toBe('R3C62GeKSCIF_DA4DQhEKIQB7izq9dIExeO_xeJJEpQ');
  });

  it('builds the authorize URL and remembers verifier, state and return path', async () => {
    const href = await buildAuthorizeUrl('/discover');
    const u = new URL(href);
    expect(u.searchParams.get('response_type')).toBe('code');
    expect(u.searchParams.get('code_challenge_method')).toBe('S256');
    expect(u.searchParams.get('scope')).toBe('profile');
    expect(u.searchParams.get('redirect_uri')).toMatch(/\/callback$/);
    expect(u.pathname).toBe('/api/oauth/authorize');
    expect(u.searchParams.get('state')).toBe(sessionStorage.getItem('weo.auth.pkce.state'));
    expect(u.searchParams.get('state')?.length).toBeGreaterThanOrEqual(32);
    const verifier = sessionStorage.getItem('weo.auth.pkce.verifier');
    expect(verifier).toBeTruthy();
    await expect(codeChallenge(verifier ?? '')).resolves.toBe(u.searchParams.get('code_challenge'));
    expect(sessionStorage.getItem('weo.auth.return')).toBe('/discover');
  });
});

describe('completeLogin', () => {
  it('rejects a state mismatch without calling the backend', async () => {
    await buildAuthorizeUrl('/');
    await expect(completeLogin('?code=abc&state=forged')).rejects.toBeInstanceOf(CallbackError);
  });

  it('surfaces an IdP error', async () => {
    await expect(completeLogin('?error=access_denied&error_description=User+said+no')).rejects.toThrow(
      'User said no',
    );
  });

  it('exchanges the code and stores first-party tokens', async () => {
    const href = await buildAuthorizeUrl('/wallet');
    const state = new URL(href).searchParams.get('state');
    let sent: Record<string, string> = {};
    server.use(
      http.post(url('/frontend/auth/verify'), async ({ request }) => {
        sent = (await request.json()) as Record<string, string>;
        return ok({ accessToken: 'acc', refreshToken: 'ref', user: { _id: 'u1', fullName: 'Mira' } });
      }),
    );
    const res = await completeLogin(`?code=the-code&state=${state}`);
    expect(res.returnTo).toBe('/wallet');
    expect(sent.code).toBe('the-code');
    expect(sent.codeVerifier).toBeTruthy();
    expect(sent.redirectUri).toMatch(/\/callback$/);
    expect(tokens.getAccess()).toBe('acc');
    expect(tokens.getRefresh()).toBe('ref');
    // one-shot: the verifier is gone
    expect(sessionStorage.getItem('weo.auth.pkce.verifier')).toBeNull();
  });
});

describe('logout', () => {
  it('revokes the refresh session and clears tokens even if the call fails', async () => {
    tokens.set('acc', 'ref');
    server.use(http.post(url('/frontend/auth/logout'), () => fail(500, 'boom')));
    await expect(logout()).rejects.toBeTruthy();
    expect(tokens.hasSession()).toBe(false);
  });
});

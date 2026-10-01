import { env } from '@/lib/env';
import { api } from './client';
import type { components } from './generated/schema';
import { tokens } from './tokens';

/**
 * OAuth2 authorization code + PKCE against the O-Wallet IdP (AUTH_SERVER).
 * The browser only ever holds the code verifier; the backend exchanges the code
 * with the client secret (`POST /frontend/auth/verify`) and returns first-party tokens.
 */
const VERIFIER_KEY = 'weo.auth.pkce.verifier';
const STATE_KEY = 'weo.auth.pkce.state';
const RETURN_KEY = 'weo.auth.return';

const base64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

export const randomString = (byteLength = 48) =>
  base64url(crypto.getRandomValues(new Uint8Array(byteLength)));

export async function codeChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64url(new Uint8Array(digest));
}

/** Full authorize URL; persists verifier + state for the callback. */
export async function buildAuthorizeUrl(returnTo = '/'): Promise<string> {
  if (!env.walletUrl || !env.clientId)
    throw new Error('OAuth is not configured (VITE_WALLET_URL / VITE_OAUTH_CLIENT_ID)');
  const verifier = randomString();
  // O-Wallet rejects a state shorter than 32 characters; 32 bytes → 43 base64url chars
  const state = randomString(32);
  sessionStorage.setItem(VERIFIER_KEY, verifier);
  sessionStorage.setItem(STATE_KEY, state);
  sessionStorage.setItem(RETURN_KEY, returnTo);
  const url = new URL(`${env.walletUrl}${env.authorizePath}`);
  url.search = new URLSearchParams({
    response_type: 'code',
    client_id: env.clientId,
    redirect_uri: env.redirectUri,
    scope: env.scope,
    state,
    code_challenge: await codeChallenge(verifier),
    code_challenge_method: 'S256',
  }).toString();
  return url.toString();
}

/** `POST /frontend/auth/verify` data — generated from the backend Swagger (npm run api:types). */
export type VerifyResponse = components['schemas']['AuthVerifyData'];
/** `POST /frontend/auth/new_access_token` data. */
export type RefreshResponse = components['schemas']['NewAccessTokenData'];

export class CallbackError extends Error {}

/** Handles `/callback?code&state`: validates state, exchanges the code, stores tokens. */
export async function completeLogin(
  search: string,
): Promise<{ returnTo: string; user: VerifyResponse['user'] }> {
  const params = new URLSearchParams(search);
  const error = params.get('error');
  if (error) throw new CallbackError(params.get('error_description') || error);
  const code = params.get('code');
  const state = params.get('state');
  const expected = sessionStorage.getItem(STATE_KEY);
  const verifier = sessionStorage.getItem(VERIFIER_KEY);
  const returnTo = sessionStorage.getItem(RETURN_KEY) || '/';
  sessionStorage.removeItem(STATE_KEY);
  sessionStorage.removeItem(VERIFIER_KEY);
  sessionStorage.removeItem(RETURN_KEY);
  if (!code) throw new CallbackError('The sign-in response had no code.');
  if (!verifier || !expected || state !== expected)
    throw new CallbackError('This sign-in link has expired. Start again.');

  const data = await api.post<VerifyResponse>(
    '/frontend/auth/verify',
    { code, codeVerifier: verifier, redirectUri: env.redirectUri },
    { auth: false },
  );
  tokens.set(data.accessToken, data.refreshToken);
  return { returnTo, user: data.user };
}

export async function logout(): Promise<void> {
  const refresh = tokens.getRefresh();
  try {
    if (refresh) await api.post('/frontend/auth/logout', { refresh_token: refresh }, { auth: false });
  } finally {
    tokens.clear();
  }
}

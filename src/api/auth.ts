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
/** which O-Wallet flow started the round trip: `owallet` (authorize) or `google` (social) */
const FLOW_KEY = 'weo.auth.flow';

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
  sessionStorage.setItem(FLOW_KEY, 'owallet');
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

/**
 * Google, through the O-Wallet (from the previous WeO build): a full-page redirect into the
 * wallet's own social endpoint. Google returns to the wallet, the wallet returns to our
 * `client_redirect_uri` (/callback) with a code for the same PKCE exchange. The wallet takes
 * no `state` on this route, so the callback accepts a missing one only for this flow.
 */
export async function buildGoogleSignInUrl(returnTo = '/'): Promise<string> {
  if (!env.walletUrl || !env.clientId)
    throw new Error('OAuth is not configured (VITE_WALLET_URL / VITE_OAUTH_CLIENT_ID)');
  const verifier = randomString();
  sessionStorage.setItem(VERIFIER_KEY, verifier);
  sessionStorage.removeItem(STATE_KEY);
  sessionStorage.setItem(RETURN_KEY, returnTo);
  sessionStorage.setItem(FLOW_KEY, 'google');
  const url = new URL(`${env.walletUrl}/api/auth/social/google`);
  url.search = new URLSearchParams({
    client_id: env.clientId,
    redirect_uri: `${env.walletUrl}/api/auth/social/google/callback`,
    response_type: 'code',
    scope: 'user',
    client_redirect_uri: env.redirectUri,
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
  const flow = sessionStorage.getItem(FLOW_KEY);
  sessionStorage.removeItem(STATE_KEY);
  sessionStorage.removeItem(VERIFIER_KEY);
  sessionStorage.removeItem(RETURN_KEY);
  sessionStorage.removeItem(FLOW_KEY);
  if (!code) throw new CallbackError('The sign-in response had no code.');
  // the authorize flow must echo our state; the Google flow sends none (and must not invent one)
  const stateOk = flow === 'google' ? !state : !!expected && state === expected;
  if (!verifier || !stateOk) throw new CallbackError('This sign-in link has expired. Start again.');

  const data = await api.post<VerifyResponse>(
    '/frontend/auth/verify',
    { code, codeVerifier: verifier, redirectUri: env.redirectUri },
    { auth: false },
  );
  tokens.set(data.accessToken, data.refreshToken);
  return { returnTo, user: data.user };
}

/**
 * End the O-Wallet's own session too (from the previous WeO build). Identity lives in two
 * places — our tokens and a session cookie on the wallet's origin; clearing only ours leaves
 * the person signed in there, and "Continue with O-Wallet" would walk them straight back in.
 * Another origin can only clear its cookies from a window of its own, so the wallet's logout
 * opens in a tiny popup that closes itself once it is back on our origin, when the person
 * closes it, or after a second. Call it synchronously from the click, before any await, or
 * the popup blocker stops it. A blocked popup is not a reason to stay signed in here.
 */
export function endWalletSession(): void {
  if (!env.walletUrl) return;
  const target = `${env.walletUrl}/api/oauth/logout?redirect_uri=${encodeURIComponent(window.location.origin)}`;
  let popup: Window | null = null;
  try {
    popup = window.open(target, 'weo-owallet-logout', 'width=1,height=1,left=0,top=0');
  } catch {
    popup = null;
  }
  if (!popup) return;
  const close = () => {
    window.clearInterval(timer);
    window.clearTimeout(cap);
    try {
      if (!popup?.closed) popup?.close();
    } catch {
      /* cross-origin at the moment of closing — it closes itself */
    }
  };
  const timer = window.setInterval(() => {
    try {
      // reading location throws while the popup is still on the wallet's origin
      if (popup?.closed || popup?.location.origin === window.location.origin) close();
    } catch {
      /* still on the wallet */
    }
  }, 100);
  const cap = window.setTimeout(close, 1000);
}

export async function logout(): Promise<void> {
  const refresh = tokens.getRefresh();
  try {
    if (refresh) await api.post('/frontend/auth/logout', { refresh_token: refresh }, { auth: false });
  } finally {
    tokens.clear();
  }
}

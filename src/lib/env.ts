/** Typed, validated access to the Vite env. Values live in .env.local (never committed). */
const trimSlash = (s: string) => s.replace(/\/+$/, '');

export const env = {
  apiUrl: trimSlash(import.meta.env.VITE_API_URL || 'http://localhost:3002'),
  walletUrl: trimSlash(import.meta.env.VITE_WALLET_URL || ''),
  // O-Wallet serves its authorize endpoint under /api (it redirects to /api/oauth/login)
  authorizePath: import.meta.env.VITE_OAUTH_AUTHORIZE_PATH || '/api/oauth/authorize',
  clientId: import.meta.env.VITE_OAUTH_CLIENT_ID || '',
  redirectUri: import.meta.env.VITE_OAUTH_REDIRECT_URI || `${window.location.origin}/callback`,
  scope: import.meta.env.VITE_OAUTH_SCOPE || 'profile',
  /** dev-only token (weo-3.0 `npm run dev:token`); ignored in production builds */
  devAccessToken: import.meta.env.DEV ? import.meta.env.VITE_DEV_ACCESS_TOKEN || '' : '',
  isDev: import.meta.env.DEV,
} as const;

/** Backend API root, e.g. http://localhost:3002/api */
export const apiRoot = `${env.apiUrl}/api`;

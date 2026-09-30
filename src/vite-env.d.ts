/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_WALLET_URL: string;
  readonly VITE_OAUTH_AUTHORIZE_PATH?: string;
  readonly VITE_OAUTH_CLIENT_ID: string;
  readonly VITE_OAUTH_REDIRECT_URI: string;
  readonly VITE_OAUTH_SCOPE?: string;
  readonly VITE_ENV?: 'DEV' | 'PROD';
  readonly VITE_DEV_ACCESS_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  /** design: touch-simulation flag the prototype sets on phones; the DS O portal reads it */
  __weoTouch?: boolean;
}

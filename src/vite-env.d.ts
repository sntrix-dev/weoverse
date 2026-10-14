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
  /** direct browser uploads (D-100) — public in the build: an IAM user limited to PutObject */
  readonly VITE_S3_BUCKET_NAME?: string;
  readonly VITE_AWS_REGION?: string;
  /** the previous build's name for the region */
  readonly VITE_AWS_S3_REGION?: string;
  readonly VITE_AWS_ACCESS_KEY_ID?: string;
  readonly VITE_AWS_SECRET_ACCESS_KEY?: string;
  /** optional CDN / custom domain in front of the bucket */
  readonly VITE_S3_PUBLIC_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  /** design: touch-simulation flag the prototype sets on phones; the DS O portal reads it */
  __weoTouch?: boolean;
}

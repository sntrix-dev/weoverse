/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: { port: 5173, strictPort: true },
  preview: { port: 5173, strictPort: true },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: { modules: { classNameStrategy: 'non-scoped' } },
    include: ['src/**/*.test.{ts,tsx}'],
    env: {
      VITE_API_URL: 'http://api.test',
      VITE_WALLET_URL: 'https://wallet.test',
      VITE_OAUTH_CLIENT_ID: 'test-client',
      VITE_OAUTH_REDIRECT_URI: 'http://localhost:5173/callback',
      VITE_DEV_ACCESS_TOKEN: '',
    },
  },
});

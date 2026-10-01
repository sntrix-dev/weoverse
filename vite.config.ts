/// <reference types="vitest/config" />
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

/**
 * Dev only: serves the read-only design prototype at http://localhost:5173/design/
 * (index.html → create.html, discover.html, …) so parity checks compare the design and
 * the app from one origin. Folder: DESIGN_DIR or the sibling `redesign/project/WeOverse v3 - HTML`.
 */
const DESIGN_DIR = resolve(
  process.env.DESIGN_DIR ?? fileURLToPath(new URL('../redesign/project/WeOverse v3 - HTML', import.meta.url)),
);
const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.gif': 'image/gif',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
};

function designReference(): Plugin {
  return {
    name: 'weo-design-reference',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/design', (req, res, next) => {
        const path = decodeURIComponent((req.url ?? '/').split('?')[0] ?? '/');
        const file = normalize(join(DESIGN_DIR, path === '/' ? 'index.html' : path));
        if (!file.startsWith(DESIGN_DIR) || !existsSync(file) || !statSync(file).isFile()) return next();
        res.setHeader('Content-Type', MIME[extname(file)] ?? 'application/octet-stream');
        createReadStream(file).pipe(res);
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), designReference()],
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

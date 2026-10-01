import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { resetMya } from '@/stores/mya';
import { usePrefs } from '@/stores/prefs';
import { resetUi } from '@/stores/ui';
import { server } from './msw/server';

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => {
  server.resetHandlers();
  cleanup();
  usePrefs.getState().reset();
  resetUi();
  resetMya();
  window.localStorage.clear();
  window.sessionStorage.clear();
});
afterAll(() => server.close());

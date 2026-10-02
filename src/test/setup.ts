import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { closeFlow } from '@/stores/flow';
import { resetMya } from '@/stores/mya';
import { usePrefs } from '@/stores/prefs';
import { resetUi } from '@/stores/ui';
import { server } from './msw/server';

// section pages load lazily (their own chunks): give the first find on a cold module room
configure({ asyncUtilTimeout: 4000 });

// jsdom has no scrolling or windows: stub them so tests stay quiet (a test that cares spies on them)
window.scrollTo = (() => {}) as typeof window.scrollTo;
window.open = (() => null) as typeof window.open;
// …and no media playback: the Create O plays and pauses its clips (jsdom logs "not implemented")
HTMLMediaElement.prototype.pause = () => {};
HTMLMediaElement.prototype.play = () => Promise.resolve();

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => {
  server.resetHandlers();
  cleanup();
  usePrefs.getState().reset();
  resetUi();
  resetMya();
  closeFlow();
  window.localStorage.clear();
  window.sessionStorage.clear();
});
afterAll(() => server.close());

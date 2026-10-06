import { create } from 'zustand';
import { setPrefs, usePrefs } from './prefs';

/**
 * Section intros and the walkthrough (design v3-spine.jsx `v3Seen` / `walkStore`), remembered on
 * the account — `uiPreferences.seen` (D-088): `intro.<section>` once the curtain is passed,
 * `walk.<section>` once its tour ends. The design kept these in page memory; here they follow
 * the person to every device.
 */
interface IntroState {
  /** a curtain asked for by hand (the hero's mark, the flow bar's ?) — shown with a close */
  recall: string | null;
  /** bumps when a walkthrough should be considered again */
  walkKick: number;
}
export const useIntro = create<IntroState>(() => ({ recall: null, walkKick: 0 }));

const SEEN_MAX = 64;

export const seenKey = (kind: 'intro' | 'walk', section: string) => `${kind}.${section}`;

/** Whether the server's preferences are in — before that nothing is shown, so a returning person never sees a flash. */
export const prefsReady = () => usePrefs.getState().server != null;

export function markSeen(key: string) {
  const seen = usePrefs.getState().prefs.seen ?? [];
  if (seen.includes(key)) return;
  setPrefs({ seen: [...seen, key].slice(-SEEN_MAX) });
}

function unsee(keys: string[]) {
  const seen = usePrefs.getState().prefs.seen ?? [];
  const next = seen.filter((k) => !keys.includes(k));
  if (next.length !== seen.length) setPrefs({ seen: next });
}

/** design `wv3:intro` — bring a section's intro back; its walkthrough follows when it closes. */
export function replayIntro(section: string) {
  unsee([seenKey('walk', section)]);
  useIntro.setState((s) => ({ recall: section, walkKick: s.walkKick + 1 }));
}
export const endRecall = () => useIntro.setState({ recall: null });

/** design flow bar "?" on a screen without an intro: replay its walkthrough. */
export function replayWalk(section: string) {
  unsee([seenKey('walk', section)]);
  useIntro.setState((s) => ({ walkKick: s.walkKick + 1 }));
}

/** Settings → Your data → "Reset the guided tours": every intro and walkthrough comes back. */
export function resetTours() {
  setPrefs({ seen: [] });
  useIntro.setState((s) => ({ walkKick: s.walkKick + 1 }));
}

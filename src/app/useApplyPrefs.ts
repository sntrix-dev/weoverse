import { useEffect } from 'react';
import { usePref } from '@/stores/prefs';

/**
 * design: app.jsx effects — `data-theme`, `data-motion`, `data-nav` on <html> (+ the view
 * preferences' `data-weo-density|media|motion|value`), and
 * `--shell-left` (the split nav's gutter: 270px open, 86px icons, 0 in bar mode).
 */
export function useApplyPrefs() {
  const theme = usePref('theme');
  const motion = usePref('motion');
  const navMode = usePref('navMode');
  const density = usePref('density');
  const media = usePref('media');
  const value = usePref('valueDisplay');
  const railOpen = usePref('railOpen');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  useEffect(() => {
    document.documentElement.setAttribute('data-motion', motion);
  }, [motion]);
  // design: view-prefs.jsx applyPrefs — the page's CSS answers these without a re-render
  useEffect(() => {
    const d = document.documentElement.dataset;
    d.weoDensity = density;
    d.weoMedia = media;
    d.weoMotion = motion;
    d.weoValue = value;
  }, [density, media, motion, value]);
  useEffect(() => {
    const de = document.documentElement;
    de.setAttribute('data-nav', navMode);
    de.style.setProperty('--shell-left', navMode === 'split' ? (railOpen ? '270px' : '86px') : '0px');
  }, [navMode, railOpen]);
}

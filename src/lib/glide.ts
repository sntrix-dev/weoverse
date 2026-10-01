/**
 * design: screens-hub.jsx wvGlide — native smooth scrolling is a no-op in some hosts, so the
 * design tweens it itself (380 ms ease-out cubic), and lands it anyway if frames never come.
 */
export function glide(target: Window | HTMLElement, to: number, axis: 'x' | 'y' = 'y') {
  const win = target === window || target === document.documentElement;
  const el = target as HTMLElement;
  const get = () => (win ? window.scrollY || 0 : axis === 'x' ? el.scrollLeft : el.scrollTop);
  const set = (v: number) => {
    if (win) window.scrollTo(0, v);
    else if (axis === 'x') el.scrollLeft = v;
    else el.scrollTop = v;
  };
  const from = get();
  const max = win
    ? Math.max(0, document.body.scrollHeight - window.innerHeight)
    : axis === 'x'
      ? el.scrollWidth - el.clientWidth
      : el.scrollHeight - el.clientHeight;
  const end = Math.max(0, Math.min(max, to));
  if (Math.abs(end - from) < 2) {
    set(end);
    return;
  }
  const t0 = performance.now();
  const dur = 380;
  const step = () => {
    const p = Math.min(1, (performance.now() - t0) / dur);
    const e = 1 - Math.pow(1 - p, 3);
    set(from + (end - from) * e);
    if (p < 1) requestAnimationFrame(step);
  };
  set(from + (end - from) * 0.001);
  requestAnimationFrame(step);
  setTimeout(() => {
    if (Math.abs(get() - end) > 4) set(end);
  }, dur + 260);
}

/** design: section-hero.jsx glideToId — bring a section to the reading line under the top bar */
export function glideToId(id: string | undefined) {
  if (!id) return;
  const el = document.getElementById(id);
  if (el) glide(window, el.getBoundingClientRect().top + window.scrollY - 96);
}

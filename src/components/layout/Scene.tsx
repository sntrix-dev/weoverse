import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react';
import { usePref } from '@/stores/prefs';

/** design: screens-hub.jsx SCENE_TICK — one shared frame loop for every Scene on the page. */
const SCENE_TICK = (() => {
  const subs = new Set<() => void>();
  let raf = 0;
  let n = 0;
  const run = () => {
    n++;
    if (n % 2 === 0)
      subs.forEach((f) => {
        try {
          f();
        } catch {
          /* one scene never stops the others */
        }
      });
    raf = requestAnimationFrame(run);
  };
  return {
    add(f: () => void) {
      subs.add(f);
      if (!raf) raf = requestAnimationFrame(run);
    },
    del(f: () => void) {
      subs.delete(f);
      if (!subs.size && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    },
  };
})();

/**
 * design: screens-hub.jsx useDepth — one per-frame reader for how deep a section sits (tilt)
 * and how far it has arrived (focus). Born fully lit: only a live frame loop can dim a section.
 */
export function useDepth(ref: RefObject<HTMLElement | null>, enabled: boolean) {
  const [st, setSt] = useState({ d: 0, rv: 1 });
  useEffect(() => {
    let lastD = 0;
    let rv = 1;
    let reached = false;
    const calc = () => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 800;
      if (r.top < vh * 0.9 || el.hasAttribute('data-lead')) reached = true;
      const arrive = reached ? 1 : Math.max(0, Math.min(1, (vh * 1.5 - r.top) / (vh * 0.6)));
      const p = enabled ? (r.top + r.height / 2 - vh / 2) / vh : 0;
      const c = Math.max(-1.2, Math.min(1.2, p));
      if (Math.abs(arrive - rv) > 0.01 || Math.abs(c - lastD) > 0.004) {
        rv = arrive;
        lastD = c;
        setSt({ d: c, rv });
      }
    };
    calc();
    SCENE_TICK.add(calc);
    return () => SCENE_TICK.del(calc);
  }, [enabled, ref]);
  return st;
}

/**
 * design: screens-hub.jsx Scene — sections soften as the scroll carries you past them.
 * Opacity and a few pixels of drift only; the frame's shape never changes with scroll.
 * Motion "calm" (view preference) turns the drift off.
 */
export function Scene({
  children,
  style,
  depth,
  id,
  dark,
  lead,
}: {
  children?: ReactNode;
  style?: CSSProperties;
  depth?: number;
  id?: string;
  dark?: boolean;
  lead?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const on = usePref('motion') !== 'calm';
  const { d, rv } = useDepth(ref, on);
  const a = Math.max(-1, Math.min(1, d)) * (depth ?? 1);
  const focus = lead ? 1 : 0.72 + 0.28 * rv;
  const m: CSSProperties = {
    opacity: (on ? 1 - Math.min(0.3, Math.abs(a) * 0.38) : 1) * focus,
    willChange: 'opacity',
  };
  if (on) m.transform = `translateY(${(a * 6).toFixed(2)}px)`;
  return (
    <section
      ref={ref}
      id={id}
      data-theme={dark ? 'dark' : undefined}
      style={{ transition: 'opacity .45s var(--ease-settle)', ...style, ...m }}
    >
      {children}
    </section>
  );
}

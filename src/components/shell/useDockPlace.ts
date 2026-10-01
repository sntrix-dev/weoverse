import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react';

export interface DockPos {
  r: number;
  b: number;
}

/**
 * design: chrome.jsx useDockPlace — the dock floats where you drop it (distance from the
 * bottom-right corner), clamped to the viewport and out of the split nav's gutter. The
 * caller persists the final position (`uiPreferences.dockPosition`).
 */
export function useDockPlace(
  ref: RefObject<HTMLElement | null>,
  watch: string,
  saved: DockPos,
  onSave: (p: DockPos) => void,
) {
  const [pos, setPos] = useState<DockPos>(saved);
  const drag = useRef<{ moved: boolean } | null>(null);
  const savedKey = `${saved.r}:${saved.b}`;
  const [lastSaved, setLastSaved] = useState(savedKey);
  if (lastSaved !== savedKey) {
    // hydrated from the server after mount
    setLastSaved(savedKey);
    setPos(saved);
  }

  const clamp = useCallback(
    (p: DockPos): DockPos => {
      const el = ref.current;
      const w = el ? el.offsetWidth : 74;
      const h = el ? el.offsetHeight : 74;
      const de = document.documentElement;
      const vw = de.clientWidth;
      const vh = de.clientHeight;
      /* the split shell owns a left gutter — Mya may not park inside the nav's own column */
      const gutter = parseFloat(getComputedStyle(de).getPropertyValue('--shell-left')) || 0;
      return {
        r: Math.max(8, Math.min(Math.max(8, vw - w - gutter - 8), p.r)),
        b: Math.max(8, Math.min(Math.max(8, vh - h - 8), p.b)),
      };
    },
    [ref],
  );
  const clampRef = useRef(clamp);
  useEffect(() => {
    clampRef.current = clamp;
  }, [clamp]);

  const onDown = (e: ReactPointerEvent) => {
    if (e.button !== 0) return;
    const start = { x: e.clientX, y: e.clientY, r: pos.r, b: pos.b, moved: false };
    drag.current = start;
    let last = pos;
    const mv = (ev: PointerEvent) => {
      const dx = start.x - ev.clientX;
      const dy = start.y - ev.clientY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) start.moved = true;
      last = clampRef.current({ r: start.r + dx, b: start.b + dy });
      setPos(last);
    };
    const up = () => {
      window.removeEventListener('pointermove', mv);
      window.removeEventListener('pointerup', up);
      if (start.moved) onSave({ r: Math.round(last.r), b: Math.round(last.b) });
    };
    window.addEventListener('pointermove', mv);
    window.addEventListener('pointerup', up);
  };

  useEffect(() => {
    const fit = () =>
      setPos((p) => {
        const n = clamp(p);
        return n.r === p.r && n.b === p.b ? p : n;
      });
    fit();
    const raf = requestAnimationFrame(fit);
    const late = setTimeout(fit, 120);
    window.addEventListener('resize', fit);
    let ro: ResizeObserver | null = null;
    if (ref.current && typeof ResizeObserver === 'function') {
      ro = new ResizeObserver(fit);
      ro.observe(ref.current);
    }
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(late);
      window.removeEventListener('resize', fit);
      ro?.disconnect();
    };
  }, [clamp, watch, ref]);

  return { pos, onDown, moved: () => !!drag.current?.moved };
}

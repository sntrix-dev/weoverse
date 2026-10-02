// design: src/data/data.js relTime — same buckets and copy.

/** "just now", "5m ago", "3h ago", "2d ago", "4mo ago", "1y ago". */
export function relTime(iso: string | Date, now: number = Date.now()): string {
  const ms = now - new Date(iso).getTime();
  const m = Math.floor(ms / 6e4);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  return mo < 12 ? `${mo}mo ago` : `${Math.floor(mo / 12)}y ago`;
}

/** design `h.since` / `l.since`: an age in the shortest unit — "now", "5h", "3d", "5w", "2mo", "1y". */
export function age(iso: string | Date, now: number = Date.now()): string {
  const h = Math.floor((now - new Date(iso).getTime()) / 36e5);
  if (h < 1) return 'now';
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 14) return `${d}d`;
  if (d < 60) return `${Math.floor(d / 7)}w`;
  const mo = Math.floor(d / 30);
  return mo < 12 ? `${mo}mo` : `${Math.floor(mo / 12)}y`;
}

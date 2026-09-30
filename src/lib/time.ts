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

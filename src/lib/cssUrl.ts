/**
 * A user-supplied image address as a CSS `url()` (M12, XSS review): quotes, backslashes and line
 * breaks are encoded so the value cannot close the `url()` and write more of the style; only
 * http(s), data:image, blob and scheme-less (same-site) addresses load — anything else is `none`.
 */
export function cssUrl(u: string | null | undefined): string {
  const s = String(u ?? '').trim();
  if (!s) return 'none';
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(s)?.[1]?.toLowerCase();
  if (scheme && !['http', 'https', 'blob'].includes(scheme) && !/^data:image\//i.test(s)) return 'none';
  const safe = s.replace(/[\r\n\f]/g, '').replace(/["\\]/g, (c) => (c === '"' ? '%22' : '%5C'));
  return `url("${safe}")`;
}

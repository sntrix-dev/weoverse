// design: src/data/data.js helpers (compact, osFmt, oStr) — pure formatting, no data.

/** 1234 → "1.2k", 1000 → "1k", 2_500_000 → "2.5m". */
export const compact = (n: number | null | undefined): string =>
  n == null
    ? '0'
    : n < 1000
      ? `${n}`
      : n < 1e6
        ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`
        : `${(n / 1e6).toFixed(1)}m`;

/** Os with thousands separators: 12480 → "12,480". */
export const osFmt = (n: number): string => n.toLocaleString('en-US');

/** "O 12,480" — the design's text form when the O mark can't be drawn. */
export const oStr = (n: number): string => `O ${osFmt(n)}`;

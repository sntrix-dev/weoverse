import type { CSSProperties } from 'react';

/** The five section tones every DS component understands. Any CSS colour is also accepted. */
export type Tone = 'blue' | 'violet' | 'green' | 'gold' | 'danger';
export type ToneInput = Tone | (string & {});

/** A style object that may also carry CSS custom properties (`--tx`, `--tone` …). */
export type StyleVars = CSSProperties & Record<`--${string}`, string | number | undefined>;

/** Index a lookup table by an open string key without widening the table to `any`. */
export function pick<T>(table: Record<string, T>, key: string | undefined, fallback: T): T {
  return (
    (key !== undefined && Object.prototype.hasOwnProperty.call(table, key) ? table[key] : undefined) ??
    fallback
  );
}

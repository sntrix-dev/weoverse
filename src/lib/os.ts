/**
 * O ↔ fiat conversion. The design disagrees with itself (weo-model.js uses ×99, the DS
 * and wv-data say 100 Os = $1); the backend OConfig is the source of truth (D-005).
 * Until M03 wires the live rate, the DS peg (100 Os = $1, rate 0.01) is the default and
 * every screen goes through these two helpers — never an inline multiplier.
 */
export const DEFAULT_USD_PER_O = 0.01;

export const osToUsd = (os: number, usdPerO: number = DEFAULT_USD_PER_O): number => os * usdPerO;
export const usdToOs = (usd: number, usdPerO: number = DEFAULT_USD_PER_O): number =>
  Math.round(usd / usdPerO);

export const formatUsd = (usd: number, maximumFractionDigits = 2): string =>
  usd.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits });

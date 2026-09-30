import { compact, oStr, osFmt } from '../format';
import { formatUsd, osToUsd, usdToOs } from '../os';
import { relTime } from '../time';

describe('format', () => {
  it('compacts like the design', () => {
    expect(compact(null)).toBe('0');
    expect(compact(999)).toBe('999');
    expect(compact(1000)).toBe('1k');
    expect(compact(1250)).toBe('1.3k');
    expect(compact(2_500_000)).toBe('2.5m');
  });
  it('formats Os', () => {
    expect(osFmt(12480)).toBe('12,480');
    expect(oStr(12480)).toBe('O 12,480');
  });
});

describe('os', () => {
  it('uses the 100 Os = $1 peg by default', () => {
    expect(osToUsd(2400)).toBe(24);
    expect(usdToOs(24)).toBe(2400);
    expect(formatUsd(24)).toBe('$24.00');
  });
  it('accepts a live rate', () => {
    expect(usdToOs(1, 1 / 99)).toBe(99);
  });
});

describe('relTime', () => {
  const now = Date.parse('2026-07-28T12:00:00Z');
  it.each([
    ['2026-07-28T11:59:40Z', 'just now'],
    ['2026-07-28T11:55:00Z', '5m ago'],
    ['2026-07-28T09:00:00Z', '3h ago'],
    ['2026-07-26T12:00:00Z', '2d ago'],
    ['2026-03-28T12:00:00Z', '4mo ago'],
    ['2025-06-28T12:00:00Z', '1y ago'],
  ])('%s → %s', (iso, expected) => {
    expect(relTime(iso, now)).toBe(expected);
  });
});

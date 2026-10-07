import type { components } from '@/api/generated/schema';
import type { Pulse } from '@/components/snapshot/Snapshot';
import { compact, oStr } from './format';

type PulseDto = components['schemas']['SnapshotPulse'];
type TrendDto = components['schemas']['TrendValue'];

/** "+8%" / "−2%" / "+1" from a window trend; `undefined` when there is nothing to compare (D-049). */
export function trendDelta(
  t: TrendDto | null | undefined,
  unit: PulseDto['unit'] = 'count',
): string | undefined {
  if (!t) return undefined;
  if (t.changePct != null && Number.isFinite(t.changePct)) {
    const pct = Math.round(t.changePct * 100);
    return `${pct >= 0 ? '+' : '−'}${Math.abs(pct)}%`;
  }
  if (!t.delta) return undefined;
  const abs = Math.abs(t.delta);
  return `${t.delta > 0 ? '+' : '−'}${unit === 'os' ? oStr(abs).slice(2) : compact(abs)}`;
}

/** A figure in the pulse's own unit. */
export function pulseFigure(n: number, unit: PulseDto['unit']): string {
  if (unit === 'os') return oStr(Math.round(n));
  if (unit === 'ratio') return `${Math.round(n * 100)}%`;
  return compact(n);
}

/**
 * One backend pulse as a chart tile. The label and note are the backend's — it names what it
 * measured ("Views · lifetime"), and a tile with no daily source has no sparkline rather than a
 * made-up one (D-049).
 */
export function pulseTile(p: PulseDto | null | undefined, tone: string): Pulse | null {
  if (!p) return null;
  const trend = (p.trend ?? null) as TrendDto | null;
  const series = (p.series ?? null) as number[] | null;
  return {
    label: p.label,
    note: p.note,
    headline: pulseFigure(p.headline, p.unit),
    delta: trendDelta(trend, p.unit),
    tone,
    series: series ?? [],
  };
}

/** The pulse map for SnapshotChart, dropping tiles the response did not carry. */
export function pulseMap<K extends string>(
  pulse: Partial<Record<K, PulseDto>> | undefined,
  tones: Record<K, string>,
): Record<string, Pulse> {
  const out: Record<string, Pulse> = {};
  for (const k of Object.keys(tones) as K[]) {
    const t = pulseTile(pulse?.[k], tones[k]);
    if (t) out[k] = t;
  }
  return out;
}

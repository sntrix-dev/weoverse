import type { PassportDto } from '../api/passport';

export type TierRungDto = PassportDto['tier']['ladder'][number];

export const pct = (adv: number) => Math.round(adv * 100);

export const currentRung = (p: PassportDto): TierRungDto =>
  p.tier.ladder.find((t) => t.current) ?? p.tier.ladder[0]!;

export const nextRung = (p: PassportDto): TierRungDto | null =>
  p.tier.next ? (p.tier.ladder.find((t) => t.key === p.tier.next) ?? null) : null;

/** "Mar 2024" — the passport's issue date. */
export const joinedLabel = (iso: string | null | undefined) => {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

/** What a rung asks of you from here — ISR first, then the answers it also needs. */
export function askFromHere(t: TierRungDto): string {
  if (t.reached)
    return t.current ? `Held while ISR stays at or above ${t.isr}` : 'Below you — you keep this by default';
  const parts: string[] = [];
  if (t.isrToGo && t.isrToGo > 0) parts.push(`${t.isrToGo} more ISR`);
  else parts.push('ISR is there');
  if (t.answersToGo && t.answersToGo > 0)
    parts.push(`${t.answersToGo} more accepted answer${t.answersToGo === 1 ? '' : 's'}`);
  return parts.join(' · ');
}

/** The one line under a rung on the tier section: how you reach it. */
export function reachLine(t: TierRungDto): string {
  if (t.reached) return t.current ? t.holds : 'Held below you';
  if (t.isrToGo && t.isrToGo > 0) return `${t.isrToGo} more ISR from here`;
  return 'ISR is there — answers still needed';
}

/** …and how it goes. */
export const loseLine = (t: TierRungDto) =>
  t.n === 1
    ? 'Only a suspended passport falls below this'
    : `ISR under ${t.isr}, a late flow, or an answer withdrawn`;

/** The ISR stage name and colour (the same ramp the creator sheet uses). */
export { isrStage, isrTone } from '@/features/creators/model/creators';

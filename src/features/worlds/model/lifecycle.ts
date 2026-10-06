// design: v3-spine.jsx V3 — STAGES, RING, ringIndex, NEED_REACT, THRESHOLD, TONE; community.jsx V3_WORD.
// The stages are the server's (`vetting.stage` on a draft, M11); `posting` is the moment between
// the twentieth pledge and the WeO existing, drawn as pledging.

export type Stage = 'draft' | 'rehearsed' | 'reacting' | 'reacted' | 'pledging' | 'posting' | 'live';

export const RING = ['Draft', 'Rehearsed', 'Reacted', 'Pledged', 'Live'] as const;
export const STAGE_RING: Record<string, number> = {
  draft: 0,
  rehearsed: 1,
  reacting: 1,
  reacted: 2,
  pledging: 3,
  posting: 3,
  live: 4,
};
export const STAGE_TONE: Record<string, string> = {
  draft: '#22C55E',
  rehearsed: '#22C55E',
  reacting: '#D946EF',
  reacted: '#D946EF',
  pledging: '#F7C62B',
  posting: '#F7C62B',
  live: '#F7C62B',
};
export const STAGE_WORD: Record<string, string> = {
  draft: 'Draft',
  rehearsed: 'Rehearsed',
  reacting: 'Reacting',
  reacted: 'Reacted',
  pledging: 'Pledging',
  posting: 'Posting',
  live: 'Live',
};
/** the circle defaults the server enforces (weo-vetting/vetting.config.ts) */
export const NEED_REACT = 12;
export const THRESHOLD = 20;

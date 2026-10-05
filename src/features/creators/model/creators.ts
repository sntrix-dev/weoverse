import type { Board, BoardRow, Pulse } from '@/components/snapshot/Snapshot';
import { formatHex, FORMATS, type WeoFormat } from '@/lib/cardModel';
import { compact, oStr } from '@/lib/format';
import type { CreatorRowDto, CreatorViewDto } from '../api/creators';

/** design `WV.CREATORS` row — what the record, the panel and the boards draw. */
export interface CreatorModel {
  id: string;
  name: string;
  handle: string;
  avatar: string | null;
  bio: string | null;
  isr: number;
  format: string;
  tone: string;
  trace: number[];
  settled: number;
  collectors: number;
  circledBy: number;
  circled: boolean;
  /** `null` when they keep their collections private */
  weos: number | null;
  weeksLive: number;
  circlesLed: number;
}

const isr100 = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export const creatorModel = (c: CreatorRowDto): CreatorModel => ({
  id: c.id,
  name: c.name,
  handle: c.handle,
  avatar: c.avatarUrl,
  bio: c.bio,
  isr: isr100(c.isr),
  format: c.format,
  tone: c.tone,
  trace: c.trace7d,
  settled: c.settled7d,
  collectors: c.collectors,
  circledBy: c.circledBy,
  circled: c.circled,
  weos: c.weos ?? null,
  weeksLive: c.weeksLive ?? 0,
  circlesLed: c.circlesLed ?? 0,
});

/** How many people a board ranks. */
export const BOARD_ROWS = 12;

const weeks = (n: number) => `${n} week${n === 1 ? '' : 's'}`;

/**
 * design: creators.jsx CREATOR_BOARDS — the same four boards, each sorted by its own figure
 * from the directory (standing, settled in 7 days, collectors, weeks live).
 */
export function creatorBoards(list: CreatorModel[]): Record<string, Board> {
  const row = (c: CreatorModel, sub: string, value: string): BoardRow => ({
    id: c.id,
    name: c.name,
    sub,
    value,
    delta: c.format,
    tone: c.tone,
    avatar: c.avatar,
    isr: c.isr,
  });
  // the podium and the nine behind it — the grid below holds everyone
  const by = (k: (c: CreatorModel) => number) =>
    list
      .slice()
      .sort((a, b) => k(b) - k(a))
      .slice(0, BOARD_ROWS);
  return {
    standing: {
      label: 'Highest standing',
      metric: 'ISR',
      rows: by((c) => c.isr).map((c) => row(c, `${c.format} · ${weeks(c.weeksLive)}`, String(c.isr))),
    },
    settled: {
      label: 'Settled most',
      metric: 'Os settled · 7d',
      rows: by((c) => c.settled).map((c) => row(c, `ISR ${c.isr}`, oStr(c.settled))),
    },
    reach: {
      label: 'Reached most collectors',
      metric: 'collectors',
      rows: by((c) => c.collectors).map((c) => row(c, `${c.circlesLed} circles led`, compact(c.collectors))),
    },
    consistency: {
      label: 'Longest live',
      metric: 'weeks live',
      rows: by((c) => c.weeksLive).map((c) =>
        row(
          c,
          c.weos == null ? 'WeOs private' : `${c.weos} WeO${c.weos === 1 ? '' : 's'}`,
          String(c.weeksLive),
        ),
      ),
    },
  };
}

export const CREATOR_PULSE_TONES = {
  standing: '#3A95F2',
  settled: '#F7C62B',
  reach: '#22C55E',
  consistency: '#D946EF',
} as const;

/**
 * design: creators.jsx CREATOR_PULSE. The backend keeps no history of these figures, so each tile
 * reads the directory as it stands: the best figure as the headline and the seven leaders, low
 * to high, as the bars (D-066). No delta is shown because there is nothing to compare against.
 */
export function creatorPulse(list: CreatorModel[]): Record<string, Pulse> {
  if (!list.length) return {};
  const lead = (k: (c: CreatorModel) => number) =>
    list
      .map(k)
      .sort((a, b) => b - a)
      .slice(0, 7)
      .reverse();
  const top = (k: (c: CreatorModel) => number) => Math.max(0, ...list.map(k));
  const sum = (k: (c: CreatorModel) => number) => list.reduce((n, c) => n + k(c), 0);
  return {
    standing: {
      label: 'Standing',
      tone: CREATOR_PULSE_TONES.standing,
      headline: String(top((c) => c.isr)),
      note: 'top ISR',
      series: lead((c) => c.isr),
    },
    settled: {
      label: 'Settled',
      tone: CREATOR_PULSE_TONES.settled,
      headline: `O ${compact(sum((c) => c.settled))}`,
      note: 'this week',
      series: lead((c) => c.settled),
    },
    reach: {
      label: 'Reach',
      tone: CREATOR_PULSE_TONES.reach,
      headline: compact(sum((c) => c.collectors)),
      note: 'collectors',
      series: lead((c) => c.collectors),
    },
    consistency: {
      label: 'Live',
      tone: CREATOR_PULSE_TONES.consistency,
      headline: String(top((c) => c.weeksLive)),
      note: 'weeks, best',
      series: lead((c) => c.weeksLive),
    },
  };
}

/** One of their WeOs on the orbit: its colour is its format's. */
export interface OrbitWeo {
  id: string;
  name: string;
  type: string;
  img: string | null;
  tone: string;
  os: number;
}

const asFormat = (f: string): WeoFormat =>
  (FORMATS as readonly string[]).includes(f) ? (f as WeoFormat) : 'Listing';

export const orbitOf = (v: CreatorViewDto | undefined): OrbitWeo[] =>
  (v?.weos ?? []).map((w) => ({
    id: w.id,
    name: w.title,
    type: w.format,
    img: w.img,
    tone: formatHex(asFormat(w.format)),
    os: w.os,
  }));

/** design: screens-network.jsx ISR_RAMP — the stage a standing reads as, and its colour. */
const ISR_RAMP: [number, string, string][] = [
  [0, '#FF5A2C', 'Starting out'],
  [40, '#F7B21F', 'Finding form'],
  [62, '#22C55E', 'Consistent'],
  [80, '#17C3D6', 'Trusted'],
  [92, '#2F6FF0', 'Exemplary'],
];
const stageOf = (n: number) => ISR_RAMP.filter((r) => n >= r[0]).pop() ?? ISR_RAMP[0]!;
export const isrTone = (n: number) => stageOf(n)[1];
export const isrStage = (n: number) => stageOf(n)[2];

/** design: CONTACT_NOTE — how they may be reached, said as a fact. */
export { CONTACT_NOTE } from '@/components/people/PublicPageButton';

/** "answers accepted" — a share, or a dash when they have answered nothing. */
export const acceptLabel = (rate: number | null | undefined) =>
  rate == null ? '—' : `${Math.round(rate * 100)}%`;

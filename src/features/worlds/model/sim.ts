// design: world.jsx — SCENARIO_NOTE, sweep, lifecycle, COHORTS, SEASONS, COHORT_DEFAULTS, simulate;
// data.js WORLDS, FIDELITY. The simulation is a model and says so (D-093): the market contexts and
// their clear rates are the network's real ones (`/weos/interests`), the comparables are the live
// floor; the cohorts, seasons and coefficients are the design's model.
import { osFmt } from '@/lib/format';
import type { WeoFormat } from '@/lib/cardModel';

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export type WorldId = 'night' | 'daylight' | 'dusk' | 'studio';
export interface WorldDef {
  id: WorldId;
  name: string;
  theme: WorldId;
  purpose: string;
  fidelity: number;
}
export const WORLDS: readonly WorldDef[] = [
  {
    id: 'night',
    name: 'Night market',
    theme: 'night',
    purpose: 'Dense evening commerce — read footfall against price.',
    fidelity: 3,
  },
  {
    id: 'daylight',
    name: 'Sunlit plaza',
    theme: 'daylight',
    purpose: 'Open browsing; wide approach distances.',
    fidelity: 3,
  },
  {
    id: 'dusk',
    name: 'Festival field',
    theme: 'dusk',
    purpose: 'Event crowds and campaign ladders.',
    fidelity: 4,
  },
  {
    id: 'studio',
    name: 'Studio room',
    theme: 'studio',
    purpose: 'One good judged closely, nothing else.',
    fidelity: 5,
  },
];
export const worldOf = (id: string | null | undefined): WorldDef =>
  WORLDS.find((w) => w.id === id) ?? WORLDS[0]!;

export const FIDELITY = [
  { level: 1, name: 'Block', purpose: 'Wayfinding, AR on a phone', tris: '1.2k' },
  { level: 2, name: 'Massing', purpose: 'Read density', tris: '6k' },
  { level: 3, name: 'Textured', purpose: 'Browse commerce', tris: '24k' },
  { level: 4, name: 'Lit', purpose: 'Presence and events', tris: '90k' },
  { level: 5, name: 'Photoreal', purpose: 'Judge a real good', tris: '400k' },
] as const;

/** The worlds are marketplace conditions the sim runs under, not scenery. */
export const SCENARIO_NOTE: Record<WorldId, string> = {
  night: 'Evening street trade — dense footfall, impulse collecting, short attention.',
  daylight: 'Weekend in the plaza — the widest audience, and the most price comparison.',
  dusk: 'Festival crowd — high intent, gift money, decisions made in minutes.',
  studio: 'Controlled test — no crowd effects at all, the terms alone.',
};

export type CohortId = 'locals' | 'circle' | 'collectors' | 'gifters' | 'visitors' | 'resellers';
export interface Cohort {
  id: CohortId;
  name: string;
  color: string;
  reach: number;
  intent: number;
  sens: number;
  pref: WeoFormat;
  note: string;
}
/** Who is in the world: the crowd you see walking it IS this list. */
export const COHORTS: readonly Cohort[] = [
  {
    id: 'locals',
    name: 'Quick browsers',
    color: '#3A95F2',
    reach: 1400,
    intent: 0.42,
    sens: 0.86,
    pref: 'Listing',
    note: 'Scrolling past. Price-aware, decides in seconds.',
  },
  {
    id: 'circle',
    name: 'Your circles',
    color: '#22C55E',
    reach: 340,
    intent: 0.8,
    sens: 0.44,
    pref: 'Pool',
    note: 'Already trusts you. Backs early, expects to hear first.',
  },
  {
    id: 'collectors',
    name: 'Serious collectors',
    color: '#D946EF',
    reach: 220,
    intent: 0.76,
    sens: 0.3,
    pref: 'Bid',
    note: 'Knows the format. Pays for provenance, not for noise.',
  },
  {
    id: 'gifters',
    name: 'Gift buyers',
    color: '#F7C62B',
    reach: 860,
    intent: 0.54,
    sens: 0.5,
    pref: 'Drop',
    note: 'Buying for someone else. A deadline beats a discount.',
  },
  {
    id: 'visitors',
    name: 'Passing visitors',
    color: '#17C3D6',
    reach: 2600,
    intent: 0.18,
    sens: 0.72,
    pref: 'Hunt',
    note: 'Curious, unattached. Volume with a thin conversion.',
  },
  {
    id: 'resellers',
    name: 'Resellers',
    color: '#FF5A2C',
    reach: 130,
    intent: 0.64,
    sens: 0.22,
    pref: 'Bid',
    note: 'Buys to relist. Lifts your floor, thins your margin.',
  },
];
export type CohortPick = Record<CohortId, boolean>;
export const COHORT_DEFAULTS: CohortPick = {
  locals: true,
  circle: true,
  collectors: true,
  gifters: false,
  visitors: true,
  resellers: false,
};
export const pickedIds = (c: CohortPick): CohortId[] => COHORTS.filter((x) => c[x.id]).map((x) => x.id);

export type SeasonId = 'weeknight' | 'weekend' | 'payday' | 'holiday';
export const SEASONS: readonly { id: SeasonId; label: string; mult: number }[] = [
  { id: 'weeknight', label: 'Weeknight', mult: 0.86 },
  { id: 'weekend', label: 'Weekend', mult: 1.12 },
  { id: 'payday', label: 'Payday week', mult: 1.24 },
  { id: 'holiday', label: 'Holiday peak', mult: 1.38 },
];
export const seasonOf = (id: string) => SEASONS.find((s) => s.id === id) ?? SEASONS[1]!;

/** One market context: a category, the format that clears best there, and how often (`/weos/interests`). */
export interface MarketContext {
  context: string;
  type: WeoFormat;
  rate: number;
}
/** Used only when the network has no category figures yet — neutral (rate / 0.7 = 1). */
export const NEUTRAL_CONTEXT: MarketContext = { context: 'Across the network', type: 'Listing', rate: 0.7 };

export interface SimConfig {
  /** the WeO under test: its format and its own price */
  weo: { type: WeoFormat; os: number };
  contexts: readonly MarketContext[];
  context: string;
  price: number;
  edition: number;
  days: number;
  bundle: boolean;
  cohorts: CohortPick;
  season: SeasonId;
  rivals: number;
}

export interface CohortRow {
  id: CohortId;
  name: string;
  color: string;
  conv: number;
  collectors: number;
}
export interface SimResult {
  through: number;
  collectors: number;
  settled: number;
  firstHours: number;
  lift: number;
  demand: number;
  soldOut: boolean;
  cohortRows: CohortRow[];
  lead: CohortRow | null;
  reach: number;
  best: WeoFormat;
  bestRate: number;
  matched: boolean;
  verdict: string;
}

export const contextOf = (cfg: Pick<SimConfig, 'contexts' | 'context'>): MarketContext =>
  cfg.contexts.find((c) => c.context === cfg.context) ?? cfg.contexts[0] ?? NEUTRAL_CONTEXT;

export function simulate(cfg: SimConfig): SimResult {
  const ctx = contextOf(cfg);
  const w = cfg.weo;
  const season = seasonOf(cfg.season);
  const rivals = cfg.rivals;
  const picked = COHORTS.filter((c) => cfg.cohorts[c.id]);
  const scarcity = clamp(1.24 - cfg.edition / 240, 0.7, 1.24);
  const pace = clamp(1.12 - cfg.days / 44, 0.72, 1.12);
  const lift = cfg.bundle ? 1.42 : 1;
  const rel = cfg.price / Math.max(1, w.os);

  const rows = picked.map((c) => {
    const priceFit = clamp(1 - (rel - 1) * (0.6 + c.sens * 1.5), 0.12, 1.5);
    const formatFit = c.pref === w.type ? 1.2 : 0.72;
    const conv = clamp(
      c.intent *
        priceFit *
        formatFit *
        (ctx.rate / 0.7) *
        season.mult *
        (1 - rivals * 0.4) *
        scarcity *
        pace *
        lift,
      0.01,
      0.95,
    );
    return { c, conv, want: Math.max(0, Math.round(c.reach * conv * 0.055)) };
  });
  const demand = rows.reduce((s, r) => s + r.want, 0);
  const collectors = Math.max(0, Math.min(cfg.edition, demand));
  const scale = demand ? collectors / demand : 0;
  const cohortRows = rows
    .map((r) => ({
      id: r.c.id,
      name: r.c.name,
      color: r.c.color,
      conv: r.conv,
      collectors: Math.round(r.want * scale),
    }))
    .sort((a, b) => b.collectors - a.collectors);
  const through = cfg.edition ? collectors / cfg.edition : 0;
  const settled = collectors * cfg.price;
  const lead = cohortRows[0] ?? null;
  const firstHours = Math.max(1, Math.round(26 * (1 / Math.max(0.05, through)) * Math.max(0.4, rel) * 0.6));
  const soldOut = demand > cfg.edition;
  return {
    through,
    collectors,
    settled,
    firstHours,
    lift,
    demand,
    soldOut,
    cohortRows,
    lead,
    reach: picked.reduce((s, c) => s + c.reach, 0),
    best: ctx.type,
    bestRate: ctx.rate,
    matched: ctx.type === w.type,
    verdict: soldOut
      ? `Demand outruns the edition — ${osFmt(demand)} would take it at this price. Raise the price or the edition.`
      : lead && lead.collectors > 0
        ? `${lead.name} carry this one: ${Math.round((lead.collectors / Math.max(1, collectors)) * 100)}% of everyone who collects.`
        : 'Nobody in this mix clears at that price. Try the format before the number.',
  };
}

/** The price ladder the sweep runs at once (free for everyone, D-087). */
export function sweep(cfg: SimConfig) {
  return [0.6, 0.8, 1, 1.25, 1.5].map((m) => {
    const price = Math.round(cfg.price * m);
    const r = simulate({ ...cfg, price });
    return { price, through: r.through, settled: r.settled, collectors: r.collectors };
  });
}

export interface LifeRow {
  k: 'remix' | 'resale' | 'reflow' | 'modify';
  label: string;
  n: number;
  r: number;
  tone: string;
  why: string;
}
export interface Lifecycle {
  comparable: number;
  horizon: number;
  rows: LifeRow[];
  uplift: number;
  resaleOs: number;
}

/**
 * What happens after the collect: remixed, resold, put back into flow, terms edited.
 * `comparable` is how many WeOs of this format are live on the floor right now.
 */
export function lifecycle(cfg: SimConfig, base: SimResult, comparable: number): Lifecycle {
  const w = cfg.weo;
  const season = seasonOf(cfg.season);
  const picked = COHORTS.filter((c) => cfg.cohorts[c.id]);
  const reach = picked.reduce((s, c) => s + c.reach, 0) || 1;
  const share = (id: CohortId) => {
    const c = picked.find((x) => x.id === id);
    return c ? c.reach / reach : 0;
  };
  const held = base.collectors;
  const scarcity = clamp(1 - cfg.edition / 240, 0, 1);

  const remixR = clamp(
    0.05 +
      share('circle') * 0.42 +
      share('collectors') * 0.22 +
      (cfg.bundle ? 0.09 : 0) +
      (w.type === 'Drop' ? 0.03 : 0),
    0.03,
    0.46,
  );
  const resaleR = clamp(
    0.04 + share('resellers') * 0.9 + share('collectors') * 0.24 + scarcity * 0.14 + (season.mult - 1) * 0.2,
    0.02,
    0.44,
  );
  const reflowR = clamp(
    0.05 + (base.soldOut ? 0.12 : 0) + share('locals') * 0.12 + scarcity * 0.1,
    0.03,
    0.4,
  );
  const modifyR = clamp(0.36 - base.through * 0.34 + (base.lead ? 0 : 0.08), 0.04, 0.42);
  const uplift = clamp(
    0.06 + scarcity * 0.4 + share('collectors') * 0.5 + (base.soldOut ? 0.12 : -0.04),
    -0.1,
    0.7,
  );

  return {
    comparable,
    horizon: 90,
    rows: [
      {
        k: 'remix',
        label: 'Remixed',
        n: Math.round(held * remixR),
        r: remixR,
        tone: 'var(--o-violet)',
        why:
          share('circle') > 0.1
            ? 'Your circles remix what they back'
            : 'Collectors rebuild it into their own',
      },
      {
        k: 'resale',
        label: 'Resold',
        n: Math.round(held * resaleR),
        r: resaleR,
        tone: 'var(--o-gold)',
        why:
          share('resellers') > 0.02
            ? 'Resellers are watching this'
            : scarcity > 0.5
              ? 'A tight edition finds a second buyer'
              : 'Thin secondary at this edition',
      },
      {
        k: 'reflow',
        label: 'Put back in flow',
        n: Math.round(held * reflowR),
        r: reflowR,
        tone: 'var(--o-blue)',
        why: base.soldOut
          ? 'Demand outran the edition — holders relist'
          : `${season.label} footfall keeps it moving`,
      },
      {
        k: 'modify',
        label: 'Terms edited to move it',
        n: Math.round(held * modifyR),
        r: modifyR,
        tone: 'var(--o-green)',
        why: base.through > 0.7 ? 'Most clear without a change' : 'Slow clearance forces a price edit',
      },
    ],
    uplift,
    resaleOs: Math.round(held * resaleR * cfg.price * (1 + uplift)),
  };
}

/** The crowd IS the cohort mix — each cohort's share of the world's footfall. */
export function crowdOf(cohorts: CohortPick) {
  const on = COHORTS.filter((c) => cohorts[c.id]);
  const total = on.reduce((s, c) => s + c.reach, 0) || 1;
  return COHORTS.map((c) => ({
    id: c.id,
    color: c.color,
    on: !!cohorts[c.id],
    intent: c.intent,
    share: cohorts[c.id] ? c.reach / total : 0,
  }));
}
export type Crowd = ReturnType<typeof crowdOf>;

/** The studio's slider bounds — the same the settle endpoint validates. */
export const BOUNDS = {
  price: [200, 8000, 100],
  edition: [10, 240, 5],
  days: [1, 30, 1],
  resale: [0, 10, 1],
} as const;
export const clampTo = (k: keyof typeof BOUNDS, v: number) => {
  const [lo, hi, step] = BOUNDS[k];
  return clamp(Math.round(v / step) * step, lo, hi);
};

export const rivalsWord = (v: number) =>
  v < 0.2 ? 'Quiet' : v < 0.45 ? 'Busy' : v < 0.7 ? 'Crowded' : 'Saturated';

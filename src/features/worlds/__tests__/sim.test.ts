import { describe, expect, it } from 'vitest';
import {
  COHORT_DEFAULTS,
  NEUTRAL_CONTEXT,
  clampTo,
  contextOf,
  crowdOf,
  lifecycle,
  simulate,
  sweep,
  type SimConfig,
} from '../model/sim';

const base: SimConfig = {
  weo: { type: 'Listing', os: 1200 },
  contexts: [
    { context: 'Digital arts', type: 'Drop', rate: 0.78 },
    { context: 'Craft & goods', type: 'Listing', rate: 0.58 },
  ],
  context: 'Craft & goods',
  price: 1200,
  edition: 50,
  days: 7,
  bundle: false,
  cohorts: COHORT_DEFAULTS,
  season: 'weekend',
  rivals: 0.35,
};

describe('simulate', () => {
  it('matches the design model for the default mix', () => {
    const r = simulate(base);
    // locals 1400·conv, circle 340, collectors 220, visitors 2600 — hand-checked against world.jsx
    expect(r.collectors).toBeGreaterThan(0);
    expect(r.collectors).toBeLessThanOrEqual(50);
    expect(r.through).toBeCloseTo(r.collectors / 50, 6);
    expect(r.settled).toBe(r.collectors * 1200);
    expect(r.best).toBe('Listing');
    expect(r.matched).toBe(true);
    expect(r.reach).toBe(1400 + 340 + 220 + 2600);
  });

  it('sells out a tight edition and says so', () => {
    const r = simulate({ ...base, edition: 10, price: 600 });
    expect(r.soldOut).toBe(true);
    expect(r.through).toBe(1);
    expect(r.verdict).toMatch(/Demand outruns the edition/);
  });

  it('a higher price clears less', () => {
    const lo = simulate({ ...base, price: 800, edition: 240 });
    const hi = simulate({ ...base, price: 4000, edition: 240 });
    expect(hi.collectors).toBeLessThan(lo.collectors);
  });

  it('an empty crowd collects nothing and says to try the format', () => {
    const none = {
      locals: false,
      circle: false,
      collectors: false,
      gifters: false,
      visitors: false,
      resellers: false,
    };
    const r = simulate({ ...base, cohorts: none });
    expect(r.collectors).toBe(0);
    expect(r.lead).toBeNull();
    expect(r.verdict).toMatch(/Nobody in this mix/);
  });

  it('falls back to a neutral context when the network has no figures', () => {
    expect(contextOf({ contexts: [], context: 'x' })).toBe(NEUTRAL_CONTEXT);
    expect(contextOf({ contexts: base.contexts, context: 'missing' }).context).toBe('Digital arts');
  });
});

describe('sweep and lifecycle', () => {
  it('runs the five-step price ladder', () => {
    const rows = sweep(base);
    expect(rows.map((r) => r.price)).toEqual([720, 960, 1200, 1500, 1800]);
  });

  it('projects what happens after it lands', () => {
    const r = simulate(base);
    const life = lifecycle(base, r, 7);
    expect(life.comparable).toBe(7);
    expect(life.rows.map((x) => x.k)).toEqual(['remix', 'resale', 'reflow', 'modify']);
    life.rows.forEach((x) => {
      expect(x.r).toBeGreaterThan(0);
      expect(x.n).toBe(Math.round(r.collectors * x.r));
    });
  });
});

describe('the crowd', () => {
  it('shares the footfall among the cohorts that are on', () => {
    const c = crowdOf(COHORT_DEFAULTS);
    const on = c.filter((x) => x.on);
    expect(on).toHaveLength(4);
    expect(on.reduce((s, x) => s + x.share, 0)).toBeCloseTo(1, 6);
    expect(c.find((x) => x.id === 'gifters')?.share).toBe(0);
  });

  it('keeps terms inside the settle bounds', () => {
    expect(clampTo('price', 12_345)).toBe(8000);
    expect(clampTo('price', 1234)).toBe(1200);
    expect(clampTo('edition', 1)).toBe(10);
    expect(clampTo('days', 45)).toBe(30);
  });
});

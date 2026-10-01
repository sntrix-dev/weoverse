import { bidWeo, dropWeo, FIXTURE_NOW, huntWeo, listingWeo, poolWeo } from '@/test/fixtures/weos';
import { cardModel, formatOf, hhmmss, shortLeft } from '../cardModel';

const m = (w: Parameters<typeof cardModel>[0], ctx?: Parameters<typeof cardModel>[1]) =>
  cardModel(w, ctx, FIXTURE_NOW);

describe('cardModel', () => {
  it('projects three weoTypes onto five formats', () => {
    expect([listingWeo(), bidWeo(), dropWeo(), poolWeo(), huntWeo()].map(formatOf)).toEqual([
      'Listing',
      'Bid',
      'Drop',
      'Pool',
      'Hunt',
    ]);
  });

  it('Listing: one price in Os, edition and resale terms', () => {
    const c = m(listingWeo());
    expect(c).toMatchObject({
      type: 'Listing',
      tone: 'var(--o-green)',
      hex: '#22C55E',
      cta: 'Collect',
      os: 4200,
      priceUsd: 42.42,
      priceLabel: 'Ask',
      edition: 'Edition of 160',
      rarity: 'Available',
      left: 100,
      total: 160,
      timer: null,
      endsIn: 'closed',
      trend: null,
      weoId: 'WEO-1290EE',
    });
    expect(c.terms).toEqual([
      { k: 'Ask', v: 'O 4,200' },
      { k: 'Edition', v: '60 of 160' },
      { k: 'Resale', v: '2%' },
    ]);
  });

  it('Bid: negotiable terms and its close clock', () => {
    const c = m(bidWeo());
    expect(c.cta).toBe('Raise');
    expect(c.priceLabel).toBe('Current bid');
    expect(c.terms).toEqual([
      { k: 'Current bid', v: 'O 4,200' },
      { k: 'Negotiable', v: 'Yes' },
      { k: 'Closes', v: '2d' },
    ]);
    expect(c.timer).toBe('48:00:00');
  });

  it('Drop: capped edition, countdown, trend and circles', () => {
    const c = m(dropWeo());
    expect(c).toMatchObject({
      type: 'Drop',
      cta: 'Get it',
      priceLabel: 'Mint',
      os: 1900,
      timer: '12:04:10',
      endsIn: '12h',
      trend: '+21%',
      fundPct: 82,
      circleIds: ['circ-1'],
    });
    expect(c.terms[1]).toEqual({ k: 'Left', v: '9 of 50' });
  });

  it('Pool: pledge unit from the backend, funded rarity, held flag', () => {
    const c = m(poolWeo());
    expect(c).toMatchObject({
      type: 'Pool',
      cta: 'Chip in',
      priceLabel: 'Pledge',
      os: 2400,
      fundPct: 78,
      edition: 'Edition of 200',
      left: 44,
      rarity: '78% funded',
      urgent: true,
      collected: true,
      timer: '06:14:22',
    });
    expect(c.terms).toEqual([
      { k: 'Pledge', v: 'O 2,400' },
      { k: 'Left', v: '44 of 200' },
      { k: 'Closes', v: '6h' },
    ]);
  });

  it('Hunt: entries and published rules', () => {
    const c = m(huntWeo());
    expect(c).toMatchObject({
      type: 'Hunt',
      cta: 'Join the hunt',
      os: 600,
      edition: '100 entries',
      rarity: 'Rules published',
    });
    expect(c.terms).toEqual([
      { k: 'Entry', v: 'O 600' },
      { k: 'Entries', v: '20 left' },
      { k: 'Ends in', v: '2d' },
    ]);
  });

  it('closed and sold out', () => {
    const c = m(listingWeo({ status: 'sold_out', inventoryLeft: 0 }));
    expect(c.live).toBe(false);
    expect(c.rarity).toBe('Sold out');
    const done = m(dropWeo({ closesAt: new Date(FIXTURE_NOW - 1000).toISOString() }));
    expect(done.timer).toBeNull();
    expect(done.endsIn).toBe('closed');
  });

  it('survives missing media, an editorial rarity note and an unknown context', () => {
    const c = cardModel(
      dropWeo({ media: [], weoverse: { ...dropWeo().weoverse!, rarityNote: 'Generative' } }),
      'nope' as never,
      FIXTURE_NOW,
    );
    expect(c.img).toBeNull();
    expect(c.rarity).toBe('Generative');
    expect(c.context).toBe('discover');
    expect(c.actions).toEqual(['collect', 'watch', 'ask']);
  });

  it('the context decides actions, not the format', () => {
    expect(m(dropWeo(), 'collected').actions).toEqual(['resell', 'transfer', 'passport']);
    expect(m(dropWeo(), 'listed').actions).toEqual(['edit', 'pause', 'share']);
  });

  it('creator view model', () => {
    expect(m(dropWeo()).creator).toMatchObject({
      handle: 'lenav',
      isr: 89,
      tradeCount: 51,
      joined: 'Feb 2024',
    });
  });

  it('clock helpers', () => {
    expect(hhmmss(null)).toBeNull();
    expect(hhmmss(3_723_000)).toBe('01:02:03');
    expect(shortLeft(3 * 864e5)).toBe('3d');
    expect(shortLeft(0)).toBe('closed');
  });
});

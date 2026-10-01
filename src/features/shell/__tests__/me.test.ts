import { navSummaryFixture } from '@/test/fixtures/navSummary';
import { initialsOf, joinedLabel, toShellMe } from '../model/me';

describe('toShellMe', () => {
  it('maps the nav summary into the shell view model', () => {
    const me = toShellMe(navSummaryFixture());
    expect(me).toMatchObject({
      name: 'Mya Rivers',
      handle: '@mya',
      initials: 'MR',
      weoId: 'OW-4F82C1',
      isr: 86,
      isrLabel: 'Strong',
      joined: 'Feb 2024',
      available: 12480,
      tier: { rank: 2, label: 'Player', badge: 'L2', tone: '#22C55E' },
      counts: { collected: 38, created: 12, circles: 4, campaigns: 3 },
      unread: 3,
      power: null,
      verified: null,
    });
  });

  it('has no tier until one applies', () => {
    const me = toShellMe(
      navSummaryFixture({ wallet: { available: 0, tier: 'not applicable', tierLabel: null, tierRank: 0 } }),
    );
    expect(me.tier).toBeNull();
  });

  it('clamps ISR and survives missing optional fields', () => {
    const dto = navSummaryFixture();
    dto.identity = { isr: 140 };
    const me = toShellMe(dto);
    expect(me.isr).toBe(100);
    expect(me.name).toBe('');
    expect(me.initials).toBe('O');
    expect(me.joined).toBe('');
  });

  it('formats helpers', () => {
    expect(initialsOf('ada lovelace byron')).toBe('AL');
    expect(joinedLabel('not a date')).toBe('');
  });
});

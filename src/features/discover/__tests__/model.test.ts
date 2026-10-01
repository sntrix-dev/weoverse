import { describe, expect, it } from 'vitest';
import { circleFixture, creatorsFixture, feedFixture, interestsFixture } from '@/test/fixtures/discover';
import { coverLine, feedItemModel, feedRoute } from '../model/feed';
import { circleCard, creatorStall, interest } from '../model/rails';

const NOW = Date.parse('2026-10-01T12:00:00Z');

describe('feed items', () => {
  it("maps the backend's legacy hrefs onto this app's routes", () => {
    expect(feedRoute('/weo/abc')).toBe('/weos/abc');
    expect(feedRoute('/community-hub/thread/t1')).toBe('/community/threads/t1');
    expect(feedRoute('/request/r1')).toBe('/requests/r1');
    expect(feedRoute('/community-hub/stories')).toBe('/community/stories');
    expect(feedRoute('/somewhere/else')).toBe('/discover');
  });

  it('a WeO item takes its format colour, names the format and runs its clock', () => {
    const [weo] = feedFixture(NOW).map((i) => feedItemModel(i, NOW));
    expect(weo).toMatchObject({
      kind: 'weo',
      tone: '#D946EF',
      sub: 'Drop · Digital arts',
      timer: '06:00:00',
      weoId: 'weo-1',
      to: '/weos/weo-1',
      metrics: [
        ['41', 'collectors'],
        ['232', 'watching'],
        ['31', 'here now'],
      ],
    });
    expect(coverLine(weo!)).toBe('Closes 06:00:00');
  });

  it('other kinds keep their kind colour, have no clock and open their record', () => {
    const [, question, request] = feedFixture(NOW).map((i) => feedItemModel(i, NOW));
    expect(question).toMatchObject({
      tone: '#D946EF',
      timer: null,
      weoId: null,
      to: '/community/threads/th-1',
    });
    expect(request).toMatchObject({ tone: '#22C55E', timer: null, to: '/requests/rq-1' });
    expect(coverLine(request!)).toBe('Open brief');
  });
});

describe('rails', () => {
  it('a creator row becomes a stall with its seven-day trace', () => {
    expect(creatorStall(creatorsFixture[0]!)).toMatchObject({
      name: 'Lena V',
      isr: 89,
      format: 'Drop',
      trace: [0, 1, 0, 2, 0, 0, 1],
    });
  });

  it('a circle fills the desire band from its resolved rate and takes its kind colour when it has one', () => {
    expect(circleCard(circleFixture())).toMatchObject({
      desire: 62,
      toneHex: '#D946EF',
      icon: 'arts',
      joined: true,
      members: 3200,
    });
    expect(circleCard(circleFixture({ weoTypeKey: 'crowdfund' }))).toMatchObject({
      toneHex: '#22C55E',
      icon: 'pool',
      bestType: 'Pool',
    });
  });

  it('an interest names the format that clears there', () => {
    expect(interest(interestsFixture[0]!)).toEqual({
      context: 'Digital arts',
      type: 'Pool',
      rate: 0.64,
      tone: '#22C55E',
      live: 4,
    });
  });
});

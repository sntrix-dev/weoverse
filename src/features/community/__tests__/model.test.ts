import { describe, expect, it, vi } from 'vitest';
import { circleView } from '@/lib/circleModel';
import { circleFixture } from '@/test/fixtures/discover';
import {
  ME,
  circleDetailFixture,
  contributor,
  myWeosFixture,
  storiesFixture,
  threadDetailFixture,
  threadFixture,
} from '@/test/fixtures/community';
import { flightItems, person, stewardModel, storyModel, threadDetail, threadModel } from '../model/community';
import { nextAct, type FlightHandlers } from '../components/InFlight';

describe('community models', () => {
  it('a person falls back from full name to handle to "A member"', () => {
    expect(person({ id: 'x', fullName: ' ', creatorName: 'ada', profileImage: null, isr: 140 })).toMatchObject({
      name: 'ada',
      handle: '@ada',
      isr: 100,
    });
    expect(person(null, 'gone').name).toBe('A member');
  });

  it('a thread row: replies are answers and their replies; an accepted answer is the "Top answer"', () => {
    const t = threadModel(threadFixture({ acceptedAnswerId: 'a-1', status: 'resolved' }));
    expect(t).toMatchObject({ replies: 3, resolved: true, pick: true, votes: 5, weo: null });
    const withWeo = threadModel(threadFixture({ attachedWeoId: 'w', attachedWeoFace: { id: 'w', title: 'Tide', cover: null } }));
    expect(withWeo.weo).toEqual({ name: 'Tide', img: null });
  });

  it('a thread page sorts answers by score and knows which are yours', () => {
    const t = threadDetail(threadDetailFixture(), ME);
    expect(t.answers.map((a) => a.id)).toEqual(['a-2', 'a-1']);
    expect(t.answers[0]!.mine).toBe(true);
    expect(t.mine).toBe(false);
    expect(threadDetail(threadDetailFixture({ authorId: ME }), ME).mine).toBe(true);
  });

  it('a circle: win rate is measured or absent, tags are what the room uses', () => {
    const c = circleView(circleDetailFixture());
    expect(c).toMatchObject({ winRate: 0.4, tags: ['pricing', 'editions'], resolved: 0.62, active: 4, desire: 62 });
    expect(circleView(circleDetailFixture({ collectThrough7d: null, trendingTags: [] }))).toMatchObject({
      winRate: null,
      tags: ['editions'],
    });
    // a list card has no detail: no win rate, its own tags
    expect(circleView(circleFixture({ tags: ['x'] }))).toMatchObject({ winRate: null, tags: ['x'] });
  });

  it('a steward is a contributor: rate defaults to 0 when they wrote nothing', () => {
    expect(stewardModel(contributor({ acceptedRate: null, fullName: null }))).toMatchObject({
      name: 'ada',
      accept: 0,
      circles: 3,
      weos: 5,
      focus: 'Pool',
    });
  });

  it('a story names its format and keeps its thread (or none)', () => {
    expect(storyModel(storiesFixture[0]!)).toMatchObject({ type: 'Pool', collectors: 40, threadId: 't-1' });
    expect(storyModel(storiesFixture[1]!)).toMatchObject({ type: 'Hunt', threadId: null, weoId: 'weo-2' });
  });

  it('in flight: drafts first, then your WeOs on the floor; closed ones are not in flight', () => {
    const items = flightItems(
      [{ _id: 'd-1', title: '', weoType: null }],
      [...myWeosFixture, { ...myWeosFixture[0]!, id: 'old', status: 'completed' }],
    );
    expect(items.map((i) => [i.id, i.stage, i.name])).toEqual([
      ['draft:d-1', 'draft', 'Untitled WeO'],
      ['weo-mine', 'live', 'Tide Pool'],
    ]);
  });

  it('in flight: a WeO that posted itself after twenty pledges carries the validated mark (G-75)', () => {
    const [plain, vetted] = flightItems(
      [],
      [myWeosFixture[0]!, { ...myWeosFixture[0]!, id: 'v', validated: true }],
    );
    expect(plain!.validated).toBe(false);
    expect(vetted!.validated).toBe(true);
    const h = { onMarket: vi.fn() } as unknown as FlightHandlers;
    expect(nextAct(vetted!, h)).toMatchObject({
      note: 'Live · validated',
      get: 'Validated mark · ahead on the floor',
    });
    expect(nextAct(plain!, h)).toMatchObject({ note: 'Live in Exchange', get: 'On the floor, earning' });
  });
});

import type { components } from '@/api/generated/schema';
import type { DraftDto } from '@/features/community/api/community';

type S = components['schemas'];
const T0 = '2026-09-28T10:00:00.000Z';

const rehearsal = {
  world: { id: 'night', name: 'Night market', fidelity: 3 },
  context: 'Digital arts',
  contextRate: 0.78,
  season: 'weekend',
  rivals: 0.35,
  cohorts: ['locals', 'circle', 'collectors', 'visitors'],
  terms: { price: 1200, edition: 50, days: 7, bundle: false, resale: 2 },
  result: {
    through: 0.62,
    collectors: 31,
    settled: 37200,
    firstHours: 9,
    soldOut: false,
    verdict: 'Your circles carry this one.',
  },
  at: T0,
};
const audience = { kind: 'circle' as const, circleId: 'circ-1', label: 'Digital Arts' };
const vet = (
  stage: NonNullable<S['DraftVetting']['stage']>,
  over: Partial<S['DraftVetting']> = {},
): S['DraftVetting'] => ({
  stage,
  rehearsal,
  audience,
  reactions: 0,
  pledges: 0,
  promisedOs: 0,
  openedAt: null,
  pledgingAt: null,
  liveAt: null,
  weoId: null,
  ...over,
});

/** One draft at every stage on the way to live. */
export const lifecycleDrafts: DraftDto[] = [
  {
    _id: 'd-1',
    title: 'Night Market Print',
    coverUrl: null,
    weoType: 'regular',
    format: 'Listing',
    ready: 0.4,
    updatedAt: T0,
  },
  {
    _id: 'd-r',
    title: 'Harbour Lights',
    coverUrl: null,
    weoType: 'regular',
    format: 'Listing',
    ready: 1,
    updatedAt: T0,
    vetting: vet('rehearsed'),
  },
  {
    _id: 'd-a',
    title: 'Paper Moons',
    coverUrl: null,
    weoType: 'regular',
    format: 'Listing',
    ready: 1,
    updatedAt: T0,
    vetting: vet('reacting', { reactions: 7 }),
  },
  {
    _id: 'd-b',
    title: 'Salt Study',
    coverUrl: null,
    weoType: 'regular',
    format: 'Listing',
    ready: 1,
    updatedAt: T0,
    vetting: vet('reacted', { reactions: 12 }),
  },
  {
    _id: 'd-p',
    title: 'Kiln Set',
    coverUrl: null,
    weoType: 'regular',
    format: 'Listing',
    ready: 1,
    updatedAt: T0,
    vetting: vet('pledging', { reactions: 12, pledges: 14, promisedOs: 16800 }),
  },
];

/** The composer's state a complete Listing draft stores (`payload.form`). */
export const fullDraft = (id: string, over: Record<string, unknown> = {}) => ({
  _id: id,
  format: 'Listing',
  title: 'Harbour Lights',
  coverUrl: 'https://cdn.example/harbour.jpg',
  ready: 1,
  payload: {
    form: {
      kind: 'Listing',
      catId: 'cat-1',
      cat: 'Digital arts',
      title: 'Harbour Lights',
      desc: 'A night print of the harbour.',
      media: 'https://cdn.example/harbour.jpg',
      gallery: [],
      tags: [],
      tagDraft: '',
      price: 1200,
      priceMax: 0,
      qty: 1,
      unit: 'piece',
      circ: 50,
      days: 7,
      resell: true,
      goal: 0,
      minPledge: 0,
      reserve: false,
      negotiable: false,
      negotiateOff: 10,
      keepFormat: '',
      ...over,
    },
  },
});

export const vettingCard = (over: Partial<S['VettingCard']> = {}): S['VettingCard'] => ({
  id: 'd-x',
  stage: 'reacting',
  title: 'Tide Charts',
  cover: null,
  format: 'Listing',
  weoType: 'regular',
  os: 1200,
  edition: 50,
  days: 7,
  creator: { id: 'u-ada', name: 'Ada Obi', handle: '@ada', avatarUrl: null, isr: 82 },
  audience: { kind: 'circle', label: 'Digital Arts', circleId: 'circ-1' },
  rehearsed: { world: 'Night market', through: 0.62 },
  reactions: { count: 5, need: 12, notes: [{ note: 'Would collect at 900', os: 900 }] },
  pledges: { count: 0, threshold: 20, promisedOs: 0 },
  mine: { isOwner: false, reaction: null, pledge: null },
  weoId: null,
  ...over,
});

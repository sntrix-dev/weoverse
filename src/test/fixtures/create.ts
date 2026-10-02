import type { AskDto, CategoryDto, TemplateDto, TemplatesDto } from '@/features/create/api/create';

export const pegFixture = { usdAgainstO: 99, usdPerO: 1 / 99 };

export const categoriesFixture: CategoryDto[] = [
  { _id: '651f8c2a3b9c0d12e4567801', name: 'Creating', slug: 'creating', weoCount: 3 },
  { _id: '651f8c2a3b9c0d12e4567802', name: 'Community', slug: 'community', weoCount: 1 },
];

const tpl = (o: Partial<TemplateDto> & Pick<TemplateDto, 'key' | 'name' | 'format'>): TemplateDto => ({
  line: 'A capped run, each one numbered',
  type: 'Product',
  sector: 'Craft',
  category: { id: categoriesFixture[0]!._id, name: 'Creating' },
  os: 4200,
  qty: 60,
  image: 'https://images.unsplash.com/photo-1?w=600&h=450&fit=crop',
  tier: 0,
  live: true,
  plan: null,
  usable: true,
  unlockOs: null,
  ...o,
});

export const templatesFixture = (): TemplatesDto => ({
  templates: [
    tpl({ key: 'tpl-edition', name: 'Signed edition', format: 'Listing' }),
    tpl({ key: 'tpl-generative', name: 'Generative drop', format: 'Drop', line: 'One seed per collector', live: false, os: 1900, qty: 50 }),
    tpl({
      key: 'pro-season',
      name: 'Season pass',
      format: 'Pool',
      line: 'A whole season, one price',
      category: { id: categoriesFixture[1]!._id, name: 'Community' },
      os: 14000,
      qty: 24,
      tier: 1,
      plan: 'Maker',
      usable: false,
      unlockOs: 900,
    }),
  ],
  myTier: { name: 'participant', rank: 1 },
  plans: [{ tier: 1, name: 'Maker', unlockOs: 900, requiresTier: 'player' }],
  locked: 1,
});

export const asksFixture: AskDto[] = [
  {
    _id: '651f8c2a3b9c0d12e45678a1',
    title: 'a hand-bound sketchbook',
    price: { min: 500, max: 1200 },
    deadline: '2099-01-01T00:00:00.000Z',
    status: 'active',
    userId: 'someone-else',
    creator: { _id: 'someone-else', name: 'Ada', profileImage: null },
  },
];

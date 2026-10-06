import type { components } from '@/api/generated/schema';

type S = components['schemas'];

const page = (
  over: Partial<S['CompanyPage']> & Pick<S['CompanyPage'], 'key' | 'label' | 'lead'>,
): S['CompanyPage'] => ({
  body: ['A paragraph.'],
  status: 'published',
  updatedAt: '2026-10-06',
  ...over,
});

export const companyFixture: S['CompanyPage'][] = [
  page({
    key: 'about',
    label: 'About WeO',
    lead: 'O is the protocol. WeO is a network built on it.',
    body: [
      'Everything in the network converts through one fixed peg: 99 Os = $1. No floating internal currency.',
    ],
    facts: [
      ['Peg', '99 Os = $1'],
      ['Live today', 'WeOverse · WeO Flow'],
      ['At launch', 'WeO Stories · WeOnomics'],
    ],
  }),
  page({
    key: 'careers',
    label: 'Careers',
    lead: 'We hire people who would rather remove a screen than add one.',
    roles: [],
    apply: {
      note: 'No roles are listed right now. Tell us what you would bring, and we will reach out when one fits.',
      roles: ['engineering', 'design', 'marketing', 'operations', 'other'],
      experience: ['0-2years', '2-5years', '5-10years', '10+years'],
    },
  }),
  page({
    key: 'privacy',
    label: 'Privacy',
    lead: 'Your standing is public. Everything else is yours.',
    status: 'draft',
  }),
  page({
    key: 'terms',
    label: 'Terms',
    lead: 'Price, terms and fees are always at rest — before you commit.',
    status: 'draft',
  }),
  page({ key: 'cookies', label: 'Cookies', lead: 'One kind, listed.', status: 'draft' }),
];

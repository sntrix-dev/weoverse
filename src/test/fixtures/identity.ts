import type { components } from '@/api/generated/schema';
import { ME } from './community';

type S = components['schemas'];

const ladder = (current: 'member' | 'contributor' | 'steward'): S['TierRung'][] => {
  const rungs = [
    {
      key: 'member',
      n: 1,
      label: 'Member',
      adv: 0.05,
      isr: 0,
      answers: 0,
      need: 'A passport in good standing',
      holds: 'You are in',
      tone: '#3A95F2',
    },
    {
      key: 'contributor',
      n: 2,
      label: 'Contributor',
      adv: 0.1,
      isr: 60,
      answers: 3,
      need: 'ISR 60 and 3 accepted answers',
      holds: 'You show up and deliver',
      tone: '#22C55E',
    },
    {
      key: 'steward',
      n: 3,
      label: 'Steward',
      adv: 0.15,
      isr: 85,
      answers: 10,
      need: 'ISR 85 and 10 accepted answers',
      holds: 'Others lean on your judgement',
      tone: '#D946EF',
    },
  ] as const;
  const at = rungs.findIndex((r) => r.key === current);
  return rungs.map((r, i) => ({
    ...r,
    current: i === at,
    reached: i <= at,
    isrToGo: i <= at ? null : Math.max(0, r.isr - 72),
    answersToGo: i <= at ? null : Math.max(0, r.answers - 4),
  }));
};

export const passportFixture = (over: Partial<S['Passport']> = {}): S['Passport'] => ({
  identity: {
    id: ME,
    passportId: 'WEO-7F3K-22',
    name: 'Sam Rivera',
    handle: '@samr',
    avatarUrl: null,
    where: null,
    bio: 'I make drops.',
    formats: ['Drop'],
    joinedAt: '2024-03-02T10:00:00.000Z',
  },
  standing: {
    isr: 72,
    acceptedAnswers: 4,
    policyVersion: 'isr-1.0.0',
    inputs: [
      { k: 'Verified redemptions', w: 3, do: 'Redeem a WeO and let its creator verify it.', cap: 'Uncapped' },
      {
        k: 'Flows settled on time',
        w: 2,
        do: 'Deliver what you listed inside its own window.',
        cap: 'Per flow',
      },
      { k: 'Open disputes', w: -6, do: 'Answer the dispute.', cap: 'Per dispute' },
    ],
    excludes: ['Follower counts', 'How much you spend'],
    appeal: 'Ask a steward to review any move.',
    moves: null,
    trace: null,
    delta: null,
  },
  tier: {
    ladder: ladder('contributor'),
    current: 'contributor',
    next: 'steward',
    example: { ask: 2400, pay: 2160, off: 240, pct: 10 },
    outside: { label: 'Someone with no standing', note: 'pays the ask', pay: 2400 },
  },
  orbit: [{ id: 'weo-1', title: 'Sunrise Loop', weoType: 'regular', img: null }],
  totals: { available: 1700, circledBy: 2, backs: 1, listed: 3 },
  publicProfile: { collections: true, activity: true, invites: true, contact: 'anyone' },
  ...over,
});

export const graphFixture: S['GraphView'] = {
  circledBy: [
    { id: 'u-ada', name: 'Ada Obi', handle: '@ada', avatarUrl: null, isr: 82 },
    { id: 'u-li', name: 'Li Wen', handle: '@li', avatarUrl: null, isr: 64 },
  ],
  backs: [{ id: 'u-ada', name: 'Ada Obi', handle: '@ada', avatarUrl: null, isr: 82 }],
  vouched: [],
  counts: { circledBy: 2, backs: 1 },
};

const row = (app: boolean, email: boolean, push: boolean) => ({ app, email, push });

export const settingsFixture = (over: Partial<S['SettingsView']> = {}): S['SettingsView'] => ({
  account: {
    name: 'Sam Rivera',
    handle: '@samr',
    email: 'sam@example.test',
    phone: null,
    passportId: 'WEO-7F3K-22',
    manageUrl: 'https://wallet.example.test',
  },
  timezone: 'UTC',
  receipts: true,
  notifications: {
    channels: {
      sales: row(true, true, true),
      bids: row(true, false, true),
      circles: row(true, false, true),
      mentions: row(true, true, true),
      mya: row(true, false, true),
      news: row(true, true, true),
      security: row(true, true, true),
    },
    digest: 'weekly',
    quiet: { on: false, from: '22:00', to: '07:00' },
    emailDelivery: false,
  },
  accountRequest: null,
  ...over,
});

/** The whole O-Wallet read — the shell and Collect use the balance; the wallet page uses all of it. */
export const fullWalletFixture = (): S['WalletView'] => ({
  balance: {
    available: 1700,
    protected: 0,
    pending: 0,
    locked: 0,
    total: 1700,
    heldReason: 'Nothing on this surface holds O back.',
  },
  commitments: { outstanding: 0, holdings: 0, nextDue: null },
  standing: {
    isr: 72,
    acceptedAnswers: 4,
    tier: 'contributor',
    label: 'Contributor',
    advantagePct: 10,
    tone: '#22C55E',
  },
  peg: { osPerDollar: 99, rate: 1 / 99, label: '99 Os = $1', note: 'The same figure for everyone.' },
  power: null,
  activity: { created: 3, sold: 2, resold: 0, earned: 4200, spent: 900, settled: 5 },
  holdings: { collected: 3, listed: 1 },
  ledger: [
    {
      id: 'l-1',
      dir: 'in',
      what: 'Sold Sunrise Loop',
      os: 240,
      state: 'success',
      at: '2026-09-28T10:00:00.000Z',
    },
  ],
  ecosystem: [
    {
      key: 'WeOverse',
      edge: 'Create',
      tone: '#D946EF',
      state: 'live',
      grants: 'Your advantage on every WeO.',
    },
    { key: 'WeO Flow', edge: 'Settle', tone: '#22C55E', state: 'launch', grants: 'Lower fees at launch.' },
  ],
  carries: [['Your ISR', 'The same number everywhere.']],
  never: ['It is never sold.'],
  apps: [
    {
      key: 'weoverse',
      name: 'WeOverse',
      tone: '#D946EF',
      line: 'Make and trade WeOs',
      here: true,
      freeLine: 'Free',
      plans: [{ key: 'pro', name: 'WeOverse Pro', line: 'Unlimited rehearsals', os: 500, payOs: 450 }],
    },
  ],
  plansNote: 'A price list — nothing here starts a subscription.',
});

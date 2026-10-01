/**
 * Every app route in one place. `route` names are the design's route keys (js/pages.js),
 * so tones/labels and later the arrival animation can be looked up by the same key.
 * Build links with the `routes.*` helpers — never hand-write a path string.
 */

// design: src/app.jsx JUMP_TONE / JUMP_LABEL
export const ROUTE_META = {
  create: { label: 'Create', tone: '#22C55E', module: 'M07' },
  discover: { label: 'Discover', tone: '#3A95F2', module: 'M04' },
  collected: { label: 'Collect', tone: '#D946EF', module: 'M06' },
  listed: { label: 'Exchange', tone: '#F7C62B', module: 'M06' },
  hub: { label: 'Community', tone: '#D946EF', module: 'M05' },
  manage: { label: 'Your circles', tone: '#D946EF', module: 'M05' },
  circle: { label: 'Circle', tone: '#D946EF', module: 'M05' },
  thread: { label: 'Thread', tone: '#D946EF', module: 'M05' },
  stewards: { label: 'Stewards', tone: '#3A95F2', module: 'M05' },
  stories: { label: 'Stories', tone: '#F7C62B', module: 'M05' },
  weo: { label: 'WeO', tone: '#3A95F2', module: 'M04' },
  creators: { label: 'Creators', tone: '#3A95F2', module: 'M08' },
  requests: { label: 'Ask', tone: '#22C55E', module: 'M08' },
  tracking: { label: 'Tracking', tone: '#22C55E', module: 'M08' },
  passport: { label: 'Your passport', tone: '#3A95F2', module: 'M09' },
  wallet: { label: 'O-Wallet', tone: '#F7C62B', module: 'M09' },
  settings: { label: 'Settings', tone: '#3A95F2', module: 'M09' },
  notifications: { label: 'Notifications', tone: '#D946EF', module: 'M10' },
  company: { label: 'WeO Global', tone: '#8a6a06', module: 'M10' },
} as const satisfies Record<string, { label: string; tone: string; module: string }>;

export type RouteName = keyof typeof ROUTE_META;

const enc = encodeURIComponent;

export const routes = {
  home: () => '/',
  login: (next?: string) => (next ? `/login?next=${enc(next)}` : '/login'),
  callback: () => '/callback',
  /** `draft` opens a saved draft in the composer (M07) */
  create: (draft?: string) => (draft ? `/create?draft=${enc(draft)}` : '/create'),
  discover: (q?: string) => (q ? `/discover?q=${enc(q)}` : '/discover'),
  collected: () => '/collect',
  listed: () => '/exchange',
  hub: () => '/community',
  manage: () => '/community/circles',
  circle: (circleId: string) => `/community/circles/${enc(circleId)}`,
  thread: (threadId: string) => `/community/threads/${enc(threadId)}`,
  stewards: () => '/community/stewards',
  stories: () => '/community/stories',
  weo: (weoId: string) => `/weos/${enc(weoId)}`,
  creators: (creatorId?: string) => (creatorId ? `/creators/${enc(creatorId)}` : '/creators'),
  requests: (requestId?: string) => (requestId ? `/requests/${enc(requestId)}` : '/requests'),
  tracking: () => '/tracking',
  passport: (section?: string) => (section ? `/passport#${section}` : '/passport'),
  wallet: () => '/wallet',
  settings: (section?: string) => (section ? `/settings#${section}` : '/settings'),
  notifications: () => '/notifications',
  company: (doc?: string) => (doc ? `/company/${enc(doc)}` : '/company'),
  devGallery: () => '/dev/ds',
} as const;

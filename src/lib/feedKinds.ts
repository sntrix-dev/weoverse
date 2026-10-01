/** design: feed-view.jsx FEED_KINDS + feed-data.js KIND — the kinds of post a feed carries. */
export const FEED_KINDS = [
  { k: 'all', label: 'Everything' },
  { k: 'weo', label: 'In motion' },
  { k: 'question', label: 'Questions' },
  { k: 'request', label: 'Requests' },
  { k: 'story', label: 'Stories' },
] as const;

export type FeedKind = Exclude<(typeof FEED_KINDS)[number]['k'], 'all'>;

export const FEED_KIND: Record<FeedKind, { label: string; color: string; hex: string }> = {
  weo: { label: 'In motion', color: 'var(--o-blue)', hex: '#3A95F2' },
  question: { label: 'Open question', color: 'var(--o-violet)', hex: '#D946EF' },
  request: { label: 'Request', color: 'var(--o-green)', hex: '#22C55E' },
  story: { label: 'Story', color: 'var(--o-gold)', hex: '#F7C62B' },
};

import type { NavSummaryDto } from '@/features/shell/model/me';
import { DEFAULT_PREFS, type UiPreferences } from '@/stores/prefs';

/** A `GET /frontend/users/me/nav-summary` payload shaped exactly like weo-3.0's service. */
/** The section intros and walkthroughs (M11), all passed. */
export const ALL_TOURS_SEEN = ['discover', 'collected', 'create', 'hub', 'listed'].flatMap((k) => [
  `intro.${k}`,
  `walk.${k}`,
]);

export const navSummaryFixture = (
  over: Partial<NavSummaryDto> = {},
  prefs: Partial<UiPreferences> = {},
): NavSummaryDto => ({
  identity: {
    id: '69808052344eb80305da8e6d',
    name: 'Mya Rivers',
    handle: '@mya',
    avatarUrl: null,
    weoId: 'OW-4F82C1',
    isr: 86,
    joinedAt: '2024-02-12T08:31:00.000Z',
  },
  wallet: { available: 12480, tier: 'player', tierLabel: 'L2', tierRank: 2 },
  counts: { collected: 38, created: 12, circles: 4, campaigns: 3, followers: 10, following: 7 },
  notifications: { unread: 3 },
  // every intro and walkthrough already met — tests that are about them say otherwise
  uiPreferences: { ...DEFAULT_PREFS, seen: ALL_TOURS_SEEN, ...prefs },
  ...over,
});

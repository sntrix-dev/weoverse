import type { components } from '@/api/generated/schema';
import { ME } from './community';

type S = components['schemas'];

const H = 36e5;
/**
 * Hours ago, kept on the calendar day the rows are grouped by (local time): under a day stays
 * today even just after midnight, a day and a bit is yesterday noon.
 */
const ago = (h: number) => {
  const now = Date.now();
  const today = new Date(now).setHours(0, 0, 0, 0);
  const t = h < 24 ? Math.max(now - h * H, today) : h < 48 ? today - 12 * H : now - h * H;
  return new Date(t).toISOString();
};

const row = (
  over: Partial<S['NotificationListRow']> &
    Pick<S['NotificationListRow'], '_id' | 'title' | 'message' | 'category'>,
): S['NotificationListRow'] => ({
  type: 'info',
  recipient: ME,
  read: false,
  sendPush: true,
  createdAt: ago(1),
  target: null,
  ...over,
});

const zero = { total: 0, unread: 0 };

export const notificationsFixture = (): S['NotificationListData'] => ({
  notifications: [
    row({
      _id: 'n-1',
      title: 'Ada Obi just listed',
      message: 'Sunrise Loop',
      category: 'weo',
      createdAt: ago(0.5),
      sender: { _id: 'u-ada', fullName: 'Ada Obi', creatorName: 'ada', profileImage: null },
      target: { kind: 'weo', id: 'weo-1' },
    }),
    row({
      _id: 'n-2',
      title: 'Top-up successful',
      message: '1,000 O credited to your wallet.',
      category: 'wallet',
      type: 'success',
      read: true,
      createdAt: ago(30),
      target: { kind: 'wallet', id: null },
    }),
    row({
      _id: 'n-3',
      title: 'Your report was reviewed',
      message: 'Thanks — a steward looked at it.',
      category: 'system',
      createdAt: ago(24 * 10),
      target: null,
    }),
  ],
  total: 3,
  page: 1,
  unReadCount: 2,
  totalPages: 1,
  categories: {
    weo: { total: 1, unread: 1 },
    'weo-request': zero,
    collection: zero,
    payment: zero,
    resell: zero,
    wallet: { total: 1, unread: 0 },
    general: zero,
    community: zero,
    system: { total: 1, unread: 1 },
  },
});

import type { components } from '@/api/generated/schema';
import { ME } from './community';

type S = components['schemas'];

const H = 36e5;
const ago = (h: number) => new Date(Date.now() - h * H).toISOString();

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

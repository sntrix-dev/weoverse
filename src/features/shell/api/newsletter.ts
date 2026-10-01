import { api, ApiError } from '@/api/client';

/**
 * `POST /frontend/email-subscription/subscribe` (public). An address that is already on
 * the list answers 400 "Email is already subscribed" — for the footer that is a success.
 */
export async function subscribeEmail(email: string): Promise<'subscribed' | 'already'> {
  try {
    await api.post('/frontend/email-subscription/subscribe', { email }, { auth: false });
    return 'subscribed';
  } catch (err) {
    if (err instanceof ApiError && err.status === 400 && /already subscribed/i.test(err.message))
      return 'already';
    throw err;
  }
}

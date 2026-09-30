import { http, HttpResponse } from 'msw';
import { apiRoot } from '@/lib/env';

/** Wraps data in the backend envelope (weo-3.0 ResponseHandler.success). */
export const ok = <T>(data: T, message = 'OK') => HttpResponse.json({ success: true, message, data });

/** ResponseHandler.error shape. */
export const fail = (
  status: number,
  message: string,
  errors: { field: string; message: string }[] | null = null,
) => HttpResponse.json({ success: false, message, data: null, error: message, errors }, { status });

export const url = (path: string) => `${apiRoot}${path}`;

/** Default handlers shared by every test; tests add their own with server.use(...). */
export const handlers = [
  http.post(url('/frontend/auth/new_access_token'), () => fail(401, 'Invalid refresh token')),
];

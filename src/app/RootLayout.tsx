import { Outlet, ScrollRestoration } from 'react-router';
import { AckRipple } from '@/components/feedback/AckRipple';
import { ExternalGate } from '@/components/feedback/ExternalGate';
import { Toasts } from '@/components/feedback/Toasts';
import { useApplyPrefs } from './useApplyPrefs';

/** Every route, signed in or not: theme on <html>, scroll to top on navigation, feedback layer. */
export function RootLayout() {
  useApplyPrefs();
  return (
    <>
      <Outlet />
      <ScrollRestoration />
      <AckRipple />
      <ExternalGate />
      <Toasts />
    </>
  );
}

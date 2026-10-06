import { Outlet, ScrollRestoration } from 'react-router';
import { AccountGate } from '@/components/feedback/AccountGate';
import { AckRipple } from '@/components/feedback/AckRipple';
import { ExternalGate } from '@/components/feedback/ExternalGate';
import { Toasts } from '@/components/feedback/Toasts';
import { useApplyPrefs } from './useApplyPrefs';
import { useConnectivity } from './useConnectivity';
import { useModalFocus } from './useModalFocus';

/** Every route, signed in or not: theme on <html>, scroll to top on navigation, feedback layer. */
export function RootLayout() {
  useApplyPrefs();
  useConnectivity();
  useModalFocus();
  return (
    <>
      <Outlet />
      <ScrollRestoration />
      <AckRipple />
      <ExternalGate />
      <Toasts />
      <AccountGate />
    </>
  );
}

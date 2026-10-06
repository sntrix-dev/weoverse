import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { accountState, useAccountBlock, type AccountBlock } from '@/api/accountState';
import { Button } from '@/design-system';
import { useLogout } from '@/features/shell/useLogout';
import s from './ExternalGate.module.css';

const COPY: Record<AccountBlock['code'], { title: string; note: string }> = {
  ACCOUNT_SUSPENDED: {
    title: 'Your account is paused',
    note: 'Your WeOs, Os and passport are kept as they are. Nothing more can happen on this account until it is active again.',
  },
  ACCOUNT_BANNED: {
    title: 'Your account is closed',
    note: 'This account can no longer use the WeOverse.',
  },
  ACCOUNT_DELETED: {
    title: 'Your account was deleted',
    note: 'This account is no longer on the WeOverse.',
  },
};

const DEACTIVATED = 'Deactivated at your request';

/**
 * A suspended, banned or deleted account (the backend's 403 `ACCOUNT_*`): said once, over every
 * screen, with the reason staff gave and the one way on — sign out (M12). Not dismissable: every
 * request behind it would be refused the same way.
 */
export function AccountGate() {
  const block = useAccountBlock();
  const logout = useLogout();
  const card = useRef<HTMLDivElement>(null);
  const shown = !!block;
  useEffect(() => {
    if (shown) card.current?.querySelector('button')?.focus();
  }, [shown]);
  if (!block) return null;
  const deactivated = block.code === 'ACCOUNT_SUSPENDED' && block.reason === DEACTIVATED;
  const copy = deactivated
    ? {
        title: 'Your account is deactivated',
        note: 'You asked us to deactivate it, and we did. Your WeOs, Os and passport are kept; ask us to turn it back on any time.',
      }
    : COPY[block.code];
  const reason = deactivated ? null : block.reason;
  const signOut = () => {
    accountState.clear();
    void logout();
  };
  return createPortal(
    <div className={s.scrim} role="presentation">
      <div
        ref={card}
        className={s.card}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="weo-account-gate"
      >
        <div>
          <p className={s.eyebrow}>Your WeO account</p>
          <h3 className={s.title} id="weo-account-gate">
            {copy.title}
          </h3>
          <p className={s.note}>{copy.note}</p>
        </div>
        {reason && <div className={s.url}>{reason}</div>}
        <div className={s.actions}>
          <Button size="sm" variant="primary" tone="violet" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

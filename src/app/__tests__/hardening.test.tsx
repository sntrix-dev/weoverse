import { onlineManager } from '@tanstack/react-query';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { accountState } from '@/api/accountState';
import { tokens } from '@/api/tokens';
import { ok, url } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { renderApp } from '@/test/renderApp';
import { useModalFocus } from '../useModalFocus';

afterEach(() => {
  tokens.clear();
  accountState.clear();
  onlineManager.setOnline(true);
});

/** `authenticate`'s refusal for an account that is not active. */
const refused = (code: string, message: string, reason?: string) =>
  http.get(url('/frontend/users/me/nav-summary'), () =>
    HttpResponse.json({ success: false, message, data: { code, status: 'x', reason } }, { status: 403 }),
  );

describe('account states (M12)', () => {
  it('a suspended account is said once, over everything, with the reason and a way out', async () => {
    const user = userEvent.setup();
    renderApp('/community');
    server.use(
      refused('ACCOUNT_SUSPENDED', 'Your account has been suspended.', 'Repeated policy violations.'),
      http.post(url('/frontend/auth/logout'), () => ok(null)),
    );
    const gate = await screen.findByRole('alertdialog', { name: 'Your account is paused' });
    expect(within(gate).getByText('Repeated policy violations.')).toBeInTheDocument();
    await waitFor(() => expect(within(gate).getByRole('button', { name: 'Sign out' })).toHaveFocus());
    await user.click(within(gate).getByRole('button', { name: 'Sign out' }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    expect(tokens.hasSession()).toBe(false);
  });

  it('a deactivation you asked for says so, without repeating the reason', async () => {
    renderApp('/community');
    server.use(refused('ACCOUNT_SUSPENDED', 'Suspended.', 'Deactivated at your request'));
    const gate = await screen.findByRole('alertdialog', { name: 'Your account is deactivated' });
    expect(within(gate).queryByText('Deactivated at your request')).not.toBeInTheDocument();
  });

  it('a deleted account, and nothing for an ordinary 403', () => {
    accountState.report(403, 'Forbidden', { code: 'NOT_YOURS' });
    accountState.report(500, 'x', { code: 'ACCOUNT_DELETED' });
    expect(accountState.get()).toBeNull();
    accountState.report(403, 'Your account has been removed.', { code: 'ACCOUNT_DELETED' });
    expect(accountState.get()).toMatchObject({ code: 'ACCOUNT_DELETED', reason: null });
  });
});

describe('offline (M12)', () => {
  it('says when the connection drops and when it is back', async () => {
    renderApp('/community');
    await screen.findByRole('heading', { level: 1, name: 'Community' });
    act(() => onlineManager.setOnline(false));
    expect(await screen.findByText('You’re offline — what you see may be out of date')).toBeInTheDocument();
    act(() => onlineManager.setOnline(true));
    expect(await screen.findByText('Back online')).toBeInTheDocument();
  });
});

function Harness() {
  useModalFocus();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open</button>
      <button>Behind</button>
      {open &&
        createPortal(
          <div role="dialog" aria-modal="true" aria-label="Sheet">
            <button>First</button>
            <button onClick={() => setOpen(false)}>Close</button>
          </div>,
          document.body,
        )}
    </>
  );
}

describe('modal focus (M12)', () => {
  it('moves into a sheet, keeps Tab inside it, and returns to where it was', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Open' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'First' })).toHaveFocus());
    await user.tab();
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'First' })).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Open' })).toHaveFocus());
  });
});

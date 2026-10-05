import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';
import { tokens } from '@/api/tokens';
import { settingsFixture } from '@/test/fixtures/identity';
import { ok, url } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { renderApp } from '@/test/renderApp';
import type { SettingsDto } from '../api/settings';

afterEach(() => tokens.clear());

/** A settings store the handlers share, so a save is what the next read returns. */
function store(initial: SettingsDto = settingsFixture()) {
  let s = initial;
  const patches: unknown[] = [];
  server.use(
    http.get(url('/frontend/users/me/settings'), () => ok(s)),
    http.patch(url('/frontend/users/me/settings'), async ({ request }) => {
      const b = (await request.json()) as {
        timezone?: string;
        receipts?: boolean;
        notifications?: {
          channels?: Record<string, object>;
          digest?: SettingsDto['notifications']['digest'];
          quiet?: object;
        };
      };
      patches.push(b);
      const ch = { ...s.notifications.channels } as Record<string, object>;
      for (const [g, r] of Object.entries(b.notifications?.channels ?? {})) ch[g] = { ...ch[g], ...r };
      s = {
        ...s,
        timezone: b.timezone ?? s.timezone,
        receipts: b.receipts ?? s.receipts,
        notifications: {
          ...s.notifications,
          channels: ch as SettingsDto['notifications']['channels'],
          digest: b.notifications?.digest ?? s.notifications.digest,
          quiet: { ...s.notifications.quiet, ...(b.notifications?.quiet ?? {}) },
        },
      };
      return ok(s);
    }),
    http.post(url('/frontend/users/me/account-request'), async ({ request }) => {
      const b = (await request.json()) as { kind: 'deactivate' | 'delete'; reason?: string };
      patches.push({ request: b });
      s = {
        ...s,
        accountRequest: { kind: b.kind, reason: b.reason ?? null, requestedAt: '2026-10-05T10:00:00.000Z' },
      };
      return ok(s);
    }),
    http.delete(url('/frontend/users/me/account-request'), () => {
      patches.push('cancel');
      s = { ...s, accountRequest: null };
      return ok(s);
    }),
  );
  return patches;
}

describe('settings', () => {
  it('shows the account, and sends email, phone and password to O-Wallet', async () => {
    const user = userEvent.setup();
    store();
    renderApp('/settings');
    expect(await screen.findByRole('heading', { level: 1, name: 'Settings' })).toBeInTheDocument();
    const account = await screen.findByRole('region', { name: 'Account' });
    expect(within(account).getByText('sam@example.test')).toBeInTheDocument();
    expect(within(account).getByText('# WEO-7F3K-22')).toBeInTheDocument();
    // no language picker, no ISR switch (always public)
    expect(screen.queryByRole('combobox', { name: 'Language' })).not.toBeInTheDocument();
    expect(screen.queryByRole('switch', { name: /Show my ISR/ })).not.toBeInTheDocument();
    await user.click(within(account).getAllByRole('button', { name: 'Change' })[1]!);
    const gate = await screen.findByRole('dialog');
    expect(within(gate).getByText('wallet.example.test', { exact: false })).toBeInTheDocument();
    expect(within(gate).getByRole('button', { name: 'Open O-Wallet' })).toBeInTheDocument();
  });

  it('saves notification choices — security email stays on', async () => {
    const user = userEvent.setup();
    const patches = store();
    renderApp('/settings');
    const box = await screen.findByRole('checkbox', { name: 'Bids & offers · Email' });
    expect(box).not.toBeChecked();
    await user.click(box);
    await waitFor(() =>
      expect(patches).toEqual([{ notifications: { channels: { bids: { email: true } } } }]),
    );
    expect(box).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Security alerts · Email' })).toBeDisabled();
    expect(screen.getByText(/email is not sent yet/)).toBeInTheDocument();

    await user.click(screen.getByRole('switch', { name: 'Quiet hours' }));
    await waitFor(() => expect(patches.at(-1)).toEqual({ notifications: { quiet: { on: true } } }));
    expect(await screen.findByLabelText('Quiet from')).toHaveValue('22:00');

    await user.click(
      within(screen.getByRole('group', { name: 'Email digest' })).getByRole('button', { name: 'Daily' }),
    );
    await waitFor(() => expect(patches.at(-1)).toEqual({ notifications: { digest: 'daily' } }));
  });

  it('asks to delete only after the word is typed, and the request can be taken back', async () => {
    const user = userEvent.setup();
    const patches = store();
    renderApp('/settings');
    await user.click(await screen.findByRole('button', { name: 'Delete account' }));
    const sheet = await screen.findByRole('dialog', { name: /Delete your account/ });
    await user.click(within(sheet).getByRole('button', { name: 'Request deletion' }));
    expect(within(sheet).getByRole('alert')).toHaveTextContent('Type DELETE to confirm');
    expect(patches).toEqual([]);

    await user.type(within(sheet).getByRole('textbox', { name: 'Type DELETE to confirm' }), 'delete');
    await user.selectOptions(
      within(sheet).getByRole('combobox', { name: 'Why are you leaving?' }),
      'Taking a break',
    );
    await user.click(within(sheet).getByRole('button', { name: 'Request deletion' }));
    await waitFor(() => expect(patches).toEqual([{ request: { kind: 'delete', reason: 'Taking a break' } }]));
    expect(await screen.findByText('Deletion requested')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancel the request' }));
    await waitFor(() => expect(patches.at(-1)).toBe('cancel'));
    expect(await screen.findByRole('button', { name: 'Delete account' })).toBeInTheDocument();
  });

  it('appearance writes the shell preferences', async () => {
    const user = userEvent.setup();
    store();
    const prefs: unknown[] = [];
    renderApp('/settings');
    server.use(
      http.patch(url('/frontend/users/me/preferences'), async ({ request }) => {
        const b = (await request.json()) as object;
        prefs.push(b);
        return ok(b);
      }),
    );
    await user.click(
      within(await screen.findByRole('group', { name: 'Theme' })).getByRole('button', { name: 'Dark' }),
    );
    await waitFor(() => expect(prefs).toContainEqual(expect.objectContaining({ theme: 'dark' })));
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  });
});

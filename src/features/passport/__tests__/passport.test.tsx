import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { tokens } from '@/api/tokens';
import { passportFixture } from '@/test/fixtures/identity';
import { fail, ok, url } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { renderApp } from '@/test/renderApp';
import { askFromHere, joinedLabel, reachLine } from '../model/passport';

afterEach(() => {
  tokens.clear();
  vi.restoreAllMocks();
});

describe('passport model', () => {
  const p = passportFixture();
  const [member, contributor, steward] = p.tier.ladder;
  it('says how each rung is reached from where you stand', () => {
    expect(reachLine(contributor!)).toBe('You show up and deliver');
    expect(reachLine(member!)).toBe('Held below you');
    expect(reachLine(steward!)).toBe('13 more ISR from here');
    expect(askFromHere(steward!)).toBe('13 more ISR · 6 more accepted answers');
    expect(reachLine({ ...steward!, isrToGo: 0 })).toBe('ISR is there — answers still needed');
  });
  it('prints the issue date as month and year', () => {
    expect(joinedLabel('2024-03-02T10:00:00.000Z')).toBe('Mar 2024');
    expect(joinedLabel(null)).toBe('');
  });
});

describe('passport page', () => {
  it('leads with who you are, your standing and the ladder — with no invented week', async () => {
    renderApp('/passport');
    expect(await screen.findByRole('heading', { level: 1, name: 'Sam Rivera' })).toBeInTheDocument();
    expect(screen.getByText('@samr')).toBeInTheDocument();
    expect(screen.getByText('# WEO-7F3K-22')).toBeInTheDocument();
    expect(screen.getByText('Your passport · isr-1.0.0')).toBeInTheDocument();
    // moves and trace are null: say so rather than drawing a week
    expect(screen.getByText('Not tracked yet')).toBeInTheDocument();
    // the ladder, with your rung
    expect(screen.getByRole('heading', { level: 3, name: 'Contributor' })).toBeInTheDocument();
    expect(screen.getByText('You are here')).toBeInTheDocument();
    expect(screen.getByText('13 more ISR from here')).toBeInTheDocument();
    expect(screen.getByText('On a WeO listed at O 2,400')).toBeInTheDocument();
    // the graph
    expect(await screen.findAllByRole('button', { name: 'Open Ada Obi' })).toHaveLength(2);
    expect(screen.getByText(/Vouches are not recorded yet/)).toBeInTheDocument();
  });

  it('edits the profile and shows a taken handle', async () => {
    const user = userEvent.setup();
    const bodies: unknown[] = [];
    server.use(
      http.patch(url('/frontend/users/me/profile'), async ({ request }) => {
        const b = (await request.json()) as { handle?: string; name?: string };
        bodies.push(b);
        if (b.handle === '@ada') return fail(409, 'That handle is taken');
        return ok(
          passportFixture({ identity: { ...passportFixture().identity, name: b.name ?? 'Sam Rivera' } }),
        );
      }),
    );
    renderApp('/passport');
    await user.click(await screen.findByRole('button', { name: 'Passport settings' }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Edit profile' }));
    const sheet = await screen.findByRole('dialog', { name: /Edit your profile/ });
    const handle = within(sheet).getByRole('textbox', { name: 'Handle' });
    await user.clear(handle);
    await user.type(handle, '@ada');
    await user.click(within(sheet).getByRole('button', { name: 'Save' }));
    expect(await within(sheet).findByRole('alert')).toHaveTextContent('That handle is taken');

    await user.clear(handle);
    await user.type(handle, '@samr');
    const name = within(sheet).getByRole('textbox', { name: 'Display name' });
    await user.clear(name);
    await user.type(name, 'Sam R');
    await user.click(within(sheet).getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(bodies.at(-1)).toEqual({ name: 'Sam R' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Sam R' })).toBeInTheDocument();
  });

  it('switches what the public page shows, and downloads your data', async () => {
    const user = userEvent.setup();
    const patches: unknown[] = [];
    let exported = 0;
    server.use(
      http.patch(url('/frontend/users/me/public-profile'), async ({ request }) => {
        const b = (await request.json()) as object;
        patches.push(b);
        return ok({ ...passportFixture().publicProfile, ...b });
      }),
      http.get(url('/frontend/users/me/export'), () => {
        exported += 1;
        return ok({ profile: { name: 'Sam Rivera' } });
      }),
    );
    const create = vi.fn(() => 'blob:x');
    Object.assign(URL, { createObjectURL: create, revokeObjectURL: vi.fn() });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    renderApp('/passport');
    await user.click(await screen.findByRole('button', { name: 'Passport settings' }));
    const sheet = await screen.findByRole('dialog');
    const sw = within(sheet).getByRole('switch', { name: 'Show my collections' });
    expect(sw).toHaveAttribute('aria-checked', 'true');
    await user.click(sw);
    await waitFor(() => expect(patches).toEqual([{ collections: false }]));
    expect(sw).toHaveAttribute('aria-checked', 'false');

    await user.click(within(sheet).getByRole('button', { name: 'Download' }));
    await waitFor(() => expect(exported).toBe(1));
    await waitFor(() => expect(create).toHaveBeenCalled());
  });
});

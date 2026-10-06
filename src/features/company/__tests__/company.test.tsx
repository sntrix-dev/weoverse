import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';
import { tokens } from '@/api/tokens';
import { ok, url } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { renderApp } from '@/test/renderApp';

afterEach(() => tokens.clear());

describe('company pages', () => {
  it('reads the page from the backend, with the settlement peg', async () => {
    renderApp('/company/about');
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'O is the protocol. WeO is a network built on it.',
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/99 Os = \$1/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Draft/)).not.toBeInTheDocument();
  });

  it('switches pages with the chips and the URL; the legal pages say they are drafts', async () => {
    const user = userEvent.setup();
    const { router } = renderApp('/company');
    const nav = await screen.findByRole('navigation', { name: 'Company pages' });
    await user.click(within(nav).getByRole('link', { name: 'Privacy' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/company/privacy'));
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Your standing is public. Everything else is yours.',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Draft — this page is being reviewed/)).toBeInTheDocument();
  });

  it('Careers lists no openings and sends the interest form', async () => {
    const user = userEvent.setup();
    const sent: unknown[] = [];
    server.use(
      http.post(url('/weo-website/careers-module'), async ({ request }) => {
        sent.push(await request.json());
        return ok({ id: 'app-1' }, 'Application submitted successfully');
      }),
    );
    renderApp('/company/careers');
    expect(await screen.findByText(/No roles are listed right now/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ask about it' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tell us about you' }));
    const sheet = await screen.findByRole('dialog', { name: /Tell us about you/ });
    // name and email come from your account
    await waitFor(() =>
      expect(within(sheet).getByRole('textbox', { name: 'Email' })).toHaveValue('sam@example.test'),
    );
    await user.selectOptions(within(sheet).getByRole('combobox', { name: 'What you do' }), 'design');
    await user.type(
      within(sheet).getByRole('textbox', { name: 'A link to your work (optional)' }),
      'portfolio',
    );
    await user.click(within(sheet).getByRole('button', { name: 'Send' }));
    expect(within(sheet).getByRole('alert')).toHaveTextContent('A link starts with https://');
    await user.clear(within(sheet).getByRole('textbox', { name: 'A link to your work (optional)' }));
    await user.type(
      within(sheet).getByRole('textbox', { name: 'A link to your work (optional)' }),
      'https://sam.example.test',
    );
    await user.click(within(sheet).getByRole('button', { name: 'Send' }));
    await waitFor(() =>
      expect(sent).toEqual([
        {
          name: 'Sam Rivera',
          email: 'sam@example.test',
          role: 'design',
          experience: '0-2years',
          portfolio: 'https://sam.example.test',
        },
      ]),
    );
  });
});

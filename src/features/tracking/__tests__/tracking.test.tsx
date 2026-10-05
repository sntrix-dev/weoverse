import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';
import { tokens } from '@/api/tokens';
import { ok, url } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { renderApp } from '@/test/renderApp';

afterEach(() => tokens.clear());

describe('tracking', () => {
  it('lists tracked WeOs with what changed, and tracked creators', async () => {
    const user = userEvent.setup();
    renderApp('/tracking');
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'What you are watching, and why it matters this week',
      }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Ask moved O 2,000 → O 1,900')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Creators 1/ }));
    expect(await screen.findByText('1 new WeO since you started tracking · 4 WeOs open')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '✓ Tracking' })).toBeInTheDocument();
  });

  it('a WeO is tracked from its page', async () => {
    const user = userEvent.setup();
    server.use(
      http.get(url('/frontend/me/tracking'), () =>
        ok({ weos: [], creators: [], counts: { weos: 0, creators: 0 } }),
      ),
    );
    const hits: string[] = [];
    server.use(
      http.post(url('/frontend/me/tracking/weos/:id'), ({ params }) => {
        hits.push(String(params.id));
        return ok({ tracked: true });
      }),
    );
    renderApp('/weos/weo-1');
    await user.click(await screen.findByRole('button', { name: /Track it/ }));
    await waitFor(() => expect(hits).toEqual(['weo-1']));
  });

  it('says how to start when nothing is tracked', async () => {
    server.use(
      http.get(url('/frontend/me/tracking'), () =>
        ok({ weos: [], creators: [], counts: { weos: 0, creators: 0 } }),
      ),
    );
    renderApp('/tracking');
    expect(await screen.findByText('Nothing tracked yet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go to the floor' })).toBeInTheDocument();
  });
});

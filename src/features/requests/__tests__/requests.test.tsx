import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';
import { tokens } from '@/api/tokens';
import { myWeosFixture } from '@/test/fixtures/community';
import { briefsFixture } from '@/test/fixtures/people';
import { ok, url } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { renderApp } from '@/test/renderApp';
import { briefModel, closesIn, offerRange } from '../model/briefs';

afterEach(() => tokens.clear());

describe('requests · model', () => {
  const now = Date.parse('2026-07-28T12:00:00Z');
  it('reads a brief: sentence case, budget at its top, closes in days or hours', () => {
    const [a, b] = briefsFixture(now).map((r) => briefModel(r, now));
    expect(a).toMatchObject({
      title: 'A hand-bound sketchbook',
      budget: 1200,
      budgetMin: 500,
      closes: '5d',
      category: 'Creating',
    });
    expect(a!.circle).toMatchObject({ name: 'Digital Arts' });
    expect(b).toMatchObject({ mine: true, closes: '20h', circle: null });
    expect(closesIn('2026-07-28T11:00:00Z', now)).toBe('closed');
  });
  it('the offer dial runs 40%–160% of the budget on a step that fits', () => {
    expect(offerRange(1200)).toEqual({ start: 1200, min: 480, max: 1920, lo: 900, hi: 1260, step: 10 });
    expect(offerRange(96000).step).toBe(1000);
  });
});

describe('requests · the page', () => {
  it('lists open briefs as cards; a card opens its panel and the URL', async () => {
    const user = userEvent.setup();
    const { router } = renderApp('/requests');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Someone wants it made' }),
    ).toBeInTheDocument();
    await user.click(await screen.findByRole('button', { name: 'A hand-bound sketchbook — open the brief' }));
    expect(router.state.location.pathname).toBe('/requests/651f8c2a3b9c0d12e45678a1');
    expect(await screen.findByText('Request · Digital Arts')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Offer one you hold' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Make a WeO for this brief/ })).toBeInTheDocument();
  });

  it('your own brief shows the offers in, and you can stop taking offers', async () => {
    const user = userEvent.setup();
    const closes: string[] = [];
    server.use(
      http.post(url('/frontend/request-weos/:id/close'), ({ params }) => {
        closes.push(String(params.id));
        return ok({ id: String(params.id), status: 'closed', open: false });
      }),
    );
    renderApp('/requests/651f8c2a3b9c0d12e45678a2');
    expect(await screen.findByText('Zine cover, two colours')).toBeInTheDocument();
    expect(screen.getByText('O 297')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Close this brief' }));
    await user.click(screen.getByRole('button', { name: 'Yes, stop taking offers' }));
    await waitFor(() => expect(closes).toEqual(['651f8c2a3b9c0d12e45678a2']));
  });

  it('Make a WeO for this opens the composer seeded with the brief, posting to that ask', async () => {
    const user = userEvent.setup();
    const { router } = renderApp('/requests/651f8c2a3b9c0d12e45678a1');
    await user.click(await screen.findByRole('button', { name: /Make a WeO for this brief/ }));
    await waitFor(() => expect(router.state.location.search).toBe('?forRequest=651f8c2a3b9c0d12e45678a1'));
    expect(await screen.findByDisplayValue('A hand-bound sketchbook')).toBeInTheDocument();
  });
});

describe('requests · offer one you hold', () => {
  it('offers one of your WeOs at your figure to that brief', async () => {
    const user = userEvent.setup();
    server.use(
      http.get(url('/frontend/community/my-weos'), () =>
        ok({
          items: [
            ...myWeosFixture,
            { ...myWeosFixture[0]!, id: 'weo-1', weoType: 'regular', title: 'Sunrise Loop' },
          ],
          nextBefore: null,
        }),
      ),
    );
    const bodies: Record<string, unknown>[] = [];
    const paths: string[] = [];
    server.use(
      http.post(url('/frontend/request-weos/:id/accept'), async ({ request, params }) => {
        paths.push(String(params.id));
        bodies.push((await request.json()) as Record<string, unknown>);
        return ok({ _id: 'weo-answer' });
      }),
    );
    renderApp('/requests/651f8c2a3b9c0d12e45678a1');
    await user.click(await screen.findByRole('button', { name: 'Offer one you hold' }));
    const pick = await screen.findByRole('radio', { name: 'Sunrise Loop' });
    expect(pick).toHaveAttribute('aria-checked', 'true');
    expect(screen.queryByRole('radio', { name: 'Tide Pool' })).toBeNull(); // a Pool cannot answer a brief
    await user.click(screen.getAllByRole('button', { name: 'Make an offer' })[0]!);
    await user.click(await screen.findByRole('button', { name: 'Review it' }));
    await user.click(await screen.findByRole('button', { name: 'Confirm' }));
    await waitFor(() => expect(paths).toEqual(['651f8c2a3b9c0d12e45678a1']), { timeout: 4000 });
    expect(bodies[0]).toMatchObject({ title: 'Sunrise Loop' });
    expect(bodies[0]).not.toHaveProperty('requestedId');
    expect(bodies[0]).not.toHaveProperty('weoType');
  });
});

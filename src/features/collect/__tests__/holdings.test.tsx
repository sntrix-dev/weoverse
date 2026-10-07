import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { tokens } from '@/api/tokens';
import { collectionsSnapshotFixture, holdingRow, resellQuoteFixture } from '@/test/fixtures/holdings';
import { ok, url } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { renderApp } from '@/test/renderApp';
import { holdingModel, needsYou } from '../model/holdings';

afterEach(() => tokens.clear());

const state = (over: Record<string, unknown> = {}) => ({
  collectionId: 'col-1',
  status: 'delivered',
  redeemedAt: null,
  disputedAt: null,
  disputeReportId: null,
  ...over,
});

describe('holdings model', () => {
  it('speaks Os and the design’s kinds; a missing value falls back to what was paid', () => {
    const h = holdingModel(holdingRow({ kind: 'entered', valueNow: null, paid: 1200 }));
    expect(h.kind).toBe('Entries');
    expect(h.current).toBe(1200);
    expect(holdingModel(holdingRow({ disputedAt: '2026-10-01T00:00:00Z' })).note).toMatch(/Dispute open/);
  });

  it('asks you to confirm a fresh regular holding, offers a resale on a riser, and points a backer to the report', () => {
    const list = collectionsSnapshotFixture().rows.map((r) => holdingModel(r));
    const t = needsYou(list);
    expect(t.map((x) => [x.h.name, x.kind])).toEqual([
      ['Sunrise Loop', 'receive'],
      ['Hand-Thrown Mug', 'resell'],
      ['Block Party Fund', 'report'],
    ]);
    // once confirmed (or disputed) it stops asking
    const done = holdingModel(holdingRow({ redeemedAt: '2026-10-02T00:00:00Z', valueNow: 1900 }));
    expect(needsYou([done])).toEqual([]);
  });
});

describe('collect page', () => {
  it('shows the stats, what needs you, your holdings by format, the snapshot and the wallet', async () => {
    const user = userEvent.setup();
    const { container, router } = renderApp('/collect');
    expect(await screen.findByRole('heading', { level: 1, name: 'Collect' })).toBeInTheDocument();
    expect(await screen.findByText('3 things waiting on you')).toBeInTheDocument();
    expect(screen.getByText('Did Sunrise Loop arrive?')).toBeInTheDocument();
    expect(screen.getByText('Hand-Thrown Mug would fetch more today')).toBeInTheDocument();
    // figures are Os: value now and the uplift
    expect(screen.getByText('10,520')).toBeInTheDocument();
    expect(screen.getAllByText('820').length).toBeGreaterThan(0);

    const held = container.querySelector('#c-held') as HTMLElement;
    expect(within(held).getAllByRole('heading', { level: 3 })).toHaveLength(4);
    await user.click(within(held).getByRole('button', { name: /^Pool/ }));
    expect(
      within(held)
        .getAllByRole('heading', { level: 3 })
        .map((h) => h.textContent),
    ).toEqual(['Block Party Fund']);

    // a holding opens its WeO, not the collection row
    await user.click(within(held).getByRole('button', { name: 'Open Block Party Fund' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/weos/w-3'));
  });

  it('confirms receipt, and a dispute goes through the gate', async () => {
    const redeemed = vi.fn();
    const disputed = vi.fn();
    let snap = collectionsSnapshotFixture();
    server.use(
      http.get(url('/frontend/me/collections/snapshot'), () => ok(snap)),
      http.post(url('/frontend/me/collections/:id/redeem'), ({ params }) => {
        redeemed(params.id);
        snap = {
          ...snap,
          rows: snap.rows.map((r) =>
            r.id === params.id ? { ...r, redeemedAt: new Date().toISOString() } : r,
          ),
        };
        return ok(state({ redeemedAt: new Date().toISOString() }));
      }),
      http.post(url('/frontend/me/collections/:id/dispute'), async ({ params, request }) => {
        disputed(params.id, await request.json());
        return ok(state({ disputedAt: new Date().toISOString() }));
      }),
    );
    const user = userEvent.setup();
    renderApp('/collect');
    await screen.findByText('Did Sunrise Loop arrive?');

    await user.click(screen.getByRole('button', { name: 'Something is wrong' }));
    const gate = await screen.findByRole('dialog', { name: 'Report a problem' });
    await user.click(within(gate).getByRole('button', { name: 'Open a dispute' }));
    await waitFor(() => expect(disputed).toHaveBeenCalledWith('col-1', { reason: 'other' }));

    await user.click(screen.getByRole('button', { name: 'Received' }));
    await waitFor(() => expect(redeemed).toHaveBeenCalledWith('col-1'));
    await waitFor(() => expect(screen.queryByText('Did Sunrise Loop arrive?')).toBeNull());
  });

  it('relists a holding through the quote: your ask in Os, no fee lines', async () => {
    const posted = vi.fn();
    server.use(
      http.post(url('/frontend/weos/:id/resell'), async ({ params, request }) => {
        posted(params.id, await request.json());
        return ok({ resold: { _id: 'w-new' }, resellAudit: { _id: 'ra-1' } }, 'WeO listed for resale');
      }),
    );
    const user = userEvent.setup();
    renderApp('/collect');
    await screen.findByText('Hand-Thrown Mug would fetch more today');
    await user.click(screen.getByRole('button', { name: 'Resell Sunrise Loop' }));
    const dialog = await screen.findByRole('dialog', { name: 'Sunrise Loop' });
    expect(within(dialog).getByText(/You paid O 1,900 · worth O 2,280 today/)).toBeInTheDocument();
    await user.click(within(dialog).getAllByRole('button', { name: 'Relist it' })[0]!);
    await user.click(within(dialog).getByRole('button', { name: 'Review it' }));
    expect(within(dialog).getByText('Your ask · you receive')).toBeInTheDocument();
    expect(within(dialog).queryByText('Itemise')).toBeNull();
    await user.click(within(dialog).getByRole('button', { name: 'Confirm' }));
    await waitFor(() =>
      expect(posted).toHaveBeenCalledWith('w-1', {
        title: 'Sunrise Loop',
        description: 'Seed 14 of 50 · remix stems included',
        amountOs: 2510,
        quantity: 1,
        tags: ['generative'],
        collectionId: 'col-1',
      }),
    );
    expect(await screen.findByRole('status', { name: 'Posted · Sunrise Loop' })).toBeInTheDocument();
  });

  it('keeps Confirm off and says why when the quote has a blocker', async () => {
    server.use(
      http.get(url('/frontend/weos/:id/resell/quote'), () =>
        ok(
          resellQuoteFixture({
            title: 'Hand-Thrown Mug',
            resellable: false,
            blockers: [{ code: 'unpaid', message: 'Finish its installments before relisting.' }],
          }),
        ),
      ),
    );
    const user = userEvent.setup();
    renderApp('/collect');
    await screen.findByText('Hand-Thrown Mug would fetch more today');
    await user.click(screen.getByRole('button', { name: 'Resell it' }));
    const dialog = await screen.findByRole('dialog', { name: 'Hand-Thrown Mug' });
    await user.click(within(dialog).getAllByRole('button', { name: 'Relist it' })[0]!);
    await user.click(within(dialog).getByRole('button', { name: 'Review it' }));
    expect(within(dialog).getByText('Finish its installments before relisting.')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Confirm' })).toBeDisabled();
  });
});

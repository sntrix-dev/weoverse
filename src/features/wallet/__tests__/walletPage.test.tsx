import { screen, within } from '@testing-library/react';
import { http } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';
import { tokens } from '@/api/tokens';
import { fullWalletFixture } from '@/test/fixtures/identity';
import { ok, url } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { renderApp } from '@/test/renderApp';

afterEach(() => tokens.clear());

describe('wallet page', () => {
  it('states the peg, says O Power is not measured, and lists plans without a way to buy them', async () => {
    server.use(http.get(url('/frontend/wallet/overview'), () => ok(fullWalletFixture())));
    renderApp('/wallet');
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'One standing, honoured everywhere the network runs',
      }),
    ).toBeInTheDocument();
    // the settlement peg, not a round 100
    expect(screen.getAllByText(/99 Os = \$1/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/100 Os = \$1/)).not.toBeInTheDocument();
    // power is null: no figure stands in for it
    expect(screen.getByText('· not measured yet')).toBeInTheDocument();
    // the buckets say why nothing is held
    expect(screen.getByText('Nothing on this surface holds O back.')).toBeInTheDocument();
    // the ecosystem, live and at launch
    expect(screen.getAllByText('WeO Flow').length).toBeGreaterThan(0);
    expect(screen.getByText('At launch')).toBeInTheDocument();
    // a price list with the advantage applied — and nothing to start
    const plan = screen.getByText('WeOverse Pro').closest('div') as HTMLElement;
    expect(within(plan.parentElement as HTMLElement).getByText('450')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Start' })).not.toBeInTheDocument();
    expect(screen.getByText('A price list — nothing here starts a subscription.')).toBeInTheDocument();
    // the record
    expect(screen.getByText('Sold Sunrise Loop')).toBeInTheDocument();
  });

  it('an empty record says so', async () => {
    server.use(http.get(url('/frontend/wallet/overview'), () => ok({ ...fullWalletFixture(), ledger: [] })));
    renderApp('/wallet');
    expect(await screen.findByText(/Nothing has moved yet/)).toBeInTheDocument();
  });
});

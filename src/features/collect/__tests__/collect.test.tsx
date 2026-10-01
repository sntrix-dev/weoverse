import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { tokens } from '@/api/tokens';
import { liveWeos, quoteFor } from '@/test/fixtures/discover';
import { fail, ok, url } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { renderApp } from '@/test/renderApp';

afterEach(() => tokens.clear());

const weo = (id: string) => liveWeos().find((w) => w._id === id)!;

const collection = (over: Record<string, unknown> = {}) => ({
  _id: 'col-9',
  collectionType: 'regular',
  weoId: 'weo-2',
  userId: 'me',
  sellerId: 'c-1',
  amount: 4200,
  currency: 'O',
  status: 'delivered',
  statusLabel: 'Fully Paid',
  isResold: false,
  qty: { count: 1, unitName: null },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  data: {},
  ...over,
});

/** Opens the sheet from the WeO page and returns the dialog. */
async function openSheet(id: string, name: string) {
  const user = userEvent.setup();
  const utils = renderApp(`/weos/${id}`);
  await screen.findByRole('heading', { level: 1, name });
  const act = document.getElementById('weo-collect') as HTMLElement;
  await user.click(await within(act).findByRole('button', { name: /·/ }));
  const dialog = await screen.findByRole('dialog', { name });
  return { user, dialog, ...utils };
}

describe('collect flow', () => {
  it('a Listing: card → terms → review → confirm posts the quote’s body, then a receipt', async () => {
    const posted = vi.fn();
    server.use(
      http.post(url('/frontend/weos/weo-2/collect'), async ({ request }) => {
        posted(await request.json());
        return ok(collection(), 'Collected');
      }),
    );
    const { user, dialog } = await openSheet('weo-2', 'Hand-Thrown Mug');
    await user.click(within(dialog).getByRole('button', { name: 'Collect' }));
    // a set price is at rest: no dial controls
    expect(within(dialog).queryByRole('slider')).toBeNull();
    expect(
      within(dialog).getByText('A set price is not a negotiation — this is the ask, at rest.'),
    ).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Review it' }));
    expect(within(dialog).getByText('You pay · they receive')).toBeInTheDocument();
    // settlement withholds nothing, so the review has no fee row
    expect(within(dialog).queryByText('Itemise')).toBeNull();
    await user.click(within(dialog).getByRole('button', { name: 'Confirm' }));
    await waitFor(() => expect(posted).toHaveBeenCalledWith(quoteFor(weo('weo-2')).payload));
    expect(await screen.findByRole('status', { name: 'Collected · Hand-Thrown Mug' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(
      await within(dialog).findByText('Yours — it is in your collection now, passport intact.'),
    ).toBeInTheDocument();
    expect(within(dialog).getByText(/Ref\s*col-9/)).toBeInTheDocument();
  });

  it('says what is short and keeps Confirm off when the wallet cannot cover it', async () => {
    server.use(
      http.get(url('/frontend/weos/weo-2/collect/quote'), () =>
        ok(quoteFor(weo('weo-2'), { oBalance: 1000 })),
      ),
    );
    const { user, dialog } = await openSheet('weo-2', 'Hand-Thrown Mug');
    await user.click(within(dialog).getByRole('button', { name: 'Collect' }));
    await user.click(within(dialog).getByRole('button', { name: 'Review it' }));
    expect(within(dialog).getByText(/Short by/)).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Top up' })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Confirm' })).toBeDisabled();
  });

  it('a Hunt offers the real entry bundles and re-prices on the one chosen', async () => {
    const asked: (string | null)[] = [];
    server.use(
      http.get(url('/frontend/weos/weo-5/collect/quote'), ({ request }) => {
        const b = new URL(request.url).searchParams.get('bundle');
        asked.push(b);
        return ok(quoteFor(weo('weo-5'), { bundle: b ? Number(b) : undefined }));
      }),
    );
    const { user, dialog } = await openSheet('weo-5', 'Studio Gear Hunt');
    await user.click(within(dialog).getByRole('button', { name: 'Join the hunt' }));
    const entries = within(dialog).getByRole('group', { name: 'Entries' });
    await user.click(within(entries).getByRole('button', { name: '5 entries' }));
    await waitFor(() => expect(asked).toContain('5'));
    await waitFor(() => expect(within(dialog).getAllByText('3,000').length).toBeGreaterThan(0));
  });

  it('a Bid moves on the dial and warns that a bid under the ask is a negotiation', async () => {
    const { user, dialog } = await openSheet('weo-3', 'Kiln Study No. 4');
    await user.click(within(dialog).getByRole('button', { name: 'Raise' }));
    const dial = within(dialog).getByRole('slider', { name: 'Your bid' });
    expect(dial).toHaveAttribute('aria-valuemax', String(weo('weo-3').weoverse?.priceOs));
    await user.click(within(dialog).getByRole('button', { name: 'Less' }));
    expect(within(dialog).getByText(/A bid under the ask is a negotiation/)).toBeInTheDocument();
  });

  it('a refused collect says why and nothing moves', async () => {
    server.use(
      http.post(url('/frontend/weos/weo-2/collect'), () => fail(400, 'Not enough WEO in circulation')),
    );
    const { user, dialog } = await openSheet('weo-2', 'Hand-Thrown Mug');
    await user.click(within(dialog).getByRole('button', { name: 'Collect' }));
    await user.click(within(dialog).getByRole('button', { name: 'Review it' }));
    await user.click(within(dialog).getByRole('button', { name: 'Confirm' }));
    expect(await within(dialog).findByText('Not enough WEO in circulation')).toBeInTheDocument();
    expect(screen.queryByRole('status', { name: /Collected/ })).toBeNull();
  });

  it('closes on Escape', async () => {
    const { user, dialog } = await openSheet('weo-2', 'Hand-Thrown Mug');
    expect(dialog).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Hand-Thrown Mug' })).toBeNull());
  });
});

import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';
import { tokens } from '@/api/tokens';
import { categoriesFixture } from '@/test/fixtures/create';
import { liveWeos } from '@/test/fixtures/discover';
import { ok, url } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { renderApp } from '@/test/renderApp';

afterEach(() => tokens.clear());

/** Records the JSON bodies the composer sends. */
function capture(method: 'post' | 'put', path: string, data: unknown = { _id: 'weo-new' }) {
  const bodies: Record<string, unknown>[] = [];
  server.use(
    http[method](url(path), async ({ request }) => {
      bodies.push((await request.json()) as Record<string, unknown>);
      return ok(data);
    }),
  );
  return bodies;
}

const openComposer = async (user: ReturnType<typeof userEvent.setup>, format = /^Sell —/) => {
  renderApp('/create');
  await user.click(await screen.findByRole('button', { name: format }));
  expect(await screen.findByText('02 — Create')).toBeInTheDocument();
};

describe('create · the O', () => {
  it('rides every format on the ring; a soon format remembers you asked and opens nothing', async () => {
    const user = userEvent.setup();
    renderApp('/create');
    expect(await screen.findByRole('region', { name: 'Make a WeO' })).toBeInTheDocument();
    for (const n of [/^Sell —/, /^Pool —/, /^Bid —/, /^Request —/, /^Hunt — coming soon/, /^Drop — coming soon/, /^Gift — coming soon/, /^Subscription — coming soon/])
      expect(screen.getByRole('button', { name: n })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^Hunt — coming soon/ }));
    expect(await screen.findByText('We’ll tell you when Hunt goes live')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Hunt — coming soon, you will be told/ })).toBeInTheDocument();
    expect(screen.queryByText('02 — Create')).not.toBeInTheDocument();
  });

  it('docks carry on (your drafts), templates and asks; a locked template says how to unlock it', async () => {
    const user = userEvent.setup();
    const { router } = renderApp('/create');
    expect(await screen.findByRole('button', { name: 'Open Carry on' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open Asked for' })).toBeInTheDocument();
    // Rehearse enters a world (M11)
    expect(screen.getByRole('button', { name: 'Open Rehearse' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Open Templates' }));
    await user.click(await screen.findByTitle('A whole season, one price'));
    expect(await screen.findByText(/^Season pass · Maker plan, or/)).toBeInTheDocument();
    await user.click(screen.getByTitle('A capped run, each one numbered'));
    expect(await screen.findByDisplayValue('Signed edition')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/create');
  });
});

describe('create · the composer', () => {
  it('names what is missing, then posts a Listing to the network in dollars at the backend peg', async () => {
    const user = userEvent.setup();
    const posted = capture('post', '/frontend/weos');
    const { router } = await (async () => {
      const r = renderApp('/create');
      await user.click(await screen.findByRole('button', { name: /^Sell —/ }));
      return r;
    })();
    // preflight is always pressable: nothing moves, the gaps are named
    await user.click(await screen.findByRole('button', { name: 'Preflight — Review it, then post' }));
    expect(await screen.findByText(/^Still needed: a name, a line, a category, a figure, a cover$/)).toBeInTheDocument();

    await user.type(screen.getByRole('textbox', { name: 'Name your WeO' }), 'Signed print');
    await user.type(screen.getByRole('textbox', { name: 'One line on what someone actually gets' }), 'One of sixty');
    await user.click(screen.getByRole('button', { name: 'Creating' }));
    await user.upload(await screen.findByTestId('media-input-0'), new File(['img'], 'cover.png', { type: 'image/png' }));
    expect(await screen.findByRole('button', { name: 'Replace cover' })).toBeInTheDocument();
    const ask = screen.getAllByRole('textbox', { name: 'Ask' })[0]!;
    await user.clear(ask);
    await user.type(ask, '4950');

    await user.click(screen.getByRole('button', { name: 'Preflight — Review it, then post' }));
    expect(await screen.findByText('What goes live')).toBeInTheDocument();
    // what settlement takes, not the design's 2% (D-055)
    expect(screen.getByText('Taken at settlement')).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: 'Post it' })[0]!);
    const sheet = await screen.findByRole('dialog', { name: 'Post · where does it go?' });
    await user.click(within(sheet).getByRole('button', { name: 'Post it' }));
    await waitFor(() => expect(posted).toHaveLength(1));
    expect(posted[0]).toMatchObject({
      weoType: 'regular',
      title: 'Signed print',
      description: 'One of sixty',
      categoryId: categoriesFixture[0]!._id,
      price: { amount: 50, priceSplit: 0, negotiableUpTo: 0 },
      media: [{ url: 'https://cdn.test/weoverse/app/u/weos/2026/10/up.png', type: 'image' }],
    });
    await waitFor(() => expect(router.state.location.pathname).toBe('/exchange'), { timeout: 5000 });
  });

  it('posts into a Circle: the WeO, then the push into that circle (D-056)', async () => {
    const user = userEvent.setup();
    capture('post', '/frontend/weos', { _id: 'weo-new' });
    const pushes = capture('post', '/frontend/community/push', { id: 't-1' });
    renderApp('/create?draft=d-9');
    server.use(
      http.get(url('/frontend/me/drafts/d-9'), () =>
        ok({
          _id: 'd-9',
          format: 'Listing',
          payload: {
            form: { kind: 'Listing', title: 'Signed print', desc: 'One of sixty', catId: categoriesFixture[0]!._id, cat: 'Creating', media: 'https://cdn.test/a.jpg', price: 4950 },
          },
        }),
      ),
    );
    expect(await screen.findByDisplayValue('Signed print')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Preflight — Review it, then post' }));
    await user.click(await screen.findAllByRole('button', { name: 'Post it' }).then((b) => b[0]!));
    const sheet = await screen.findByRole('dialog', { name: 'Post · where does it go?' });
    await user.click(within(sheet).getByRole('button', { name: /^A Circle/ }));
    await user.click(within(sheet).getByRole('button', { name: 'Post it' }));
    await waitFor(() => expect(pushes).toHaveLength(1));
    expect(pushes[0]).toMatchObject({ weoId: 'weo-new', question: 'Signed print', description: 'One of sixty' });
  });

  it('Mya drafts the line from the title; nothing is written until you pick one', async () => {
    const user = userEvent.setup();
    await openComposer(user);
    await user.type(screen.getByRole('textbox', { name: 'Name your WeO' }), 'Signed print');
    await user.click(screen.getByRole('button', { name: 'Draft with Mya' }));
    await user.click(screen.getByRole('button', { name: 'Ask Mya to draft it' }));
    await user.click(await screen.findByRole('button', { name: /Sixty prints, each signed and numbered by hand\./ }));
    expect(screen.getByRole('textbox', { name: 'One line on what someone actually gets' })).toHaveValue('Sixty prints, each signed and numbered by hand.');
  });

  it('autosaves a draft once the composer has something in it', async () => {
    const user = userEvent.setup();
    const saved = capture('post', '/frontend/me/drafts', { _id: 'draft-new' });
    await openComposer(user, /^Pool —/);
    await user.type(screen.getByRole('textbox', { name: 'Name your WeO' }), 'Neighbourhood fund');
    await waitFor(() => expect(saved.some((b) => b.format === 'Pool')).toBe(true), { timeout: 6000 });
    expect(saved.find((b) => b.format === 'Pool')).toMatchObject({ weoType: 'crowdfund', title: 'Neighbourhood fund' });
  });

  it('a Request has no media and posts straight to the asks board in Os', async () => {
    const user = userEvent.setup();
    const asked = capture('post', '/frontend/request-weos', { _id: 'rq-new' });
    await openComposer(user, /^Request —/);
    expect(screen.queryByRole('button', { name: /^Media/ })).not.toBeInTheDocument();
    await user.type(screen.getByRole('textbox', { name: 'Name your WeO' }), 'A sketchbook');
    await user.type(screen.getByRole('textbox', { name: 'One line on what someone actually gets' }), 'Hand-bound');
    await user.click(screen.getByRole('button', { name: 'Creating' }));
    for (const [name, v] of [['From', '500'], ['To', '1200']] as const) {
      const box = screen.getAllByRole('textbox', { name })[0]!;
      await user.clear(box);
      await user.type(box, v);
    }
    await user.click(screen.getByRole('button', { name: 'Preflight — Review it, then post' }));
    await user.click(await screen.findAllByRole('button', { name: 'Post it' }).then((b) => b[0]!));
    await waitFor(() => expect(asked).toHaveLength(1));
    expect(asked[0]).toMatchObject({ title: 'A sketchbook', categoryName: 'Creating', price: { min: 500, max: 1200 } });
    expect(await screen.findByRole('heading', { name: 'A sketchbook is live' }, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'See the asks' })).toBeInTheDocument();
  });

  it('edits a live WeO of yours and saves it in place', async () => {
    const user = userEvent.setup();
    const w = liveWeos()[0]!;
    server.use(http.get(url('/frontend/categories'), () => ok([{ _id: 'c-art', name: w.categoryName }])));
    const saved = capture('put', `/frontend/weos/${w._id}`, { _id: w._id });
    const { router } = renderApp(`/create?edit=${w._id}`);
    expect(await screen.findByDisplayValue(w.title)).toBeInTheDocument();
    const line = screen.getByRole('textbox', { name: 'One line on what someone actually gets' });
    await user.clear(line);
    await user.type(line, 'Fifty unique seeds');
    await user.click(screen.getByRole('button', { name: 'Preflight — Review it, then post' }));
    await user.click(await screen.findAllByRole('button', { name: 'Save it' }).then((b) => b[0]!));
    await waitFor(() => expect(saved).toHaveLength(1));
    expect(saved[0]).toMatchObject({ title: w.title, description: 'Fifty unique seeds', categoryId: 'c-art' });
    await waitFor(() => expect(router.state.location.pathname).toBe(`/weos/${w._id}`));
  });
});

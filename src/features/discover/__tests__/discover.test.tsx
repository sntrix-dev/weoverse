import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';
import { tokens } from '@/api/tokens';
import { feedFixture, liveWeos } from '@/test/fixtures/discover';
import { ok, url } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { renderApp } from '@/test/renderApp';

afterEach(() => tokens.clear());

/** Records every `GET /frontend/weos` query string the page sends. */
const weoQueries = () => {
  const seen: URLSearchParams[] = [];
  server.use(
    http.get(url('/frontend/weos'), ({ request }) => {
      const q = new URL(request.url).searchParams;
      seen.push(q);
      const search = (q.get('search') ?? '').toLowerCase();
      const items =
        q.get('feed') === 'following' ? [] : liveWeos().filter((w) => w.title.toLowerCase().includes(search));
      return ok({ items, pagination: { total: items.length, page: 1, limit: 24, totalPages: 1 } });
    }),
  );
  return seen;
};

/** Records every `GET /frontend/feed` query; answers `total` items in pages. */
const feedQueries = (total = 20) => {
  const seen: URLSearchParams[] = [];
  server.use(
    http.get(url('/frontend/feed'), ({ request }) => {
      const q = new URL(request.url).searchParams;
      seen.push(q);
      return ok({ items: feedFixture(), total, page: Number(q.get('page') ?? 1), totalPages: 3 });
    }),
  );
  return seen;
};

/** the sticky filter bar (its quick chips share names with the feed's chips) */
const bar = async () => {
  await screen.findByRole('button', { name: 'Jump to' });
  return document.querySelector('.weo-sticky-filters') as HTMLElement;
};

describe('Discover (v4)', () => {
  it('opens on the filter bar and a pill of three figures, without the breadcrumb', async () => {
    renderApp('/discover');
    expect(await screen.findByRole('heading', { level: 1, name: 'Discover' })).toBeInTheDocument();
    const pill = screen.getByRole('region', { name: 'Discover' });
    expect(within(pill).getByText('On the floor')).toBeInTheDocument();
    expect(within(pill).getByText('WeOs in motion')).toBeInTheDocument();
    expect(within(pill).getByText('From My Circle')).toBeInTheDocument();
    await waitFor(() => expect(within(pill).getByTitle(/creators you circle/i)).toHaveTextContent('1'));
    expect(screen.queryByRole('button', { name: /^Back to/ })).not.toBeInTheDocument();
    const b = await bar();
    expect(within(b).getByRole('button', { name: /^Closing soonest/ })).toBeInTheDocument();
    expect(within(b).getByRole('button', { name: /^Moving now/ })).toBeInTheDocument();
    // v4: no flow bar on Discover
    expect(screen.queryByRole('region', { name: 'Where you are and what is next' })).not.toBeInTheDocument();
  });

  it('Jump to lists the places on the page', async () => {
    const user = userEvent.setup();
    renderApp('/discover');
    await user.click(await screen.findByRole('button', { name: 'Jump to' }));
    const menu = screen.getByRole('menu', { name: 'Jump to' });
    expect(
      within(menu)
        .getAllByRole('menuitem')
        .map((b) => b.textContent),
    ).toEqual([
      'On the stage',
      'Your feed',
      'Who is trading1',
      'Circles behind the floor1',
      'Browse by interest1',
    ]);
  });

  it('the rails under the feed are gone; who is trading, circles and interests stay', async () => {
    renderApp('/discover');
    expect(await screen.findByText('Lena V')).toBeInTheDocument();
    expect(await screen.findByText('Digital Arts', { selector: 'h3' })).toBeInTheDocument();
    expect(await screen.findByText('4 live · Pool wins')).toBeInTheDocument();
    expect(screen.queryByText('Also in the feed')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'From creators you circle' })).not.toBeInTheDocument();
    expect(screen.queryByText('Everything on the floor')).not.toBeInTheDocument();
    expect(screen.getByTitle('Collapse Your feed')).toHaveAttribute('aria-expanded', 'true');
    expect(screen.queryByTitle('Collapse Who is trading')).not.toBeInTheDocument();
  });

  it('the feed comes in pages of nine', async () => {
    const user = userEvent.setup();
    const seen = feedQueries(20);
    renderApp('/discover');
    const pages = await screen.findByRole('navigation', { name: 'Feed pages' });
    expect(within(pages).getByText('Showing 1–9 of 20')).toBeInTheDocument();
    expect(within(pages).getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page');
    await user.click(within(pages).getByRole('button', { name: 'Page 3' }));
    await waitFor(() => expect(seen.some((q) => q.get('page') === '3' && q.get('limit') === '9')).toBe(true));
    expect(await within(pages).findByText('Showing 19–20 of 20')).toBeInTheDocument();
  });

  it('a kind chip asks the server for that kind', async () => {
    const user = userEvent.setup();
    const seen = feedQueries(3);
    renderApp('/discover');
    await user.click(await screen.findByRole('button', { name: 'Questions' }));
    await waitFor(() => expect(seen.some((q) => q.get('kind') === 'question')).toBe(true));
    expect(screen.getByRole('button', { name: 'Questions' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('Moving now in the bar picks the feed lens, drawn from the floor', async () => {
    const user = userEvent.setup();
    const seen = weoQueries();
    renderApp('/discover');
    await user.click(within(await bar()).getByRole('button', { name: /^Moving now/ }));
    await waitFor(() =>
      expect(
        seen.some((q) => q.get('sort') === 'trending' && q.get('limit') === '9' && q.get('page') === '1'),
      ).toBe(true),
    );
    const feed = document.getElementById('d-feed') as HTMLElement;
    expect(within(feed).getByRole('button', { name: 'Moving now' })).toHaveAttribute('aria-pressed', 'true');
    expect((await within(feed).findAllByText('Sunrise Loop')).length).toBeGreaterThan(0);
  });

  it('from creators you circle says so when there is nothing', async () => {
    const user = userEvent.setup();
    const seen = weoQueries();
    renderApp('/discover');
    await screen.findByTitle('Collapse Your feed');
    const feed = document.getElementById('d-feed') as HTMLElement;
    await user.click(await within(feed).findByRole('button', { name: 'From creators you circle' }));
    await waitFor(() => expect(seen.some((q) => q.get('feed') === 'following')).toBe(true));
    expect(
      await within(feed).findByText('Nothing yet — circle a creator and their WeOs arrive here.'),
    ).toBeInTheDocument();
  });

  it('the stage is a carousel with dots', async () => {
    const user = userEvent.setup();
    renderApp('/discover');
    const dots = await screen.findByRole('tablist', { name: 'Stage cards' });
    const tabs = within(dots).getAllByRole('tab');
    expect(tabs.length).toBeGreaterThan(1);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    await user.click(tabs[1]!);
    expect(within(dots).getAllByRole('tab')[1]).toHaveAttribute('aria-selected', 'true');
  });

  it('a search from the top bar lands on the floor with its results; a stall tile opens the WeO', async () => {
    const user = userEvent.setup();
    const seen = weoQueries();
    const { router } = renderApp('/discover?q=mug');
    expect(await screen.findByText('Results for "mug"')).toBeInTheDocument();
    await waitFor(() => expect(seen.some((q) => q.get('search') === 'mug')).toBe(true));
    const floor = document.getElementById('floor') as HTMLElement;
    await user.click(await within(floor).findByRole('button', { name: 'Hand-Thrown Mug · Listing' }));
    await waitFor(() => expect(router.state.location.pathname).toMatch(/^\/weos\//));
  });
});

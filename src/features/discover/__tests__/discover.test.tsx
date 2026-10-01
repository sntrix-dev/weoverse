import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';
import { tokens } from '@/api/tokens';
import { liveWeos } from '@/test/fixtures/discover';
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

describe('Discover', () => {
  it('leads with the live figures from the discovery snapshot', async () => {
    renderApp('/discover');
    expect(await screen.findByRole('heading', { level: 1, name: 'Discover' })).toBeInTheDocument();
    expect(await screen.findByText('On the floor')).toBeInTheDocument();
    expect(await screen.findByText('31,980')).toBeInTheDocument();
    expect(screen.getAllByText('From creators you circle').length).toBeGreaterThan(0);
  });

  it('asks the floor for what is live, closing first and moving now', async () => {
    const seen = weoQueries();
    renderApp('/discover');
    await screen.findByRole('heading', { level: 1, name: 'Discover' });
    await waitFor(() => expect(seen.length).toBeGreaterThanOrEqual(5));
    const sorts = seen.map((q) => `${q.get('sort')}|${q.get('status')}|${q.get('feed')}`);
    expect(sorts).toContain('ending_soon|active|null');
    expect(sorts).toContain('trending|active|null');
    expect(sorts).toContain('null|active|following');
  });

  it('shows the feed cover, the rails and the empty "creators you circle" row', async () => {
    renderApp('/discover');
    expect(await screen.findByText('Also in the feed')).toBeInTheDocument();
    expect(await screen.findByText('Lena V')).toBeInTheDocument();
    expect(await screen.findByText('Digital Arts', { selector: 'h3' })).toBeInTheDocument();
    expect(await screen.findByText('4 live · Pool wins')).toBeInTheDocument();
    expect(
      await screen.findByText('Nothing yet — circle a creator and their WeOs arrive here.'),
    ).toBeInTheDocument();
  });

  it('a search from the top bar lands on the floor with its results', async () => {
    const seen = weoQueries();
    renderApp('/discover?q=mug');
    expect(await screen.findByText('Results for "mug"')).toBeInTheDocument();
    await waitFor(() => expect(seen.some((q) => q.get('search') === 'mug')).toBe(true));
    const floor = document.getElementById('floor') as HTMLElement;
    expect(
      await within(floor).findByRole('button', { name: 'Hand-Thrown Mug · Listing' }),
    ).toBeInTheDocument();
  });

  it('a lens re-asks the floor; a fold collapses and opens again', async () => {
    const user = userEvent.setup();
    const seen = weoQueries();
    renderApp('/discover');
    const lens = await screen.findByRole('group', { name: 'Lens' });
    await user.click(within(lens).getByRole('button', { name: 'Moving now' }));
    expect(within(lens).getByRole('button', { name: 'Moving now' })).toHaveAttribute('aria-pressed', 'true');
    await waitFor(() =>
      expect(seen.some((q) => q.get('sort') === 'trending' && q.get('limit') === '24')).toBe(true),
    );
    const fold = screen.getByTitle('Collapse Who is trading');
    expect(fold).toHaveAttribute('aria-expanded', 'true');
    await user.click(fold);
    expect(screen.getByTitle('Expand Who is trading')).toHaveAttribute('aria-expanded', 'false');
  });

  it('a stall tile opens the WeO', async () => {
    const user = userEvent.setup();
    const { router } = renderApp('/discover');
    await screen.findByRole('heading', { level: 1, name: 'Discover' });
    const floor = document.getElementById('floor') as HTMLElement;
    await user.click(await within(floor).findByRole('button', { name: 'Sunrise Loop · Drop' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/weos/weo-1'));
  });
});

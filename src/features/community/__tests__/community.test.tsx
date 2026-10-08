import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { tokens } from '@/api/tokens';
import {
  ME,
  answerFixture,
  author,
  circleWeosFixture,
  threadDetailFixture,
  threadFixture,
} from '@/test/fixtures/community';
import { fail, ok, url } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { renderApp } from '@/test/renderApp';

afterEach(() => tokens.clear());

/** Records every write to `path` and answers with `data`. */
function spy(method: 'post' | 'patch' | 'delete', path: string, data: unknown = null) {
  const calls = vi.fn();
  server.use(
    http[method](url(path), async ({ request }) => {
      calls(method === 'delete' ? null : await request.json().catch(() => null));
      return ok(data);
    }),
  );
  return calls;
}

describe('community hub', () => {
  it('shows your WeOs in flight, your circles, the questions and the wallet', async () => {
    const user = userEvent.setup();
    const { router, container } = renderApp('/community');
    expect(await screen.findByRole('heading', { level: 1, name: 'Community' })).toBeInTheDocument();
    // a draft and a live WeO, each with its one step (a draft's is Rehearse; Post it stays one tap away)
    expect(await screen.findByRole('button', { name: 'Night Market Print — Rehearse' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tide Pool — Move with the market' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Your circles/ }));
    expect(await screen.findByText('Digital Arts')).toBeInTheDocument();

    await user.click(container.querySelector('#r-community') as HTMLElement);
    expect(await screen.findByText('How do I price a first edition?')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Stewards' }));
    expect(await screen.findByText('Ada Obi')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Stories' }));
    expect(await screen.findByText('Forty backers in a week')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Wallet/ }));
    expect(await screen.findByText('Earned Os · free to move')).toBeInTheDocument();
    // the balance and its Available bucket
    expect(screen.getAllByText('1,700').length).toBeGreaterThan(0);

    // the direct path goes to the composer with the draft
    await user.click(screen.getByRole('button', { name: 'Post it' }));
    await waitFor(() => expect(router.state.location.search).toBe('?draft=d-1'));
  });

  it('moves Os to a creator from the wallet row', async () => {
    const user = userEvent.setup();
    const moved = spy('post', '/frontend/wallet/transfer', { ok: true });
    renderApp('/community');
    await user.click(await screen.findByRole('button', { name: /Wallet/ }));
    await user.click(await screen.findByRole('button', { name: /^Move Os/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Move Os' });
    await user.click(within(dialog).getByRole('button', { name: /^Move O 500/ }));
    await waitFor(() => expect(moved).toHaveBeenCalledWith({ toUserId: 'c-1', amount: 500 }));
  });
});

describe('circle page', () => {
  it('reads the circle, filters by a trending tag, and opens members and WeOs', async () => {
    const user = userEvent.setup();
    renderApp('/community/circles/circ-1');
    expect(await screen.findByRole('heading', { level: 1, name: 'Digital Arts' })).toBeInTheDocument();
    expect(
      screen.getByText(/cleared 40% collect-through here, and 62% of discussions resolved/),
    ).toBeInTheDocument();
    // the snapshot card keeps it; the list drops it under the filter
    const before = screen.getAllByText('Cap the edition?').length;
    expect(screen.getByText('Top answer')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '#pricing' }));
    expect(screen.getAllByText('Cap the edition?')).toHaveLength(before - 1);
    expect(screen.queryByText('Top answer')).toBeNull();

    await user.click(screen.getByRole('button', { name: /^Members/ }));
    expect(await screen.findByText('Bo Lin')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^WeOs/ }));
    for (const r of circleWeosFixture()) {
      expect(await screen.findByRole('button', { name: `Open ${r.weo.title}` })).toBeInTheDocument();
    }
  });

  it('leave and join write the membership', async () => {
    const user = userEvent.setup();
    const left = spy('delete', '/frontend/community/circles/circ-1/leave', { isJoined: false });
    renderApp('/community/circles/circ-1');
    await user.click(await screen.findByRole('button', { name: '✓ Joined' }));
    await waitFor(() => expect(left).toHaveBeenCalled());
    expect(await screen.findByText('Left Digital Arts · re-join anytime')).toBeInTheDocument();
  });

  it('starts a discussion in this circle and lands on it', async () => {
    const user = userEvent.setup();
    const created = spy('post', '/frontend/community/threads', threadFixture({ id: 't-9' }));
    renderApp('/community/circles/circ-1');
    await user.click(await screen.findByRole('button', { name: 'Start a discussion' }));
    const dialog = await screen.findByRole('dialog', { name: 'Ask your Circles' });
    expect(within(dialog).getByRole('button', { name: 'Next' })).toBeDisabled();
    await user.type(within(dialog).getByRole('textbox', { name: 'Your question' }), 'Is 12 too many?');
    await user.click(within(dialog).getByRole('button', { name: 'Next' }));
    const step2 = await screen.findByRole('dialog', { name: 'Add details' });
    await user.click(within(step2).getByRole('button', { name: 'Tide Pool' }));
    await user.click(within(step2).getByRole('button', { name: 'Post discussion' }));
    await waitFor(() =>
      expect(created).toHaveBeenCalledWith({
        question: 'Is 12 too many?',
        circleId: 'circ-1',
        attachedWeoId: 'weo-mine',
        tags: [],
      }),
    );
    expect(await screen.findByText('Discussion posted in Digital Arts')).toBeInTheDocument();
  });

  it('a WeO in the circle opens the push sheet: someone else’s is asked about, yours is pushed', async () => {
    const user = userEvent.setup();
    const asked = spy('post', '/frontend/community/threads', threadFixture());
    const pushed = spy('post', '/frontend/community/push', threadFixture());
    const rows = circleWeosFixture();
    const other = rows[0]!;
    const mine = rows[1]!;
    mine.weo = { ...mine.weo, creator: { ...mine.weo.creator, _id: ME } };
    server.use(
      http.get(url('/frontend/community/circles/:id/weos'), () =>
        ok({ items: [other, mine], pagination: { total: 2, page: 1, limit: 24, totalPages: 1 } }),
      ),
    );
    renderApp('/community/circles/circ-1');
    await user.click(await screen.findByRole('button', { name: /^WeOs/ }));
    const ask = async (name: string, q: string) => {
      await user.click(await screen.findByRole('button', { name: `Open ${name}` }));
      const d = await screen.findByRole('dialog', { name: 'Push to the Hub' });
      expect(await within(d).findByText(/goes to Digital Arts/)).toBeInTheDocument();
      await user.type(within(d).getByRole('textbox', { name: 'What do you want to ask your Circle?' }), q);
      await user.click(within(d).getByRole('button', { name: 'Next' }));
      await user.click(
        within(await screen.findByRole('dialog', { name: 'Push to the Hub' })).getByRole('button', {
          name: 'Push to Hub',
        }),
      );
    };
    await ask(other.weo.title, 'Worth it?');
    await waitFor(() =>
      expect(asked).toHaveBeenCalledWith({
        question: 'Worth it?',
        circleId: 'circ-1',
        attachedWeoId: other.weo._id,
        tags: [],
      }),
    );
    await user.click(await screen.findByRole('button', { name: /^WeOs/ }));
    await ask(mine.weo.title, 'Price ok?');
    await waitFor(() =>
      expect(pushed).toHaveBeenCalledWith({ weoId: mine.weo._id, question: 'Price ok?', circleId: 'circ-1' }),
    );
  });
});

describe('thread page', () => {
  it('answers by score; votes toggle; replies and answers post', async () => {
    const user = userEvent.setup();
    const voted = vi.fn();
    server.use(
      http.post(url('/frontend/community/answers/:id/vote'), async ({ request, params }) => {
        const body = (await request.json()) as { value: number };
        voted(params.id, body.value);
        return ok({ voteScore: 4 + body.value, userVote: body.value });
      }),
    );
    const replied = spy('post', '/frontend/community/answers/a-1/replies', {});
    const answered = spy('post', '/frontend/community/threads/t-1/answers', answerFixture({ id: 'a-3' }));
    renderApp('/community/threads/t-1');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'How do I price a first edition?' }),
    ).toBeInTheDocument();
    expect(screen.getByText('ISR 82')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: '2 answers' })).toBeInTheDocument();
    // not the asker: no accept control
    expect(screen.queryByRole('button', { name: 'Accept answer' })).toBeNull();

    const ups = screen.getAllByRole('button', { name: 'Upvote' });
    await user.click(ups[1]!);
    await waitFor(() => expect(voted).toHaveBeenLastCalledWith('a-1', 1));
    expect(ups[1]!).toHaveAttribute('aria-pressed', 'true');
    await user.click(ups[1]!);
    await waitFor(() => expect(voted).toHaveBeenLastCalledWith('a-1', 0));

    await user.click(screen.getAllByRole('button', { name: 'Reply' })[1]!);
    await user.type(screen.getByRole('textbox', { name: 'Reply to Bo Lin' }), 'Thanks');
    const composer = screen.getByRole('textbox', { name: 'Reply to Bo Lin' }).parentElement!;
    await user.click(within(composer).getByRole('button', { name: 'Reply' }));
    await waitFor(() => expect(replied).toHaveBeenCalledWith({ body: 'Thanks' }));

    await user.type(screen.getByRole('textbox', { name: 'Your answer' }), 'Cap at ten.');
    await user.click(screen.getByRole('button', { name: 'Post answer' }));
    await waitFor(() => expect(answered).toHaveBeenCalledWith({ body: 'Cap at ten.' }));
    expect(await screen.findByText('Answer posted')).toBeInTheDocument();
  });

  it('the asker can accept; a report posts its reason', async () => {
    const user = userEvent.setup();
    const accepted = spy('post', '/frontend/community/answers/a-1/accept', {
      accepted: true,
      threadStatus: 'resolved',
      threadId: 't-1',
      answerId: 'a-1',
    });
    server.use(
      http.get(url('/frontend/community/threads/:id'), () =>
        ok(threadDetailFixture({ authorId: ME, author: author({ id: ME }) })),
      ),
    );
    renderApp('/community/threads/t-1');
    await user.click((await screen.findAllByRole('button', { name: 'Accept answer' }))[1]!);
    await waitFor(() => expect(accepted).toHaveBeenCalled());
    expect(await screen.findByText('Answer accepted · thread resolved')).toBeInTheDocument();
  });

  it('reports someone else’s thread', async () => {
    const user = userEvent.setup();
    const reported = spy('post', '/frontend/report', {});
    renderApp('/community/threads/t-1');
    await user.click(await screen.findByRole('button', { name: 'Report' }));
    const d = await screen.findByRole('dialog', { name: 'Report' });
    await user.click(within(d).getByRole('button', { name: 'Off-topic or misleading' }));
    await user.click(within(d).getByRole('button', { name: 'Submit report' }));
    await waitFor(() => expect(reported).toHaveBeenCalledWith({ threadId: 't-1', reportType: 'misleading' }));
    expect(await screen.findByText('Report submitted · thank you')).toBeInTheDocument();
  });

  it('says why a vote did not go through and puts the count back', async () => {
    const user = userEvent.setup();
    server.use(http.post(url('/frontend/community/answers/:id/vote'), () => fail(500, 'Vote failed')));
    renderApp('/community/threads/t-1');
    const up = (await screen.findAllByRole('button', { name: 'Upvote' }))[1]!;
    await user.click(up);
    expect(
      await screen.findByText('Something went wrong on our side — try again in a moment.'),
    ).toBeInTheDocument();
    await waitFor(() => expect(up).toHaveAttribute('aria-pressed', 'false'));
  });
});

describe('manage, stewards, stories', () => {
  it('mutes a circle you are in', async () => {
    const user = userEvent.setup();
    const muted = spy('patch', '/frontend/community/circles/circ-1/notification', { notification: 'off' });
    renderApp('/community/circles');
    expect(await screen.findByRole('heading', { level: 1, name: 'Manage your Circles' })).toBeInTheDocument();
    await user.click(await screen.findByRole('button', { name: 'Mute' }));
    await waitFor(() => expect(muted).toHaveBeenCalledWith({ notification: 'off' }));
    expect(await screen.findByText('Muted Digital Arts')).toBeInTheDocument();
  });

  it('stewards: the four figures, a format filter, and follow', async () => {
    const user = userEvent.setup();
    const followed = spy('post', '/frontend/users/u-ada/follow');
    renderApp('/community/stewards');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'The creators who keep Circles calm' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Average ISR')).toBeInTheDocument();
    expect(await screen.findByText('80')).toBeInTheDocument();
    expect(await screen.findByText('50%')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^Hunt/ }));
    expect(screen.queryByText('Ada Obi')).toBeNull();
    expect(screen.getByText('Bo Lin')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^All/ }));
    await user.click(screen.getByRole('button', { name: 'Follow' }));
    await waitFor(() => expect(followed).toHaveBeenCalled());
    // Bo was followed already; now Ada too
    await waitFor(() => expect(screen.getAllByRole('button', { name: '✓ Following' })).toHaveLength(2));
  });

  it('stories: one leads into its thread; one without a thread opens its WeO', async () => {
    const user = userEvent.setup();
    const { router } = renderApp('/community/stories');
    expect(
      await screen.findByRole('heading', { level: 2, name: 'Forty backers in a week' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: /A hunt that sold out/ }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/weos/weo-2'));
  });
});

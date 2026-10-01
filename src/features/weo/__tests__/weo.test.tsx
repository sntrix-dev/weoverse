import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';
import { tokens } from '@/api/tokens';
import { liveWeos } from '@/test/fixtures/discover';
import { fail, ok, url } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { renderApp } from '@/test/renderApp';

afterEach(() => tokens.clear());

describe('WeO page', () => {
  it('shows the WeO, its price, its key terms and its passport', async () => {
    renderApp('/weos/weo-2');
    expect(await screen.findByRole('heading', { level: 1, name: 'Hand-Thrown Mug' })).toBeInTheDocument();
    const terms = document.getElementById('weo-terms') as HTMLElement;
    expect(within(terms).getByText('Key terms')).toBeInTheDocument();
    expect(within(terms).getByText('Passport')).toBeInTheDocument();
    expect(within(terms).getByText('Resale')).toBeInTheDocument();
    expect(screen.getByText('What you actually get')).toBeInTheDocument();
  });

  it('the main act opens the collect sheet', async () => {
    const user = userEvent.setup();
    renderApp('/weos/weo-2');
    await screen.findByRole('heading', { level: 1, name: 'Hand-Thrown Mug' });
    const act = document.getElementById('weo-collect') as HTMLElement;
    await user.click(await within(act).findByRole('button', { name: /Collect/ }));
    expect(await screen.findByRole('dialog', { name: 'Hand-Thrown Mug' })).toBeInTheDocument();
  });

  it('a closed WeO says so and cannot be collected', async () => {
    const closed = {
      ...liveWeos().find((w) => w._id === 'weo-2')!,
      closesAt: new Date(Date.now() - 1000).toISOString(),
    };
    server.use(http.get(url('/frontend/weos/weo-2'), () => ok(closed)));
    renderApp('/weos/weo-2');
    const act = await screen.findByText('This one has closed', { selector: '#weo-collect span' });
    const button = within(act.parentElement as HTMLElement).getByRole('button', { name: 'Closed' });
    expect(button).toBeDisabled();
  });

  it('a missing WeO is an empty state with the way back', async () => {
    server.use(http.get(url('/frontend/weos/nope'), () => fail(404, 'WeO not found')));
    renderApp('/weos/nope');
    expect(await screen.findByText('This WeO isn’t on the floor')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back to Discover' })).toBeInTheDocument();
  });
});

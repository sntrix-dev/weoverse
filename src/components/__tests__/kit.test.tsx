import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CircleChip, CircleRecord } from '@/components/circle/Circle';
import { SectionHero } from '@/components/hero/SectionHero';
import { OAvatarOrb, Spark } from '@/components/people/People';
import { SnapshotPanel, type Board, type Pulse } from '@/components/snapshot/Snapshot';
import { StageRing } from '@/components/weo/StageRing';
import { StallTile } from '@/components/weo/WeoBits';
import { WeoView } from '@/components/weo/WeoView';
import { cardModel } from '@/lib/cardModel';
import { usePrefs } from '@/stores/prefs';
import { ALL_FIXTURE_WEOS, FIXTURE_NOW, huntWeo } from '@/test/fixtures/weos';

const models = () => ALL_FIXTURE_WEOS().map((w) => cardModel(w, 'discover', FIXTURE_NOW));

describe('circle kit', () => {
  const c = {
    id: 'c1',
    name: 'Loop makers',
    members: 1240,
    toneHex: '#22C55E',
    icon: 'pool',
    desire: 72,
    bestType: 'Pool',
  };

  it('CircleRecord shows the name, compact members and the joined dot; Enter opens', () => {
    const onOpen = vi.fn();
    render(<CircleRecord c={c} joined onOpen={onOpen} />);
    expect(screen.getByRole('heading', { name: 'Loop makers' })).toBeInTheDocument();
    expect(screen.getByText('1.2k members')).toBeInTheDocument();
    expect(screen.getByTitle('Joined')).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
    fireEvent.click(screen.getByRole('button'));
    expect(onOpen).toHaveBeenCalledTimes(2);
  });

  it('CircleRecord without joined has no dot', () => {
    render(<CircleRecord c={c} onOpen={() => {}} />);
    expect(screen.queryByTitle('Joined')).toBeNull();
  });

  it('CircleChip names the winning format and falls back to the ask icon', () => {
    const { container } = render(<CircleChip c={{ bestType: 'Hunt', icon: 'nope' }} />);
    expect(screen.getByText('Hunt')).toBeInTheDocument();
    expect(container.querySelector('svg')).not.toBeNull();
  });
});

describe('people kit', () => {
  it('OAvatarOrb shows the ISR and hides the advantage chip without a figure (G-23)', () => {
    render(<OAvatarOrb isr={82} tier={{ n: 2 }} onOpen={() => {}} />);
    const btn = screen.getByRole('button', { name: /your standing/i });
    expect(within(btn).getByText('82')).toBeInTheDocument();
    expect(btn).toHaveAttribute('title', 'ISR 82 · Tier 2 — how it is built and how to move it');
    expect(screen.queryByText(/advantage/)).toBeNull();
  });

  it('OAvatarOrb shows the advantage when the tier carries one', () => {
    render(<OAvatarOrb isr={60} tier={{ n: 1, adv: 0.1 }} />);
    expect(screen.getByText('10% advantage')).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('Spark draws a line for a series and survives a single point', () => {
    const { container, rerender } = render(<Spark values={[1, 4, 2]} tone="#3A95F2" />);
    expect(container.querySelectorAll('path')).toHaveLength(2);
    rerender(<Spark values={[5]} tone="#3A95F2" />);
    expect(container.querySelectorAll('path')).toHaveLength(0);
  });
});

describe('StageRing', () => {
  it('draws five tracks, the finished stages and the partial current one', () => {
    const { container } = render(<StageRing size={96} index={2} fill={0.5} tone="#22C55E" />);
    const paths = [...container.querySelectorAll('path')];
    expect(paths.filter((p) => p.getAttribute('stroke') === 'var(--surface-3)')).toHaveLength(5);
    expect(paths.filter((p) => p.getAttribute('stroke') === '#22C55E')).toHaveLength(3);
  });
});

describe('SnapshotPanel', () => {
  const rows = ['A', 'B', 'C', 'D', 'E'].map((n, i) => ({
    id: n,
    name: `Row ${n}`,
    value: `O ${(5 - i) * 100}`,
    delta: '+1%',
    tone: '#3A95F2',
  }));
  const boards: Record<string, Board> = {
    collected: { label: 'Where the Os flowed', metric: 'Os', rows },
    creators: { label: 'Who moved', metric: 'ISR', rows: rows.slice(0, 2) },
  };
  const pulse: Record<string, Pulse> = {
    collected: { label: 'Flow', headline: 'O 1,500', tone: '#3A95F2', series: [1, 2, 3] },
    creators: { label: 'Creators', headline: '12', tone: '#D946EF', series: [2, 2, 1] },
  };

  it('podium reads 02 · 01 · 03, the rest continue from 04, and a pick reports the row', () => {
    const onPick = vi.fn();
    render(
      <SnapshotPanel boards={boards} pulse={pulse} board="collected" onBoard={() => {}} onPick={onPick} />,
    );
    expect(screen.getByRole('heading', { name: 'Where the Os flowed' })).toBeInTheDocument();
    const names = screen.getAllByText(/^Row /).map((el) => el.textContent);
    expect(names).toEqual(['Row B', 'Row A', 'Row C', 'Row D', 'Row E']);
    expect(screen.getByText('04')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Row D'));
    expect(onPick).toHaveBeenCalledWith(expect.objectContaining({ id: 'D' }));
  });

  it('a pulse tile switches the board; the lit tile opens its section', () => {
    const onBoard = vi.fn();
    const onOpenSection = vi.fn();
    render(
      <SnapshotPanel
        boards={boards}
        pulse={pulse}
        board="collected"
        onBoard={onBoard}
        onPick={() => {}}
        onOpenSection={onOpenSection}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Creators/ }));
    expect(onBoard).toHaveBeenCalledWith('creators');
    const lit = screen.getByRole('button', { pressed: true });
    expect(lit).toHaveAttribute('title', 'Open the whole section');
    fireEvent.click(lit);
    expect(onOpenSection).toHaveBeenCalledWith('collected');
  });

  it('without a rail the board takes the full width', () => {
    const { container } = render(
      <SnapshotPanel boards={boards} pulse={pulse} board="missing" onBoard={() => {}} onPick={() => {}} />,
    );
    const grid = container.querySelector('.weo-snap-grid') as HTMLElement;
    expect(grid.style.gridTemplateColumns).toBe('minmax(0,1fr)');
    expect(screen.getByRole('heading', { name: 'Where the Os flowed' })).toBeInTheDocument();
  });
});

describe('WeO views', () => {
  beforeEach(() => localStorage.clear());

  it('StallTile names the WeO and its format; Enter opens it', () => {
    const w = cardModel(huntWeo(), 'discover', FIXTURE_NOW);
    const onOpen = vi.fn();
    render(<StallTile w={w} onOpen={onOpen} />);
    const tile = screen.getByRole('button', { name: `${w.name} · Hunt` });
    fireEvent.keyDown(tile, { key: 'Enter' });
    expect(onOpen).toHaveBeenCalledWith(w);
  });

  it('starts from the weoView pref, switches view and remembers it per group', () => {
    usePrefs.setState((s) => ({ prefs: { ...s.prefs, weoView: 'list' } }));
    const list = models();
    const h = { onOpen: vi.fn() };
    const { unmount } = render(<WeoView id="t1" list={list} h={h} head={(segs) => <div>{segs}</div>} />);
    expect(screen.getByRole('button', { name: 'List' })).toHaveAttribute('aria-pressed', 'true');
    for (const w of list) expect(screen.getByRole('heading', { name: w.name })).toBeInTheDocument();
    expect(screen.queryByText('Push to Circle')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Cards' }));
    expect(localStorage.getItem('weo.view.t1')).toBe('cards');
    unmount();
    render(<WeoView id="t1" list={list} h={h} head={(segs) => <div>{segs}</div>} />);
    expect(screen.getByRole('button', { name: 'Cards' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('an empty group says so', () => {
    render(<WeoView id="t2" list={[]} h={{ onOpen: () => {} }} />);
    expect(screen.getByText('Nothing here yet.')).toBeInTheDocument();
  });
});

describe('SectionHero', () => {
  beforeEach(() => localStorage.clear());

  it('shows the title and stats; More reveals the priorities and is remembered', () => {
    const ui = (
      <SectionHero
        id="t-hero"
        title="Find what's happening now"
        stats={[{ label: 'Live now', value: 5 }]}
        priorities={[{ id: 'p1', label: 'Night hunt closes in 6h' }]}
      />
    );
    const { unmount } = render(ui);
    expect(screen.getByRole('heading', { name: "Find what's happening now" })).toBeInTheDocument();
    expect(screen.getByText('Live now')).toBeInTheDocument();
    const more = screen.getByRole('button', { name: /More/ });
    expect(more).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(more);
    expect(screen.getByRole('button', { name: /Less/ })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Night hunt closes in 6h')).toBeInTheDocument();
    unmount();
    render(ui);
    expect(screen.getByRole('button', { name: /Less/ })).toBeInTheDocument();
  });
});

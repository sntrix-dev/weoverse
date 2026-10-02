import { useMemo, useState, type CSSProperties } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { ApiError } from '@/api/client';
import { routes } from '@/app/routes';
import { withTabIcons } from '@/components/hero/HeroParts';
import { SectionHero } from '@/components/hero/SectionHero';
import { Rows } from '@/components/layout/Rows';
import { Scene } from '@/components/layout/Scene';
import { SectionHead } from '@/components/layout/SectionMark';
import { FlowFoot } from '@/components/shell/FlowBar';
import { PathBar } from '@/components/shell/PathBar';
import { useHubPath } from '@/components/shell/useHubPath';
import { SnapshotChart, SnapshotPanel, type BoardRow } from '@/components/snapshot/Snapshot';
import { SnapshotRail } from '@/components/snapshot/SnapshotRail';
import { Button, O_SECTION_ICONS, Tabs } from '@/design-system';
import { useDrafts, useFollow } from '@/features/community/api/community';
import { useNavSummary } from '@/features/shell/api/navSummary';
import { formatHex } from '@/lib/cardModel';
import { pulseMap } from '@/lib/snapshotModel';
import { openPush } from '@/stores/flow';
import { toast } from '@/stores/ui';
import { useCircleCreators, useListingsSnapshot, useSetListingStatus } from '../api/listings';
import { CircleCreatorsOrbit, type OrbitPerson } from '../components/CircleCreatorsOrbit';
import { ListingRow, type ListingRowHandlers } from '../components/ListingRow';
import {
  attention,
  draftModel,
  EXCHANGE_PULSE_TONES,
  exchangeBoards,
  exchangeStats,
  listingModel,
  type ListingModel,
} from '../model/listings';

const page: CSSProperties = {
  maxWidth: 'var(--page-w)',
  margin: '0 auto',
  padding: 'clamp(16px,2.2vw,26px) clamp(16px,2.4vw,28px) 190px',
  animation: 'weo-cardin .5s var(--ease-portal) both',
};

const quiet: CSSProperties = {
  margin: 0,
  padding: 40,
  textAlign: 'center',
  fontSize: 13.5,
  color: 'var(--text-dim)',
  background: 'var(--surface)',
};

const TABS = ['All', 'Live', 'Draft', 'Closed'] as const;
type Tab = (typeof TABS)[number];

const fail = (e: unknown) => (e instanceof ApiError ? e.message : 'That did not go through — try again.');

/** design: exchange.jsx ListedScreen — the stage where a WeO earns: put into flow by you, on the floor for everyone. */
export function ExchangePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const path = useHubPath([{ label: 'Exchange' }]);
  const snap = useListingsSnapshot('7d');
  const drafts = useDrafts();
  const me = useNavSummary().data;
  const creatorsQ = useCircleCreators(6);
  const setStatus = useSetListingStatus();
  const follow = useFollow();
  const [board, setBoard] = useState('performing');
  const [tab, setTab] = useState<Tab>('All');

  const s = snap.data;
  const all = useMemo(() => {
    const listed = (s?.rows ?? []).map((r) => listingModel(r));
    // a paused listing reads `draft` on the wire; your drafts proper come from the composer (D-047)
    const unfinished = (drafts.data?.items ?? []).map(draftModel);
    return [...listed, ...unfinished];
  }, [s, drafts.data]);
  const byId = useMemo(() => new Map(all.map((l) => [l.id, l])), [all]);
  const att = useMemo(() => attention(all), [all]);
  const boards = useMemo(() => exchangeBoards(s, byId, att), [s, byId, att]);
  const pulse = useMemo(() => pulseMap(s?.pulse, EXCHANGE_PULSE_TONES), [s]);
  const list = tab === 'All' ? all : all.filter((l) => l.tab === tab);

  const people: OrbitPerson[] = useMemo(
    () =>
      (creatorsQ.data?.items ?? [])
        .filter((c) => c.id !== me?.id)
        .slice(0, 6)
        .map((c) => ({
          id: c.id,
          name: c.name,
          handle: c.handle,
          avatar: c.avatarUrl,
          isr: c.isr,
          bio: c.bio ?? null,
          format: c.format,
          tone: c.tone,
          circled: c.circled,
        })),
    [creatorsQ.data, me?.id],
  );

  const open = (l: ListingModel) => void navigate(l.kind === 'draft' ? routes.create(l.id) : routes.weo(l.id));
  const act: ListingRowHandlers = {
    onOpen: open,
    // editing a live WeO arrives with the composer (M07): until then it opens the WeO
    onEdit: open,
    onToggle: (l) => {
      const to = l.paused ? 'active' : 'inactive';
      setStatus.mutate(
        { id: l.id, status: to, was: l.paused ? 'inactive' : 'active' },
        {
          onSuccess: () => toast(`${l.name} · ${to === 'active' ? 'back in flow' : 'paused — off the floor'}`),
          onError: (e) => toast(fail(e)),
        },
      );
    },
    onPush: (l) =>
      openPush({
        id: l.id,
        name: l.name,
        img: l.img,
        type: l.format,
        category: '',
        hex: formatHex(l.format),
        creatorId: me?.id ?? '',
        circleIds: l.circle ? [l.circle.id] : [],
      }),
  };

  const onPick = (r: BoardRow) => {
    const l = byId.get(r.id);
    if (l) open(l);
    else toast(`${r.name} · ${r.value}`);
  };

  const rail = (
    <SnapshotRail
      title="Needs attention"
      empty="Nothing waiting on you."
      rows={att.slice(0, 6).map((a) => ({ k: a.l.name, v: a.act, note: a.why, tone: a.tone, onAct: () => open(a.l) }))}
    />
  );

  return (
    <main style={page}>
      <PathBar onHub={path.onHub} items={path.items} />
      <SectionHero
        id="listed"
        tone="#F7C62B"
        icon={O_SECTION_ICONS.left}
        eyebrow="04 of 04"
        title="Exchange"
        bleedArt={all.find((l) => l.img)?.img ?? undefined}
        lede="Move with the market. The stage where a WeO earns: put into flow by you, on the floor for everyone."
        stats={exchangeStats(s, all)}
        directory={[
          { id: 'l-listed', label: 'Your listings', count: all.length },
          { id: 'l-more', label: 'Creators & snapshot' },
        ]}
        actions={
          <Button size="sm" variant="primary" tone="gold" onClick={() => void navigate(routes.create())}>
            New WeO
          </Button>
        }
        foot={
          Object.keys(pulse).length ? (
            <SnapshotChart pulse={pulse} keys={Object.keys(EXCHANGE_PULSE_TONES)} value={board} onChange={setBoard} />
          ) : undefined
        }
      />

      <Scene id="l-listed" style={{ display: 'block', marginTop: 40 }}>
        <SectionHead
          eyebrow="01 — In flow"
          title="WeOs you flow"
          right={<Tabs tabs={withTabIcons([...TABS])} value={tab} onChange={(v) => setTab(v as Tab)} tone="var(--o-gold)" />}
        />
        <div
          style={{
            display: 'grid',
            gap: 1,
            borderRadius: 26,
            overflow: 'hidden',
            background: 'var(--border)',
            boxShadow: 'var(--nm-raised), inset 0 0 0 1px var(--border)',
          }}
        >
          {list.map((l, i) => (
            <ListingRow key={`${l.kind}-${l.id}`} l={l} i={i} act={act} />
          ))}
          {list.length === 0 && (
            <p style={quiet}>
              {snap.isLoading
                ? 'Reading your storefront…'
                : snap.isError
                  ? 'Your listings did not load.'
                  : `Nothing ${tab === 'All' ? 'in flow' : tab.toLowerCase()} right now.`}
            </p>
          )}
        </div>
      </Scene>

      <Scene id="l-more" style={{ display: 'block', marginTop: 40 }}>
        <Rows
          rows={[
            {
              id: 'l-snapshot',
              title: 'Snapshot · 7d',
              tone: '#F7C62B',
              body: Object.keys(boards).length ? (
                <SnapshotPanel
                  boards={boards}
                  pulse={pulse}
                  board={board}
                  onBoard={setBoard}
                  eyebrow="Your listings · 7d"
                  rail={rail}
                  onPick={onPick}
                />
              ) : (
                <p style={{ ...quiet, background: 'transparent' }}>{snap.isLoading ? 'Measuring…' : 'Nothing to measure yet.'}</p>
              ),
            },
            {
              id: 'l-creators',
              title: 'Creators in your circles',
              count: people.length,
              tone: '#F7C62B',
              body: (
                <CircleCreatorsOrbit
                  list={people}
                  shared={creatorsQ.data?.shared ?? false}
                  me={{ avatar: me?.avatarUrl ?? null, isr: me?.isr ?? 0, tier: me?.tier?.label ?? null }}
                  onOpen={(p) => void navigate(routes.creators(p.id))}
                  onCircle={(p) =>
                    follow.mutate(
                      { userId: p.id, follow: !p.circled },
                      {
                        onSuccess: () => toast(p.circled ? `Unfollowed ${p.name}` : `Following ${p.name}`),
                        onError: (e) => toast(fail(e)),
                        onSettled: () => void qc.invalidateQueries({ queryKey: ['creators'] }),
                      },
                    )
                  }
                  onStanding={() => void navigate(routes.passport())}
                  onCircles={() => void navigate(routes.manage())}
                />
              ),
            },
          ]}
        />
      </Scene>
      <FlowFoot
        screen="listed"
        back={{ label: 'Community', go: () => void navigate(routes.hub()) }}
        next={{ label: 'Discover', lead: 'See them on the floor', go: () => void navigate(routes.discover()), tone: '#3A95F2' }}
      />
    </main>
  );
}

export default ExchangePage;

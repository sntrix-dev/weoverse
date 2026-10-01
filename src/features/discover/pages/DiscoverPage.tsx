import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { routes } from '@/app/routes';
import { CircleRecord } from '@/components/circle/Circle';
import { useViewPrefs } from '@/components/hero/ViewBar';
import { withTabIcons } from '@/components/hero/HeroParts';
import { SectionHero } from '@/components/hero/SectionHero';
import { Fold, Rail, RailHead } from '@/components/layout/Rail';
import { Scene } from '@/components/layout/Scene';
import { FlowFoot } from '@/components/shell/FlowBar';
import { PathBar } from '@/components/shell/PathBar';
import { RAIL_VIEW, WeoView } from '@/components/weo/WeoView';
import { O_SECTION_ICONS, Tabs } from '@/design-system';
import { cardModel, type WeoCardModel } from '@/lib/cardModel';
import { osFmt } from '@/lib/format';
import { glide } from '@/lib/glide';
import { useWeoHandlers } from '@/features/weo/useWeoHandlers';
import { useWeos, type WeoListParams } from '@/features/weo/api/weos';
import { openDock, toast } from '@/stores/ui';
import { useCircles, useCreators, useDiscoverySnapshot, useFeed, useInterests } from '../api/discover';
import { FeedBoard } from '../components/Feed';
import { CreatorStall, FloorGrid, InterestTile, type FloorLens } from '../components/Floor';
import { StageDeck } from '../components/Stage';
import { feedItemModel } from '../model/feed';
import { circleCard, creatorStall, interest } from '../model/rails';

const page: CSSProperties = {
  maxWidth: 'var(--page-w)',
  margin: '0 auto',
  padding: 'clamp(16px,2.2vw,26px) clamp(16px,2.4vw,28px) 190px',
  animation: 'weo-cardin .5s var(--ease-portal) both',
};

const WEO_VIEW_OPTIONS = [
  RAIL_VIEW,
  { value: 'cards', label: 'Cards' },
  { value: 'orbit', label: 'Orbit' },
  { value: 'list', label: 'List' },
] as const;

const FLOOR_QUERY: Record<FloorLens, WeoListParams> = {
  all: { sort: 'recent' },
  ending: { sort: 'ending_soon', status: 'active' },
  moving: { sort: 'trending', status: 'active' },
  open: { sort: 'recent', status: 'active' },
};

const jumpTo = (id: string) => {
  const el = document.getElementById(id);
  if (el) glide(window, el.getBoundingClientRect().top + window.scrollY - 90);
};

/** Models for a page of WeOs, minus the formats the viewer muted (design VIEW.weos). */
function useModels(items: { items: Parameters<typeof cardModel>[0][] } | undefined, muted: string[]) {
  return useMemo(
    () => (items?.items ?? []).map((w) => cardModel(w)).filter((w) => !muted.includes(w.type)),
    [items, muted],
  );
}

/** design: discover.jsx DiscoverScreen — "01 of 04": what is happening now, on the floor. */
export function DiscoverPage() {
  const navigate = useNavigate();
  const h = useWeoHandlers();
  const [params] = useSearchParams();
  const query = params.get('q') ?? '';
  const { prefs } = useViewPrefs();
  const muted = prefs.mutedFormats;

  const [lens, setLens] = useState<FloorLens>('all');
  /* Everything is open at rest; this holds only what the reader has collapsed. */
  const [shut, setShut] = useState<string[]>([]);
  const toggle = (id: string) => setShut((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const isShut = (id: string) => shut.includes(id);
  const goPlace = (id: string) => {
    setShut((s) => s.filter((x) => x !== id));
    setTimeout(() => jumpTo(id), 60);
  };
  const toFloor = (k: FloorLens) => {
    setLens(k);
    setShut((s) => s.filter((x) => x !== 'floor'));
    setTimeout(() => jumpTo('floor'), 60);
  };

  // a search from the top bar lands on the floor
  useEffect(() => {
    if (!query) return;
    const t = setTimeout(() => {
      setLens('all');
      setShut((s) => s.filter((x) => x !== 'floor'));
      setTimeout(() => jumpTo('floor'), 60);
    }, 60);
    return () => clearTimeout(t);
  }, [query]);

  const snapshot = useDiscoverySnapshot();
  const feed = useFeed();
  const stageQ = useWeos({ sort: 'recent', status: 'active', limit: 8 });
  const endingQ = useWeos({ sort: 'ending_soon', status: 'active', limit: 12 });
  const movingQ = useWeos({ sort: 'trending', status: 'active', limit: 12 });
  const followedQ = useWeos({ feed: 'following', status: 'active', limit: 12 });
  const floorQ = useWeos({ ...FLOOR_QUERY[lens], search: query || undefined, limit: 24 });
  const creatorsQ = useCreators(12);
  const circlesQ = useCircles();
  const interestsQ = useInterests();

  const stageAll = useModels(stageQ.data, muted);
  // design: the stage holds what is live — an active WeO past its own close time is not
  const stage = useMemo(() => stageAll.filter((w) => w.live), [stageAll]);
  const ending = useModels(endingQ.data, muted);
  const moving = useModels(movingQ.data, muted);
  const followed = useModels(followedQ.data, muted);
  const floor = useModels(floorQ.data, muted);
  const feedItems = useMemo(() => (feed.data?.items ?? []).map((i) => feedItemModel(i)), [feed.data]);
  const creators = useMemo(() => (creatorsQ.data?.items ?? []).map(creatorStall), [creatorsQ.data]);
  const circles = useMemo(() => {
    const d = circlesQ.data;
    const seen = new Set<string>();
    return [...(d?.joined ?? []), ...(d?.suggested ?? [])]
      .filter((c) => (seen.has(c.id) ? false : (seen.add(c.id), true)))
      .map(circleCard);
  }, [circlesQ.data]);
  const interests = useMemo(() => (interestsQ.data ?? []).map(interest), [interestsQ.data]);

  const snap = snapshot.data;
  const live = snap?.liveCount ?? stageQ.data?.pagination.total ?? 0;
  const count = (q: { data?: { pagination: { total: number } } }, shown: number) =>
    q.data?.pagination.total ?? shown;
  const open = (w: WeoCardModel) => h.onOpen(w);

  return (
    <main style={page}>
      <PathBar
        onHub={() => void navigate(routes.hub())}
        items={[
          { label: 'WeOverse', onClick: () => void navigate(routes.hub()) },
          { label: 'Community', onClick: () => void navigate(routes.hub()) },
          { label: 'Discover' },
        ]}
      />
      <SectionHero
        id="discover"
        tone="#3A95F2"
        icon={O_SECTION_ICONS.top}
        eyebrow="01 of 04"
        title="Discover"
        bleedArt={stage[0]?.img ?? undefined}
        lede="Find what’s happening now. The first stage of a WeO's life: in the open, on the floor, still anyone's. Whatever closes first takes the big frame."
        stats={[
          { value: String(live), label: 'On the floor' },
          {
            value: osFmt(snap?.settledOs7d ?? 0),
            os: true,
            label: 'In motion',
            title: 'Os that settled on the floor in the last seven days',
          },
          { value: String(snap?.followingNewCount ?? 0), label: 'From creators you circle' },
        ]}
        directory={[
          { id: 'd-stage', label: 'On the stage' },
          { id: 'd-feed', label: 'Your feed' },
          { id: 'd-ending', label: 'Closing soonest', count: count(endingQ, ending.length) },
          { id: 'd-moving', label: 'Moving now', count: count(movingQ, moving.length) },
          { id: 'd-followed', label: 'Creators you circle', count: count(followedQ, followed.length) },
          { id: 'd-creators', label: 'Who is trading', count: creatorsQ.data?.total ?? creators.length },
          { id: 'd-circles', label: 'Circles behind the floor', count: circles.length },
          { id: 'd-interests', label: 'Browse by interest', count: interests.length },
          { id: 'floor', label: 'The whole floor' },
        ].map((d) => ({ ...d, onClick: () => goPlace(d.id) }))}
        foot={stage.length ? <StageDeck list={stage} /> : undefined}
        filterSummary={lens === 'all' ? 'All' : lens === 'ending' ? 'Closing' : 'Moving'}
        filters={
          <Tabs
            tabs={withTabIcons([
              { value: 'all', label: 'All' },
              { value: 'ending', label: 'Closing' },
              { value: 'moving', label: 'Moving' },
            ])}
            value={lens}
            onChange={(v) => toFloor(v as FloorLens)}
            tone="var(--o-blue)"
          />
        }
      />

      <Scene id="d-feed" style={{ display: 'block', marginTop: 46 }}>
        <Fold id="d-feed" shut={isShut('d-feed')} onToggle={toggle} title="Your feed" tone="var(--o-blue)">
          {feedItems.length ? (
            <FeedBoard items={feedItems} />
          ) : (
            <p style={quiet}>{feed.isLoading ? 'Reading the feed…' : 'Nothing in the feed yet.'}</p>
          )}
        </Fold>
      </Scene>

      <Scene id="d-ending" style={{ display: 'block', marginTop: 44 }}>
        <Fold
          id="d-ending"
          shut={isShut('d-ending')}
          onToggle={toggle}
          title="Closing soonest"
          tone="#F7C62B"
          count={count(endingQ, ending.length)}
        >
          <WeoView
            h={h}
            list={ending}
            id="disc3.ending"
            tile="stall"
            tone="#F7C62B"
            options={WEO_VIEW_OPTIONS}
            head={(segs) => (
              <RailHead
                tone="#F7C62B"
                title="Closing soonest"
                note="The countdown is the WeO's own close time. Nothing without one appears here."
                action="Browse all"
                onAction={() => toFloor('ending')}
                views={segs}
              />
            )}
          />
        </Fold>
      </Scene>

      <Scene id="d-moving" style={{ display: 'block', marginTop: 40 }}>
        <Fold
          id="d-moving"
          shut={isShut('d-moving')}
          onToggle={toggle}
          title="Moving now"
          tone="#D946EF"
          count={count(movingQ, moving.length)}
        >
          <WeoView
            h={h}
            list={moving}
            id="disc3.moving"
            tile="stall"
            tone="#D946EF"
            options={WEO_VIEW_OPTIONS}
            head={(segs) => (
              <RailHead
                tone="#D946EF"
                title="Moving now"
                note="Ranked by who is in the room, not by all-time popularity."
                action="Browse all"
                onAction={() => toFloor('moving')}
                views={segs}
              />
            )}
          />
        </Fold>
      </Scene>

      <Scene id="d-followed" style={{ display: 'block', marginTop: 40 }}>
        <Fold
          id="d-followed"
          shut={isShut('d-followed')}
          onToggle={toggle}
          title="Creators you circle"
          tone="#22C55E"
          count={count(followedQ, followed.length)}
        >
          <WeoView
            h={h}
            list={followed}
            id="disc3.followed"
            tile="stall"
            tone="#22C55E"
            options={WEO_VIEW_OPTIONS}
            head={(segs) => (
              <RailHead
                tone="#22C55E"
                title="From creators you circle"
                note="Circle a creator and their next WeO lands in this row."
                action="Find creators"
                onAction={() => void navigate(routes.creators())}
                views={followed.length ? segs : null}
              />
            )}
            empty={
              <p
                style={{
                  ...quiet,
                  padding: 30,
                  borderRadius: 24,
                  background: 'var(--surface-2)',
                  boxShadow: 'var(--nm-inset)',
                }}
              >
                Nothing yet — circle a creator and their WeOs arrive here.
              </p>
            }
          />
        </Fold>
      </Scene>

      <Scene id="d-creators" style={{ display: 'block', marginTop: 44 }}>
        <Fold
          id="d-creators"
          shut={isShut('d-creators')}
          onToggle={toggle}
          title="Who is trading"
          tone="#3A95F2"
          count={creatorsQ.data?.total ?? creators.length}
        >
          <RailHead
            tone="#3A95F2"
            title="Who is trading"
            note="Standing leads: the score, and the seven days behind it."
            action="All creators"
            onAction={() => void navigate(routes.creators())}
          />
          <Rail w={250}>
            {creators.map((c) => (
              <CreatorStall key={c.id} c={c} onOpen={() => void navigate(routes.creators(c.id))} />
            ))}
          </Rail>
        </Fold>
      </Scene>

      <Scene id="d-circles" style={{ display: 'block', marginTop: 40 }}>
        <Fold
          id="d-circles"
          shut={isShut('d-circles')}
          onToggle={toggle}
          title="Circles behind the floor"
          tone="#D946EF"
          count={circles.length}
        >
          <RailHead
            tone="#D946EF"
            title="Circles behind the floor"
            note="Every WeO here posts in a Circle. That is where the questions are."
            action="Community hub"
            onAction={() => void navigate(routes.hub())}
          />
          <Rail w={250}>
            {circles.slice(0, 6).map((c) => (
              <div key={c.id} style={{ flex: '0 0 auto', width: 244, scrollSnapAlign: 'start' }}>
                <CircleRecord c={c} joined={c.joined} onOpen={() => void navigate(routes.circle(c.id))} />
              </div>
            ))}
          </Rail>
        </Fold>
      </Scene>

      <Scene id="d-interests" style={{ display: 'block', marginTop: 40 }}>
        <Fold
          id="d-interests"
          shut={isShut('d-interests')}
          onToggle={toggle}
          title="Browse by interest"
          tone="#F7C62B"
          count={interests.length}
        >
          <RailHead
            tone="#F7C62B"
            title="Browse by interest"
            note="What wins where — the format that actually clears in each context."
          />
          <Rail w={200}>
            {interests.map((c) => (
              <InterestTile
                key={c.context}
                ctx={c}
                onOpen={() => toast(`${c.context} · ${c.type} wins here at ${Math.round(c.rate * 100)}%`)}
              />
            ))}
          </Rail>
        </Fold>
      </Scene>

      <Scene id="floor" style={{ display: 'block', marginTop: 46 }}>
        <Fold
          id="floor"
          shut={isShut('floor')}
          onToggle={toggle}
          title="The whole floor"
          tone="var(--o-blue)"
        >
          <FloorGrid
            list={floor}
            total={floorQ.data?.pagination.total ?? floor.length}
            query={query}
            lens={lens}
            setLens={setLens}
            loading={floorQ.isFetching && !floorQ.data}
            onClear={() => void navigate(routes.discover())}
            onOpen={open}
            onAskMya={() => openDock('mya')}
            onRequest={() => void navigate(routes.requests())}
          />
        </Fold>
      </Scene>

      <FlowFoot screen="discover" back={{ label: 'Community', go: () => void navigate(routes.hub()) }} />
    </main>
  );
}

const quiet: CSSProperties = {
  margin: 0,
  padding: 20,
  textAlign: 'center',
  fontSize: 13,
  color: 'var(--text-dim)',
};

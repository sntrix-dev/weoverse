import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { routes } from '@/app/routes';
import { CircleRecord } from '@/components/circle/Circle';
import { FilterMenu, StuckViews } from '@/components/hero/FilterMenu';
import { useViewPrefs } from '@/components/hero/ViewBar';
import { Fold, Rail, RailHead } from '@/components/layout/Rail';
import { Scene } from '@/components/layout/Scene';
import { cardModel, type WeoCardModel } from '@/lib/cardModel';
import { glide } from '@/lib/glide';
import { useWeoHandlers } from '@/features/weo/useWeoHandlers';
import { useWeos } from '@/features/weo/api/weos';
import { openWorld } from '@/stores/flow';
import { openDock, toast } from '@/stores/ui';
import { useCircles, useCreators, useDiscoverySnapshot, useFeed, useInterests } from '../api/discover';
import { FEED_VIEWS, FeedBoard, type FeedTab } from '../components/Feed';
import { CreatorStall, FloorGrid, InterestTile, type FloorLens } from '../components/Floor';
import { HeroPill, StickyFilters } from '../components/FloorBar';
import { StageDeck } from '../components/Stage';
import { feedItemModel } from '../model/feed';
import { circleCard, creatorStall, interest } from '../model/rails';

/*
 * The page is one wrapping row (design app.css v4): the sticky filter bar and the hero pill share
 * the first line, everything after takes a full line. The bar's containing block is the page, so
 * it stays pinned all the way down.
 */
const page: CSSProperties = {
  maxWidth: 'var(--page-w)',
  margin: '0 auto',
  padding: 'clamp(16px,2.2vw,26px) clamp(16px,2.4vw,28px) 190px',
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  columnGap: 16,
  // the entry animation must not leave a filter behind: a filtered ancestor stops the pinned
  // bar's backdrop blur
  animation: 'weo-cardin .5s var(--ease-portal) backwards',
};
const full: CSSProperties = { flex: '1 0 100%', minWidth: 0 };

const jumpTo = (id: string) => {
  const el = document.getElementById(id);
  if (el) glide(window, el.getBoundingClientRect().top + window.scrollY - 136);
};

/** Models for a page of WeOs, minus the formats the viewer muted (design VIEW.weos). */
function useModels(items: { items: Parameters<typeof cardModel>[0][] } | undefined, muted: string[]) {
  return useMemo(
    () => (items?.items ?? []).map((w) => cardModel(w)).filter((w) => !muted.includes(w.type)),
    [items, muted],
  );
}

/**
 * design: discover.jsx DiscoverScreen (v4) — "01 of 04": one feed with filters. A sticky bar
 * (Jump to, Closing soonest, Moving now; the view switch and Enter a world once pinned) shares
 * its row with a pill of three figures; the stage is a carousel; the feed pages in nines; then
 * who is trading, the circles and the interests. v4 drops the breadcrumb, the flow bar and the
 * rails under the feed (Closing soonest, Moving now, Creators you circle, The whole floor) —
 * the feed's own chips do their job. A search from the top bar still lands here, on the floor
 * as "Results for …" (D-106).
 */
export function DiscoverPage() {
  const navigate = useNavigate();
  const h = useWeoHandlers();
  const [params] = useSearchParams();
  const query = params.get('q') ?? '';
  const { prefs } = useViewPrefs();
  const muted = prefs.mutedFormats;
  const heroRef = useRef<HTMLElement>(null);

  const [tab, setTab] = useState<FeedTab>('all');
  const [lens, setLens] = useState<FloorLens>('all');
  const [feedShut, setFeedShut] = useState(false);
  const goPlace = (id: string) => {
    if (id === 'd-feed') setFeedShut(false);
    setTimeout(() => jumpTo(id), 60);
  };
  // design `toFloor`: the quick chips choose the feed's lens and bring it into view
  const toFeed = (t: FeedTab) => {
    setTab(t);
    setFeedShut(false);
    setTimeout(() => jumpTo('d-feed'), 60);
  };

  // a search from the top bar lands on the floor's results
  useEffect(() => {
    if (!query) return;
    const t = setTimeout(() => {
      setLens('all');
      jumpTo('floor');
    }, 120);
    return () => clearTimeout(t);
  }, [query]);

  const snapshot = useDiscoverySnapshot();
  const feed = useFeed();
  const stageQ = useWeos({ sort: 'recent', status: 'active', limit: 8 });
  const allQ = useWeos({ sort: 'recent', limit: 1 });
  const endingQ = useWeos({ sort: 'ending_soon', status: 'active', limit: 1 });
  const movingQ = useWeos({ sort: 'trending', status: 'active', limit: 1 });
  const floorQ = useWeos(
    {
      sort: lens === 'ending' ? 'ending_soon' : lens === 'moving' ? 'trending' : 'recent',
      status: lens === 'all' ? undefined : 'active',
      search: query || undefined,
      limit: 24,
    },
    !!query,
  );
  const creatorsQ = useCreators(12);
  const circlesQ = useCircles();
  const interestsQ = useInterests();

  const stageAll = useModels(stageQ.data, muted);
  // design: the stage holds what is live — an active WeO past its own close time is not
  const stage = useMemo(() => stageAll.filter((w) => w.live), [stageAll]);
  const floor = useModels(floorQ.data, muted);
  const cover = useMemo(() => (feed.data?.items ?? []).map((i) => feedItemModel(i)), [feed.data]);
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
  const total = (q: { data?: { pagination: { total: number } } }) => q.data?.pagination.total ?? null;
  const open = (w: WeoCardModel) => h.onOpen(w);
  const creatorCount = creatorsQ.data?.total ?? creators.length;

  return (
    <main style={page}>
      <StickyFilters heroRef={heroRef}>
        <FilterMenu
          label="Jump to"
          tone="var(--o-blue)"
          groups={[
            {
              label: 'Jump to',
              items: [
                // nothing live, no stage — the menu does not offer a place that is not there
                ...(stage.length ? [{ key: 'd-stage', label: 'On the stage' }] : []),
                { key: 'd-feed', label: 'Your feed' },
                { key: 'd-creators', label: 'Who is trading', count: creatorCount },
                { key: 'd-circles', label: 'Circles behind the floor', count: circles.length },
                { key: 'd-interests', label: 'Browse by interest', count: interests.length },
              ].map((d) => ({ ...d, onClick: () => goPlace(d.key) })),
            },
          ]}
          quick={[
            {
              key: 'ending',
              urgent: true,
              label: 'Closing soonest',
              count: total(endingQ),
              active: tab === 'ending',
              onClick: () => toFeed('ending'),
            },
            {
              key: 'moving',
              label: 'Moving now',
              count: total(movingQ),
              active: tab === 'moving',
              onClick: () => toFeed('moving'),
            },
          ]}
        />
        <StuckViews
          id="feed.board"
          items={FEED_VIEWS}
          initial="editorial"
          tone="var(--o-blue)"
          onWorld={() => openWorld()}
        />
      </StickyFilters>
      <HeroPill
        pillRef={heroRef}
        id="discover"
        title="Discover"
        tone="#3A95F2"
        lede="Find what’s happening now. The first stage of a WeO's life: in the open, on the floor, still anyone's. Whatever closes first takes the big frame."
        stats={[
          { value: String(live), label: 'On the floor' },
          {
            value: String(total(allQ) ?? 0),
            label: 'WeOs in motion',
            title: 'Every WeO on the floor, open or closed',
          },
          {
            value: String(snap?.followingNewCount ?? 0),
            label: 'From My Circle',
            title: 'Posted in the last seven days by creators you circle',
          },
        ]}
      />

      {stage.length > 0 && (
        <div style={{ ...full, marginTop: 24 }}>
          <StageDeck list={stage} />
        </div>
      )}

      <Scene id="d-feed" style={{ ...full, display: 'block', marginTop: 46 }}>
        <Fold
          id="d-feed"
          shut={feedShut}
          onToggle={() => setFeedShut((v) => !v)}
          title="Your feed"
          note="Size is urgency: whatever closes first, or leads this week, takes the big frame."
          tone="var(--o-blue)"
        >
          <FeedBoard cover={cover} tab={tab} onTab={setTab} />
        </Fold>
      </Scene>

      {query && (
        <Scene id="floor" style={{ ...full, display: 'block', marginTop: 46 }}>
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
        </Scene>
      )}

      <Scene id="d-creators" style={{ ...full, display: 'block', marginTop: 44 }}>
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
      </Scene>

      <Scene id="d-circles" style={{ ...full, display: 'block', marginTop: 40 }}>
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
      </Scene>

      <Scene id="d-interests" style={{ ...full, display: 'block', marginTop: 40 }}>
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
      </Scene>
    </main>
  );
}

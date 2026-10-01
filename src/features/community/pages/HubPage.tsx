import { useMemo, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router';
import { routes } from '@/app/routes';
import { withTabIcons } from '@/components/hero/HeroParts';
import { SectionHero } from '@/components/hero/SectionHero';
import { Rows } from '@/components/layout/Rows';
import { Scene } from '@/components/layout/Scene';
import { IconSegs } from '@/components/layout/SectionMark';
import { FlowBar, FlowFoot } from '@/components/shell/FlowBar';
import { PathBar } from '@/components/shell/PathBar';
import { useWeoView } from '@/components/weo/WeoView';
import { Button, ICO, Tabs } from '@/design-system';
import { circleView, type CircleView } from '@/lib/circleModel';
import {
  useCommunityCircles,
  useContributors,
  useDiscussions,
  useDrafts,
  useMyWeos,
  useStories,
  type DiscussionFilter,
} from '../api/community';
import { CircleGrid } from '../components/CircleGrid';
import { LensSegs, StoryGrid, ThreadRow, useHubPath, useOpenStory, type HubLens } from '../components/Hub';
import { FLIGHT_VIEWS, InFlightGrid, nextAct, type FlightHandlers } from '../components/InFlight';
import { StewardGrid } from '../components/StewardGrid';
import { WalletRow } from '../components/WalletRow';
import { flightItems, stewardModel, storyModel, threadModel } from '../model/community';
import { useCommunityActions } from '../useCommunity';

const page: CSSProperties = {
  maxWidth: 'var(--page-w)',
  margin: '0 auto',
  padding: 'clamp(16px,2.2vw,26px) clamp(16px,2.4vw,28px) 190px',
  animation: 'weo-cardin .5s var(--ease-portal) both',
};

const quiet: CSSProperties = { margin: 0, padding: 24, textAlign: 'center', fontSize: 13, color: 'var(--text-dim)' };

const HERO_ART = '/media/weo-nutrition.jpg';

/** design: community.jsx HubScreen — your WeOs in flight, and the Circles around them. */
export function HubPage() {
  const navigate = useNavigate();
  const path = useHubPath();
  const act = useCommunityActions();
  const openStory = useOpenStory();

  const drafts = useDrafts();
  const mine = useMyWeos();
  const circlesQ = useCommunityCircles();
  const [lens, setLens] = useState<HubLens>('questions');
  const [filter, setFilter] = useState<DiscussionFilter>('all');
  const feedQ = useDiscussions(filter);
  const stewardsQ = useContributors(4);
  const storiesQ = useStories();
  const [view, setView] = useWeoView('flight', FLIGHT_VIEWS, 'cards');

  const items = useMemo(
    () => flightItems(drafts.data?.items ?? [], mine.data?.items ?? []),
    [drafts.data, mine.data],
  );
  const inFlight = items.filter((x) => x.stage !== 'live');
  const live = items.filter((x) => x.stage === 'live');
  // reactions and pledges arrive with M11: nothing waits on the circle yet (D-037)
  const waiting = 0;

  const { joined, suggested } = useMemo(() => {
    const d = circlesQ.data;
    const j = (d?.joined ?? []).map(circleView);
    const ids = new Set(j.map((c) => c.id));
    // the backend's `suggested` can repeat a joined circle (api-gaps)
    const s = (d?.suggested ?? []).filter((c) => !ids.has(c.id) && !c.isJoined).map(circleView);
    return { joined: j, suggested: s };
  }, [circlesQ.data]);

  const feed = useMemo(() => (feedQ.data?.items ?? []).map(threadModel), [feedQ.data]);
  const stewards = useMemo(() => (stewardsQ.data?.contributors ?? []).map(stewardModel), [stewardsQ.data]);
  const stories = useMemo(() => (storiesQ.data?.items ?? []).map(storyModel), [storiesQ.data]);

  const fh: FlightHandlers = {
    onPost: (it) => void navigate(routes.create(it.ref)),
    onMarket: () => void navigate(routes.listed()),
    onOpen: (it) => void navigate(it.stage === 'draft' ? routes.create(it.ref) : routes.weo(it.ref)),
    onCreate: () => void navigate(routes.create()),
  };
  const circleAct = {
    onEnter: (c: CircleView) => void navigate(routes.circle(c.id)),
    onToggleJoin: (c: CircleView) => act.toggleJoin(c),
  };
  const next = inFlight.map((x) => ({ x, n: nextAct(x, fh) })).find((p) => p.n.verb);

  return (
    <main style={page}>
      <PathBar onHub={path.onHub} items={path.items} />
      <SectionHero
        id="hub"
        tone="#D946EF"
        icon={ICO.hub}
        eyebrow="Community"
        title="Community"
        bleedArt={HERO_ART}
        lede="Your WeOs in flight, and the Circles around them. Post a WeO and it is live today. Or let your circle vet it first: rehearse the price in a world, hear what twelve collectors would pay, and let twenty pledges pre-sell it — then it posts itself with a validated mark and goes ahead on the floor. Each O below shows the next step and what it earns you; ‘Post it now’ is always one tap away."
        stats={[
          { value: String(inFlight.length), label: 'In flight' },
          { value: String(waiting), label: 'With your circle' },
          { value: String(live.length), label: 'Live' },
        ]}
        directory={[
          { id: 'h-flight', label: 'In flight', count: inFlight.length },
          { id: 'h-rooms', label: 'Circles', count: joined.length },
          { id: 'h-more', label: 'Community & wallet' },
        ]}
      />

      <Scene id="h-flight" style={{ display: 'block', marginTop: 36 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <IconSegs items={FLIGHT_VIEWS} value={view} onChange={setView} tone="#D946EF" />
        </div>
        <InFlightGrid items={[...inFlight, ...live]} view={view} h={fh} />
      </Scene>

      <Scene id="h-rooms" style={{ display: 'block', marginTop: 40 }}>
        <Rows
          rows={[
            {
              id: 'r-circles',
              title: 'Your circles',
              count: joined.length,
              tone: '#D946EF',
              body: (
                <div>
                  {joined.length ? (
                    <CircleGrid list={joined} act={circleAct} />
                  ) : (
                    <p style={quiet}>{circlesQ.isLoading ? 'Finding your circles…' : 'You have not joined a circle yet.'}</p>
                  )}
                  <div style={{ marginTop: 12 }}>
                    <Button size="sm" variant="ghost" tone="violet" onClick={() => void navigate(routes.manage())}>
                      Manage
                    </Button>
                  </div>
                </div>
              ),
            },
            {
              id: 'r-open',
              title: 'Circles you can join',
              count: suggested.length,
              tone: '#D946EF',
              body: <CircleGrid list={suggested} act={circleAct} />,
            },
          ]}
        />
      </Scene>

      <Scene id="h-more" style={{ display: 'block', marginTop: 12 }}>
        <Rows
          rows={[
            {
              id: 'r-community',
              title: 'Community',
              count: feed.length,
              tone: '#3A95F2',
              body: (
                <div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 14 }}>
                    <LensSegs value={lens} onChange={setLens} />
                    {lens === 'questions' && (
                      <Tabs
                        tabs={withTabIcons([
                          { value: 'all', label: 'All' },
                          { value: 'open', label: 'Open' },
                          { value: 'resolved', label: 'Resolved' },
                          { value: 'mine', label: 'Mine' },
                        ])}
                        value={filter}
                        onChange={(v) => setFilter(v as DiscussionFilter)}
                        tone="var(--o-violet)"
                      />
                    )}
                  </div>
                  {lens === 'questions' &&
                    (feed.length ? (
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
                        {feed.map((t) => (
                          <div key={t.id} style={{ background: 'var(--surface)', padding: '2px 6px' }}>
                            <ThreadRow t={t} onOpen={() => void navigate(routes.thread(t.id))} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={quiet}>{feedQ.isLoading ? 'Reading the questions…' : 'No questions here yet.'}</p>
                    ))}
                  {lens === 'stewards' && (
                    <StewardGrid
                      list={stewards}
                      limit={4}
                      onFollow={act.toggleFollow}
                      onOpen={(s) => void navigate(routes.creators(s.id))}
                    />
                  )}
                  {lens === 'stories' && <StoryGrid list={stories} onOpen={openStory} />}
                </div>
              ),
            },
            { id: 'r-wallet', title: 'Wallet', tone: '#F7C62B', body: <WalletRow /> },
          ]}
        />
      </Scene>
      {next ? (
        <FlowBar
          screen="hub"
          tone={next.n.tone}
          label={`${next.x.name} · ${next.n.verb}`}
          note={next.n.get ?? undefined}
          primary={{ label: next.n.verb, act: next.n.act }}
          secondary={{ label: 'New WeO', act: () => void navigate(routes.create()) }}
        />
      ) : (
        <FlowFoot
          screen="hub"
          next={{ label: 'Exchange', lead: 'Move with the market', go: () => void navigate(routes.listed()), tone: '#F7C62B' }}
        />
      )}
    </main>
  );
}

export default HubPage;

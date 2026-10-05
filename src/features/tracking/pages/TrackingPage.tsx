// design: tracking.jsx TrackingScreen / TrackedCreatorRow — `/tracking`
import { useMemo, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router';
import { ApiError } from '@/api/client';
import { routes } from '@/app/routes';
import { withTabIcons } from '@/components/hero/HeroParts';
import { Scene } from '@/components/layout/Scene';
import { SectionHead, SectionMark } from '@/components/layout/SectionMark';
import { PathBar } from '@/components/shell/PathBar';
import { useHubPath } from '@/components/shell/useHubPath';
import { RAIL_VIEW, WeoView } from '@/components/weo/WeoView';
import { Avatar, Button, Card, EmptyState, Input, Tabs } from '@/design-system';
import { useTrackCreator } from '@/features/creators/api/creators';
import { useWeoHandlers } from '@/features/weo/useWeoHandlers';
import { cardModel, type WeoCardDto } from '@/lib/cardModel';
import { toast } from '@/stores/ui';
import { useTracking, type TrackingDto } from '../api/tracking';

const page: CSSProperties = {
  maxWidth: 'var(--page-w)',
  margin: '0 auto',
  padding: 'clamp(18px,2.6vw,32px) clamp(16px,2.4vw,28px) 190px',
  animation: 'weo-cardin .5s var(--ease-portal) both',
};

type TrackedCreator = TrackingDto['creators'][number];

function TrackedCreatorRow({
  t,
  on,
  onOpen,
  onToggle,
}: {
  t: TrackedCreator;
  on: boolean;
  onOpen: () => void;
  onToggle: () => void;
}) {
  const p = t.creator;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        flexWrap: 'wrap',
        padding: '14px 18px',
        background: 'var(--surface)',
      }}
    >
      <Avatar src={p.avatarUrl} isr={Math.round(p.isr)} size={46} />
      <span style={{ flex: '1 1 220px', minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 14.5, fontWeight: 700, color: 'var(--text)' }}>
          {p.name}
        </span>
        <span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-faint)' }}>
          {t.note} · {t.openWeos} WeO{t.openWeos === 1 ? '' : 's'} open
        </span>
      </span>
      <span style={{ display: 'flex', gap: 8, flex: '0 0 auto' }}>
        <Button size="sm" variant="ghost" tone="blue" onClick={onOpen}>
          Open record
        </Button>
        <Button size="sm" variant={on ? 'primary' : 'secondary'} tone="green" onClick={onToggle}>
          {on ? '✓ Tracking' : 'Track'}
        </Button>
      </span>
    </div>
  );
}

export default function TrackingPage() {
  const navigate = useNavigate();
  const path = useHubPath([{ label: 'Tracking' }]);
  const h = useWeoHandlers();
  const q = useTracking();
  const track = useTrackCreator();
  const [tab, setTab] = useState('weos');
  const [term, setQ] = useState('');
  // a creator you stop tracking stays in the list (with "Track") until you leave the page
  const [dropped, setDropped] = useState<Record<string, TrackedCreator>>({});
  const t = term.trim().toLowerCase();

  const tracked = useMemo(() => q.data?.weos ?? [], [q.data]);
  const weos = useMemo(
    () =>
      tracked
        .map((x) => ({ w: cardModel(x.weo as unknown as WeoCardDto), note: x.note }))
        .filter(({ w }) => !t || `${w.name}${w.type}${w.category}`.toLowerCase().includes(t)),
    [tracked, t],
  );
  const creators = useMemo(() => {
    const live = q.data?.creators ?? [];
    const gone = Object.values(dropped).filter((d) => !live.some((x) => x.creator.id === d.creator.id));
    return [...live, ...gone].filter((x) => !t || x.creator.name.toLowerCase().includes(t));
  }, [q.data, dropped, t]);

  const toggle = (x: TrackedCreator) => {
    const id = x.creator.id;
    const will = !!dropped[id];
    track.mutate(
      { id, on: will },
      {
        onSuccess: () => {
          setDropped((d) => {
            const next = { ...d };
            if (will) delete next[id];
            else next[id] = x;
            return next;
          });
          toast(
            will
              ? `Tracking ${x.creator.name} · you will hear when they drop`
              : `No longer tracking ${x.creator.name}`,
          );
        },
        onError: (e) => toast(e instanceof ApiError ? e.message : 'That did not go through — try again'),
      },
    );
  };

  return (
    <main style={page}>
      <PathBar onHub={path.onHub} items={path.items} />
      <Scene lead style={{ display: 'block' }}>
        <SectionMark
          icon={
            <>
              <circle cx="12" cy="12" r="3.2" />
              <circle cx="12" cy="12" r="8.4" />
              <path d="M12 1.8v2.6M12 19.6v2.6M1.8 12h2.6M19.6 12h2.6" />
            </>
          }
          label="Tracking"
          tone="var(--o-green)"
          rule={false}
        />
        <h1
          style={{
            margin: '10px 0 0',
            maxWidth: '26ch',
            fontSize: 'clamp(24px,3.2vw,34px)',
            fontWeight: 700,
            letterSpacing: '-.035em',
            lineHeight: 1.04,
            color: 'var(--text)',
          }}
        >
          What you are watching, and why it matters this week
        </h1>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginTop: 20 }}>
          <Tabs
            tone="var(--o-green)"
            value={tab}
            onChange={setTab}
            tabs={withTabIcons([
              { value: 'weos', label: `WeOs ${q.data?.counts.weos ?? 0}` },
              { value: 'creators', label: `Creators ${q.data?.counts.creators ?? 0}` },
            ])}
          />
          <div style={{ flex: '1 1 220px', minWidth: 180 }}>
            <Input
              tone="#22C55E"
              value={term}
              onChange={(e) => setQ(e.target.value)}
              placeholder={tab === 'weos' ? 'Search what you track' : 'Search creators'}
              aria-label={tab === 'weos' ? 'Search what you track' : 'Search creators'}
            />
          </div>
        </div>
      </Scene>

      {tab === 'weos' && (
        <Scene style={{ display: 'block', marginTop: 40 }}>
          <WeoView
            id="tracking.weos"
            list={weos.map((x) => x.w)}
            h={h}
            tile="stall"
            tone="var(--o-green)"
            options={[
              RAIL_VIEW,
              { value: 'cards', label: 'Cards' },
              { value: 'orbit', label: 'Orbit' },
              { value: 'list', label: 'List' },
            ]}
            initial="cards"
            head={(segs) => (
              <SectionHead
                eyebrow="02 — Your watchlist"
                title="WeOs you track"
                note="Tracking never bids. It only tells you when the terms change."
                right={weos.length ? segs : null}
              />
            )}
            empty={
              <EmptyState
                title={t && tracked.length ? 'Nothing matches' : 'Nothing tracked yet'}
                description={
                  t && tracked.length
                    ? 'Clear the search to see everything you track.'
                    : 'Open a WeO and track it to watch its terms without bidding.'
                }
                action={
                  t && tracked.length ? (
                    <Button size="sm" variant="ghost" tone="green" onClick={() => setQ('')}>
                      Clear search
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="primary"
                      tone="blue"
                      onClick={() => void navigate(routes.discover())}
                    >
                      Go to the floor
                    </Button>
                  )
                }
              />
            }
          />
          {weos.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))',
                gap: 12,
                marginTop: 18,
              }}
            >
              {weos.map(({ w, note }) => (
                <Card key={w.id} elevation="inset" radius={22} padding="13px 16px">
                  <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--text)' }}>
                    {w.name}
                  </span>
                  <span
                    style={{
                      display: 'block',
                      marginTop: 4,
                      fontSize: 11.5,
                      lineHeight: 1.45,
                      color: 'var(--text-dim)',
                    }}
                  >
                    {note}
                  </span>
                </Card>
              ))}
            </div>
          )}
        </Scene>
      )}

      {tab === 'creators' && (
        <Scene style={{ display: 'block', marginTop: 40 }}>
          <SectionHead
            eyebrow="02 — People you watch"
            title="Creators you track"
            note="You hear the moment they list. Circle them too and their next WeO lands on your Discover floor."
          />
          {creators.length === 0 ? (
            t ? (
              <EmptyState
                title="No creators match"
                description="Clear the search to see everyone you track."
                action={
                  <Button size="sm" variant="ghost" tone="green" onClick={() => setQ('')}>
                    Clear search
                  </Button>
                }
              />
            ) : (
              <EmptyState
                title="No one tracked yet"
                description="Open a creator and choose Track drops to hear the moment they list."
                action={
                  <Button
                    size="sm"
                    variant="primary"
                    tone="blue"
                    onClick={() => void navigate(routes.creators())}
                  >
                    Find creators
                  </Button>
                }
              />
            )
          ) : (
            <Card
              elevation="raised"
              radius={26}
              padding={0}
              style={{ display: 'grid', gap: 1, overflow: 'hidden', background: 'var(--border)' }}
            >
              {creators.map((x) => (
                <TrackedCreatorRow
                  key={x.creator.id}
                  t={x}
                  on={!dropped[x.creator.id]}
                  onOpen={() => void navigate(routes.creators(x.creator.id))}
                  onToggle={() => toggle(x)}
                />
              ))}
            </Card>
          )}
        </Scene>
      )}
    </main>
  );
}

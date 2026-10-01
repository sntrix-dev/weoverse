import { useMemo, type CSSProperties } from 'react';
import { useNavigate } from 'react-router';
import { routes } from '@/app/routes';
import { Scene } from '@/components/layout/Scene';
import { SectionHead, SectionMark } from '@/components/layout/SectionMark';
import { PathBar } from '@/components/shell/PathBar';
import { Button, Chip, Orb } from '@/design-system';
import { useStories } from '../api/community';
import { useHubPath, useOpenStory } from '../components/Hub';
import { storyModel } from '../model/community';

const page: CSSProperties = {
  maxWidth: 'var(--page-w)',
  margin: '0 auto',
  padding: 'clamp(18px,2.6vw,32px) clamp(16px,2.4vw,28px) 190px',
  animation: 'weo-cardin .5s var(--ease-portal) both',
};

const STORY_ARC = [
  { k: 'Rehearsed', n: '01', note: 'The terms were tried in a world first — provisional, dashed, reversible.' },
  { k: 'Listed', n: '02', note: 'One format, one ask, at rest. Nothing behind a hover.' },
  { k: 'Settled', n: '03', note: 'A permanent record, and standing that moved with it.' },
];

const kicker: CSSProperties = { fontWeight: 700, textTransform: 'uppercase' };

/** design: stories.jsx StoriesScreen — rehearsals that became real campaigns, each opening its thread. */
export function StoriesPage() {
  const navigate = useNavigate();
  const path = useHubPath([{ label: 'WeO Stories' }]);
  const open = useOpenStory();
  const q = useStories();
  const stories = useMemo(() => (q.data?.items ?? []).map(storyModel), [q.data]);
  const lead = stories[0];
  const rest = stories.slice(1);

  return (
    <main style={page}>
      <PathBar onHub={path.onHub} items={path.items} />
      <Scene lead style={{ display: 'block' }}>
        <SectionMark
          icon={
            <>
              <path d="M4 19.2A2.4 2.4 0 0 1 6.4 17H20" />
              <path d="M6.4 3H20v19H6.4A2.4 2.4 0 0 1 4 19.6V5.4A2.4 2.4 0 0 1 6.4 3z" />
            </>
          }
          label="WeO Stories"
          tone="var(--o-blue)"
          rule={false}
        />
        <h1
          style={{
            margin: '10px 0 0',
            maxWidth: '22ch',
            fontSize: 'clamp(26px,3.4vw,38px)',
            fontWeight: 700,
            letterSpacing: '-.035em',
            lineHeight: 1.02,
            color: 'var(--text)',
          }}
        >
          Rehearsals that became real campaigns
        </h1>
        {/* one story leads — the rest wait below */}
        {lead ? (
          <div
            onClick={() => open(lead)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter') open(lead);
            }}
            className="weo-snap-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.1fr)',
              gap: 'clamp(18px,2.6vw,38px)',
              alignItems: 'center',
              marginTop: 26,
              cursor: 'pointer',
              borderRadius: 34,
              padding: 'clamp(18px,2.4vw,30px)',
              background: 'var(--surface)',
              boxShadow: 'var(--shadow-card), inset 0 0 0 1px var(--border)',
            }}
          >
            <div style={{ display: 'grid', placeItems: 'center' }}>
              <Orb size={220} fill={lead.img ? 'image' : lead.tone} src={lead.img} ring ringColor="#3A95F2" matcap breathe />
            </div>
            <div style={{ minWidth: 0 }}>
              <span style={{ ...kicker, fontSize: 10.5, letterSpacing: '.14em', color: 'var(--o-blue)' }}>
                {lead.type} · {lead.duration}
              </span>
              <h2
                style={{
                  margin: '10px 0 0',
                  fontSize: 'clamp(21px,2.5vw,29px)',
                  fontWeight: 700,
                  letterSpacing: '-.03em',
                  lineHeight: 1.08,
                  color: 'var(--text)',
                }}
              >
                {lead.title}
              </h2>
              <p style={{ margin: '12px 0 0', maxWidth: '46ch', fontSize: 14, lineHeight: 1.6, color: 'var(--text-dim)' }}>{lead.blurb}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
                <Chip tone="var(--o-blue)">{lead.author}</Chip>
                {lead.status && <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--o-green)' }}>{lead.status}</span>}
                <span style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>
                  {lead.threadId ? 'Open the thread it came from →' : 'Open the WeO →'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <p style={{ margin: '26px 0 0', padding: 30, textAlign: 'center', fontSize: 13.5, color: 'var(--text-dim)' }}>
            {q.isLoading ? 'Reading the stories…' : 'No stories yet.'}
          </p>
        )}
      </Scene>

      <Scene style={{ display: 'block', marginTop: 58 }}>
        <SectionHead
          eyebrow="02 — The arc"
          title="Every story here travelled the same three steps"
          note="Nothing in a world moves real value until one explicit confirm. That is the whole contract."
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 14 }}>
          {STORY_ARC.map((s) => (
            <div key={s.k} style={{ borderRadius: 26, padding: 20, background: 'var(--surface-2)', boxShadow: 'var(--nm-inset)' }}>
              <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.14em', color: 'var(--text-faint)' }}>{s.n}</span>
              <h4 style={{ margin: '8px 0 0', fontSize: 15.5, fontWeight: 700, letterSpacing: '-.02em', color: 'var(--text)' }}>{s.k}</h4>
              <p style={{ margin: '7px 0 0', fontSize: 12.5, lineHeight: 1.55, color: 'var(--text-dim)' }}>{s.note}</p>
            </div>
          ))}
        </div>
      </Scene>

      {rest.length > 0 && (
        <Scene style={{ display: 'block', marginTop: 52 }}>
          <SectionHead eyebrow="03 — More" title="The rest of the record" note="Each one opens the Circle thread it actually happened in." />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,300px),1fr))', gap: 20 }}>
            {rest.map((s) => (
              <div
                key={s.id}
                role="link"
                tabIndex={0}
                onClick={() => open(s)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') open(s);
                }}
                style={{
                  cursor: 'pointer',
                  borderRadius: 26,
                  padding: 20,
                  background: 'var(--surface)',
                  boxShadow: 'var(--nm-sm), inset 0 0 0 1px var(--border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <Orb size={64} fill={s.img ? 'image' : s.tone} src={s.img} matcap style={{ flex: '0 0 auto' }} />
                  <div style={{ minWidth: 0 }}>
                    <span style={{ ...kicker, fontSize: 10, letterSpacing: '.13em', color: 'var(--text-faint)' }}>
                      {s.type} · {s.duration}
                    </span>
                    <h4 style={{ margin: '5px 0 0', fontSize: 14.5, fontWeight: 700, letterSpacing: '-.02em', lineHeight: 1.25, color: 'var(--text)' }}>
                      {s.title}
                    </h4>
                  </div>
                </div>
                <p
                  style={{
                    margin: '13px 0 0',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    fontSize: 12.5,
                    lineHeight: 1.55,
                    color: 'var(--text-dim)',
                  }}
                >
                  {s.blurb}
                </p>
              </div>
            ))}
          </div>
        </Scene>
      )}

      <Scene style={{ display: 'block', marginTop: 52 }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 16,
            borderRadius: 30,
            padding: 'clamp(18px,2.2vw,26px)',
            background: 'color-mix(in srgb, var(--o-blue) 6%, var(--surface))',
            boxShadow: 'inset 0 0 0 1px var(--border)',
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: 'clamp(18px,2.1vw,24px)', fontWeight: 700, letterSpacing: '-.028em', color: 'var(--text)' }}>
              Start yours in a world, not on the floor
            </h3>
            <p style={{ margin: '8px 0 0', maxWidth: '52ch', fontSize: 13.5, lineHeight: 1.55, color: 'var(--text-dim)' }}>
              Rehearse the terms first. If they hold, one confirm makes them real — and the thread becomes the story.
            </p>
          </div>
          {/* "Enter a world" arrives with worlds (M11) */}
          <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
            <Button variant="ghost" tone="green" onClick={() => void navigate(routes.create())}>
              Create a WeO
            </Button>
          </div>
        </div>
      </Scene>
    </main>
  );
}

export default StoriesPage;

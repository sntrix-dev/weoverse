import { useMemo, type CSSProperties } from 'react';
import { useNavigate } from 'react-router';
import { routes } from '@/app/routes';
import { CircleChip, CircleOi } from '@/components/circle/Circle';
import { SectionMark } from '@/components/layout/SectionMark';
import { PathBar } from '@/components/shell/PathBar';
import { Button, ICO, OButton, svg } from '@/design-system';
import { circleView } from '@/lib/circleModel';
import { compact } from '@/lib/format';
import { useCommunityCircles } from '../api/community';
import { useHubPath } from '../components/Hub';
import { useCommunityActions } from '../useCommunity';

const page: CSSProperties = {
  maxWidth: 'var(--page-w)',
  margin: '0 auto',
  padding: 'clamp(18px,2.6vw,32px) clamp(16px,2.4vw,28px) 190px',
  animation: 'weo-cardin .5s var(--ease-portal) both',
};
const surface: CSSProperties = {
  borderRadius: 22,
  background: 'var(--surface)',
  boxShadow: 'var(--nm-raised), inset 0 0 0 1px var(--border)',
};
const h2: CSSProperties = { fontSize: 18, fontWeight: 700, color: 'var(--text)' };
const bare: CSSProperties = {
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  padding: 0,
  font: 'inherit',
  textAlign: 'left',
};

/** design: circles.jsx ManageScreen — your circles (mute, leave) and the open ones (join). */
export function ManagePage() {
  const navigate = useNavigate();
  const act = useCommunityActions();
  const path = useHubPath([{ label: 'Manage circles' }]);
  const q = useCommunityCircles();
  const { mine, other } = useMemo(() => {
    const j = (q.data?.joined ?? []).map(circleView);
    const ids = new Set(j.map((c) => c.id));
    return {
      mine: j,
      other: (q.data?.suggested ?? []).filter((c) => !ids.has(c.id) && !c.isJoined).map(circleView),
    };
  }, [q.data]);
  const go = (id: string) => void navigate(routes.circle(id));

  return (
    <main style={page}>
      <PathBar onHub={path.onHub} items={path.items} />
      <SectionMark
        icon={
          <>
            <circle cx="12" cy="12" r="7.4" />
            <circle cx="12" cy="12" r="2.4" />
          </>
        }
        label="Your circles"
        rule={false}
      />
      <h1
        style={{
          margin: '10px 0 0',
          fontSize: 'clamp(26px,3.4vw,36px)',
          fontWeight: 700,
          letterSpacing: '-.035em',
          color: 'var(--text)',
        }}
      >
        Manage your Circles
      </h1>
      <h2 style={{ ...h2, margin: '30px 0 14px' }}>Your Circles</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {mine.map((c) => (
          <div
            key={c.id}
            style={{ ...surface, display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px' }}
          >
            <CircleOi c={c} size={72} />
            <button onClick={() => go(c.id)} style={{ ...bare, flex: 1, minWidth: 0 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{c.name}</h3>
              <p
                style={{
                  margin: '3px 0 0',
                  fontSize: 11.5,
                  color: 'var(--text-dim)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {compact(c.members)} members · {compact(c.weos)} WeOs · {compact(c.threads)} discussions
              </p>
              <span style={{ display: 'inline-flex', marginTop: 8 }}>
                <CircleChip c={c} />
              </span>
            </button>
            <OButton
              variant="ghost"
              size={38}
              active={!c.muted}
              tone="violet"
              aria-label={c.muted ? 'Unmute' : 'Mute'}
              onClick={() => act.toggleMute(c)}
            >
              {svg(c.muted ? ICO.bellOff : ICO.bell, 17, 'currentColor', 1.7)}
            </OButton>
            <Button size="sm" variant="destructive" onClick={() => act.toggleJoin(c)}>
              Leave
            </Button>
          </div>
        ))}
        {!mine.length && (
          <p style={{ margin: 0, padding: 24, textAlign: 'center', fontSize: 13, color: 'var(--text-dim)' }}>
            {q.isLoading ? 'Finding your circles…' : 'You have not joined a circle yet.'}
          </p>
        )}
      </div>
      <h2 style={{ ...h2, margin: '32px 0 14px' }}>Open Circles</h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,280px),1fr))',
          gap: 16,
        }}
      >
        {other.map((c) => (
          <div key={c.id} style={{ ...surface, padding: 16 }}>
            <button
              onClick={() => go(c.id)}
              style={{ ...bare, display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}
            >
              <CircleOi c={c} size={64} />
              <span style={{ minWidth: 0 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{c.name}</h3>
                <p
                  style={{
                    margin: '3px 0 0',
                    fontSize: 11,
                    color: 'var(--text-dim)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {compact(c.members)} members · desire {c.desire}
                </p>
                <span style={{ display: 'inline-flex', marginTop: 7 }}>
                  <CircleChip c={c} />
                </span>
              </span>
            </button>
            <p
              style={{
                margin: '10px 0 0',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                fontSize: 12.5,
                lineHeight: 1.5,
                color: 'var(--text-dim)',
              }}
            >
              {c.description}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              <Button size="sm" variant="ghost" tone="green" onClick={() => act.toggleJoin(c)}>
                Join
              </Button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

export default ManagePage;

import { useMemo, useState, type CSSProperties } from 'react';
import { useNavigate, useParams } from 'react-router';
import { routes } from '@/app/routes';
import { CircleChip, CircleOi } from '@/components/circle/Circle';
import { PathBar } from '@/components/shell/PathBar';
import { Clamp } from '@/components/text/Clamp';
import { WeoTile } from '@/components/weo/WeoCards';
import { Avatar, Button, Chip, svg } from '@/design-system';
import { cardModel } from '@/lib/cardModel';
import { circleView } from '@/lib/circleModel';
import { compact } from '@/lib/format';
import { relTime } from '@/lib/time';
import { CircleWaiting } from '@/features/worlds/components/CircleWaiting';
import { openCompose } from '@/stores/flow';
import { useCircle, useCircleMembers, useCircleWeos } from '../api/community';
import { CircleSnapshot, type CircleTab } from '../components/CircleSnapshot';
import { useHubPath } from '../components/Hub';
import { threadModel } from '../model/community';
import { useCommunityActions, useCommunityWeoHandlers } from '../useCommunity';

const page: CSSProperties = {
  maxWidth: 'var(--page-w)',
  margin: '0 auto',
  padding: 'clamp(18px,2.6vw,32px) clamp(16px,2.4vw,28px) 190px',
  animation: 'weo-cardin .5s var(--ease-portal) both',
};
const quiet: CSSProperties = { textAlign: 'center', padding: 40, fontSize: 14, color: 'var(--text-dim)' };
const card: CSSProperties = {
  borderRadius: 22,
  background: 'var(--surface)',
  boxShadow: 'var(--nm-raised), inset 0 0 0 1px var(--border)',
};

/** design: circle.jsx CircleScreen — one circle: who it is, what it talks about, who is in it, what they made. */
export function CirclePage() {
  const { circleId } = useParams();
  const navigate = useNavigate();
  const act = useCommunityActions();
  const wh = useCommunityWeoHandlers(circleId ?? null);
  const q = useCircle(circleId);
  const membersQ = useCircleMembers(circleId, 24);
  const weosQ = useCircleWeos(circleId);
  const [tab, setTab] = useState<CircleTab>('discussions');
  const [tag, setTag] = useState<string | null>(null);

  const c = useMemo(() => (q.data ? circleView(q.data) : null), [q.data]);
  const threads = useMemo(() => (q.data?.threads ?? []).map(threadModel), [q.data]);
  const shown = tag ? threads.filter((t) => t.tags.includes(tag)) : threads;
  const members = useMemo(
    () =>
      (membersQ.data?.items ?? []).map((m) => ({
        id: m.id,
        name: m.fullName?.trim() || m.creatorName?.trim() || 'A member',
        avatar: m.profileImage || null,
        isr: Math.max(0, Math.min(100, Math.round(m.isr))),
      })),
    [membersQ.data],
  );
  const weos = useMemo(() => (weosQ.data?.items ?? []).map((r) => cardModel(r.weo)), [weosQ.data]);
  const path = useHubPath(c ? [{ label: c.name }] : []);

  if (!c) {
    return (
      <main style={page}>
        <PathBar onHub={path.onHub} items={path.items} />
        <p style={quiet}>{q.isError ? 'This circle could not be found.' : 'Opening the circle…'}</p>
      </main>
    );
  }

  const pills: [string, string][] = [
    [compact(c.members), 'members'],
    [compact(c.weos), 'WeOs'],
    [compact(c.threads), 'discussions'],
    [String(c.desire), 'desire index'],
    ...(c.winRate != null ? ([[`${Math.round(c.winRate * 100)}%`, `${c.bestType} win rate`]] as [string, string][]) : []),
  ];
  const byType = c.axis === 'By WeO type';

  return (
    <main style={page}>
      <PathBar
        onHub={path.onHub}
        items={path.items}
        right={
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              marginLeft: 6,
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: '.1em',
              textTransform: 'uppercase',
              color: c.toneHex,
            }}
          >
            {c.bestType}
          </span>
        }
      />
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 24,
          borderRadius: 30,
          padding: 'clamp(20px,2.4vw,28px)',
          background: 'var(--surface)',
          boxShadow: 'var(--nm-raised), inset 0 0 0 1px var(--border)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            right: -70,
            top: -80,
            width: 240,
            height: 240,
            borderRadius: '50%',
            opacity: 0.2,
            filter: 'blur(34px)',
            background: `radial-gradient(circle, ${c.toneHex}, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />
        <CircleOi c={c} size={124} hot />
        <div style={{ position: 'relative', flex: '1 1 280px', minWidth: 240 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <p
              style={{
                margin: 0,
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: '.14em',
                textTransform: 'uppercase',
                color: 'var(--text-faint)',
              }}
            >
              {c.axis}
            </p>
            <CircleChip c={c} />
          </div>
          <h1 style={{ margin: '7px 0 0', fontSize: 'clamp(24px,3vw,33px)', fontWeight: 700, letterSpacing: '-.03em', color: 'var(--text)' }}>
            {c.name}
          </h1>
          <div style={{ marginTop: 7, maxWidth: '54ch' }}>
            <Clamp lines={2} tone="var(--o-violet)" style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--text-dim)' }}>
              {c.description}
            </Clamp>
          </div>
          {/* what the old About tab said, in the panel it belongs to */}
          <p style={{ margin: '9px 0 0', maxWidth: '56ch', fontSize: 12.5, lineHeight: 1.55, color: 'var(--text-faint)' }}>
            Membership is earned by action — post a WeO of this {byType ? 'type' : 'category'} and you are in. In the last 7
            days{' '}
            {c.winRate != null
              ? `${c.bestType} WeOs cleared ${Math.round(c.winRate * 100)}% collect-through here, and `
              : ''}
            {Math.round(c.resolved * 100)}% of discussions resolved.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
            {pills.map(([v, l]) => (
              <span
                key={l}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  borderRadius: 999,
                  padding: '6px 13px',
                  fontSize: 12.5,
                  color: 'var(--text-dim)',
                  background: `color-mix(in srgb, ${c.toneHex} 9%, var(--surface))`,
                }}
              >
                <span style={{ fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{v}</span> {l}
              </span>
            ))}
          </div>
        </div>
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 9, flex: '0 0 auto' }}>
          <Button variant="primary" tone="green" selected={c.joined} onClick={() => act.toggleJoin(c)}>
            {c.joined ? '✓ Joined' : 'Join circle'}
          </Button>
          <Button variant="ghost" tone="violet" onClick={() => openCompose(c.id)}>
            Start a discussion
          </Button>
        </div>
      </div>

      {/* A snapshot of the whole circle before the tabs narrow it. Each card opens its own tab. */}
      <CircleSnapshot
        c={c}
        threads={threads}
        members={members}
        weos={weos.map((w) => ({ id: w.id, img: w.img, ring: w.hex }))}
        tab={tab}
        onTab={setTab}
      />
      {circleId && <CircleWaiting circleId={circleId} />}

      {tab === 'discussions' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 22, marginTop: 22, alignItems: 'flex-start' }}>
          <div style={{ flex: '3 1 440px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {shown.map((t) => {
              const p = t.author;
              const accent = t.pinned ? 'var(--o-violet)' : t.pick ? 'var(--o-gold)' : null;
              return (
                <div
                  key={t.id}
                  role="link"
                  tabIndex={0}
                  onClick={() => void navigate(routes.thread(t.id))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void navigate(routes.thread(t.id));
                  }}
                  style={{
                    ...card,
                    display: 'flex',
                    gap: 12,
                    cursor: 'pointer',
                    padding: 16,
                    background: accent ? `color-mix(in srgb, ${accent} 7%, var(--surface))` : 'var(--surface)',
                    borderLeft: accent ? `3px solid ${accent}` : 'none',
                  }}
                >
                  <Avatar src={p.avatar} isr={p.isr} size={40} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-dim)' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text)' }}>{p.name}</span>
                      <span>· {t.createdAt ? relTime(t.createdAt) : 'just now'}</span>
                      {t.pinned && (
                        <span
                          style={{
                            borderRadius: 999,
                            padding: '2px 9px',
                            fontWeight: 700,
                            color: 'var(--o-violet)',
                            background: 'color-mix(in srgb,var(--o-violet) 12%,var(--surface))',
                            border: '1px solid var(--o-violet)',
                          }}
                        >
                          Pinned
                        </span>
                      )}
                      {t.pick && (
                        <span
                          style={{
                            borderRadius: 999,
                            padding: '2px 9px',
                            fontWeight: 700,
                            color: 'var(--o-gold-ink)',
                            background: 'color-mix(in srgb,var(--o-gold) 14%,var(--surface))',
                            border: '1px solid var(--o-gold)',
                          }}
                        >
                          Top answer
                        </span>
                      )}
                    </div>
                    <h3 style={{ margin: '6px 0 0', fontSize: 16, fontWeight: 700, letterSpacing: '-.01em', color: 'var(--text)' }}>
                      {t.title}
                    </h3>
                    <p
                      style={{
                        margin: '3px 0 0',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        fontSize: 12.5,
                        lineHeight: 1.5,
                        color: 'var(--text-dim)',
                      }}
                    >
                      {t.snippet}
                    </p>
                  </div>
                  <div
                    style={{
                      flex: '0 0 auto',
                      alignSelf: 'flex-start',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      borderRadius: 14,
                      padding: '6px 11px',
                      color: 'var(--o-violet)',
                      background: 'color-mix(in srgb,var(--o-violet) 12%,var(--surface))',
                      border: '1px solid var(--o-violet)',
                    }}
                  >
                    {svg(<polyline points="18 15 12 9 6 15" />, 16, 'currentColor', 2)}
                    <span style={{ fontSize: 14, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{t.votes}</span>
                  </div>
                </div>
              );
            })}
            {shown.length === 0 && <p style={quiet}>No threads yet — start the conversation.</p>}
          </div>
          <div style={{ ...card, flex: '1 1 240px', minWidth: 220, padding: 18 }}>
            <p
              style={{
                margin: '0 0 12px',
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: '.14em',
                textTransform: 'uppercase',
                color: 'var(--text-faint)',
              }}
            >
              Trending tags
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {c.tags.map((t) => (
                <Chip
                  key={t}
                  tone="var(--o-violet)"
                  selected={tag === t}
                  role="button"
                  tabIndex={0}
                  aria-pressed={tag === t}
                  onClick={() => setTag((x) => (x === t ? null : t))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setTag((x) => (x === t ? null : t));
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  #{t}
                </Chip>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'members' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))', gap: 16, marginTop: 22 }}>
          {members.map((m) => (
            <button
              key={m.id}
              onClick={() => void navigate(routes.creators(m.id))}
              style={{
                ...card,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                border: 'none',
                padding: 20,
                font: 'inherit',
              }}
            >
              <Avatar src={m.avatar} isr={m.isr} size={64} />
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{m.name}</span>
              <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                ISR <span style={{ fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{m.isr}</span>
              </span>
            </button>
          ))}
          {members.length === 0 && <p style={{ ...quiet, gridColumn: '1/-1' }}>Nobody has joined yet.</p>}
        </div>
      )}

      {tab === 'weos' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))',
            gap: 24,
            marginTop: 26,
            justifyItems: 'center',
          }}
        >
          {weos.map((w) => (
            <WeoTile
              key={w.id}
              w={w}
              h={wh.h}
              width={220}
             
              onEngage={() => wh.engage(w)}
            />
          ))}
          {weos.length === 0 && <p style={{ ...quiet, gridColumn: '1/-1' }}>No WeOs have been pushed to this Circle yet.</p>}
        </div>
      )}
    </main>
  );
}

export default CirclePage;

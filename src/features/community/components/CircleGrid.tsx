import { useState } from 'react';
import { CircleChip, CircleRecord } from '@/components/circle/Circle';
import { Avatar, Button, Orb } from '@/design-system';
import type { CircleView } from '@/lib/circleModel';
import { useCircleMembers } from '../api/community';

export interface CircleActions {
  onEnter: (c: CircleView) => void;
  onToggleJoin: (c: CircleView) => void;
}

/**
 * design: screens-hub.jsx CircleOrbit — an opened circle: its members orbiting the circle's
 * orb, what it is, who is here now, and Enter / Join / Close. "Stewarded by" is gone with the
 * steward role (D-036); the rim is the circle's first members.
 */
export function CircleOrbit({ c, act, onCollapse }: { c: CircleView; act: CircleActions; onCollapse: () => void }) {
  const members = useCircleMembers(c.id, 6);
  const rim = (members.data?.items ?? []).map((m) => ({ id: m.id, avatar: m.profileImage || null }));
  const outer = rim.slice(0, 4);
  const inner = rim.slice(4, 6);
  const ring = (list: typeof rim, r: number, dur: number, rev: boolean) => (
    <div
      style={{
        position: 'absolute',
        inset: r,
        animation: `${rev ? 'weo-orbit-rev' : 'weo-orbit'} ${dur}s linear infinite`,
      }}
    >
      {list.map((m, i) => {
        const a = (i / list.length) * 360;
        return (
          <div
            key={m.id}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: `rotate(${a}deg) translateY(calc(-50% - ${(300 - r * 2) / 2}px))`,
            }}
          >
            <div
              style={{
                animation: `${rev ? 'weo-orbit' : 'weo-orbit-rev'} ${dur}s linear infinite`,
                marginLeft: -19,
                marginTop: -19,
              }}
            >
              <Avatar src={m.avatar} size={38} />
            </div>
          </div>
        );
      })}
    </div>
  );
  return (
    <div
      style={{
        gridColumn: '1/-1',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 'clamp(18px,3vw,38px)',
        borderRadius: 30,
        padding: 'clamp(18px,2.4vw,28px)',
        background: 'var(--surface)',
        boxShadow: 'var(--nm-hero), inset 0 0 0 1px var(--border)',
        animation: 'weo-cardin .45s var(--ease-portal) both',
      }}
    >
      <div style={{ flex: '0 0 auto', width: 348, maxWidth: '100%', height: 348, display: 'grid', placeItems: 'center' }}>
        <div className="orbit-ring" style={{ position: 'relative', width: 300, height: 300 }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px dashed var(--border)' }} />
          <div style={{ position: 'absolute', inset: 64, borderRadius: '50%', border: '1px solid var(--border)' }} />
          {ring(outer, 0, 34, false)}
          {ring(inner, 64, 26, true)}
          <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }}>
            <Orb
              size={104}
              fill={c.img ? 'image' : c.toneHex}
              src={c.img}
              ring
              ringColor={c.toneHex}
              matcap
              breathe
            />
          </div>
        </div>
      </div>
      <div style={{ flex: '1 1 300px', minWidth: 260 }}>
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
        <h3 style={{ margin: '7px 0 0', fontSize: 'clamp(21px,2.4vw,27px)', fontWeight: 700, letterSpacing: '-.03em', color: 'var(--text)' }}>
          {c.name}
        </h3>
        <p
          style={{
            margin: '8px 0 0',
            maxWidth: '46ch',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            fontSize: 13.5,
            lineHeight: 1.55,
            color: 'var(--text-dim)',
          }}
        >
          {c.description}
        </p>
        <CircleChip c={c} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 14 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-dim)' }}>
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: 'var(--o-green)',
                animation: 'weo-breathe-sm 3.4s var(--ease-standard) infinite',
              }}
            />
            <span style={{ fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{c.active}</span> here
            now
          </span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginTop: 20 }}>
          <Button size="sm" variant="primary" tone="violet" onClick={() => act.onEnter(c)}>
            Enter circle
          </Button>
          <Button size="sm" variant="ghost" tone="green" selected={c.joined} onClick={() => act.onToggleJoin(c)}>
            {c.joined ? '✓ Joined' : 'Join'}
          </Button>
          <Button size="sm" variant="ghost" tone="blue" onClick={onCollapse}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

/** design: screens-hub.jsx CircleGrid — records; the opened one spreads into its orbit. */
export function CircleGrid({ list, act }: { list: CircleView[]; act: CircleActions }) {
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(232px, 1fr))', gap: 14 }}>
      {list.map((c) =>
        openId === c.id ? (
          <CircleOrbit key={c.id} c={c} act={act} onCollapse={() => setOpenId(null)} />
        ) : (
          <CircleRecord key={c.id} c={c} joined={c.joined} onOpen={() => setOpenId(c.id)} />
        ),
      )}
    </div>
  );
}

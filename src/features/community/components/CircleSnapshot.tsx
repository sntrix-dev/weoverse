import type { ReactNode } from 'react';
import { Avatar, Orb, svg } from '@/design-system';
import { compact } from '@/lib/format';
import type { CircleView } from '@/lib/circleModel';
import type { ThreadModel } from '../model/community';

export type CircleTab = 'discussions' | 'members' | 'weos';

interface SnapCard {
  k: CircleTab;
  label: string;
  count: string;
  tone: string;
  icon: ReactNode;
  note: string;
  body: ReactNode;
}

/**
 * design: screens-circle.jsx CircleSnapshot — the circle at a glance: discussions, members and
 * WeOs in miniature. The cards are the tabs; the open one reads as selected.
 */
export function CircleSnapshot({
  c,
  threads,
  members,
  weos,
  tab,
  onTab,
}: {
  c: CircleView;
  threads: ThreadModel[];
  members: { id: string; avatar: string | null }[];
  weos: { id: string; img: string | null; ring: string }[];
  tab: CircleTab;
  onTab: (t: CircleTab) => void;
}) {
  const open = threads.filter((t) => !t.resolved).length;
  const cards: SnapCard[] = [
    {
      k: 'discussions',
      label: 'Discussions',
      count: compact(c.threads),
      tone: 'var(--o-violet)',
      icon: <path d="M20.5 11.5a8 8 0 0 1-8 8 8 8 0 0 1-3.6-.85L3.5 20.5l1.85-5.4A8 8 0 0 1 12.5 3.5a8 8 0 0 1 8 8z" />,
      note: open ? `${open} still open` : 'all resolved',
      body: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {threads.slice(0, 2).map((t) => (
            <span key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  flex: '0 0 auto',
                  background: t.resolved ? 'var(--o-green)' : 'var(--o-violet)',
                }}
              />
              <span
                style={{
                  minWidth: 0,
                  flex: 1,
                  fontSize: 11.5,
                  color: 'var(--text-dim)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {t.title}
              </span>
              <span style={{ fontSize: 10.5, color: 'var(--text-faint)', fontVariantNumeric: 'tabular-nums' }}>{t.replies}</span>
            </span>
          ))}
        </div>
      ),
    },
    {
      k: 'members',
      label: 'Members',
      count: compact(c.members),
      tone: 'var(--o-blue)',
      icon: (
        <>
          <circle cx="12" cy="8.4" r="3.2" />
          <path d="M6 19c.8-3 3.2-4.6 6-4.6S17.2 16 18 19" />
        </>
      ),
      note: `${c.active} here now`,
      body: (
        <span style={{ display: 'flex' }}>
          {members.slice(0, 6).map((m, i) => (
            <span key={m.id} style={{ marginLeft: i ? -9 : 0 }}>
              <Avatar src={m.avatar} size={28} />
            </span>
          ))}
        </span>
      ),
    },
    {
      k: 'weos',
      label: 'WeOs',
      count: compact(c.weos),
      tone: c.toneHex,
      icon: (
        <>
          <circle cx="12" cy="12" r="8.4" />
          <circle cx="12" cy="12" r="3.2" />
        </>
      ),
      note: `${c.bestType ?? 'Listing'} leads here`,
      body: (
        <span style={{ display: 'flex', gap: 6 }}>
          {weos.slice(0, 4).map((w) => (
            <Orb key={w.id} size={30} fill={w.img ? 'image' : w.ring} src={w.img} ring ringColor={w.ring} matcap />
          ))}
          {!weos.length && <span style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>Nothing posted yet</span>}
        </span>
      ),
    },
  ];
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,236px),1fr))',
        gap: 12,
        marginTop: 18,
      }}
    >
      {cards.map((card) => {
        const on = tab === card.k;
        return (
          <button
            key={card.k}
            onClick={() => onTab(card.k)}
            aria-pressed={on}
            title={`${card.label} · ${card.note}`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 11,
              minWidth: 0,
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              font: 'inherit',
              borderRadius: 24,
              padding: 15,
              background: on ? `color-mix(in srgb, ${card.tone} 12%, var(--surface))` : 'var(--surface)',
              boxShadow: on
                ? `var(--shadow-card), inset 0 0 0 1.5px ${card.tone}`
                : 'var(--nm-raised), inset 0 0 0 1px var(--border)',
              transition: 'background .26s, box-shadow .28s, transform .26s var(--ease-settle)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <span
                style={{
                  display: 'grid',
                  placeItems: 'center',
                  width: 30,
                  height: 30,
                  flex: '0 0 auto',
                  borderRadius: '50%',
                  color: on ? '#fff' : card.tone,
                  background: on ? card.tone : `color-mix(in srgb, ${card.tone} 13%, var(--surface))`,
                }}
              >
                {svg(card.icon, 16, 'currentColor', 1.8)}
              </span>
              <span style={{ minWidth: 0, flex: 1, fontSize: 12, fontWeight: 700, letterSpacing: '.02em', color: 'var(--text)' }}>
                {card.label}
              </span>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
                {card.count}
              </span>
            </span>
            {card.body}
            <span style={{ fontSize: 10.5, color: 'var(--text-faint)' }}>{card.note}</span>
          </button>
        );
      })}
    </div>
  );
}

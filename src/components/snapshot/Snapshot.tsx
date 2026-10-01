import { useState, type ReactNode } from 'react';
import { Avatar, Orb, svg } from '@/design-system';
import { SectionMark } from '@/components/layout/SectionMark';
import { OsText } from '@/components/text/OsText';

/**
 * design: snapshot.jsx — BOARD_TABS, LeaderFace, Podium, BOARD_SECTION, SnapshotChart, SnapshotPanel.
 * Pure: boards and pulse come in as props (the design read `HUB.BOARDS` / `HUB.PULSE` mock data).
 * The design's built-in LeaderPreview sheet is not part of the kit (D-028): a page passes `onPick`.
 */

/** One leaderboard row. `value` is display text; an Os figure is written "O 1,200". */
export interface BoardRow {
  id: string;
  name: string;
  sub?: ReactNode;
  value: string;
  delta?: string;
  tone: string;
  /** a person: face with their ISR ring */
  avatar?: string | null;
  isr?: number;
  /** a WeO or circle: an image orb */
  img?: string | null;
  /** else a lettered disc */
  initial?: string;
}

export interface Board {
  label: string;
  metric: string;
  rows: BoardRow[];
}

/** One tile of the pulse chart. */
export interface Pulse {
  label: string;
  note?: string;
  headline: string;
  delta?: string;
  tone: string;
  series: number[];
}

export const BOARD_TABS = [
  { value: 'collected', label: 'Flow' },
  { value: 'creators', label: 'Creators' },
  { value: 'circles', label: 'Circles' },
  { value: 'campaigns', label: 'Campaigns' },
  { value: 'remixes', label: 'Remixes' },
] as const;

/** which section each board belongs to — the stat tab is the way in, the rows are the people */
export const BOARD_SECTION: Record<string, string> = {
  creators: 'creators',
  collected: 'collected',
  circles: 'hub',
  campaigns: 'listed',
  remixes: 'collected',
  movers: 'collected',
  formats: 'collected',
  pending: 'wallet',
  performing: 'listed',
  views: 'listed',
  earning: 'listed',
  ready: 'listed',
  standing: 'creators',
  settled: 'creators',
  reach: 'creators',
  consistency: 'creators',
};

export function LeaderFace({ row, size, focus }: { row: BoardRow; size: number; focus?: boolean }) {
  if (row.avatar) {
    return (
      <div style={{ position: 'relative', width: size, height: size, flex: '0 0 auto' }}>
        <Avatar src={row.avatar} isr={row.isr} size={size} />
      </div>
    );
  }
  if (row.img)
    return (
      <Orb
        size={size}
        fill="image"
        src={row.img}
        ring
        ringColor={row.tone}
        matcap
        breathe={focus}
        style={{ flex: '0 0 auto' }}
      />
    );
  return (
    <div
      style={{
        width: size,
        height: size,
        flex: '0 0 auto',
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        background: `radial-gradient(120% 120% at 38% 26%, var(--surface), color-mix(in srgb, ${row.tone} 12%, var(--surface)))`,
        boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${row.tone} 45%, transparent), var(--nm-sm)`,
        color: row.tone,
        fontSize: size * 0.34,
        fontWeight: 700,
      }}
    >
      {row.initial ?? row.name.slice(0, 1).toUpperCase()}
    </div>
  );
}

export function Podium({ rows, onPick }: { rows: BoardRow[]; onPick: (row: BoardRow) => void }) {
  const order = [1, 0, 2];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, alignItems: 'end' }}>
      {order.map((idx) => {
        const row = rows[idx];
        if (!row) return null;
        const first = idx === 0;
        return (
          <button
            type="button"
            key={row.id}
            onClick={() => onPick(row)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              border: 'none',
              cursor: 'pointer',
              borderRadius: 26,
              padding: first ? '18px 12px 16px' : '12px 10px 14px',
              background: first ? `color-mix(in srgb, ${row.tone} 7%, var(--surface))` : 'var(--surface)',
              boxShadow: first ? 'var(--nm-raised), inset 0 0 0 1px var(--border)' : 'var(--nm-sm)',
              transform: first ? 'translateY(-6px)' : 'none',
              transition: 'transform .28s var(--ease-portal)',
            }}
          >
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: '.16em',
                color: 'var(--text-faint)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {String(idx + 1).padStart(2, '0')}
            </span>
            <LeaderFace row={row} size={first ? 92 : 70} focus={first} />
            <span
              style={{
                fontSize: first ? 14 : 12.5,
                fontWeight: 700,
                letterSpacing: '-.01em',
                color: 'var(--text)',
                textAlign: 'center',
                lineHeight: 1.2,
              }}
            >
              {row.name}
            </span>
            <span
              style={{ fontSize: 10.5, color: 'var(--text-faint)', textAlign: 'center', lineHeight: 1.25 }}
            >
              {row.sub}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
              <span
                style={{
                  fontSize: first ? 19 : 16,
                  fontWeight: 700,
                  color: 'var(--text)',
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '-.01em',
                }}
              >
                <OsText value={row.value} />
              </span>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: row.tone }}>{row.delta}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function SnapshotChart({
  pulse,
  keys,
  value,
  onChange,
  onOpenSection,
}: {
  pulse: Record<string, Pulse>;
  keys?: string[];
  value: string;
  onChange: (key: string) => void;
  /** tapping the lit tile again opens its section (design `app.go(BOARD_SECTION[k])`) */
  onOpenSection?: (section: string) => void;
}) {
  const [hov, setHov] = useState<string | null>(null);
  const list = (keys ?? BOARD_TABS.map((t) => t.value)).flatMap((k) => {
    const p = pulse[k];
    return p ? [{ k, p }] : [];
  });
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${list.length}, minmax(0,1fr))`, gap: 10 }}>
      {list.map(({ k, p }, ci) => {
        const on = value === k;
        const hot = hov === k;
        const section = onOpenSection ? BOARD_SECTION[k] : undefined;
        const max = Math.max(1, ...p.series);
        return (
          <button
            type="button"
            key={k}
            aria-pressed={on}
            onClick={() => (on && section ? onOpenSection?.(section) : onChange(k))}
            onMouseEnter={() => setHov(k)}
            onMouseLeave={() => setHov(null)}
            title={on && section ? 'Open the whole section' : p.label}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              textAlign: 'left',
              border: 'none',
              cursor: 'pointer',
              borderRadius: 22,
              padding: '14px 14px 12px',
              background: on ? `color-mix(in srgb, ${p.tone} 8%, var(--surface))` : 'var(--surface)',
              boxShadow: on
                ? `var(--nm-sm), inset 0 0 0 1px color-mix(in srgb, ${p.tone} 36%, transparent)`
                : hot
                  ? 'var(--nm-sm)'
                  : 'inset 0 0 0 1px var(--border)',
              transform: on || hot ? 'translateY(-2px)' : 'none',
              transition: 'background .3s, box-shadow .3s, transform .3s var(--ease-portal)',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
              <span
                style={{
                  fontSize: 19,
                  fontWeight: 700,
                  letterSpacing: '-.025em',
                  color: 'var(--text)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                <OsText value={p.headline} />
              </span>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: p.tone }}>{p.delta}</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 46 }}>
              {p.series.map((v, i) => (
                <span
                  key={i}
                  style={{
                    flex: 1,
                    height: `${Math.max(12, (v / max) * 100)}%`,
                    borderRadius: 3,
                    background:
                      on || hot
                        ? `color-mix(in srgb, ${p.tone} ${45 + (i / Math.max(1, p.series.length - 1)) * 55}%, transparent)`
                        : 'var(--surface-3)',
                    transformOrigin: 'bottom',
                    animation: `weo-cardin .5s var(--ease-settle) ${ci * 0.05 + i * 0.03}s both`,
                    transition: 'background .3s',
                  }}
                />
              ))}
            </span>
            <span style={{ display: 'flex', alignItems: 'baseline', gap: 6, minWidth: 0 }}>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: on ? 700 : 600,
                  color: on ? p.tone : 'var(--text-dim)',
                  whiteSpace: 'nowrap',
                }}
              >
                {p.label}
              </span>
              <span
                style={{
                  fontSize: 10,
                  color: 'var(--text-faint)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {p.note}
              </span>
              {on && section && (
                <span style={{ marginLeft: 'auto', display: 'grid', placeItems: 'center', color: p.tone }}>
                  {svg(<path d="M9 6l6 6-6 6" />, 12, 'currentColor', 2.4)}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** design: SnapshotPanel's default rail ("What wins where", `HUB.CONTEXTS`) as its own part. */
export function WhatWinsRail({
  contexts,
}: {
  contexts: { context: string; type: string; rate: number; tone: string }[];
}) {
  return (
    <div
      style={{
        borderRadius: 24,
        padding: 18,
        background: 'var(--surface-2)',
        boxShadow: 'var(--nm-inset)',
        minWidth: 0,
      }}
    >
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
        What wins where
      </p>
      <div style={{ height: 14 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
        {contexts.map((c) => (
          <div key={c.context}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)' }}>{c.context}</span>
              <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: c.tone }}>
                {c.type}
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--text)',
                  fontVariantNumeric: 'tabular-nums',
                  width: 34,
                  textAlign: 'right',
                }}
              >
                {Math.round(c.rate * 100)}%
              </span>
            </div>
            <div
              style={{
                marginTop: 5,
                height: 6,
                borderRadius: 999,
                background: 'var(--surface)',
                boxShadow: 'var(--nm-inset)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{ width: `${c.rate * 100}%`, height: '100%', borderRadius: 999, background: c.tone }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SnapshotPanel({
  boards,
  pulse,
  board: boardKey,
  onBoard,
  eyebrow,
  rail,
  onPick,
  onOpenSection,
}: {
  boards: Record<string, Board>;
  pulse: Record<string, Pulse>;
  board: string;
  onBoard: (key: string) => void;
  eyebrow?: ReactNode;
  /** the right column; without one the board takes the full width */
  rail?: ReactNode;
  onPick: (row: BoardRow) => void;
  onOpenSection?: (section: string) => void;
}) {
  const keys = Object.keys(boards);
  const cur = boards[boardKey] ? boardKey : (keys[0] ?? '');
  const board = boards[cur];
  if (!board) return null;
  const rest = board.rows.slice(3);
  return (
    <section
      style={{
        borderRadius: 30,
        padding: 'clamp(18px,2.4vw,26px)',
        background: 'var(--surface)',
        boxShadow: 'var(--nm-raised), inset 0 0 0 1px var(--border)',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          gap: 16,
          justifyContent: 'space-between',
        }}
      >
        <div>
          <SectionMark n={1} label={eyebrow || 'Snapshot · 7d'} rule={false} />
          <h2
            style={{
              margin: '8px 0 0',
              fontSize: 'clamp(21px,2.5vw,27px)',
              fontWeight: 700,
              letterSpacing: '-.025em',
              color: 'var(--text)',
            }}
          >
            {board.label}
          </h2>
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <SnapshotChart
          pulse={pulse}
          keys={keys}
          value={cur}
          onChange={onBoard}
          onOpenSection={onOpenSection}
        />
      </div>

      <div
        key={cur}
        className="weo-snap-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: rail ? 'minmax(0,1.55fr) minmax(240px,.85fr)' : 'minmax(0,1fr)',
          gap: 'clamp(16px,2vw,26px)',
          marginTop: 22,
          alignItems: 'start',
          animation: 'weo-cardin .42s var(--ease-settle) both',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
          <Podium rows={board.rows} onPick={onPick} />
          <div
            style={{
              display: 'grid',
              gap: 1,
              borderRadius: 20,
              overflow: 'hidden',
              background: 'var(--border)',
            }}
          >
            {rest.map((row, i) => (
              <button
                type="button"
                key={row.id}
                onClick={() => onPick(row)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  border: 'none',
                  cursor: 'pointer',
                  padding: '11px 14px',
                  textAlign: 'left',
                  background: 'var(--surface)',
                  animation: `weo-cardin .4s var(--ease-settle) ${0.1 + i * 0.07}s both`,
                }}
              >
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    letterSpacing: '.14em',
                    color: 'var(--text-faint)',
                    fontVariantNumeric: 'tabular-nums',
                    width: 20,
                  }}
                >
                  {String(i + 4).padStart(2, '0')}
                </span>
                <LeaderFace row={row} size={36} />
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span
                    style={{
                      display: 'block',
                      fontSize: 13,
                      fontWeight: 700,
                      color: 'var(--text)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {row.name}
                  </span>
                  <span style={{ display: 'block', fontSize: 10.5, color: 'var(--text-faint)' }}>
                    {row.sub}
                  </span>
                </span>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: 'var(--text)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  <OsText value={row.value} />
                </span>
                <span
                  style={{ fontSize: 10.5, fontWeight: 700, color: row.tone, width: 74, textAlign: 'right' }}
                >
                  {row.delta}
                </span>
              </button>
            ))}
          </div>
        </div>
        {rail}
      </div>
    </section>
  );
}

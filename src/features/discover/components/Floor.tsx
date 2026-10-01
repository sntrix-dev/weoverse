import { useState } from 'react';
import { RailHead } from '@/components/layout/Rail';
import { PersonOi, Spark } from '@/components/people/People';
import { StallTile } from '@/components/weo/WeoBits';
import { Button } from '@/design-system';
import type { WeoCardModel } from '@/lib/cardModel';
import type { CreatorStallModel, InterestModel } from '../model/rails';

/** design: discover.jsx CreatorStall — standing leads: the score, and the seven days behind it. */
export function CreatorStall({ c, onOpen }: { c: CreatorStallModel; onOpen: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      type="button"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onOpen}
      style={{
        flex: '0 0 auto',
        width: 236,
        scrollSnapAlign: 'start',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        textAlign: 'left',
        border: 'none',
        cursor: 'pointer',
        borderRadius: 22,
        padding: 12,
        background: hov ? `color-mix(in srgb, ${c.tone} 5%, var(--surface))` : 'var(--surface)',
        boxShadow: `var(--nm-raised), inset 0 0 0 1px ${hov ? `color-mix(in srgb, ${c.tone} 30%, transparent)` : 'var(--border)'}`,
        transition: 'background .3s, box-shadow .3s',
      }}
    >
      <PersonOi p={{ isr: c.isr, avatar: c.avatar }} size={58} hot={hov} />
      <span style={{ minWidth: 0, flex: 1 }}>
        <span
          style={{
            display: 'block',
            fontSize: 13.5,
            fontWeight: 700,
            color: 'var(--text)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {c.name}
        </span>
        <span style={{ display: 'block', marginTop: 2, fontSize: 11, color: 'var(--text-faint)' }}>
          ISR {c.isr} · {c.format}
        </span>
        <span style={{ display: 'block', marginTop: 6 }}>
          <Spark values={c.trace} tone={c.tone} h={18} />
        </span>
      </span>
    </button>
  );
}

/** design: discover.jsx InterestTile — what wins where. */
export function InterestTile({ ctx, onOpen }: { ctx: InterestModel; onOpen: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      type="button"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onOpen}
      style={{
        flex: '0 0 auto',
        width: 186,
        scrollSnapAlign: 'start',
        textAlign: 'left',
        border: 'none',
        cursor: 'pointer',
        borderRadius: 22,
        padding: 14,
        background: hov ? `color-mix(in srgb, ${ctx.tone} 8%, var(--surface))` : 'var(--surface-2)',
        boxShadow: hov ? 'var(--nm-raised)' : 'var(--nm-inset)',
        transition: 'background .3s, box-shadow .3s',
      }}
    >
      <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>
        {ctx.context}
      </span>
      <span style={{ display: 'block', marginTop: 3, fontSize: 11, color: 'var(--text-faint)' }}>
        {ctx.live} live · {ctx.type} wins
      </span>
      <span
        style={{
          display: 'block',
          marginTop: 10,
          height: 5,
          borderRadius: 999,
          background: 'var(--surface)',
          boxShadow: 'var(--nm-inset)',
          overflow: 'hidden',
        }}
      >
        <span
          style={{
            display: 'block',
            height: '100%',
            width: `${ctx.rate * 100}%`,
            borderRadius: 999,
            background: ctx.tone,
          }}
        />
      </span>
    </button>
  );
}

export type FloorLens = 'all' | 'ending' | 'moving' | 'open';
export const LENSES: { k: FloorLens; label: string }[] = [
  { k: 'all', label: 'Everything' },
  { k: 'ending', label: 'Closing soonest' },
  { k: 'moving', label: 'Moving now' },
  { k: 'open', label: 'Open now' },
];

/** design: discover.jsx FloorGrid — every WeO in one place: the destination for search and every "browse all". */
export function FloorGrid({
  list,
  total,
  query,
  lens,
  setLens,
  onClear,
  onOpen,
  onAskMya,
  onRequest,
  loading,
}: {
  list: WeoCardModel[];
  total: number;
  query: string;
  lens: FloorLens;
  setLens: (l: FloorLens) => void;
  onClear: () => void;
  onOpen: (w: WeoCardModel) => void;
  onAskMya: () => void;
  onRequest: () => void;
  loading?: boolean;
}) {
  const q = query.trim();
  return (
    <>
      <RailHead
        tone="#3A95F2"
        title={q ? `Results for "${q}"` : 'Everything on the floor'}
        note={
          q
            ? `${total} WeOs match. Clear the search to see the whole floor.`
            : 'The whole floor, one lens at a time. Nothing here is hidden behind a hover.'
        }
        right={
          q ? (
            <Button size="sm" variant="ghost" tone="violet" onClick={onClear}>
              Clear
            </Button>
          ) : null
        }
      />
      <div role="group" aria-label="Lens" style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 4 }}>
        {LENSES.map((l) => {
          const on = lens === l.k;
          return (
            <button
              type="button"
              key={l.k}
              aria-pressed={on}
              onClick={() => setLens(l.k)}
              style={{
                border: 'none',
                cursor: 'pointer',
                borderRadius: 999,
                padding: '7px 14px',
                fontSize: 12.5,
                fontWeight: on ? 700 : 600,
                color: on ? '#fff' : 'var(--text-dim)',
                background: on ? 'var(--o-blue)' : 'var(--surface-2)',
                boxShadow: on ? 'none' : 'var(--nm-inset)',
                transition: 'background .24s, color .2s',
              }}
            >
              {l.label}
            </button>
          );
        })}
      </div>
      {list.length ? (
        <div
          aria-busy={loading || undefined}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill,minmax(232px,1fr))',
            gap: 16,
            marginTop: 18,
            opacity: loading ? 0.6 : 1,
            transition: 'opacity .2s',
          }}
        >
          {list.map((w) => (
            <StallTile key={w.id} w={w} onOpen={onOpen} />
          ))}
        </div>
      ) : (
        <div
          style={{
            marginTop: 18,
            borderRadius: 26,
            padding: 26,
            textAlign: 'center',
            background: 'var(--surface-2)',
            boxShadow: 'var(--nm-inset)',
          }}
        >
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-dim)' }}>
            {loading
              ? 'Reading the floor…'
              : 'Nothing on the floor matches that yet. Ask Mya what is moving, or post a request and let the floor answer.'}
          </p>
          {!loading && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 14 }}>
              <Button size="sm" variant="ghost" tone="violet" onClick={onAskMya}>
                Ask Mya
              </Button>
              <Button size="sm" variant="primary" tone="green" onClick={onRequest} dot>
                Post a request
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

import { StageRing } from '@/components/weo/StageRing';
import { Orb } from '@/design-system';
import { formatHex, type WeoFormat } from '@/lib/cardModel';
import { openVet } from '@/stores/flow';
import { useCircleVetting } from '../api/worlds';
import { STAGE_RING, STAGE_TONE } from '../model/lifecycle';

/**
 * D-090: what is waiting on this Circle — WeOs its members opened to reactions or pledges. Each
 * opens the vetting sheet. Hidden when nothing waits.
 */
export function CircleWaiting({ circleId }: { circleId: string }) {
  const q = useCircleVetting(circleId);
  const items = q.data?.items ?? [];
  if (!items.length) return null;
  return (
    <section aria-label="Waiting on this circle" style={{ marginTop: 22 }}>
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
        Waiting on this circle · {items.length}
      </p>
      <div className="weo-rail" style={{ ['--rail-w' as string]: '200px' }}>
        {items.map((c) => {
          const stage = c.stage === 'posting' ? 'pledging' : c.stage;
          const tone = STAGE_TONE[stage] ?? '#D946EF';
          const pledging = stage === 'pledging';
          const n = pledging ? (c.pledges.count ?? 0) : (c.reactions.count ?? 0);
          const of = pledging ? (c.pledges.threshold ?? 20) : (c.reactions.need ?? 12);
          return (
            <button
              key={c.id}
              onClick={() => openVet(c.id)}
              aria-label={`${c.title} — ${n} of ${of} ${pledging ? 'pledges' : 'reactions'}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                padding: '16px 12px 14px',
                border: 'none',
                borderRadius: 24,
                cursor: 'pointer',
                font: 'inherit',
                background: 'var(--surface)',
                boxShadow: 'var(--nm-raised), inset 0 0 0 1px var(--border)',
              }}
            >
              <StageRing size={92} index={STAGE_RING[stage] ?? 1} fill={n / of} tone={tone} waiting>
                <Orb
                  size={60}
                  fill={c.cover ? 'image' : formatHex((c.format as WeoFormat) ?? 'Listing')}
                  src={c.cover ?? undefined}
                  matcap
                />
              </StageRing>
              <span
                style={{
                  maxWidth: '100%',
                  fontSize: 13.5,
                  fontWeight: 700,
                  color: 'var(--text)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {c.title}
              </span>
              <span style={{ fontSize: 11.5, color: 'var(--text-dim)', fontVariantNumeric: 'tabular-nums' }}>
                {n} of {of} {pledging ? 'pledges' : 'reactions'} · {c.creator.handle || c.creator.name}
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: tone }}>
                {c.mine.isOwner
                  ? 'Yours'
                  : pledging
                    ? c.mine.pledge
                      ? 'You pledged'
                      : 'Pledge'
                    : c.mine.reaction
                      ? 'You reacted'
                      : 'Say what you’d pay'}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

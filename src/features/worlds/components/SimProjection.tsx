import { useMemo } from 'react';
import { OMark } from '@/design-system';
import { osFmt } from '@/lib/format';
import { lifecycle, seasonOf, simulate, type SimConfig, type WorldDef } from '../model/sim';

/**
 * design: world.jsx SimProjection — the life of the WeO after it lands, under the world you are
 * standing in. Live: it moves as you change the world, the crowd, the season or the terms.
 */
export function SimProjection({
  cfg,
  world,
  comparable,
  live,
}: {
  cfg: SimConfig;
  world: WorldDef;
  /** live WeOs of this format on the floor right now */
  comparable: number;
  live: boolean;
}) {
  const { base, life } = useMemo(() => {
    const b = simulate(cfg);
    return { base: b, life: lifecycle(cfg, b, comparable) };
  }, [cfg, comparable]);
  const season = seasonOf(cfg.season);
  const max = Math.max(...life.rows.map((r) => r.r));
  return (
    <div
      style={{
        borderRadius: 22,
        padding: '13px 14px 14px',
        background: 'var(--surface)',
        boxShadow: 'var(--nm-raised), inset 0 0 0 1px var(--border)',
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '.14em',
          textTransform: 'uppercase',
          color: 'var(--text-faint)',
        }}
      >
        Likely after it lists
      </p>
      <p style={{ margin: '4px 0 0', fontSize: 11, lineHeight: 1.45, color: 'var(--text-dim)' }}>
        {world.name} · {season.label} · next {life.horizon} days
      </p>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 10 }}>
        <b
          style={{
            fontSize: 21,
            fontWeight: 700,
            letterSpacing: '-.03em',
            color: 'var(--text)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {base.collectors}
        </b>
        <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>
          of {cfg.edition} collected · {Math.round(base.through * 100)}%
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 12 }}>
        {life.rows.map((r) => (
          <div key={r.k} title={r.why}>
            <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                  fontSize: 11.5,
                  color: 'var(--text-dim)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {r.label}
              </span>
              <b
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--text)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {r.n}
              </b>
              <span
                style={{
                  width: 30,
                  textAlign: 'right',
                  fontSize: 10.5,
                  color: 'var(--text-faint)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {Math.round(r.r * 100)}%
              </span>
            </span>
            <span
              style={{
                display: 'block',
                height: 5,
                marginTop: 5,
                borderRadius: 999,
                background: 'var(--surface-2)',
                boxShadow: 'var(--nm-inset)',
                overflow: 'hidden',
              }}
            >
              <span
                style={{
                  display: 'block',
                  width: `${Math.round((r.r / (max || 1)) * 100)}%`,
                  height: '100%',
                  borderRadius: 999,
                  background: r.tone,
                  transition: 'width .5s var(--ease-portal)',
                }}
              />
            </span>
          </div>
        ))}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 7,
          marginTop: 12,
          paddingTop: 11,
          borderTop: '1px solid var(--border)',
        }}
      >
        <span style={{ fontSize: 10.5, color: 'var(--text-faint)' }}>Second-hand flow</span>
        <span
          style={{
            marginLeft: 'auto',
            display: 'inline-flex',
            alignItems: 'baseline',
            gap: 4,
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--text)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          <OMark size={11} />
          {osFmt(life.resaleOs)}
        </span>
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 600,
            color: life.uplift >= 0 ? 'var(--o-green)' : 'var(--o-orange, var(--text-dim))',
          }}
        >
          {life.uplift >= 0 ? '+' : ''}
          {Math.round(life.uplift * 100)}%
        </span>
      </div>
      <p style={{ margin: '9px 0 0', fontSize: 10, lineHeight: 1.45, color: 'var(--text-faint)' }}>
        Modelled on {life.comparable} {cfg.weo.type.toLowerCase()} WeOs collecting in the network right now,
        and how the network&rsquo;s cohorts behave at this time of year.{' '}
        {live ? 'Updates as you change the world.' : 'Matches the rehearsal you ran.'}
      </p>
    </div>
  );
}

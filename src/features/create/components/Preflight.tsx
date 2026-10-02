// design: create.jsx CreateScreen step 3 — "03 — Preflight / What goes live": the checklist, the card
// exactly as collectors will meet it, what you receive, and Post it.
import { Scene } from '@/components/layout/Scene';
import { SectionHead } from '@/components/layout/SectionMark';
import { OsRun } from '@/components/text/OsRun';
import { Button, WeOCard, svg, type WeOCardProps } from '@/design-system';
import { oStr } from '@/lib/format';
import type { ComposerForm } from '../model/composer';
import type { ComposerModule } from './ModWell';

/** What the creator gets, as settlement actually pays it (D-055: nothing is taken). */
function receipt(f: ComposerForm): {
  title: string;
  rows: [string, string][];
  total: [string, string];
  note: string;
} {
  if (f.kind === 'Request')
    return {
      title: 'What you are asking',
      rows: [
        ['Budget from', oStr(f.price)],
        ['Budget to', oStr(f.priceMax)],
      ],
      total: ['Open for', `${f.days} days`],
      note: 'Makers answer with a WeO; you choose',
    };
  if (f.kind === 'Pool')
    return {
      title: 'What you receive',
      rows: [
        ['Funding goal', oStr(f.goal)],
        ['Taken at settlement', oStr(0)],
      ],
      total: ['Each pledge, at least', oStr(f.minPledge)],
      note: 'Each pledge settles to you as it lands',
    };
  return {
    title: 'What you receive',
    rows: [
      [f.kind === 'Bid' ? 'Opening bid' : 'Collector pays', oStr(f.price)],
      ['Taken at settlement', oStr(0)],
    ],
    total: ['You receive', oStr(f.price)],
    note: 'Settled when it is collected',
  };
}

export function Preflight({
  f,
  mods,
  card,
  toneName,
  busy,
  editing,
  onBack,
  onPost,
}: {
  f: ComposerForm;
  mods: ComposerModule[];
  card: WeOCardProps;
  toneName: string;
  busy: boolean;
  editing: boolean;
  onBack: () => void;
  onPost: () => void;
}) {
  const checks = [
    {
      key: 'title',
      title: 'Title & description',
      done: f.title.trim().length > 2 && f.desc.trim().length > 4,
      summary: f.title,
    },
    ...mods,
  ];
  const r = receipt(f);
  return (
    <Scene style={{ display: 'block', marginTop: 18 }}>
      <SectionHead eyebrow="03 — Preflight" title="What goes live" />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1fr) 300px 320px',
          gap: 'clamp(18px,2.4vw,32px)',
          alignItems: 'start',
        }}
        className="weo-snap-grid"
      >
        <div
          style={{
            borderRadius: 30,
            padding: 'clamp(18px,2.2vw,24px)',
            background: 'var(--surface)',
            boxShadow: 'var(--nm-raised), inset 0 0 0 1px var(--border)',
          }}
        >
          {checks.map((m) => (
            <div
              key={m.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 11,
                padding: '11px 0',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <span
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  background: m.done ? 'var(--o-green)' : 'var(--surface-2)',
                  boxShadow: m.done ? 'none' : 'var(--nm-inset)',
                  color: '#fff',
                  flex: '0 0 auto',
                }}
              >
                {m.done ? svg(<path d="M5 12.5l4.2 4.2L19 7" />, 11, 'currentColor', 2.6) : null}
              </span>
              <span style={{ flex: 1, fontSize: 13.5, color: 'var(--text)' }}>{m.title}</span>
              <span
                style={{
                  fontSize: 12,
                  color: 'var(--text-faint)',
                  minWidth: 0,
                  maxWidth: '45%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                <OsRun text={m.summary || (m.done ? 'set' : 'open')} />
              </span>
            </div>
          ))}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 18 }}>
            <Button variant="ghost" tone="blue" size="sm" onClick={onBack}>
              Back to the modules
            </Button>
          </div>
        </div>
        {/* the card exactly as collectors will meet it — tap it to see the back */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <span
            style={{
              alignSelf: 'stretch',
              textAlign: 'center',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '.13em',
              textTransform: 'uppercase',
              color: 'var(--text-faint)',
            }}
          >
            How collectors see it
          </span>
          <WeOCard w={272} {...card} />
          <span style={{ fontSize: 11, color: 'var(--text-faint)', textAlign: 'center' }}>
            Tap the card to see its back
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div
            style={{
              borderRadius: 26,
              padding: 20,
              background: 'var(--surface-2)',
              boxShadow: 'var(--nm-inset)',
              display: 'flex',
              flexDirection: 'column',
              gap: 11,
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '.13em',
                textTransform: 'uppercase',
                color: 'var(--text-faint)',
              }}
            >
              {r.title}
            </span>
            {r.rows.map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text-dim)' }}>{k}</span>
                <b style={{ color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
                  <OsRun text={v} />
                </b>
              </div>
            ))}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: 11,
                borderTop: '1px solid var(--border)',
                fontSize: 14,
              }}
            >
              <b style={{ color: 'var(--text)' }}>{r.total[0]}</b>
              <b style={{ color: 'var(--o-green)', fontVariantNumeric: 'tabular-nums' }}>
                <OsRun text={r.total[1]} />
              </b>
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{r.note}</span>
          </div>
          {/* the act this page exists for: in colour at rest, not only on hover */}
          <Button variant="primary" selected tone={toneName} onClick={onPost} dot disabled={busy}>
            {busy ? 'Posting…' : editing ? 'Save it' : 'Post it'}
          </Button>
          <span style={{ fontSize: 11, textAlign: 'center', color: 'var(--text-faint)' }}>
            {f.kind === 'Request'
              ? 'Your ask goes to the requests board. Makers answer it with a WeO.'
              : 'Post it raw and refine it live. Every path ends in Exchange.'}
          </span>
        </div>
      </div>
    </Scene>
  );
}

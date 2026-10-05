// design: creators.jsx MyaRecord / MyaPanelProfile / CreatorRecord / CreatorPanel / CreatorGrid
import { useState, type KeyboardEvent } from 'react';
import { PersonOi, Spark, StandChip } from '@/components/people/People';
import { MYA } from '@/components/shell/mya';
import { Button, OMark, Orb } from '@/design-system';
import { MYA_STARTERS } from '@/features/shell/model/myaFaq';
import { compact, osFmt } from '@/lib/format';
import { askMya } from '@/stores/mya';
import { openCollect } from '@/stores/flow';
import { openDock } from '@/stores/ui';
import { useCreator } from '../api/creators';
import { acceptLabel, orbitOf, type CreatorModel } from '../model/creators';

const onEnter = (go: () => void) => (e: KeyboardEvent) => {
  if (e.key === 'Enter') go();
};

/** design WV.MYA — her profile copy (brand copy, not data). */
export const MYA_PROFILE = {
  name: 'Mya',
  handle: '@mya',
  role: 'Your guide in the WeOverse',
  bio: 'I read the last seven days across every Circle and tell you what actually moved. I never sell, never take a cut, and never see your money.',
  does: [
    { k: 'Which format wins here', v: 'collect-through by type and context' },
    { k: 'Why a launch stalled', v: 'your first-collector time against the Circle median' },
    { k: 'What to bundle', v: 'pairings with a measured lift' },
    { k: 'Where to rehearse', v: 'the world that matches your goods' },
  ],
  never: ['Set your price', 'See your balance', 'Move value', 'Change your standing'],
} as const;

const panel = {
  gridColumn: '1/-1',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'clamp(18px,3vw,34px)',
  borderRadius: 30,
  padding: 'clamp(18px,2.4vw,28px)',
  background: 'var(--surface)',
  boxShadow: 'var(--nm-hero), inset 0 0 0 1px var(--border)',
  animation: 'weo-cardin .45s var(--ease-portal) both',
} as const;

const eyebrow = {
  margin: 0,
  fontSize: 10.5,
  fontWeight: 700,
  letterSpacing: '.14em',
  textTransform: 'uppercase',
  color: 'var(--text-faint)',
} as const;

const h3Big = {
  margin: '7px 0 0',
  fontSize: 'clamp(21px,2.4vw,27px)',
  fontWeight: 700,
  letterSpacing: '-.03em',
  color: 'var(--text)',
} as const;

function recordStyle(hov: boolean, tone: string) {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    cursor: 'pointer',
    borderRadius: 26,
    padding: 14,
    background: hov ? `color-mix(in srgb, ${tone} 5%, var(--surface))` : 'var(--surface)',
    boxShadow: `var(--nm-raised), inset 0 0 0 1px ${hov ? `color-mix(in srgb, ${tone} 34%, transparent)` : 'var(--border)'}`,
    transform: hov ? 'translateY(-2px)' : 'none',
    transition: 'transform .3s var(--ease-portal), background .3s, box-shadow .3s',
  } as const;
}

/* ---------- Mya: the guide, as a profile ---------- */
export function MyaRecord({ onOpen }: { onOpen: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Mya — your guide"
      onClick={onOpen}
      onKeyDown={onEnter(onOpen)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        ...recordStyle(hov, 'var(--o-violet)'),
        background: hov ? 'color-mix(in srgb, var(--o-violet) 6%, var(--surface))' : 'var(--surface)',
      }}
    >
      <span
        style={{
          position: 'relative',
          flex: '0 0 auto',
          width: 96,
          height: 96,
          borderRadius: '50%',
          overflow: 'hidden',
          background: 'var(--surface-2)',
          boxShadow: hov ? 'var(--nm-hero)' : 'var(--nm-inset)',
          transition: 'box-shadow .3s',
        }}
      >
        <img
          src={hov ? MYA.faces.answered : MYA.faces.id}
          alt="Mya"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <h3
          style={{
            margin: 0,
            fontSize: 15.5,
            fontWeight: 700,
            letterSpacing: '-.015em',
            color: 'var(--text)',
          }}
        >
          {MYA_PROFILE.name}
        </h3>
        <p style={{ margin: '3px 0 0', fontSize: 11.5, color: 'var(--text-faint)' }}>{MYA_PROFILE.role}</p>
        <p
          style={{
            margin: '8px 0 0',
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: '.1em',
            textTransform: 'uppercase',
            color: 'var(--o-violet)',
          }}
        >
          Guide · not ranked
        </p>
      </div>
    </div>
  );
}

export function MyaPanelProfile({ onCollapse }: { onCollapse: () => void }) {
  const ask = () => {
    openDock('mya');
    const q = MYA_STARTERS[0]?.q;
    if (q) void askMya(q);
  };
  return (
    <div style={panel}>
      <div style={{ flex: '0 0 auto', width: 240, maxWidth: '100%', display: 'grid', placeItems: 'center' }}>
        <span
          style={{
            position: 'relative',
            width: 210,
            height: 210,
            borderRadius: '50%',
            overflow: 'hidden',
            background: 'var(--surface-2)',
            boxShadow: 'var(--nm-hero)',
          }}
        >
          <video
            src={MYA.clips.chat}
            poster={MYA.faces.idle}
            autoPlay
            muted
            loop
            playsInline
            aria-label="Mya"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </span>
      </div>
      <div style={{ flex: '1 1 340px', minWidth: 0 }}>
        <p style={eyebrow}>
          {MYA_PROFILE.handle} · {MYA_PROFILE.role}
        </p>
        <h3 style={h3Big}>{MYA_PROFILE.name}</h3>
        <p
          style={{
            margin: '8px 0 0',
            maxWidth: '50ch',
            fontSize: 13.5,
            lineHeight: 1.6,
            color: 'var(--text-dim)',
          }}
        >
          {MYA_PROFILE.bio}
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))',
            gap: 10,
            marginTop: 18,
          }}
        >
          {MYA_PROFILE.does.map((d) => (
            <div
              key={d.k}
              style={{
                borderRadius: 16,
                padding: '12px 14px',
                background: 'var(--surface-2)',
                boxShadow: 'var(--nm-inset)',
              }}
            >
              <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                {d.k}
              </span>
              <span
                style={{
                  display: 'block',
                  marginTop: 3,
                  fontSize: 11.5,
                  lineHeight: 1.45,
                  color: 'var(--text-dim)',
                }}
              >
                {d.v}
              </span>
            </div>
          ))}
        </div>
        <p style={{ margin: '16px 0 0', fontSize: 11.5, color: 'var(--text-faint)' }}>
          Never: {MYA_PROFILE.never.join(' · ')}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginTop: 18 }}>
          <Button size="sm" variant="primary" tone="violet" onClick={ask}>
            Ask Mya
          </Button>
          {/* "Rehearse with her" arrives with worlds (M11, D-064) */}
          <Button size="sm" variant="ghost" tone="blue" onClick={onCollapse}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ---------- a creator ---------- */
export function CreatorRecord({ c, onOpen }: { c: CreatorModel; onOpen: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${c.name} — open their record`}
      onClick={onOpen}
      onKeyDown={onEnter(onOpen)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={recordStyle(hov, c.tone)}
    >
      <PersonOi p={c} size={96} hot={hov} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <h3
          style={{
            margin: 0,
            fontSize: 15.5,
            fontWeight: 700,
            letterSpacing: '-.015em',
            color: 'var(--text)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {c.name}
        </h3>
        <p style={{ margin: '3px 0 0', fontSize: 11.5, color: 'var(--text-faint)' }}>
          {c.format} · {c.weeksLive} weeks live
        </p>
        <div style={{ marginTop: 8, opacity: hov ? 1 : 0.55, transition: 'opacity .3s' }}>
          <Spark values={c.trace} tone={c.tone} h={22} />
        </div>
      </div>
      {c.circled && (
        <span
          title="Circled"
          style={{
            alignSelf: 'flex-start',
            flex: '0 0 auto',
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: c.tone,
          }}
        />
      )}
    </div>
  );
}

/* the record opens into its orbit — their WeOs circle their standing */
export function CreatorPanel({
  c,
  onCollapse,
  onCircle,
  onOpenWeo,
}: {
  c: CreatorModel;
  onCollapse: () => void;
  onCircle: (c: CreatorModel) => void;
  onOpenWeo: (id: string) => void;
}) {
  const detail = useCreator(c.id).data;
  const list = orbitOf(detail).slice(0, 8);
  const R = 132;
  const first = list[0];
  const self = !!detail?.viewer.isSelf;
  const stats: [React.ReactNode, string][] = [
    [
      <span key="s" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
        <OMark size={12} />
        {osFmt(c.settled)}
      </span>,
      'settled · 7d',
    ],
    [compact(c.collectors), 'collectors'],
    [String(detail?.stats.circlesLed ?? c.circlesLed), 'circles led'],
    [acceptLabel(detail?.stats.acceptRate), 'answers accepted'],
  ];
  return (
    <div id={`cr-${c.id}`} style={{ ...panel, alignItems: 'center', gap: 'clamp(18px,3vw,38px)' }}>
      <div
        className="orbit-ring"
        style={{
          flex: '0 0 auto',
          width: 320,
          height: 320,
          maxWidth: '100%',
          position: 'relative',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <div
          style={{ position: 'absolute', inset: 26, borderRadius: '50%', border: '1px dashed var(--border)' }}
        />
        <div style={{ position: 'absolute', inset: 26, animation: 'weo-orbit 34s linear infinite' }}>
          {list.map((w, i) => (
            <div
              key={w.id}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: `rotate(${(i / list.length) * 360}deg) translateY(-${R}px)`,
              }}
            >
              <div
                style={{ animation: 'weo-orbit-rev 34s linear infinite', marginLeft: -33, marginTop: -33 }}
              >
                <button
                  type="button"
                  onClick={() => onOpenWeo(w.id)}
                  title={`${w.name} · ${w.type}`}
                  aria-label={`${w.name} · ${w.type}`}
                  style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}
                >
                  <Orb size={66} fill="image" src={w.img} ring ringColor={w.tone} matcap breathe />
                </button>
              </div>
            </div>
          ))}
        </div>
        <PersonOi p={c} size={150} hot />
      </div>
      <div style={{ flex: '1 1 320px', minWidth: 0 }}>
        <p style={eyebrow}>{c.handle}</p>
        <h3 style={h3Big}>{c.name}</h3>
        {c.bio && (
          <p
            style={{
              margin: '8px 0 0',
              maxWidth: '46ch',
              fontSize: 13.5,
              lineHeight: 1.55,
              color: 'var(--text-dim)',
            }}
          >
            {c.bio}
          </p>
        )}
        <div style={{ marginTop: 12 }}>
          <StandChip c={c} />
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(104px,1fr))',
            gap: 10,
            marginTop: 18,
          }}
        >
          {stats.map(([v, k]) => (
            <div
              key={k}
              style={{
                borderRadius: 16,
                padding: '11px 13px',
                background: 'var(--surface-2)',
                boxShadow: 'var(--nm-inset)',
              }}
            >
              <span
                style={{
                  display: 'block',
                  fontSize: 15,
                  fontWeight: 700,
                  color: 'var(--text)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {v}
              </span>
              <span
                style={{
                  display: 'block',
                  marginTop: 2,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '.1em',
                  textTransform: 'uppercase',
                  color: 'var(--text-faint)',
                }}
              >
                {k}
              </span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginTop: 20 }}>
          {self ? (
            <span style={{ alignSelf: 'center', fontSize: 12, color: 'var(--text-dim)' }}>
              This is you — what others see on your record.
            </span>
          ) : (
            <>
              <Button
                size="sm"
                variant="primary"
                tone="blue"
                disabled={!first}
                title={
                  first
                    ? first.name
                    : detail && !detail.shows.collections
                      ? 'Their WeOs are private'
                      : 'Nothing live yet'
                }
                onClick={() => first && openCollect(first.id)}
              >
                Collect a WeO
              </Button>
              <Button size="sm" variant="ghost" tone="green" selected={c.circled} onClick={() => onCircle(c)}>
                {c.circled ? '✓ Circled' : 'Circle them'}
              </Button>
            </>
          )}
          {/* "Rehearse a pairing" arrives with worlds (M11, D-064) */}
          <Button size="sm" variant="ghost" tone="blue" onClick={onCollapse}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

export function CreatorGrid({
  list,
  openId,
  onOpenId,
  onCircle,
  onOpenWeo,
}: {
  list: CreatorModel[];
  /** the open record (`mya`, a creator id, or none) — the page keeps it in the URL */
  openId: string | null;
  onOpenId: (id: string | null) => void;
  onCircle: (c: CreatorModel) => void;
  onOpenWeo: (id: string) => void;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(258px, 1fr))', gap: 14 }}>
      {openId === 'mya' ? (
        <MyaPanelProfile key="mya" onCollapse={() => onOpenId(null)} />
      ) : (
        <MyaRecord key="mya" onOpen={() => onOpenId('mya')} />
      )}
      {list.map((c) =>
        openId === c.id ? (
          <CreatorPanel
            key={c.id}
            c={c}
            onCollapse={() => onOpenId(null)}
            onCircle={onCircle}
            onOpenWeo={onOpenWeo}
          />
        ) : (
          <CreatorRecord key={c.id} c={c} onOpen={() => onOpenId(c.id)} />
        ),
      )}
    </div>
  );
}

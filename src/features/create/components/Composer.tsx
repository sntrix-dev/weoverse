// design: create.jsx CreateScreen step 2 — the WeO edits itself: modules either side, the O (or the
// card) at the centre, its name, line and figures typed onto it, and one way forward: Preflight.
import { useState } from 'react';
import { PortalStage } from '@/components/flow/FlowParts';
import { Scene } from '@/components/layout/Scene';
import { WeoPriceAtRest } from '@/components/weo/WeoBits';
import { Orb, WeOCard, type WeOCardProps, svg } from '@/design-system';
import { OsRun } from '@/components/text/OsRun';
import { oStr } from '@/lib/format';
import type { TemplateDto } from '../api/create';
import type { ComposerForm } from '../model/composer';
import { labelOf } from '../model/formats';
import { CardAssist } from './AiDraft';
import { InlineNum, InlineText, ModRing } from './bits';
import { CFORMAT_ICO } from './icons';
import { ModRail } from './ModRail';
import { editTerms } from './modules';
import type { ComposerModule } from './ModWell';
import { TemplateDrawer } from './TemplateTiles';

export interface ComposerProps {
  f: ComposerForm;
  set: (patch: Partial<ComposerForm>) => void;
  tone: string;
  mods: ComposerModule[];
  openMod: string | null;
  setOpenMod: (k: string | null) => void;
  reqMiss: (key: string) => boolean;
  missing: string[];
  canPost: boolean;
  card: WeOCardProps;
  priceLabel: string;
  templates: TemplateDto[];
  onTemplate: (tp: TemplateDto) => void;
  onLocked: (tp: TemplateDto) => void;
  onBrowseTemplates: () => void;
  onPreflight: () => void;
}

export function Composer(p: ComposerProps) {
  const { f, set, tone, mods } = p;
  const [rail, setRail] = useState(true);
  const [pins, setPins] = useState<Record<string, boolean>>({});
  const [flip, setFlip] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [modHov, setModHov] = useState<string | null>(null);
  const done = mods.filter((m) => m.done || m.optional).length;
  const half = Math.ceil(mods.length / 2);
  const rails = {
    rail,
    setRail,
    mods,
    tone,
    done,
    openMod: p.openMod,
    setOpenMod: p.setOpenMod,
    pins,
    reqMiss: p.reqMiss,
    modHov,
    setModHov,
  };
  const togglePin = (k: string) =>
    setPins((x) => {
      const n = { ...x };
      if (n[k]) delete n[k];
      else n[k] = true;
      return n;
    });
  return (
    <Scene style={{ display: 'block', marginTop: 18 }}>
      <div
        style={{
          maxWidth: 1080,
          margin: '0 auto',
          borderRadius: 34,
          padding: 'clamp(18px,2.6vw,32px)',
          background: 'var(--surface)',
          boxShadow: 'var(--shadow-card), inset 0 0 0 1px var(--border)',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 14, marginBottom: 22 }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            {/* the WeO speaks for itself below — the step and the format's icon, nothing more */}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
              <span
                style={{
                  display: 'grid',
                  placeItems: 'center',
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  color: '#fff',
                  background: tone,
                  boxShadow: `0 8px 18px -8px ${tone}`,
                }}
              >
                {svg(CFORMAT_ICO[f.kind ?? 'Listing'] ?? CFORMAT_ICO.Listing, 15, 'currentColor', 1.9)}
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '.15em',
                  textTransform: 'uppercase',
                  color: 'var(--text-faint)',
                }}
              >
                02 — Create
              </span>
            </span>
          </div>
          <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            <ModRing done={done} total={mods.length} tone={tone} />
          </div>
        </div>

        <div
          className="weo-make-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: rail
              ? 'minmax(220px,.85fr) minmax(0,1.5fr) minmax(220px,.85fr)'
              : '58px minmax(0,1fr) 58px',
            gap: 'clamp(12px,1.6vw,22px)',
            alignItems: 'start',
            transition: 'grid-template-columns .34s var(--ease-portal)',
          }}
        >
          <ModRail side="left" list={mods.slice(0, half)} onPin={togglePin} {...rails} />

          <div
            style={{ minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 }}
          >
            {/* the O itself — the preview, and the portal it arrives through */}
            <div style={{ display: 'grid', placeItems: 'center', minHeight: 330 }}>
              {flip ? (
                <div
                  key="card"
                  style={{
                    display: 'grid',
                    placeItems: 'center',
                    gap: 10,
                    animation: 'weo-cardin .46s var(--ease-portal) both',
                  }}
                >
                  <WeOCard w={272} {...p.card} />
                  <WeoPriceAtRest os={f.kind === 'Pool' ? f.minPledge : f.price} label={p.priceLabel} />
                </div>
              ) : (
                <PortalStage size={320} stage={p.openMod ?? 'rest'}>
                  <Orb
                    size={224}
                    fill={f.media ? 'image' : tone}
                    src={f.media}
                    ring
                    ringColor={tone}
                    matcap
                    breathe
                  />
                </PortalStage>
              )}
            </div>

            <div style={{ textAlign: 'center', width: '100%', maxWidth: 560 }}>
              <button
                type="button"
                onClick={() => p.setOpenMod(p.openMod === 'cat' ? null : 'cat')}
                title="Set its category"
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  padding: '3px 8px',
                  borderRadius: 999,
                  font: 'inherit',
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '.15em',
                  textTransform: 'uppercase',
                  color: tone,
                }}
              >
                {labelOf(f.kind)} · {f.cat || 'pick a category'}
              </button>
              <InlineText
                value={f.title}
                onChange={(v) => set({ title: v })}
                placeholder="Name your WeO"
                invalid={p.reqMiss('title')}
                style={{
                  marginTop: 5,
                  fontSize: 'clamp(22px,2.6vw,30px)',
                  fontWeight: 700,
                  letterSpacing: '-.033em',
                  textAlign: 'center',
                }}
              />
              <InlineText
                area
                value={f.desc}
                onChange={(v) => set({ desc: v })}
                placeholder="One line on what someone actually gets"
                invalid={p.reqMiss('desc')}
                style={{ marginTop: 4, fontSize: 13.5, color: 'var(--text-dim)', textAlign: 'center' }}
              />
              <CardAssist f={f} tone={tone} onPick={(v) => set({ desc: v })} />
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  gap: 10,
                  marginTop: 12,
                }}
              >
                {editTerms(f.kind).map(([label, key, pre]) => (
                  <InlineNum
                    key={key}
                    label={label}
                    pre={pre}
                    tone={tone}
                    value={f[key] as number}
                    onChange={(v) => set({ [key]: v })}
                    invalid={p.reqMiss(key)}
                  />
                ))}
              </div>
              {/* CRE-09: one way forward. Preflight shows what you receive; Post lives only there.
                  "Vet it first" waits for the worlds (M11, D-054). */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 12,
                  marginTop: 20,
                  width: '100%',
                }}
              >
                <div
                  className="weo-fork"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,240px),1fr))',
                    gap: 12,
                    width: '100%',
                  }}
                >
                  <ForkCard
                    tone={tone}
                    onClick={p.onPreflight}
                    receive={f.kind === 'Pool' ? f.minPledge : f.kind === 'Request' ? 0 : f.price}
                    request={f.kind === 'Request'}
                  />
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 14,
                    fontSize: 12,
                    color: 'var(--text-dim)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setFlip((x) => !x)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      font: 'inherit',
                      fontSize: 12,
                      fontWeight: 500,
                      color: 'var(--o-violet)',
                      padding: 0,
                    }}
                  >
                    {flip ? 'Back to the O' : 'See it as the card'}
                  </button>
                </div>
              </div>
              {!p.canPost && (
                <p style={{ margin: '9px 0 0', fontSize: 11, color: 'var(--text-faint)' }}>
                  Still needed: {p.missing.join(', ')}. The rest can follow.
                </p>
              )}

              {/* templates stay reachable from inside the composer — except for a Request: you are asking, not listing */}
              {f.kind !== 'Request' && (
                <div
                  style={{
                    marginTop: 18,
                    borderRadius: 22,
                    background: 'var(--surface)',
                    boxShadow: 'var(--nm-sm), inset 0 0 0 1px var(--border)',
                    overflow: 'hidden',
                    textAlign: 'left',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setDrawer(true)}
                    aria-haspopup="dialog"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 9,
                      width: '100%',
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      font: 'inherit',
                      padding: '11px 14px',
                    }}
                  >
                    <span
                      style={{
                        display: 'grid',
                        placeItems: 'center',
                        width: 26,
                        height: 26,
                        borderRadius: '50%',
                        color: tone,
                        background: `color-mix(in srgb, ${tone} 13%, var(--surface))`,
                      }}
                    >
                      {svg(
                        <>
                          <rect x="4" y="4" width="7" height="7" rx="2" />
                          <rect x="13" y="4" width="7" height="7" rx="2" />
                          <rect x="4" y="13" width="7" height="7" rx="2" />
                          <rect x="13" y="13" width="7" height="7" rx="2" />
                        </>,
                        14,
                        'currentColor',
                        1.8,
                      )}
                    </span>
                    <span
                      style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 700, color: 'var(--text)' }}
                    >
                      Start from a template
                    </span>
                    <span
                      style={{
                        fontSize: 11.5,
                        color: 'var(--text-faint)',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {p.templates.length}
                    </span>
                    <span style={{ display: 'grid', placeItems: 'center', color: 'var(--text-faint)' }}>
                      {svg(<polyline points="18 15 12 9 6 15" />, 14, 'currentColor', 2.2)}
                    </span>
                  </button>
                </div>
              )}
              {drawer && f.kind !== 'Request' && (
                <TemplateDrawer
                  templates={p.templates}
                  onClose={() => setDrawer(false)}
                  onBrowse={() => {
                    setDrawer(false);
                    p.onBrowseTemplates();
                  }}
                  onPick={p.onTemplate}
                  onLocked={p.onLocked}
                />
              )}
            </div>
          </div>

          <ModRail side="right" list={mods.slice(half)} onPin={togglePin} {...rails} />
        </div>
      </div>
    </Scene>
  );
}

function ForkCard({
  tone,
  onClick,
  receive,
  request,
}: {
  tone: string;
  onClick: () => void;
  receive: number;
  request: boolean;
}) {
  const steps = ['Review', 'Post'];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Preflight — Review it, then post"
      onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
      onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 9,
        textAlign: 'left',
        padding: '16px 18px',
        borderRadius: 24,
        border: 'none',
        cursor: 'pointer',
        font: 'inherit',
        background: 'var(--surface)',
        boxShadow: `var(--nm-raised), inset 0 0 0 1px color-mix(in srgb, ${tone} 28%, var(--border))`,
        transition: 'box-shadow .24s, transform .24s var(--ease-portal)',
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 9,
          borderRadius: 999,
          minHeight: 40,
          padding: '0 8px 0 16px',
          fontSize: 13.5,
          fontWeight: 700,
          color: '#fff',
          background: tone,
          boxShadow: `0 12px 26px -10px color-mix(in srgb, ${tone} 85%, transparent)`,
        }}
      >
        Preflight
        <span
          style={{
            display: 'grid',
            placeItems: 'center',
            width: 26,
            height: 26,
            borderRadius: '50%',
            background: 'rgba(255,255,255,.22)',
          }}
        >
          {svg(<path d="M9 6l6 6-6 6" />, 13, 'currentColor', 2.2)}
        </span>
      </span>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Review it, then post</span>
      <span style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--text-dim)', textWrap: 'pretty' }}>
        {request ? (
          'Makers see your budget and the deadline before anything is live'
        ) : receive > 0 ? (
          <span>
            Nothing is taken at settlement · you receive{' '}
            <b style={{ color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
              <OsRun text={oStr(receive)} />
            </b>{' '}
            per collect
          </span>
        ) : (
          'What you receive is shown before anything is live'
        )}
      </span>
      <span style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px 8px', marginTop: 2 }}>
        {steps.map((st, i) => (
          <span
            key={st}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '.06em',
              textTransform: 'uppercase',
              color: 'var(--text-faint)',
            }}
          >
            <span
              style={{
                display: 'grid',
                placeItems: 'center',
                width: 18,
                height: 18,
                borderRadius: '50%',
                fontSize: 10,
                color: '#fff',
                background: tone,
              }}
            >
              {i + 1}
            </span>
            {st}
            {i < steps.length - 1 && svg(<polyline points="9 6 15 12 9 18" />, 10, 'var(--text-faint)', 2)}
          </span>
        ))}
      </span>
    </button>
  );
}

// design: create.jsx CreateHero — the docks either side of the O (Carry on · Templates | Asked for ·
// Track it) and the template shelf; they slide in once the formats have arrived.
import { useState, type ReactNode } from 'react';
import { ICO, O_SECTION_ICONS, Orb } from '@/design-system';
import { createTone } from '../model/formats';
import type { CreateHeroProps } from './CreateHero';
import { FloatMod, OrbSlider } from './Docks';
import { MOD_ICO } from './icons';
import { TemplateShelf } from './TemplateTiles';

export function HeroDocks({ glimpse, ...p }: CreateHeroProps & { glimpse: boolean }) {
  const [shelf, setShelf] = useState<'tpl' | null>(null);
  const docks: {
    tone: string;
    icon: ReactNode;
    label: string;
    value?: string | null;
    cta?: string | null;
    onCta?: () => void;
    body?: ReactNode;
    open?: boolean;
    onOpen?: () => void;
  }[][] = [
    [
      {
        tone: 'var(--o-green)',
        icon: MOD_ICO.title,
        label: 'Carry on',
        value: p.drafts.length ? `${p.drafts.length} in progress` : null,
        cta: p.drafts.length ? null : 'Blank WeO',
        onCta: p.onBlank,
        body: p.drafts.length > 0 && (
          <OrbSlider label="Drafts in progress">
            {p.drafts.map((d) => (
              <button
                type="button"
                key={d._id}
                onClick={() => p.onDraft(d)}
                title={`${d.title || d.format || 'Untitled'} · ${Math.round((d.ready ?? 0) * 100)}%`}
                aria-label={d.title || d.format || 'Untitled draft'}
                style={{
                  padding: 0,
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  borderRadius: '50%',
                }}
              >
                <Orb
                  size={44}
                  fill={d.coverUrl ? 'image' : createTone(d.format)}
                  src={d.coverUrl ?? undefined}
                  ring
                  ringColor={createTone(d.format)}
                  matcap
                />
              </button>
            ))}
          </OrbSlider>
        ),
      },
      {
        tone: 'var(--o-gold)',
        icon: MOD_ICO.rules,
        label: 'Templates',
        value: `${p.templates.length}`,
        open: shelf === 'tpl',
        onOpen: () => setShelf((x) => (x === 'tpl' ? null : 'tpl')),
        cta: 'All as cards',
        onCta: p.onAllTemplates,
      },
    ],
    [
      // "Rehearse · Enter a world" waits for the worlds (M11, D-054)
      {
        tone: 'var(--o-blue)',
        icon: ICO.requests,
        label: 'Asked for',
        value: p.asks ? String(p.asks) : null,
        cta: 'See asks',
        onCta: p.onAsks,
      },
      {
        tone: 'var(--o-gold)',
        icon: O_SECTION_ICONS.left,
        label: 'Track it',
        cta: 'How it grows',
        onCta: p.onTrack,
      },
    ],
  ];
  // two docks, one each side, sliding in from the edges; the centre stays clear for the O
  return (
    <div
      className="weo-create-strip"
      style={{
        position: 'absolute',
        inset: 0,
        padding: 'clamp(12px,3vh,32px) clamp(16px,2vw,26px)',
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 12,
        zIndex: 3,
        pointerEvents: 'none',
        animation: 'weo-fadein 1.4s var(--ease-settle) .8s both',
      }}
    >
      <div
        className="weo-create-shelf"
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          gridTemplateColumns: '230px 1fr 230px',
          alignItems: 'center',
          padding: 'clamp(12px,3vh,32px) clamp(16px,2vw,26px)',
          pointerEvents: 'none',
        }}
      >
        {docks.map((mods, side) => (
          <div
            key={side}
            style={{
              gridColumn: side ? 3 : 1,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              pointerEvents: 'auto',
              ['--sx' as string]: `${side ? 60 : -60}px`,
              animation: `weo-dockin 1.5s var(--ease-portal) ${0.9 + side * 0.25}s both`,
            }}
          >
            {mods.map((m, i) => (
              <div
                key={m.label}
                style={{
                  minWidth: 0,
                  animation: `weo-cardin .9s var(--ease-portal) ${1 + side * 0.25 + i * 0.18}s both`,
                }}
              >
                <FloatMod
                  tone={m.tone}
                  icon={m.icon}
                  label={m.label}
                  value={m.value}
                  cta={m.cta}
                  onCta={m.onCta}
                  open={m.open || glimpse}
                  onOpen={m.onOpen}
                >
                  {m.body || null}
                </FloatMod>
              </div>
            ))}
          </div>
        ))}
      </div>
      <TemplateShelf
        templates={p.templates}
        shown={shelf === 'tpl'}
        onPick={p.onTemplate}
        onLocked={p.onLocked}
      />
    </div>
  );
}

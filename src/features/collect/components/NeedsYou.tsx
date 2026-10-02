import { Scene } from '@/components/layout/Scene';
import { SectionHead } from '@/components/layout/SectionMark';
import { Button, Orb, type ToneInput } from '@/design-system';
import type { NeedsYouItem } from '../model/holdings';

export interface NeedsYouAction {
  label: string;
  tone?: ToneInput;
  ghost?: boolean;
  go: () => void;
  busy?: boolean;
}

/**
 * design: v3-screens.jsx NeedsYou — collecting is possession; confirming completes the exchange.
 * What each held WeO still needs from you, one verb each. The page supplies the verbs.
 */
export function NeedsYou({
  items,
  actionsOf,
}: {
  items: NeedsYouItem[];
  actionsOf: (t: NeedsYouItem) => NeedsYouAction[];
}) {
  if (!items.length) return null;
  return (
    <Scene id="c-needs" style={{ display: 'block', marginTop: 40 }}>
      <SectionHead
        eyebrow="00 — Needs you"
        title={`${items.length} thing${items.length === 1 ? '' : 's'} waiting on you`}
        note="Confirming tells the creator it reached you"
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,340px),1fr))', gap: 12 }}>
        {items.map((t, i) => (
          <div
            key={t.h.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              padding: 16,
              borderRadius: 24,
              background: 'var(--surface)',
              boxShadow: `var(--nm-raised), inset 0 0 0 1px color-mix(in srgb, ${t.tone} 30%, var(--border))`,
              animation: `weo-cardin .44s var(--ease-settle) ${i * 0.06}s both`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Orb size={48} fill={t.h.img ? 'image' : t.tone} src={t.h.img} ring ringColor={t.tone} matcap />
              <div style={{ minWidth: 0, flex: 1 }}>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 14.5,
                    fontWeight: 700,
                    letterSpacing: '-.018em',
                    color: 'var(--text)',
                    textWrap: 'balance',
                  }}
                >
                  {t.headline}
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: 12, lineHeight: 1.45, color: 'var(--text-dim)' }}>{t.sub}</p>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {actionsOf(t).map((a) => (
                <Button
                  key={a.label}
                  size="sm"
                  variant={a.ghost ? 'ghost' : 'primary'}
                  tone={a.tone ?? 'blue'}
                  onClick={a.go}
                  disabled={a.busy}
                >
                  {a.label}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Scene>
  );
}
